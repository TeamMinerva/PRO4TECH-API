import { Router } from "express";
import {
  createConversationController,
  deleteConversationController,
  getConversationsController,
  getMessagesController,
  updateConversationController,
} from "../controllers/conversation.controller";

const router = Router();

router.post("/", createConversationController);
router.get("/", getConversationsController);
router.get("/:id/messages", getMessagesController);
router.patch("/:id", updateConversationController);
router.put("/:id", updateConversationController);
router.delete("/:id", deleteConversationController);

export default router;
