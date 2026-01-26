// Deprecated: legacy JS mock server.
// The project now uses the TypeScript tRPC server at `src/server.ts`.
// Keep this file for reference only — do not run it.
console.warn('mock_server.js is deprecated. Use `npm start` to run the TypeScript tRPC server (src/server.ts).');

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });
    const created = await prisma.user.create({
      data: { name, email, password, role: "HR" },
    });
    return res
      .status(201)
      .json({
        message: "User registered successfully",
        user: { id: created.id, email: created.email },
      });
  } catch (e) {
    console.error("register error", e);
    try {
      fs.appendFileSync(
        "./backend/register_error.log",
        new Date().toISOString() + "\n" + (e.stack || e.toString()) + "\n\n",
      );
    } catch (_) {}
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Login attempt for", email);
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User from DB:", user);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    // Accept either plain-text or bcrypt-hashed passwords for flexibility in dev
    if (typeof user.password === "string" && user.password.startsWith("$2")) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });
    } else {
      if (user.password !== password)
        return res.status(401).json({ error: "Invalid credentials" });
    }
    // sign a JWT including role and userId
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "8h",
    });
    return res.json({ token, role: user.role });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Request OTP (mock): stores a short-lived code for the given email
app.post('/auth/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes
  otpStore[email] = { code, expiresAt };
  console.log(`OTP for ${email}: ${code} (expires ${new Date(expiresAt).toISOString()})`);
  return res.json({ message: 'OTP sent (mock)', code });
});

// Verify OTP (mock): exchange for JWT if valid
app.post('/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
  const entry = otpStore[email];
  if (!entry) return res.status(400).json({ error: 'No OTP requested' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: 'OTP expired' });
  if (String(code) !== String(entry.code)) return res.status(400).json({ error: 'Invalid OTP' });
  // OTP valid — find or create user and issue token
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { name: email.split('@')[0], email, password: '', role: 'EMPLOYEE' } });
    await prisma.employee.create({ data: { userId: user.id } }).catch(() => null);
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  // cleanup
  delete otpStore[email];
  return res.json({ token, role: user.role });
});

function checkAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Invalid token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role ? req.user.role : "EMPLOYEE";
    if (userRole === role) return next();
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  };
}

