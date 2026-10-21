import { Router } from "express";

import { createDeveloperController, getDeveloperController } from "../controllers/developer.controller";

const router = Router();

router.post("/", createDeveloperController);
router.get("/:id", getDeveloperController);

export default router;