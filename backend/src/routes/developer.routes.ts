import { Router } from "express";

import { createDeveloperController, getDeveloperController } from "../controllers/developer.controller";

import { developerChatController } from "../controllers/developer-chat.controller";

const router = Router();

router.post("/", createDeveloperController);
router.get("/:id", getDeveloperController);
router.post("/:id/chat", developerChatController);

export default router;