import { Router } from "express";
import {
  chatDesenvolvedorController,
  chatProjetoController,
} from "../controllers/chat-project.controller";

const router = Router();

// Um endpoint por contexto de chat. Para um novo contexto (ex.: desenvolvedor),
// basta adicionar uma rota aqui, um serviço em chat.service.ts e o endpoint
// correspondente no serviço de IA — o componente de chat do front é o mesmo.
router.post("/projects/:id", chatProjetoController);
router.post("/developers/:id", chatDesenvolvedorController);

export default router;
