import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

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