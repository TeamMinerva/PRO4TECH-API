import { prisma } from '../lib/prisma';

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
      console.error("Aviso: falha ao gerar indexação total", error);
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
        await this.enviarParaLightRAG(textoAtualizado, `projeto_${projeto.id}`);
      }
    } catch (error) {
      console.error("Aviso: falha ao atualizar projeto no LightRAG", error);
    }
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
      console.error("Aviso: falha ao atualizar desenvolvedor no LightRAG", error);
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

  private formatarDesenvolvedor(dev: any): string {
    const techsDev = (dev.technologies || []).map((t: any) => t.name).join(", ");
    const statusDev = dev.active ? "Ativo" : "Inativo";
    let texto = `\n--- DESENVOLVEDOR: ${dev.name} ---\nO desenvolvedor '${dev.name}' está com status ${statusDev}. Competências técnicas: ${techsDev || 'Nenhuma registrada'}.\n`;

    for (const pbi of dev.pbis || []) {
      const featureNome = pbi.feature?.name;
      const epicoNome = pbi.feature?.epic?.name;
      const projetoNome = pbi.feature?.epic?.project?.name;
      texto += `O desenvolvedor '${dev.name}' trabalha no PBI '${pbi.title}'`
        + (featureNome ? ` (Feature '${featureNome}'` : '')
        + (epicoNome ? `, Épico '${epicoNome}'` : '')
        + (projetoNome ? `, Projeto '${projetoNome}'` : '')
        + (featureNome ? `)` : '')
        + `.\n`;
    }

    for (const bug of dev.bugs || []) {
      const projetoNome = bug.project?.name;
      texto += `O desenvolvedor '${dev.name}' resolveu o problema/bug '${bug.title}'`
        + (projetoNome ? ` no projeto '${projetoNome}'` : '')
        + `. Descrição do problema: ${bug.description}. Solução aplicada: ${bug.solution}.\n`;
    }

    return texto;
  }

  private formatarProjeto(projeto: any): string {
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
    try {
      const urlFastAPI = process.env.LIGHTRAG_URL || 'http://localhost:8000/knowledge';
      
      await fetch(urlFastAPI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: conteudo,
          doc_id: docId
        })
      });
    } catch (error) {
      console.error("Aviso: falha de rede ao comunicar com o LightRAG.", error);
    }
  }
}