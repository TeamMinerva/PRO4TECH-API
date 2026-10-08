import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export class IndexacaoService {
  async gerarEIndexarConhecimentoTotal() {
    try {
      const projetos = await prisma.project.findMany({
        include: {
          technologies: true,
          bugs: { include: { developer: true } },
          epics: { include: { features: { include: { pbis: { include: { developers: { include: { technologies: true } } } } } } } }
        }
      });

      let textoParaIA = "BASE DE CONHECIMENTO DO SISTEMA PRO4TECH:\n\n";

      for (const projeto of projetos) {
        textoParaIA += this.formatarProjeto(projeto);
      }

      console.log("Texto estruturado gerado com sucesso!");
      await this.enviarParaLightRAG(textoParaIA);

      return { success: true, message: "Indexação concluída." };
    } catch (error) {
      console.error("Erro ao gerar indexação:", error);
      return { success: false, error };
    }
  }

  async atualizarProjetoNoRAG(projetoId: number) {
    try {
      const projeto = await prisma.project.findUnique({
        where: { id: projetoId },
        include: {
          technologies: true,
          bugs: { include: { developer: true } },
          epics: { include: { features: { include: { pbis: { include: { developers: { include: { technologies: true } } } } } } } }
        }
      });

      if (projeto) {
        const textoAtualizado = this.formatarProjeto(projeto);
        console.log(`Enviando atualização do projeto ${projeto.name} para o RAG...`);
        await this.enviarParaLightRAG(textoAtualizado);
      }
    } catch (error) {
      console.error("Erro ao atualizar projeto no RAG:", error);
    }
  }

  private formatarProjeto(projeto: any): string {
    const techsProjeto = projeto.technologies.map((t: any) => t.name).join(", ");
    let texto = `\n--- PROJETO: ${projeto.name} ---\n`;
    texto += `O projeto '${projeto.name}' está no status ${projeto.status}. Tecnologias usadas: ${techsProjeto || 'Não definidas'}.\n`;

    for (const bug of projeto.bugs) {
       texto += `Foi registrado o problema/bug '${bug.title}' no projeto '${projeto.name}'. Descrição: ${bug.description}. Solução aplicada: ${bug.solution}. O desenvolvedor associado é '${bug.developer.name}'.\n`;
    }

    for (const epico of projeto.epics) {
      texto += `Dentro do projeto '${projeto.name}', existe o Épico '${epico.name}'. Objetivo: ${epico.objective}. Resultado esperado: ${epico.expectedResult}.\n`;

      for (const feature of epico.features) {
        texto += `O Épico '${epico.name}' possui a Feature '${feature.name}'. Descrição: ${feature.description}. Critérios: ${feature.approvalCriteria}.\n`;

        for (const pbi of feature.pbis) {
          texto += `Para a Feature '${feature.name}', temos o PBI '${pbi.title}'. História: ${pbi.userStory}. Aceite: ${pbi.acceptanceCriteria}.\n`;

          for (const dev of pbi.developers) {
             const techsDev = dev.technologies.map((t: any) => t.name).join(", ");
             texto += `O desenvolvedor '${dev.name}' trabalha no PBI '${pbi.title}'. Competências: ${techsDev || 'Nenhuma'}.\n`;
          }
        }
      }
    }
    return texto;
  }

  private async enviarParaLightRAG(conteudo: string) {
    try {
      const urlFastAPI = process.env.LIGHTRAG_URL || 'http://localhost:8000/api/indexar';
      await axios.post(urlFastAPI, { texto: conteudo });
      console.log("Dados recebidos pela IA!");
    } catch (error) {
      console.log(conteudo.substring(0, 500) + "\n...[MENSAGEM CORTADA PARA NÃO POLUIR O TERMINAL]...");
      console.log("A IA ainda não está online para receber os dados.");
    }
  }
}