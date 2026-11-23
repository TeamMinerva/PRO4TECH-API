import express from "express";
import cors from "cors";
import { authMiddleware } from "./middlewares/auth.middleware";
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
import azureDevOpsRoutes from "./routes/azure-devops.routes";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/projects", authMiddleware, projectRoutes);
app.use('/api/developers', authMiddleware, developerRoutes);
app.use("/api/technologies", authMiddleware, technologyRoutes);
app.use("/api/developers-gallery", authMiddleware, developerGalleryRoutes);
app.use('/api/projects-gallery', authMiddleware, projectGalleryRoutes);
app.use('/api/bugs', authMiddleware, bugsRouter);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/chat", authMiddleware, generalChatRoutes);
app.use("/api/conversations", authMiddleware, conversationRoutes);
app.use("/api/azure-devops", authMiddleware, azureDevOpsRoutes);
app.use("/api/azure-boards", authMiddleware, azureDevOpsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Pro4Tech funcionando!" });
});

app.get("/api/test", authMiddleware, (req, res) => {
  res.json({ success: true, message: "Requisição recebida 👍" });
});

export default app;