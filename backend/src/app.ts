import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import developerRoutes from './routes/developer.routes';
import projectRoutes from "./routes/project.routes";
import technologyRoutes from "./routes/technology.routes";
import { developerGalleryRoutes } from "./routes/developers-gallery.route";
import { projectGalleryRoutes } from "./routes/projects-galley.route";
import bugsRouter from "./routes/bug.route";
import chatRoutes from "./routes/chat-project.routes";
import generalChatRoutes from "./routes/general-chat.routes";
import conversationRoutes from "./routes/conversation.routes";

const app = express();

app.use(cors());
app.use(express.json()); 

app.use("/api/projects", projectRoutes);
app.use('/api/developers', developerRoutes);
app.use("/api/technologies", technologyRoutes);
app.use("/api/developers-gallery", developerGalleryRoutes);
app.use('/api/projects-gallery', projectGalleryRoutes);
app.use('/api/bugs', bugsRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/chat", generalChatRoutes);
app.use("/api/conversations", conversationRoutes);

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Pro4Tech funcionando!" });
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Requisição recebida 👍" });
});

export default app;