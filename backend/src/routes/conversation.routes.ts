import { Router } from "express";
import { createConversationController, getConversationsController, getMessagesController } from "../controllers/conversation.controller";

const router = Router();

router.post("/", createConversationController);
router.get("/", getConversationsController);
router.get("/:id/messages", getMessagesController);

export default router;