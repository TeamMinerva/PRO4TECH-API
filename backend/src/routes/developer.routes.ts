import { Router } from "express";

import { createDeveloperController, getDeveloperController } from "../controllers/developer.controller";
import { recommendDevelopersController } from "../controllers/developer-recommendation.controller";
import { developerChatController } from "../controllers/developer-chat.controller";

const router = Router();

router.post("/", createDeveloperController);
router.post("/recommend", recommendDevelopersController);
router.get("/:id", getDeveloperController);
router.post("/:id/chat", developerChatController);

export default router;