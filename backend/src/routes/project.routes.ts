import { Router } from "express";
import {
  createProjectController,
  getProjectByIdController,
  updateProjectController,
} from "../controllers/project.controller";
import { similarProjectsController } from "../controllers/similar-projects.controller";

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

export default router;
