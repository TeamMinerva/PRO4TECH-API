import { Router } from "express";
import {
  createProjectController,
  getProjectByIdController,
} from "../controllers/project.controller";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Rota de projetos funcionando!",
  });
});

router.get("/:id", getProjectByIdController);

router.post("/", createProjectController);

export default router;