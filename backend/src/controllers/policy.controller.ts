import { Request, Response } from "express";
import { prisma } from "../prisma";

export const createPolicy = async (req: Request, res: Response) => {
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
};

export const getPolicies = async (req: Request, res: Response) => {
  try {
    const policies = await prisma.policy.findMany({
      include: { dependents: true },
    });
    return res.json(policies);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch policies" });
  }
};

export const assignDependent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { dependentId } = req.body;
  if (!dependentId)
    return res.status(400).json({ error: "Missing dependentId" });
  try {
    const user = (req as any).user;

    const depRec = await prisma.dependent.findUnique({ where: { id: Number(dependentId) } });
    if (!depRec) return res.status(404).json({ error: 'Dependent not found' });

    // HR may assign any dependent
    if (String(user.role || '').toUpperCase().startsWith('HR')) {
      const dep = await prisma.dependent.update({ where: { id: Number(dependentId) }, data: { policyId: id } });
      return res.json(dep);
    }

    // Employee may assign only their own dependent
    if (String(user.role || '').toUpperCase() === 'EMPLOYEE') {
      const emp = await prisma.employee.findUnique({ where: { userId: user.userId } });
      if (!emp) return res.status(404).json({ error: 'Employee record not found' });
      if (depRec.employeeId !== emp.id) return res.status(403).json({ error: 'Access denied' });

      const dep = await prisma.dependent.update({ where: { id: Number(dependentId) }, data: { policyId: id } });
      return res.json(dep);
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: "Failed to assign dependent" });
  }
};