app.get("/hr/employees", checkAuth, requireRole("HR"), async (req, res) => {
  try {
    const emps = await prisma.employee.findMany({ include: { user: true } });
    return res.json(
      emps.map((e) => ({
        id: e.id,
        userId: e.userId,
        user: { id: e.userId, name: e.user?.name, email: e.user?.email },
        dob: e.dob ? e.dob.toISOString() : null,
        gender: e.gender || null,
        address: e.address || null,
        phone: e.phone || null,
        married: !!e.married,
        externalId: e.externalId || null,
      })),
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.get("/hr/employees/:id", checkAuth, requireRole("HR"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: { user: true, dependents: true },
    });
    if (!emp) return res.status(404).json({ error: "Not found" });
    return res.json({
      id: emp.id,
      userId: emp.userId,
      user: { id: emp.userId, name: emp.user?.name, email: emp.user?.email },
      dependents: emp.dependents || [],
      dob: emp.dob ? emp.dob.toISOString() : null,
      gender: emp.gender || null,
      address: emp.address || null,
      phone: emp.phone || null,
      married: !!emp.married,
      externalId: emp.externalId || null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// current user info (public to authenticated users)
app.get("/me", checkAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? Number(req.user.userId) : null;
    if (!userId) return res.status(401).json({ error: "Invalid token" });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      employee: user.employee
        ? {
            ...user.employee,
            dob: user.employee.dob ? user.employee.dob.toISOString() : null,
          }
        : null,
    });
  } catch (e) {
    console.error("me error", e);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Bulk create employees. Accepts { employees: [{name,email,password}, ...] }
// Optional query param ?transaction=true for all-or-nothing behavior.
app.post(
  "/hr/employee/bulk",
  checkAuth,
  requireRole("HR"),
  async (req, res) => {
    const incoming = Array.isArray(req.body.employees)
      ? req.body.employees
      : [];
    if (!incoming || incoming.length === 0)
      return res.status(400).json({ error: "No employees provided" });
    const transactional = String(req.query.transaction) === "true";

    // basic validation helper
    const validateRow = (r) => ({
      ok: !!(r && r.email && r.password),
      message: r && r.email ? "" : "Missing fields",
    });

    if (transactional) {
      // all-or-nothing: fail fast if duplicates in DB or missing fields
      try {
        const emails = incoming.map((r) => String(r.email).toLowerCase());
        // check duplicates within payload
        const dup = emails.find((e, i) => emails.indexOf(e) !== i);
        if (dup)
          return res
            .status(400)
            .json({ error: "Duplicate emails in payload", email: dup });
        // check existing in DB
        const existing = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        });
        if (existing && existing.length > 0)
          return res
            .status(400)
            .json({
              error: "Some emails already exist",
              emails: existing.map((x) => x.email),
            });

        const results = await prisma.$transaction(async (tx) => {
          const out = [];
          for (let i = 0; i < incoming.length; i++) {
            const row = incoming[i];
            if (!row || !row.email || !row.password)
              throw new Error(`Missing fields at row ${i + 1}`);
            const user = await tx.user.create({
              data: {
                name: row.name || null,
                email: row.email,
                password: row.password,
                role: "EMPLOYEE",
              },
            });
            const employee = await tx.employee.create({
              data: { userId: user.id },
            });
            out.push({
              row: i + 1,
              ok: true,
              userId: user.id,
              employeeId: employee.id,
            });
          }
          return out;
        });
        return res.status(201).json({ results });
      } catch (e) {
        console.error("bulk transactional error", e);
        return res
          .status(400)
          .json({
            error: "Bulk create failed",
            details: e?.message || String(e),
          });
      }
    }

    // Non-transactional: attempt each row and return per-row result
    const results = [];
    for (let i = 0; i < incoming.length; i++) {
      const row = incoming[i];
      if (!row || !row.email || !row.password) {
        results.push({ row: i + 1, ok: false, message: "Missing fields" });
        continue;
      }
      try {
        const existing = await prisma.user.findUnique({
          where: { email: row.email },
        });
        if (existing) {
          results.push({ row: i + 1, ok: false, message: "Email exists" });
          continue;
        }
        const user = await prisma.user.create({
          data: {
            name: row.name || null,
            email: row.email,
            password: row.password,
            role: "EMPLOYEE",
          },
        });
        const employee = await prisma.employee.create({
          data: { userId: user.id },
        });
        results.push({
          row: i + 1,
          ok: true,
          userId: user.id,
          employeeId: employee.id,
        });
      } catch (e) {
        console.error("bulk row error", e);
        results.push({
          row: i + 1,
          ok: false,
          message: e?.message || "Failed",
        });
      }
    }
    return res.status(207).json({ results });
  },
);

// Dependents endpoints for frontend (with simple persistence and lock)
app.get("/dependents", checkAuth, async (req, res) => {
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null
  const where = employeeId ? { where: { employeeId } } : {}
  const deps = employeeId ? await prisma.dependent.findMany({ where: { employeeId } }) : await prisma.dependent.findMany()
  return res.json(deps);
});

app.post("/dependents", checkAuth, async (req, res) => {
  const { name, relation, employeeId, dob, gender } = req.body;
  if (!name || !relation || !employeeId)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const dep = await prisma.dependent.create({
      data: { name, relation, employeeId: Number(employeeId), dob: dob ? new Date(dob) : undefined, gender: gender || undefined },
    });
    return res.status(201).json(dep);
  } catch (e) {
    console.error("create dependent error", e);
    try {
      fs.appendFileSync(
        "./create_dependent_error.log",
        new Date().toISOString() + "\n" + (e.stack || e.toString()) + "\n\n",
      );
    } catch (_) {}
    return res
      .status(400)
      .json({
        error: "Failed to create dependent",
        details: e?.message || String(e),
      });
  }
});

app.put("/dependents/:id", checkAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, relation, dob, gender } = req.body;
  try {
    const dep = await prisma.dependent.update({
      where: { id },
      data: { name, relation, dob: dob ? new Date(dob) : undefined, gender: gender || undefined },
    });
    return res.json(dep);
  } catch (e) {
    return res.status(404).json({ error: "Not found or locked" });
  }
});

app.delete("/dependents/:id", checkAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const dep = await prisma.dependent.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: "Not found" });
    if (dep.policyId)
      return res
        .status(403)
        .json({ error: "Cannot delete dependent assigned to a policy" });
    await prisma.dependent.delete({ where: { id } });
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(404).json({ error: "Not found or locked" });
  }
});

