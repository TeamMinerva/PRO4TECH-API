import { useState } from 'react';

export interface PBI {
  id: string;
  titulo: string;
  userStory: string;
  criteriosAprovacao: string;
  desenvolvedores: string[];
}

export interface Feature {
  id: string;
  nome: string;
  descricao: string;
  criteriosAprovacao: string;
  pbis: PBI[];
}

export interface Epico {
  id: string;
  nome: string;
  descricao: string;
  objetivo: string;
  resultadoEsperado: string;
  features: Feature[];
}

export interface Projeto {
  nome: string;
  status: string;
  tecnologias: string[];
  epicos: Epico[];
}

export interface Feedback {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

const projetoInicial: Projeto = {
  nome: '',
  status: '',
  tecnologias: [],
  epicos: [],
};

export const TECNOLOGIAS_DISPONIVEIS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python',
  'Java', 'C#', 'Go', 'Docker', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Tailwind CSS', 'Next.js', 'Express', 'Prisma', 'Git',
];

export const STATUS_OPCOES = [
  { valor: 'PLANNED', label: 'Planejado' },
  { valor: 'IN_PROGRESS', label: 'Em andamento' },
  { valor: 'DONE', label: 'Concluído' },
];

function montarPayload(projeto: Projeto) {
  return {
    name: projeto.nome,
    technologies: projeto.tecnologias,
    status: projeto.status,
    epics: projeto.epicos.map((epico) => ({
      name: epico.nome,
      description: epico.descricao,
      objective: epico.objetivo,
      expectedResult: epico.resultadoEsperado,
      features: epico.features.map((feature) => ({
        name: feature.nome,
        description: feature.descricao,
        approvalCriteria: feature.criteriosAprovacao,
        pbis: feature.pbis.map((pbi) => ({
          title: pbi.titulo,
          userStory: pbi.userStory,
          acceptanceCriteria: pbi.criteriosAprovacao,
          developerIds: pbi.desenvolvedores.map(Number),
        })),
      })),
    })),
  };
}

function validarProjeto(projeto: Projeto): Record<string, string> {
  const erros: Record<string, string> = {};
  const vazio = (valor: string) => valor.trim() === '';

  if (vazio(projeto.nome)) erros['projeto.nome'] = 'Informe o nome do projeto.';
  if (projeto.status === '') erros['projeto.status'] = 'Selecione um status.';
  if (projeto.tecnologias.length === 0) erros['projeto.tecnologias'] = 'Selecione ao menos uma tecnologia.';

  projeto.epicos.forEach((epico) => {
    if (vazio(epico.nome)) erros[`epico.${epico.id}.nome`] = 'Informe o nome do épico.';
    if (vazio(epico.descricao)) erros[`epico.${epico.id}.descricao`] = 'Informe a descrição.';
    if (vazio(epico.objetivo)) erros[`epico.${epico.id}.objetivo`] = 'Informe o objetivo.';
    if (vazio(epico.resultadoEsperado)) erros[`epico.${epico.id}.resultadoEsperado`] = 'Informe o resultado esperado.';

    epico.features.forEach((feature) => {
      if (vazio(feature.nome)) erros[`feature.${feature.id}.nome`] = 'Informe o nome da feature.';
      if (vazio(feature.descricao)) erros[`feature.${feature.id}.descricao`] = 'Informe a descrição.';
      if (vazio(feature.criteriosAprovacao))
        erros[`feature.${feature.id}.criteriosAprovacao`] = 'Informe os critérios de aprovação.';

      feature.pbis.forEach((pbi) => {
        if (vazio(pbi.titulo)) erros[`pbi.${pbi.id}.titulo`] = 'Informe o título.';
        if (vazio(pbi.userStory)) erros[`pbi.${pbi.id}.userStory`] = 'Informe a user story.';
        if (vazio(pbi.criteriosAprovacao))
          erros[`pbi.${pbi.id}.criteriosAprovacao`] = 'Informe os critérios de aceitação.';
        if (pbi.desenvolvedores.length === 0)
          erros[`pbi.${pbi.id}.desenvolvedores`] = 'Selecione ao menos um desenvolvedor.';
      });
    });
  });

  return erros;
}

