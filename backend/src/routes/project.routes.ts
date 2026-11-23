import { Router } from "express";
import {
  createProjectController,
  getProjectByIdController,
  updateProjectController,
} from "../controllers/project.controller";
import { similarProjectsController } from "../controllers/similar-projects.controller";
import { exportProjectBacklogController } from "../controllers/azure-devops.controller";
import { azureDevOpsAuthGuard } from "./azure-devops.routes";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Rota de projetos funcionando!",
  });
});

router.get("/:id/similar", similarProjectsController);
router.get("/:id", getProjectByIdController);
router.post("/", createProjectController);
router.put("/:id", updateProjectController);

router.post("/:id/export/azure-devops", azureDevOpsAuthGuard, exportProjectBacklogController);
router.post("/:id/export/azure-boards", azureDevOpsAuthGuard, exportProjectBacklogController);

export default router;

