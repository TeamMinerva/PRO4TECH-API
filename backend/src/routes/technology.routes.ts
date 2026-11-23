import { Router } from "express";
import {
  createTechnologyController,
  deleteTechnologyController,
  getTechnologyController,
  listTechnologiesController,
  updateTechnologyController,
} from "../controllers/technology.controller";

const router = Router();

router.get("/", listTechnologiesController);
router.get("/:id", getTechnologyController);
router.post("/", createTechnologyController);
router.put("/:id", updateTechnologyController);
router.delete("/:id", deleteTechnologyController);

export default router;
