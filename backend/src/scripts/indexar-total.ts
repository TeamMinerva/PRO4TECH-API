import { IndexacaoService } from "../services/indexacao.service";

async function main() {
  const indexador = new IndexacaoService();
  const resultado = await indexador.gerarEIndexarConhecimentoTotal();
  if (!resultado.success) {
    console.error("Indexação total não concluída.", resultado.error);
    process.exitCode = 1;
    return;
  }
  console.log(resultado);
}

main();