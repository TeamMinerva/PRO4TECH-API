import { Router } from "express";
import * as projectController from "../controllers/projects-galley.controller";

export const projectGalleryRoutes = Router();

projectGalleryRoutes.get("/", projectController.listProjects);