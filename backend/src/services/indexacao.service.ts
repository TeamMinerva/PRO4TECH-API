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
        include: {
          technologies: true,
          bugs: { include: { project: true } },
          pbis: { include: { feature: { include: { epic: { include: { project: true } } } } } },
        }
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
        include: {
          technologies: true,
          bugs: { include: { project: true } },
          pbis: { include: { feature: { include: { epic: { include: { project: true } } } } } },
        }
      });

      if (dev) {
        const textoDev = this.formatarDesenvolvedor(dev);
        await this.enviarParaLightRAG(textoDev, `dev_${dev.id}`);
      }
    } catch (error) {
      console.error("event=developer_knowledge_indexing_failed developer_id=%d", devId, error);
    }
  }

  private formatarStatusProjeto(status: string): string {
    const mapa: Record<string, string> = {
      PLANNED: "Planejado",
      IN_PROGRESS: "Em andamento",
      DONE: "Concluído",
    };
    return mapa[status] || status;
  }

  public formatarDesenvolvedor(dev: any): string {
    const techsDev = (dev.technologies || []).map((t: any) => t.name).join(", ");
    const statusDev = dev.active ? "Ativo" : "Inativo";

    const projetosMap = new Map<number, { name: string; status: string }>();
    for (const pbi of dev.pbis || []) {
      const proj = pbi.feature?.epic?.project;
      if (proj && !projetosMap.has(proj.id)) {
        projetosMap.set(proj.id, {
          name: proj.name,
          status: this.formatarStatusProjeto(proj.status),
        });
      }
    }
    for (const bug of dev.bugs || []) {
      const proj = bug.project;
      if (proj && !projetosMap.has(proj.id)) {
        projetosMap.set(proj.id, {
          name: proj.name,
          status: this.formatarStatusProjeto(proj.status),
        });
      }
    }

    const listaProjetos = Array.from(projetosMap.values())
      .map((p) => `'${p.name}' (${p.status})`)
      .join(", ");

    let texto = `\n--- DESENVOLVEDOR: ${dev.name} ---\n`;
    texto += `O desenvolvedor '${dev.name}' está com status ${statusDev}. `;
    texto += `Competências técnicas: ${techsDev || "Nenhuma registrada"}. `;
    texto += `Projetos em que participou: ${listaProjetos || "Nenhum projeto vinculado"}.\n`;

    for (const pbi of dev.pbis || []) {
      const feature = pbi.feature;
      const epico = feature?.epic;
      const projeto = epico?.project;

      texto += `O desenvolvedor '${dev.name}' trabalha no PBI '${pbi.title}'`
        + (feature?.name ? ` (Feature '${feature.name}'` : "")
        + (epico?.name ? `, Épico '${epico.name}'` : "")
        + (projeto?.name ? `, Projeto '${projeto.name}'` : "")
        + (feature?.name ? `)` : "")
        + `. História de usuário: ${pbi.userStory}. Critérios de aceite: ${pbi.acceptanceCriteria}.\n`;
    }

    for (const bug of dev.bugs || []) {
      const projetoNome = bug.project?.name;
      texto += `O desenvolvedor '${dev.name}' resolveu o problema/bug '${bug.title}'`
        + (projetoNome ? ` no projeto '${projetoNome}'` : "")
        + `. Descrição do problema: ${bug.description}. Solução aplicada: ${bug.solution}.\n`;
    }

    return texto;
  }

  public formatarProjeto(projeto: any): string {
    const techsProjeto = projeto.technologies.map((t: any) => t.name).join(", ");
    const statusFormatado = this.formatarStatusProjeto(projeto.status);
    let texto = `\n--- PROJETO: ${projeto.name} ---\n`;
    texto += `O projeto '${projeto.name}' está no status ${statusFormatado}. Tecnologias usadas: ${techsProjeto || 'Não definidas'}.\n`;

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