app.post("/hr/employee", checkAuth, requireRole("HR"), async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });
    const user = await prisma.user.create({
      data: { name, email, password, role: "EMPLOYEE" },
    });
    const empData = { userId: user.id };
    if (req.body.dob) empData.dob = new Date(req.body.dob);
    if (req.body.gender) empData.gender = req.body.gender;
    if (req.body.address) empData.address = req.body.address;
    if (req.body.phone) empData.phone = req.body.phone;
    if (typeof req.body.married !== 'undefined') empData.married = !!req.body.married;
    if (req.body.externalId) empData.externalId = req.body.externalId;
    const employee = await prisma.employee.create({ data: empData });
    // create dependents if provided
    if (Array.isArray(req.body.dependents) && req.body.dependents.length) {
      for (const d of req.body.dependents) {
        const depPayload = { name: d.name, relation: d.relation, employeeId: employee.id }
        if (d.policyId) depPayload.policyId = d.policyId
        if (d.dob) depPayload.dob = new Date(d.dob)
        if (d.gender) depPayload.gender = d.gender
        await prisma.dependent.create({ data: depPayload })
      }
    }

    // reload with relations
    const result = await prisma.employee.findUnique({ where: { id: employee.id }, include: { user: true, dependents: true } })
    return res
      .status(201)
      .json({ user: { id: user.id, name: user.name, email: user.email }, employee: result });
  } catch (e) {
    console.error("create employee error", e);
    try {
      fs.appendFileSync(
        "./backend/create_employee_error.log",
        new Date().toISOString() + "\n" + (e.stack || e.toString()) + "\n\n",
      );
    } catch (_) {}
    return res.status(500).json({ error: "Failed to create employee" });
  }
});

// Policies
app.post("/policies", checkAuth, requireRole("HR"), async (req, res) => {
  const { policyNumber, name } = req.body;
  if (!policyNumber || !name)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const p = await prisma.policy.create({ data: { policyNumber, name } });
    return res.status(201).json(p);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create policy" });
  }
});

app.get("/policies", checkAuth, requireRole("HR"), async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      include: { dependents: true },
    });
    return res.json(policies);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch policies" });
  }
});

// assign dependent(s) to a policy
app.post(
  "/policies/:id/assign",
  checkAuth,
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { dependentId } = req.body;
    if (!dependentId)
      return res.status(400).json({ error: "Missing dependentId" });
    try {
      const dep = await prisma.dependent.update({
        where: { id: Number(dependentId) },
        data: { policyId: id },
      });
      return res.json(dep);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ error: "Failed to assign dependent" });
    }
  },
);

// unassign dependent from policy
app.post(
  "/policies/:id/unassign",
  checkAuth,
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { dependentId } = req.body;
    if (!dependentId)
      return res.status(400).json({ error: "Missing dependentId" });
    try {
      const dep = await prisma.dependent.update({
        where: { id: Number(dependentId) },
        data: { policyId: null },
      });
      return res.json(dep);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ error: "Failed to unassign dependent" });
    }
  },
);

// Update employee (HR only)
app.put("/hr/employee/:id", checkAuth, requireRole("HR"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, dob, address, phone, married, gender, externalId } = req.body;
  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: "Not found" });
    await prisma.user
      .update({
        where: { id: employee.userId },
        data: { name: name ?? undefined, email: email ?? undefined },
      })
      .catch(() => null);
    // update employee-specific fields
    const empUpdate:any = {};
    if (dob) empUpdate.dob = new Date(dob);
    if (typeof married !== 'undefined') empUpdate.married = !!married;
    if (address) empUpdate.address = address;
    if (phone) empUpdate.phone = phone;
    if (gender) empUpdate.gender = gender;
    if (externalId) empUpdate.externalId = externalId;
    if (Object.keys(empUpdate).length > 0) {
      await prisma.employee.update({ where: { id }, data: empUpdate }).catch(()=>null);
    }
    const user = await prisma.user.findUnique({
      where: { id: employee.userId },
    });
    const emp = await prisma.employee.findUnique({ where: { id } });
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      employee: emp ? {
        id: emp.id,
        dob: emp.dob ? emp.dob.toISOString() : null,
        address: emp.address || null,
        phone: emp.phone || null,
        married: !!emp.married,
        gender: emp.gender || null,
        externalId: emp.externalId || null,
      } : null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete employee (HR only) - cascade delete dependents
app.delete(
  "/hr/employee/:id",
  checkAuth,
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      const employee = await prisma.employee.findUnique({ where: { id } });
      if (!employee) return res.status(404).json({ error: "Not found" });
      await prisma.employee.delete({ where: { id } });
      // user and dependents cascade handled by Prisma schema if configured; attempt to remove user as well
      await prisma.user
        .delete({ where: { id: employee.userId } })
        .catch(() => null);
      return res.json({ message: "Deleted" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete" });
    }
  },
);

app.listen(PORT, () => console.log("Mock backend running on", PORT));
