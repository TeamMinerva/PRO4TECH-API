import { Router } from "express";
import { createBugController } from "../controllers/bug.controller";

const bugsRouter = Router();

bugsRouter.post("/", createBugController);

export default bugsRouter;