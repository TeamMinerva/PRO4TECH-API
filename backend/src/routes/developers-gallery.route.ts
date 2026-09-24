import { Router } from "express";
import * as developerController from "../controllers/developers-gallery.controller";

export const developerGalleryRoutes = Router();

developerGalleryRoutes.get("/", developerController.listDevelopers);