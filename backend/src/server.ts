import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import * as trpc from "@trpc/server";
import { createContext } from "./context";
import { appRouter } from "./routers";
import multer from "multer";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authenticate } from "./middleware/auth.middleware";
import { authorizeRole, isHR } from "./middleware/role.middleware";

const app = express();
app.use(cors());
app.use(express.json());

// mount tRPC
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }: { req: any }) => createContext({ req }),
  }),
);

// simple health
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// compatibility REST endpoints for existing frontend
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

app.post("/auth/login", async (req, res) => {
  // Accept emailOrId, password and role
  console.log('[REST /auth/login] incoming body=', req.body, 'headers=', req.headers && { authorization: req.headers.authorization });
  const { emailOrId, password, role } = req.body;
  if (!emailOrId || !password || !role) return res.status(400).json({ error: "Missing fields" });

  try {
    let user: any = null;

    if (role === 'HR') {
      // HR: find by email
      user = await prisma.user.findUnique({ where: { email: String(emailOrId) } });
    } else if (role === 'EMPLOYEE') {
      // EMPLOYEE: try to find by user email first
      user = await prisma.user.findUnique({ where: { email: String(emailOrId) } });
      if (!user) {
        // try by employee id (numeric) or externalId
        const byId = Number(emailOrId);
        const emp = await prisma.employee.findFirst({
          where: {
            OR: [
              byId && Number.isFinite(byId) ? { id: byId } : undefined,
              { externalId: String(emailOrId) },
            ].filter(Boolean) as any[],
          },
          include: { user: true },
        });
        if (emp) user = emp.user;
      }
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    // role mismatch check
    if (role === 'HR') {
      if (!user.role || !user.role.toUpperCase().startsWith('HR')) return res.status(403).json({ error: 'Unauthorized role' });
    } else if (role === 'EMPLOYEE') {
      if (String(user.role).toUpperCase() !== 'EMPLOYEE') return res.status(403).json({ error: 'Unauthorized role' });
    }

    // password check (bcrypt or plain)
    if (user.password && user.password.startsWith('$2')) {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid password' });
    } else {
      if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role: user.role });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post("/auth/request-otp", async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  // If requesting OTP for HR, ensure the account exists and has an HR role
  if (role && String(role).toUpperCase() === 'HR'){
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.status(404).json({ error: 'User not found for HR OTP' });
    if (!user.role || !String(user.role).toUpperCase().startsWith('HR')) return res.status(403).json({ error: 'Unauthorized role' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 1000 * 60 * 5;
  otpStore[email] = { code, expiresAt };
  console.log(`OTP for ${email}: ${code}`);
  return res.json({ message: "OTP sent (dev)", code });
});

app.post("/auth/verify-otp", async (req, res) => {
  const { email, code, role } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Missing fields" });
  const entry = otpStore[email];
  if (!entry) return res.status(400).json({ error: "No OTP requested" });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: "OTP expired" });
  if (String(code) !== String(entry.code)) return res.status(400).json({ error: "Invalid OTP" });

  let user = await prisma.user.findUnique({ where: { email } });

  // If HR OTP flow, require existing HR user and do not auto-create
  if (role && String(role).toUpperCase() === 'HR'){
    if (!user) return res.status(404).json({ error: 'User not found for HR OTP' });
    if (!user.role || !String(user.role).toUpperCase().startsWith('HR')) return res.status(403).json({ error: 'Unauthorized role' });
  } else {
    // employee/magic-link behavior: create employee if missing
    if (!user) {
      user = await prisma.user.create({ data: { name: email.split("@")[0], email, password: "", role: "EMPLOYEE" } });
      await prisma.employee.create({ data: { userId: user.id } }).catch(() => null);
    }
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  delete otpStore[email];
  return res.json({ token, role: user.role });
});

app.get("/policies", async (req, res) => {
  try {
    const policies = await prisma.policy.findMany();
    return res.json(policies);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch policies" });
  }
});

// create policy (HR only)
app.post('/policies', authenticate, isHR, async (req, res) => {
  const { policyNumber, name } = req.body;
  if (!policyNumber || !name) return res.status(400).json({ error: 'Missing fields' });
  try {
    const p = await prisma.policy.create({ data: { policyNumber, name } });
    return res.json(p);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create policy' });
  }
});

// get policy details
app.get('/policies/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id)
  try {
    const policy = await prisma.policy.findUnique({ where: { id }, include: { dependents: true, employees: { include: { employee: { include: { user: true } } } } } })
    if (!policy) return res.status(404).json({ error: 'Not found' })
    return res.json(policy)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch policy' })
  }
})

// update policy (HR only)
app.put('/policies/:id', authenticate, isHR, async (req, res) => {
  const id = Number(req.params.id);
  const { name, policyNumber } = req.body;
  try {
    const p = await prisma.policy.update({ where: { id }, data: { name: name ?? undefined, policyNumber: policyNumber ?? undefined } });
    return res.json(p);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update policy' });
  }
});

// delete policy (HR only) — will set dependents.policyId to null due to onDelete behavior
app.delete('/policies/:id', authenticate, isHR, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.policy.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete policy' });
  }
});

// get current user and employee record
app.get('/me', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    const emp = await prisma.employee.findUnique({ where: { userId: user.userId } }).catch(() => null);
    return res.json({ user: dbUser, employee: emp });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch me' });
  }
});

