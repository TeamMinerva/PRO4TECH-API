import { Router } from "express";
import { createProjectController } from "../controllers/project.controller";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Rota de projetos funcionando!",
  });
});

router.post("/", createProjectController);

export default router;