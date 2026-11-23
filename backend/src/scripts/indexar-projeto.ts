import { IndexacaoService } from "../services/indexacao.service";

async function main() {
  const projectId = Number(process.argv[2]);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || projectId > 2147483647) {
    console.error("Informe um ID de projeto inteiro positivo.");
    process.exitCode = 1;
    return;
  }

  try {
    await new IndexacaoService().reindexarProjeto(projectId);
    console.log(`Indexação do projeto ${projectId} concluída.`);
  } catch (error) {
    console.error(`Indexação do projeto ${projectId} não concluída.`, error);
    process.exitCode = 1;
  }
}

void main();
