import { Router } from "express";
import {
  createPolicy,
  getPolicies,
  assignDependent,
} from "../controllers/policy.controller";
import { authenticate } from "../middleware/auth.middleware";
import { isHR } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, isHR, createPolicy);
router.get("/", authenticate, isHR, getPolicies);
// assigning/unassigning dependents to a policy: HR can assign any; employee may assign/unassign their own dependents
router.post("/:id/assign", authenticate, assignDependent);

export default router;
