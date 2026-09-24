import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import developerRoutes from './routes/developer.routes';
import projectRoutes from "./routes/project.routes";
import { developerGalleryRoutes } from "./routes/developers-gallery.route";
import { projectGalleryRoutes } from "./routes/projects-galley.route";

const app = express();

app.use(cors());
app.use(express.json()); 

app.use("/api/projects", projectRoutes);
app.use('/api/developers', developerRoutes);
app.use("/api/developers-gallery", developerGalleryRoutes)
app.use('/api/projects-gallery', projectGalleryRoutes)

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API Pro4Tech funcionando!"
  });
});


app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Requisição recebida 👍"
  });
});

export default app;