export function useProjeto() {
  const [projeto, setProjeto] = useState<Projeto>(projetoInicial);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [camposMarcados, setCamposMarcados] = useState<Set<string>>(new Set());

  const erros = validarProjeto(projeto);
  const erroDoCampo = (chave: string) => (camposMarcados.has(chave) ? erros[chave] : undefined);
  const temErrosVisiveis = Object.keys(erros).some((chave) => camposMarcados.has(chave));

  const atualizarNome = (nome: string) => setProjeto((prev) => ({ ...prev, nome }));

  const definirStatus = (status: string) => setProjeto((prev) => ({ ...prev, status }));

  const alternarTecnologia = (tech: string) =>
    setProjeto((prev) => ({
      ...prev,
      tecnologias: prev.tecnologias.includes(tech)
        ? prev.tecnologias.filter((t) => t !== tech)
        : [...prev.tecnologias, tech],
    }));

  const adicionarEpico = () => {
    const novo: Epico = {
      id: crypto.randomUUID(),
      nome: '',
      descricao: '',
      objetivo: '',
      resultadoEsperado: '',
      features: [],
    };
    setProjeto((prev) => ({ ...prev, epicos: [...prev.epicos, novo] }));
  };

  const adicionarFeature = (epicoId: string) => {
    const nova: Feature = {
      id: crypto.randomUUID(),
      nome: '',
      descricao: '',
      criteriosAprovacao: '',
      pbis: [],
    };
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId ? { ...e, features: [...e.features, nova] } : e
      ),
    }));
  };

  const adicionarPBI = (epicoId: string, featureId: string) => {
    const novo: PBI = {
      id: crypto.randomUUID(),
      titulo: '',
      userStory: '',
      criteriosAprovacao: '',
      desenvolvedores: [],
    };
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map((f) =>
                f.id === featureId ? { ...f, pbis: [...f.pbis, novo] } : f
              ),
            }
          : e
      ),
    }));
  };

  const removerEpico = (epicoId: string) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.filter((e) => e.id !== epicoId),
    }));

  const removerFeature = (epicoId: string, featureId: string) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? { ...e, features: e.features.filter((f) => f.id !== featureId) }
          : e
      ),
    }));

  const removerPBI = (epicoId: string, featureId: string, pbiId: string) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map((f) =>
                f.id === featureId
                  ? { ...f, pbis: f.pbis.filter((p) => p.id !== pbiId) }
                  : f
              ),
            }
          : e
      ),
    }));

  const atualizarEpico = (epicoId: string, campo: keyof Epico, valor: string) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId ? { ...e, [campo]: valor } : e
      ),
    }));

  const atualizarFeature = (
    epicoId: string,
    featureId: string,
    campo: keyof Feature,
    valor: string
  ) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map((f) =>
                f.id === featureId ? { ...f, [campo]: valor } : f
              ),
            }
          : e
      ),
    }));

  const atualizarPBI = (
    epicoId: string,
    featureId: string,
    pbiId: string,
    campo: keyof PBI,
    valor: string | string[]
  ) =>
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map((f) =>
                f.id === featureId
                  ? {
                      ...f,
                      pbis: f.pbis.map((p) =>
                        p.id === pbiId ? { ...p, [campo]: valor } : p
                      ),
                    }
                  : f
              ),
            }
          : e
      ),
    }));

  const handleSalvar = async () => {
    setFeedback(null);

    const chavesComErro = Object.keys(erros);
    if (chavesComErro.length > 0) {
      setCamposMarcados(new Set(chavesComErro));
      setFeedback({ tipo: 'erro', mensagem: 'Há campos obrigatórios não preenchidos.' });
      return;
    }

    try {
      const resposta = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(montarPayload(projeto)),
      });

      if (resposta.ok) {
        setProjeto(projetoInicial);
        setCamposMarcados(new Set());
        setFeedback({ tipo: 'sucesso', mensagem: 'Projeto salvo com sucesso!' });
      } else {
        setFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível salvar o projeto. Verifique os campos e tente novamente.',
        });
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      setFeedback({ tipo: 'erro', mensagem: 'Não foi possível conectar ao servidor.' });
    }
  };

  return {
    projeto,
    feedback,
    erroDoCampo,
    temErrosVisiveis,
    atualizarNome,
    definirStatus,
    alternarTecnologia,
    adicionarEpico,
    adicionarFeature,
    adicionarPBI,
    removerEpico,
    removerFeature,
    removerPBI,
    atualizarEpico,
    atualizarFeature,
    atualizarPBI,
    handleSalvar,
  };
}
