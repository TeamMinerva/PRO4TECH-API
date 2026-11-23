import { Router } from "express";
import { createBugController, updateBugController,} from "../controllers/bug.controller";

const bugsRouter = Router();

bugsRouter.post("/", createBugController);
bugsRouter.put("/:id", updateBugController);

export default bugsRouter;