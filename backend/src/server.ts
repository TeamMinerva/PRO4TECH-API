import app from "./app";
import { checkAzureDevOpsConfigOnStartup } from "./config/azure-devops.config";

const PORT = process.env.PORT || 3000;

checkAzureDevOpsConfigOnStartup();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});