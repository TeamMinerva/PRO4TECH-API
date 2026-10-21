import { IndexacaoService } from "../services/indexacao.service";

async function main() {
  const indexador = new IndexacaoService();
  const resultado = await indexador.gerarEIndexarConhecimentoTotal();
  console.log(resultado);
}

main();