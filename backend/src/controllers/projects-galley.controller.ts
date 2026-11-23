import type { NextFunction, Request, Response } from "express";
import { listProjectsQuerySchema } from "../schemas/projects-gallery.schema";
import * as projectService from "../services/projects-gallery.service";

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listProjectsQuerySchema.parse(req.query);
    const projects = await projectService.listProjects(query);
    return res.json(projects);
  } catch (error) {
    return next(error);
  }
}