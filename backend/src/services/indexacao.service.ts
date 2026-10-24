import { prisma } from '../lib/prisma';
import { AI_TIMEOUT_MS, postJson } from './ai-http.service';

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

      for (const projeto of projetos) {
        const textoParaIA = this.formatarProjeto(projeto);
        await this.enviarParaLightRAG(textoParaIA, `projeto_${projeto.id}`);
      }

      const desenvolvedores = await prisma.developer.findMany({
        include: { technologies: true }
      });

      for (const dev of desenvolvedores) {
        const textoDev = this.formatarDesenvolvedor(dev);
        await this.enviarParaLightRAG(textoDev, `dev_${dev.id}`);
      }

      return { success: true, message: "Indexação concluída." };
    } catch (error) {
      console.error("event=knowledge_indexing_failed", error);
      return { success: false, error };
    }
  }

  async atualizarProjetoNoRAG(projetoId: number) {
    try {
      await this.reindexarProjeto(projetoId);
    } catch (error) {
      console.error("event=project_knowledge_indexing_failed project_id=%d", projetoId, error);
    }
  }

  async reindexarProjeto(projetoId: number) {
    const projeto = await prisma.project.findUnique({
      where: { id: projetoId },
      include: {
        technologies: true,
        bugs: { include: { developer: true } },
        epics: { include: { features: { include: { pbis: { include: { developers: { include: { technologies: true } } } } } } } }
      }
    });
    if (!projeto) {
      throw new Error(`Projeto ${projetoId} não encontrado.`);
    }

    const textoAtualizado = this.formatarProjeto(projeto);
    await this.enviarParaLightRAG(textoAtualizado, `projeto_${projeto.id}`);
  }

  async atualizarDesenvolvedorNoRAG(devId: number) {
    try {
      const dev = await prisma.developer.findUnique({
        where: { id: devId },
        include: { technologies: true }
      });

      if (dev) {
        const textoDev = this.formatarDesenvolvedor(dev);
        await this.enviarParaLightRAG(textoDev, `dev_${dev.id}`);
      }
    } catch (error) {
      console.error("event=developer_knowledge_indexing_failed developer_id=%d", devId, error);
    }
  }

  private formatarDesenvolvedor(dev: any): string {
    const techsDev = dev.technologies.map((t: any) => t.name).join(", ");
    return `\n--- DESENVOLVEDOR: ${dev.name} ---\nO desenvolvedor '${dev.name}' está com status ativo: ${dev.active}. Competências técnicas: ${techsDev || 'Nenhuma registrada'}.\n`;
  }

  private formatarProjeto(projeto: any): string {
    const techsProjeto = projeto.technologies.map((t: any) => t.name).join(", ");
    let texto = `\n--- PROJETO: ${projeto.name} ---\n`;
    texto += `O projeto '${projeto.name}' está no status ${projeto.status}. Tecnologias usadas: ${techsProjeto || 'Não definidas'}.\n`;

    for (const bug of projeto.bugs) {
       texto += `Foi registrado o problema/bug '${bug.title}' no projeto '${projeto.name}'. Descrição: ${bug.description}. Solução aplicada: ${bug.solution}. O desenvolvedor associado é '${bug.developer.name}'.\n`;
    }

    for (const epico of projeto.epics) {
      texto += `Dentro do projeto '${projeto.name}', existe o Épico '${epico.name}'. Descrição: ${epico.description}. Objetivo: ${epico.objective}. Resultado esperado: ${epico.expectedResult}.\n`;

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

  private async enviarParaLightRAG(conteudo: string, docId: string) {
    const urlFastAPI = process.env.LIGHTRAG_URL || 'http://localhost:8000/knowledge';
    try {
      const resposta = await postJson(
        urlFastAPI,
        {
          text: conteudo,
          doc_id: docId
        },
        AI_TIMEOUT_MS,
      );
      if (resposta.status < 200 || resposta.status >= 300) {
        console.error(
          "event=lightrag_indexing_http_failed document_id=%s http_status=%d",
          docId,
          resposta.status,
        );
        throw new Error(`LightRAG respondeu com HTTP ${resposta.status}.`);
      }
    } catch (error) {
      console.error(
        "event=lightrag_indexing_request_failed document_id=%s endpoint_host=%s",
        docId,
        new URL(urlFastAPI).host,
        error,
      );
      throw error;
    }
  }
}