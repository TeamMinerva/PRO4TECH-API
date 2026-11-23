import { Router } from "express";
import { chatGeralController } from "../controllers/general-chat.controller";

const router = Router();

router.post("/", chatGeralController);
router.post("/general", chatGeralController);

export default router;
