import { Request, Response } from "express";
import { prisma } from "../prisma";
import { cacheGet, cacheSet } from '../utils/cache'
import XLSX from 'xlsx';

function parseCsvText(text: string){
  const lines = text.split(/\r?\n/).filter(l=>l.trim() !== '')
  if (lines.length < 1) return []
  const headers = lines[0].split(',').map(h=>h.trim())
  const rows = lines.slice(1).map(line=>{
    const cols = line.split(',').map(c=>c.trim())
    const obj:any = {}
    headers.forEach((h,i)=> obj[h] = cols[i] ?? '')
    return obj
  })
  return rows
}

async function parseFileBuffer(buffer: Buffer, filename: string){
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv')){
    return parseCsvText(buffer.toString('utf8'))
  }
  // try xlsx
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const first = workbook.SheetNames[0]
  const sheet = workbook.Sheets[first]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[]
  return json.map(r => {
    const obj:any = {}
    Object.keys(r).forEach(k=> obj[k] = String(r[k] ?? ''))
    return obj
  })
}

/**
 * GET ALL EMPLOYEES (HR only)
 */
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'hr:employees'
    const cached = cacheGet(cacheKey)
    if (cached) return res.json(cached)

    const employees = await prisma.employee.findMany({
      include: {
        user: true,
      },
    });

    cacheSet(cacheKey, employees, 60) // cache for 60s

    return res.json(employees);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
};

/**
 * CREATE EMPLOYEE (HR only)
 */
export const createEmployee = async (req: Request, res: Response) => {
  // accept extended payload: { name, email, password, dob, gender, dependents: [{name, relation, policyId?}] }
  const { name, email, password, dob, gender, dependents } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const user = await prisma.user.create({ data: { name, email, password, role: "EMPLOYEE" } });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        dob: dob ? new Date(dob) : undefined,
        gender: gender || undefined,
      },
    });

    // create dependents if provided (array of { name, relation, policyId? })
    if (Array.isArray(dependents) && dependents.length) {
      for (const d of dependents) {
        const depPayload: any = { name: d.name, relation: d.relation, employeeId: employee.id };
        if (d.policyId) depPayload.policyId = d.policyId;
        if (d.dob) depPayload.dob = new Date(d.dob);
        if (d.gender) depPayload.gender = d.gender;
        await prisma.dependent.create({ data: depPayload });
      }
    }

    // reload employee with relations
    const result = await prisma.employee.findUnique({ where: { id: employee.id }, include: { user: true, dependents: true } });

    return res.status(201).json({ employee: result, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create employee" });
  }
};

/**
 * DELETE EMPLOYEE (HR only)
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  const userId = Number((req as any).params.id);

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // delete child first
    await prisma.employee.delete({
      where: { userId },
    });

    // then delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete employee" });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const userId = Number((req as any).params.id);
  const { name, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Invalid employee ID" });
  }

  try {
    // 1️⃣ Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // 2️⃣ Update USER table (name & email live here)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
    });

    return res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ error: "Update failed" });
  }
};

/**
 * BULK CREATE EMPLOYEES (HR only)
 * Expects: [{ name, email, password, dob?, gender?, dependents?: [{name,relation,policyId?}] }, ...]
 */
export const createEmployeesBulk = async (req: Request, res: Response) => {
  let payload: any = req.body

  // if a file was uploaded (multipart/form-data), parse it into payload array
  if ((req as any).file && !(Array.isArray(payload) && payload.length)) {
    try {
      const file = (req as any).file
      const rows = await parseFileBuffer(file.buffer, file.originalname)
      payload = rows
    } catch (err:any) {
      console.error('Failed to parse uploaded file', err)
      return res.status(400).json({ error: 'Failed to parse uploaded file' })
    }
  }

  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Expected an array of employees' })

  const created: any[] = []
  const errors: any[] = []

  for (const item of payload) {
    const { name, email, password, dob, gender, dependents } = item
    if (!name || !email) {
      errors.push({ item, error: 'Missing name or email' })
      continue
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) { errors.push({ item, error: 'User exists' }); continue }

      const user = await prisma.user.create({ data: { name, email, password: password || 'changeme', role: 'EMPLOYEE' } })
      const employee = await prisma.employee.create({ data: { userId: user.id, dob: dob ? new Date(dob) : undefined, gender: gender || undefined } })

      if (Array.isArray(dependents) && dependents.length) {
        for (const d of dependents) {
          const depPayload: any = { name: d.name, relation: d.relation, employeeId: employee.id }
          if (d.policyId) depPayload.policyId = d.policyId
          if (d.dob) depPayload.dob = new Date(d.dob)
          if (d.gender) depPayload.gender = d.gender
          await prisma.dependent.create({ data: depPayload })
        }
      }

      const result = await prisma.employee.findUnique({ where: { id: employee.id }, include: { user: true, dependents: true } })
      created.push(result)
    } catch (err:any) {
      console.error('bulk create error', err)
      errors.push({ item, error: err.message || 'create failed' })
    }
  }

  return res.json({ createdCount: created.length, created, errors })
}

/**
 * PRESIGNED UPLOAD STUB
 * Returns a placeholder response that describes expected fields for a real S3 presigned POST.
 * In production, this should call AWS SDK / S3 buildPresignedPost and return the URL + fields.
 */
export const getPresignedUpload = async (req: Request, res: Response) => {
  // basic stub for dev - instructs frontend how to upload directly to storage
  const bucketUrl = process.env.PRESIGNED_BUCKET_URL || 'https://example-bucket.s3.amazonaws.com'
  const response = {
    url: bucketUrl,
    // example fields returned by S3 presigned POST (policy, signature, key, etc.)
    fields: {
      key: 'uploads/${filename}',
      policy: 'BASE64_POLICY_PLACEHOLDER',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'CREDENTIAL_PLACEHOLDER',
      'x-amz-signature': 'SIGNATURE_PLACEHOLDER',
    },
    note: 'This is a stub. Replace with a real presigned POST from your storage provider.'
  }

  return res.json(response)
}
