import { Router } from "express";

import { createDeveloperController } from "../controllers/developer.controller";

const router = Router();

router.post("/", createDeveloperController);

export default router;