// HR: list employees
app.get("/hr/employees", authenticate, isHR, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ include: { user: true, dependents: true } });
    return res.json(employees);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// HR: get single employee
app.get("/hr/employees/:id", authenticate, isHR, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true, dependents: true } });
    if (!emp) return res.status(404).json({ error: "Not found" });
    return res.json(emp);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// HR: delete employee (cascades dependents)
app.delete("/hr/employee/:id", authenticate, isHR, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.employee.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete employee" });
  }
});

// REST compatibility: create employee (HR only)
app.post("/hr/employee", authenticate, isHR, async (req, res) => {
  const { name, email, password, employeeId, designation, dateOfJoining, dob, gender, mobile, policyId } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Missing required fields" });

  try {
    console.log('[POST] /hr/employee request body=', req.body, 'user=', (req as any).user)
    // prevent creating duplicate users by email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    // create user
    const hashed = password ? await bcrypt.hash(password, 8) : "";
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: "EMPLOYEE" } });

    // create employee record (link to user)
    const employee = await prisma.employee.create({ data: { userId: user.id } });

    // optionally assign policy
    if (policyId) {
      await prisma.employeePolicy.create({ data: { employeeId: employee.id, policyId: Number(policyId) } }).catch(() => null);
    }

    return res.status(201).json({ employee: { id: employee.id, userId: user.id } });
  } catch (e) {
    console.error('create employee failed', e);
    return res.status(500).json({ error: "Failed to create employee", details: (e as any)?.message || String(e) });
  }
});

// REST compatibility: update employee (HR only)
app.put("/hr/employee/:id", authenticate, isHR, async (req, res) => {
  const id = Number(req.params.id)
  const { name, email, password, dob, gender, mobile, phone, address, married, externalId, maritalStatus } = req.body
  try {
    console.log('[PUT] /hr/employee/' + id + ' body=', req.body, 'user=', (req as any).user)
    // update user fields if provided
    const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })

    const updates: any = {}
    if (name) updates.name = name
    if (email) updates.email = email
    if (password) updates.password = password.startsWith('$2') ? password : await bcrypt.hash(password, 8)

    let user = employee.user
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates })
    }

    const empUpdates: any = {}
    if (dob !== undefined) empUpdates.dob = dob ? new Date(dob).toISOString() : undefined
    if (gender !== undefined) empUpdates.gender = gender || undefined
    // accept both legacy `mobile` and newer `phone`
    if (mobile !== undefined) empUpdates.phone = mobile || undefined
    if (phone !== undefined) empUpdates.phone = phone || undefined
    if (address !== undefined) empUpdates.address = address || undefined
    if (typeof married !== 'undefined') empUpdates.married = !!married
    // accept a string maritalStatus (e.g. 'single'|'married'|'divorced') and store it
    if (maritalStatus !== undefined) empUpdates.maritalStatus = maritalStatus || undefined
    // keep the legacy boolean in sync when possible
    if (maritalStatus !== undefined && typeof maritalStatus === 'string') {
      empUpdates.married = maritalStatus.toLowerCase() === 'married'
    }
    if (externalId !== undefined) empUpdates.externalId = externalId || undefined

    let updatedEmp = employee
    if (Object.keys(empUpdates).length > 0) {
      updatedEmp = await prisma.employee.update({ where: { id }, data: empUpdates, include: { user: true } })
    }

    return res.json({ employee: updatedEmp, user })
  } catch (e) {
    const errAny: any = e
    console.error('Failed to update employee', errAny && errAny.stack ? errAny.stack : errAny)
    return res.status(500).json({ error: 'Failed to update employee', details: errAny?.message || String(errAny) })
  }
})

