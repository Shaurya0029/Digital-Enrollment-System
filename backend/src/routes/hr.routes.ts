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
import { isHR } from "../middleware/role.middleware";
import { getPresignedUpload } from '../controllers/hr.controller'

const router = Router();
const upload = multer();

/**
 * HR PROTECTED ROUTES
 */

// GET all employees
router.get("/employees", authenticate, isHR, getAllEmployees);

// CREATE employee
router.post("/employee", authenticate, isHR, createEmployee);
// BULK create employees (accepts array of employee payloads)
router.post("/employee/bulk", authenticate, isHR, upload.single('file'), createEmployeesBulk);

// PRESIGNED upload stub (returns form data fields for direct upload)
router.post('/employee/upload-presigned', authenticate, isHR, getPresignedUpload)

// UPDATE employee
router.put("/employee/:id", authenticate, isHR, updateEmployee);

// DELETE employee
router.delete(
  "/employee/:id",
  authenticate,
  isHR,
  deleteEmployee,
);

export default router;
