import { Router } from "express";
import multer from 'multer';
import {
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  createEmployeesBulk,
} from "../controllers/hr.controller";

import { authenticate } from "../middleware/auth.middleware";
import { verifyHR } from "../middleware/role.middleware";
import { getPresignedUpload } from '../controllers/hr.controller'

const router = Router();
const upload = multer();

/**
 * HR PROTECTED ROUTES - Employee CRUD Operations
 * 
 * All routes require:
 * 1. Valid JWT token (authenticate)
 * 2. HR role (verifyHR)
 * 
 * Returns:
 * - 401 if token missing or invalid
 * - 403 if user role is not HR
 */

// GET all employees
router.get("/employees", authenticate, verifyHR, getAllEmployees);

// CREATE employee
router.post("/employee", authenticate, verifyHR, createEmployee);
// BULK create employees (accepts array of employee payloads)
router.post("/employee/bulk", authenticate, verifyHR, upload.single('file'), createEmployeesBulk);

// PRESIGNED upload stub (returns form data fields for direct upload)
router.post('/employee/upload-presigned', authenticate, verifyHR, getPresignedUpload)

// UPDATE employee
router.put("/employee/:id", authenticate, verifyHR, updateEmployee);

// DELETE employee
router.delete(
  "/employee/:id",
  authenticate,
  verifyHR,
  deleteEmployee,
);

export default router;
