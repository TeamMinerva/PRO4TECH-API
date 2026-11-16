import { Router, type NextFunction, type Request, type Response } from "express";
import {
  createWorkItemController,
  listWorkItemTypesController,
} from "../controllers/azure-devops.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

function azureDevOpsAuthGuard(req: Request, res: Response, next: NextFunction) {
  if (
    process.env.AZURE_DEVOPS_REQUIRE_AUTH === "true" ||
    Boolean(req.headers.authorization)
  ) {
    return authMiddleware(req, res, next);
  }
  return next();
}

router.use(azureDevOpsAuthGuard);

router.get("/work-item-types", listWorkItemTypesController);
router.post("/work-items", createWorkItemController);

export default router;