// REST compatibility: create dependent (HR or owning employee)
app.post("/dependents", authenticate, async (req, res) => {
  const { name, relation, dob, employeeId, policyId } = req.body;
  if (!name || !relation || !employeeId) return res.status(400).json({ error: "Missing required fields" });

  try {
    const user = (req as any).user;

    // allow HR_MANAGER or owner of the employee
    const emp = await prisma.employee.findUnique({ where: { id: Number(employeeId) } });
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    if (!String(user.role || '').toUpperCase().startsWith('HR') && user.userId !== emp.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const depData: any = { name, relation, employeeId: Number(employeeId), policyId: policyId ? Number(policyId) : undefined, dob: dob ? new Date(dob) : undefined, gender: req.body.gender || undefined };
    const dep = await prisma.dependent.create({ data: depData });
    return res.json({ dependent: dep });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create dependent" });
  }
});

// list dependents (HR can list all; employee can list their own; optional query employeeId allowed)
app.get("/dependents", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const qEmployeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    if (qEmployeeId) {
      const targetEmp = await prisma.employee.findUnique({ where: { id: qEmployeeId } });
      if (!targetEmp) return res.status(404).json({ error: "Employee not found" });
      if (!String(user.role || '').toUpperCase().startsWith('HR') && user.userId !== targetEmp.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deps = await prisma.dependent.findMany({ where: { employeeId: qEmployeeId } });
      return res.json(deps);
    }

    // no explicit employee id: HR gets all, employee gets their own
    if (String(user.role || '').toUpperCase().startsWith('HR')) {
      const deps = await prisma.dependent.findMany();
      return res.json(deps);
    }

    const emp = await prisma.employee.findUnique({ where: { userId: user.userId } });
    if (!emp) return res.status(404).json({ error: "Employee record not found" });
    const deps = await prisma.dependent.findMany({ where: { employeeId: emp.id } });
    return res.json(deps);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch dependents" });
  }
});

// delete dependent: HR can delete any; employee can delete own dependent only if not assigned to a policy
app.delete('/dependents/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const dep = await prisma.dependent.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: 'Dependent not found' });

    const user = (req as any).user;

    // HR may delete any dependent
    if (String(user.role || '').toUpperCase().startsWith('HR')) {
      await prisma.dependent.delete({ where: { id } });
      return res.json({ ok: true });
    }

    // Employee may delete only their own dependent and only if not assigned to a policy
    if (String(user.role || '').toUpperCase() !== 'EMPLOYEE') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const emp = await prisma.employee.findUnique({ where: { userId: user.userId } });
    if (!emp) return res.status(404).json({ error: 'Employee record not found' });
    if (dep.employeeId !== emp.id) return res.status(403).json({ error: 'Access denied' });
    if (dep.policyId) return res.status(403).json({ error: 'Cannot delete dependent enrolled in a policy' });

    await prisma.dependent.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete dependent' });
  }
});

// update dependent: HR can update any; employee can update own dependent (but cannot change policy assignment)
app.put('/dependents/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const dep = await prisma.dependent.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: 'Dependent not found' });

    const user = (req as any).user;

    // HR may update any field
    if (String(user.role || '').toUpperCase().startsWith('HR')) {
      const data: any = {};
      if (req.body.name !== undefined) data.name = req.body.name;
      if (req.body.relation !== undefined) data.relation = req.body.relation;
      if (req.body.dob !== undefined) data.dob = req.body.dob ? new Date(req.body.dob) : null;
      if (req.body.gender !== undefined) data.gender = req.body.gender;
      if (req.body.policyId !== undefined) data.policyId = req.body.policyId ? Number(req.body.policyId) : null;
      const updated = await prisma.dependent.update({ where: { id }, data });
      return res.json(updated);
    }

    // Employee: only allowed to update their own dependent, and not change policy assignment
    if (String(user.role || '').toUpperCase() !== 'EMPLOYEE') return res.status(403).json({ error: 'Access denied' });
    const emp = await prisma.employee.findUnique({ where: { userId: user.userId } });
    if (!emp) return res.status(404).json({ error: 'Employee record not found' });
    if (dep.employeeId !== emp.id) return res.status(403).json({ error: 'Access denied' });
    if (req.body.policyId !== undefined) return res.status(403).json({ error: 'Employees cannot change policy assignment via update' });

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.relation !== undefined) data.relation = req.body.relation;
    if (req.body.dob !== undefined) data.dob = req.body.dob ? new Date(req.body.dob) : null;
    if (req.body.gender !== undefined) data.gender = req.body.gender;

    const updated = await prisma.dependent.update({ where: { id }, data });
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update dependent' });
  }
});

app.listen(PORT, () => console.log("tRPC + REST server listening on", PORT));

export type AppRouter = typeof appRouter;
