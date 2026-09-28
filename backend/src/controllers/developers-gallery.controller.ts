import type { NextFunction, Request, Response } from "express";
import { listDevelopersQuerySchema } from "../schemas/developers-gallery.schema";
import * as developerService from "../services/developers-gallery.service";

export async function listDevelopers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listDevelopersQuerySchema.parse(req.query);
    const developers = await developerService.listDevelopers(query);
    return res.json(developers);
  } catch (error) {
    return next(error);
  }
}