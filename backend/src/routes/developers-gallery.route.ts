import { Router } from "express";
import * as developerController from "../controllers/developers-gallery.controller";
import { createDeveloperController } from "../controllers/developer.controller";

export const developerGalleryRoutes = Router();

developerGalleryRoutes.get("/", developerController.listDevelopers);
developerGalleryRoutes.post("/", createDeveloperController);