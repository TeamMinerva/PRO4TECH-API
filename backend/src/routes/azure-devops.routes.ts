import { Router, type NextFunction, type Request, type Response } from "express";
import {
  createWorkItemController,
  exportProjectBacklogController,
  listWorkItemTypesController,
} from "../controllers/azure-devops.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

export function azureDevOpsAuthGuard(req: Request, res: Response, next: NextFunction) {
  return authMiddleware(req, res, next);
}

router.use(azureDevOpsAuthGuard);

router.get("/work-item-types", listWorkItemTypesController);
router.post("/work-items", createWorkItemController);
router.post("/projects/:projectId/export", exportProjectBacklogController);

export default router;

