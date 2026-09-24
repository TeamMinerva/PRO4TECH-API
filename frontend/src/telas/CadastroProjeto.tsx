import { useEffect, useRef, useState } from 'react';

// --- TIPAGENS ---

export interface Desenvolvedor {
  id: string;
  nome: string;
}

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

const projetoInicial: Projeto = {
  nome: '',
  status: '',
  tecnologias: [],
  epicos: []
};

const TECNOLOGIAS_DISPONIVEIS = [
  "React", "Node.js", "TypeScript", "JavaScript", "Python",
  "Java", "C#", "Go", "Docker", "PostgreSQL", "MySQL",
  "MongoDB", "Tailwind CSS", "Next.js", "Express", "Prisma", "Git"
];

const STATUS_OPCOES = [
  { valor: 'PLANNED', label: 'Planejado' },
  { valor: 'IN_PROGRESS', label: 'Em andamento' },
  { valor: 'DONE', label: 'Concluído' },
];

// --- COMPONENTE PRINCIPAL ---

export default function CadastroProjeto() {
  const [projeto, setProjeto] = useState<Projeto>(projetoInicial);

  const [chatAberto, setChatAberto] = useState(true);
  const [statusAberto, setStatusAberto] = useState(false);
  const [techAberto, setTechAberto] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const techDropdownRef = useRef<HTMLDivElement>(null);

  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
    campos: string[];
  } | null>(null);

  const [devsDisponiveis, setDevsDisponiveis] = useState<Desenvolvedor[]>([]);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusAberto(false);
      }
      if (
        techDropdownRef.current &&
        !techDropdownRef.current.contains(event.target as Node)
      ) {
        setTechAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, []);

  useEffect(() => {
    async function carregarDesenvolvedores() {
      try {
        const resposta = await fetch(
          'http://localhost:3000/api/developers-gallery?active=true'
        );

        if (!resposta.ok) {
          throw new Error('Erro ao buscar desenvolvedores.');
        }

        const dados: { id: number; name: string }[] = await resposta.json();

        setDevsDisponiveis(
          dados.map((d) => ({ id: String(d.id), nome: d.name }))
        );
      } catch (erro) {
        console.error('Erro ao carregar desenvolvedores:', erro);
      }
    }

    carregarDesenvolvedores();
  }, []);

  // --- FUNÇÕES DE MANIPULAÇÃO DE ESTADO ---

  const adicionarEpico = () => {
    const novo: Epico = {
      id: crypto.randomUUID(),
      nome: '',
      descricao: '',
      objetivo: '',
      resultadoEsperado: '',
      features: []
    };

    setProjeto((prev) => ({
      ...prev,
      epicos: [...prev.epicos, novo]
    }));
  };

  const adicionarFeature = (epicoId: string) => {
    const nova: Feature = {
      id: crypto.randomUUID(),
      nome: '',
      descricao: '',
      criteriosAprovacao: '',
      pbis: []
    };

    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? { ...e, features: [...e.features, nova] }
          : e
      )
    }));
  };

  const adicionarPBI = (epicoId: string, featureId: string) => {
    const novo: PBI = {
      id: crypto.randomUUID(),
      titulo: '',
      userStory: '',
      criteriosAprovacao: '',
      desenvolvedores: []
    };

    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map((f) =>
                f.id === featureId
                  ? { ...f, pbis: [...f.pbis, novo] }
                  : f
              )
            }
          : e
      )
    }));
  };

  const removerEpico = (epicoId: string) => {
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.filter((e) => e.id !== epicoId)
    }));
  };

  const removerFeature = (epicoId: string, featureId: string) => {
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) =>
        e.id === epicoId
          ? { ...e, features: e.features.filter((f) => f.id !== featureId) }
          : e
      )
    }));
  };

  const removerPBI = (epicoId: string, featureId: string, pbiId: string) => {
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
              )
            }
          : e
      )
    }));
  };

  // --- FUNÇÕES DE ATUALIZAÇÃO DE TEXTO ---

  const atualizarEpico = (
    epicoId: string,
    campo: keyof Epico,
    valor: string
  ) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e =>
        e.id === epicoId
          ? { ...e, [campo]: valor }
          : e
      )
    }));
  };

  const atualizarFeature = (
    epicoId: string,
    featureId: string,
    campo: keyof Feature,
    valor: string
  ) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map(f =>
                f.id === featureId
                  ? { ...f, [campo]: valor }
                  : f
              )
            }
          : e
      )
    }));
  };

  const atualizarPBI = (
    epicoId: string,
    featureId: string,
    pbiId: string,
    campo: keyof PBI,
    valor: string | string[]
  ) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e =>
        e.id === epicoId
          ? {
              ...e,
              features: e.features.map(f =>
                f.id === featureId
                  ? {
                      ...f,
                      pbis: f.pbis.map(p =>
                        p.id === pbiId
                          ? { ...p, [campo]: valor }
                          : p
                      )
                    }
                  : f
              )
            }
          : e
      )
    }));
  };

  const montarPayload = () => ({
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
  });

  const validarProjeto = (): string[] => {
    const faltando: string[] = [];
    const vazio = (valor: string) => valor.trim() === '';

    if (vazio(projeto.nome)) faltando.push('Nome do projeto');
    if (projeto.status === '') faltando.push('Status');
    if (projeto.tecnologias.length === 0) faltando.push('Tecnologias');

    projeto.epicos.forEach((epico, iE) => {
      const e = `Épico ${iE + 1}`;
      if (vazio(epico.nome)) faltando.push(`${e}: nome`);
      if (vazio(epico.descricao)) faltando.push(`${e}: descrição`);
      if (vazio(epico.objetivo)) faltando.push(`${e}: objetivo`);
      if (vazio(epico.resultadoEsperado)) faltando.push(`${e}: resultado esperado`);

      epico.features.forEach((feature, iF) => {
        const f = `${e} > Feature ${iF + 1}`;
        if (vazio(feature.nome)) faltando.push(`${f}: nome`);
        if (vazio(feature.descricao)) faltando.push(`${f}: descrição`);
        if (vazio(feature.criteriosAprovacao)) faltando.push(`${f}: critérios de aprovação`);

        feature.pbis.forEach((pbi, iP) => {
          const p = `${f} > PBI ${iP + 1}`;
          if (vazio(pbi.titulo)) faltando.push(`${p}: título`);
          if (vazio(pbi.userStory)) faltando.push(`${p}: user story`);
          if (vazio(pbi.criteriosAprovacao)) faltando.push(`${p}: critérios de aceitação`);
          if (pbi.desenvolvedores.length === 0) faltando.push(`${p}: desenvolvedores`);
        });
      });
    });

    return faltando;
  };

  const handleSalvar = async () => {
    setFeedback(null);

    const faltando = validarProjeto();
    if (faltando.length > 0) {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Preencha os campos obrigatórios:',
        campos: faltando,
      });
      return;
    }

    try {
      const payload = montarPayload();
      console.log("Enviando payload para a API:", payload);
      const resposta = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resposta.ok) {
        setProjeto(projetoInicial);
        setFeedback({ tipo: 'sucesso', mensagem: 'Projeto salvo com sucesso!', campos: [] });
      } else {
        setFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível salvar o projeto. Verifique os campos e tente novamente.',
          campos: [],
        });
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      setFeedback({ tipo: 'erro', mensagem: 'Não foi possível conectar ao servidor.', campos: [] });
    }
  };

  // --- RENDERIZAÇÃO ---q
  return (
    <div className="flex h-screen bg-[#1c1c1c] text-[#a0a0a0]">

      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-700 transition-all duration-300">

        <button className="mb-6 text-gray-400 hover:text-white font-['Poppins'] text-lg">
          ← Voltar
        </button>

        {/* Nível 0: Projeto */}
        <div className="mb-8">

          <input
            type="text"
            placeholder="Nome do projeto"
            className="w-full bg-transparent text-3xl font-semibold text-white mb-4 outline-none placeholder-gray-500 font-['Outfit']"
            value={projeto.nome}
            onChange={(e) =>
              setProjeto({
                ...projeto,
                nome: e.target.value
              })
            }
          />

          <div className="flex flex-col gap-4 text-lg mb-6 border-b border-gray-800 pb-6 font-['Poppins']">

            {/* STATUS */}
            <div className="relative inline-block w-fit" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setStatusAberto(!statusAberto);
                  setTechAberto(false);
                }}
                className="flex items-center gap-2.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
              >
                {projeto.status ? (
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-gray-200 font-medium">
                      {STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label}
                    </span>
                  </span>
                ) : (
                  <span>Status</span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                    statusAberto ? 'rotate-180 text-gray-300' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {statusAberto && (
                <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 font-['Poppins']">
                  {STATUS_OPCOES.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setProjeto((prev) => ({ ...prev, status: opcao.valor }));
                        setStatusAberto(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                        projeto.status === opcao.valor
                          ? 'bg-[#2a2a2a] text-white font-medium'
                          : 'text-gray-300 hover:bg-[#282828] hover:text-white'
                      }`}
                    >
                      <span>{opcao.label}</span>
                      {projeto.status === opcao.valor && (
                        <span className="text-orange-400 text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                  {projeto.status && (
                    <button
                      type="button"
                      onClick={() => {
                        setProjeto((prev) => ({ ...prev, status: '' }));
                        setStatusAberto(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-[#282828] transition-colors border-t border-[#333] mt-1 pt-2"
                    >
                      Limpar status
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TECNOLOGIAS */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative inline-block" ref={techDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setTechAberto(!techAberto);
                    setStatusAberto(false);
                  }}
                  className="flex items-center gap-2.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
                >
                  <span>Tecnologias</span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                      techAberto ? 'rotate-180 text-gray-300' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {techAberto && (
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[220px] max-h-64 overflow-y-auto bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 font-['Poppins'] scrollbar-thin scrollbar-thumb-gray-700">
                    {TECNOLOGIAS_DISPONIVEIS.map((tech) => {
                      const selecionada = projeto.tecnologias.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => {
                            if (selecionada) {
                              setProjeto((prev) => ({
                                ...prev,
                                tecnologias: prev.tecnologias.filter((t) => t !== tech),
                              }));
                            } else {
                              setProjeto((prev) => ({
                                ...prev,
                                tecnologias: [...prev.tecnologias, tech],
                              }));
                            }
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                            selecionada
                              ? 'bg-[#2a2a2a] text-white font-medium'
                              : 'text-gray-300 hover:bg-[#282828] hover:text-white'
                          }`}
                        >
                          <span>{tech}</span>
                          {selecionada && (
                            <span className="text-orange-400 text-xs font-bold">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Badges de Tecnologias Selecionadas */}
              {projeto.tecnologias.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-[#252525] text-gray-200 border border-[#333]"
                >
                  {tech}
                  <button
                    type="button"
                    title={`Remover ${tech}`}
                    onClick={() =>
                      setProjeto((prev) => ({
                        ...prev,
                        tecnologias: prev.tecnologias.filter((t) => t !== tech),
                      }))
                    }
                    className="text-gray-400 hover:text-red-500 font-bold ml-1 transition-colors leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* Nível 1: Épicos */}

        <div className="border-l-2 border-[#333] pl-6 ml-2 space-y-10 relative">

          {projeto.epicos.map((epico, iE) => (

            <div key={epico.id} className="space-y-4">

              {/* Título do Épico - Outfit */}

              <div className="flex items-center gap-3">

                <span className="text-white text-xl font-semibold whitespace-nowrap font-['Outfit']">
                  {iE + 1}.0.0 Épico:
                </span>

                <input
                  type="text"
                  className="w-full bg-transparent text-white text-xl font-medium outline-none pb-1 font-['Outfit']"
                  value={epico.nome}
                  onChange={(e) =>
                    atualizarEpico(
                      epico.id,
                      'nome',
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  title="Excluir Épico"
                  onClick={() => removerEpico(epico.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1 text-xl font-bold ml-2"
                >
                  ✕
                </button>

              </div>

              {/* Subcampos do Épico - Poppins */}

              <div className="flex items-center gap-3 font-['Poppins']">

                <span className="text-lg text-gray-300 whitespace-nowrap">
                  Descrição:
                </span>

                <input
                  type="text"
                  value={epico.descricao}
                  onChange={(e) =>
                    atualizarEpico(
                      epico.id,
                      'descricao',
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                />

              </div>

              <div className="flex items-center gap-3 font-['Poppins']">

                <span className="text-lg text-gray-300 whitespace-nowrap">
                  Objetivo:
                </span>

                <input
                  type="text"
                  value={epico.objetivo}
                  onChange={(e) =>
                    atualizarEpico(
                      epico.id,
                      'objetivo',
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                />

              </div>

              <div className="flex items-center gap-3 font-['Poppins'] mb-6">

                <span className="text-lg text-gray-300 whitespace-nowrap">
                  Resultado esperado:
                </span>

                <input
                  type="text"
                  value={epico.resultadoEsperado}
                  onChange={(e) =>
                    atualizarEpico(
                      epico.id,
                      'resultadoEsperado',
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                />

              </div>

              {/* Nível 2: Features */}

              <div className="border-l-2 border-[#444] pl-6 space-y-8">

                {epico.features.map((feature, iF) => (

                  <div
                    key={feature.id}
                    className="space-y-4"
                  >

                    {/* Título da Feature - Outfit */}

                    <div className="flex items-center gap-3">

                      <span className="text-gray-200 font-semibold text-xl font-medium whitespace-nowrap font-['Outfit']">
                        {iE + 1}.{iF + 1}.0 Feature:
                      </span>

                      <input
                        type="text"
                        className="w-full bg-transparent text-gray-200 text-xl font-medium outline-none pb-1 font-['Outfit']"
                        value={feature.nome}
                        onChange={(e) =>
                          atualizarFeature(
                            epico.id,
                            feature.id,
                            'nome',
                            e.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        title="Excluir Feature"
                        onClick={() => removerFeature(epico.id, feature.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1 text-lg font-bold ml-2"
                      >
                        ✕
                      </button>

                    </div>

                    {/* Subcampos da Feature - Poppins */}

                    <div className="flex items-center gap-3 font-['Poppins']">

                      <span className="text-lg text-gray-300 whitespace-nowrap">
                        Descrição:
                      </span>

                      <input
                        type="text"
                        value={feature.descricao}
                        onChange={(e) =>
                          atualizarFeature(
                            epico.id,
                            feature.id,
                            'descricao',
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                      />

                    </div>

                    <div className="flex items-center gap-3 font-['Poppins'] mb-6">

                      <span className="text-lg text-gray-300 whitespace-nowrap">
                        Critérios de aprovação:
                      </span>

                      <input
                        type="text"
                        value={feature.criteriosAprovacao}
                        onChange={(e) =>
                          atualizarFeature(
                            epico.id,
                            feature.id,
                            'criteriosAprovacao',
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                      />

                    </div>

                    {/* Nível 3: PBIs */}

                    <div className="border-l-2 border-[#555] pl-6 space-y-4">

                      {feature.pbis.map((pbi, iP) => (

                        <div
                          key={pbi.id}
                          className="space-y-4 bg-[#252525] p-5 rounded-lg"
                        >

                          {/* Título do PBI - Outfit */}

                          <div className="flex items-center gap-3">

                            <span className="text-white font-semibold text-lg font-medium whitespace-nowrap font-['Outfit']">
                              {iE + 1}.{iF + 1}.{iP + 1} PBI:
                            </span>

                            <input
                              type="text"
                              className="w-full bg-transparent text-white text-lg font-medium outline-none pb-1 font-['Outfit']"
                              value={pbi.titulo}
                              onChange={(e) =>
                                atualizarPBI(
                                  epico.id,
                                  feature.id,
                                  pbi.id,
                                  'titulo',
                                  e.target.value
                                )
                              }
                            />

                            <button
                              type="button"
                              title="Excluir PBI"
                              onClick={() => removerPBI(epico.id, feature.id, pbi.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1 text-base font-bold ml-auto"
                            >
                              ✕
                            </button>

                          </div>

                          {/* Subcampos do PBI - Poppins */}

                          <div className="flex items-center gap-3 font-['Poppins']">

                            <span className="text-lg text-gray-300 whitespace-nowrap">
                              User Story:
                            </span>

                            <input
                              type="text"
                              value={pbi.userStory}
                              onChange={(e) =>
                                atualizarPBI(
                                  epico.id,
                                  feature.id,
                                  pbi.id,
                                  'userStory',
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                            />

                          </div>

                          <div className="flex items-center gap-3 font-['Poppins']">

                            <span className="text-lg text-gray-300 whitespace-nowrap">
                              Critérios de aprovação:
                            </span>

                            <input
                              type="text"
                              value={pbi.criteriosAprovacao}
                              onChange={(e) =>
                                atualizarPBI(
                                  epico.id,
                                  feature.id,
                                  pbi.id,
                                  'criteriosAprovacao',
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
                            />

                          </div>

                          <div className="pt-2 font-['Poppins']">

                            <span className="text-base mb-1 block text-gray-300">
                              Desenvolvedores vinculados:
                            </span>

                            <select
                              multiple
                              value={pbi.desenvolvedores}
                              onChange={(e) =>
                                atualizarPBI(
                                  epico.id,
                                  feature.id,
                                  pbi.id,
                                  'desenvolvedores',
                                  Array.from(
                                    e.target.selectedOptions,
                                    (opcao) => opcao.value
                                  )
                                )
                              }
                              className="w-full bg-[#1c1c1c] text-lg p-2 rounded outline-none border border-gray-700 text-gray-200"
                            >
                              {devsDisponiveis.map(dev => (
                                <option
                                  key={dev.id}
                                  value={dev.id}
                                >
                                  {dev.nome}
                                </option>
                              ))}
                            </select>

                          </div>

                        </div>

                      ))}

                      <button
                        onClick={() =>
                          adicionarPBI(
                            epico.id,
                            feature.id
                          )
                        }
                        className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']"
                      >
                        + Novo PBI
                      </button>

                    </div>

                  </div>

                ))}

                <button
                  onClick={() =>
                    adicionarFeature(epico.id)
                  }
                  className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']"
                >
                  + Nova Feature
                </button>

              </div>

            </div>

          ))}

          <button
            onClick={adicionarEpico}
            className="text-lg text-[#ff5722] hover:text-orange-400 mt-4 block font-['Poppins']"
          >
            + Novo Épico
          </button>

        </div>

        {/* Rodapé */}

        <div className="mt-12 flex items-center gap-6 font-['Poppins']">

          <button className="text-lg hover:text-white transition-colors">
            Analisar projeto
          </button>

          <button
            onClick={handleSalvar}
            className="bg-[#111] hover:bg-black text-white px-8 py-3 rounded text-lg transition-colors border border-[#333]"
          >
            Salvar
          </button>

        </div>

        {feedback && (
          <div
            role="alert"
            className={`mt-4 rounded border px-4 py-3 font-['Poppins'] ${
              feedback.tipo === 'sucesso'
                ? 'border-green-700 bg-green-900/30 text-green-300'
                : 'border-red-700 bg-red-900/30 text-red-300'
            }`}
          >
            <p>{feedback.mensagem}</p>

            {feedback.campos.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-base">
                {feedback.campos.map((campo) => (
                  <li key={campo}>{campo}</li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>

      {/* CHAT LADO DIREITO */}

      <div
        className={`bg-[#141414] border-l border-[#222] flex flex-col relative transition-all duration-300 ${
          chatAberto
            ? 'w-[400px] p-6'
            : 'w-[80px] p-4 items-center'
        }`}
      >

        <div
          onClick={() => setChatAberto(!chatAberto)}
          className="absolute top-6 right-6 opacity-50 hover:opacity-100 cursor-pointer z-10 transition-opacity p-2"
        >

          {chatAberto ? (

            <div className="w-4 h-3 flex flex-col justify-between">

              <div className="w-full h-[2px] bg-gray-400"></div>

              <div className="w-full h-[2px] bg-gray-400"></div>

            </div>

          ) : (

            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 3.582-9 8-9s9 3.582 9 8z"
              />
            </svg>

          )}

        </div>

        {chatAberto ? (

          <>

            <div className="flex-1 flex flex-col justify-center gap-4 opacity-40 mt-8">

              <div className="w-64 h-12 bg-[#2a2a2a] rounded-xl self-start"></div>

              <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>

              <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>

            </div>

            <div className="mt-6 relative font-['Poppins']">

              <input
                type="text"
                placeholder="Digite uma mensagem."
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 px-5 text-lg text-white outline-none focus:border-gray-500 transition-colors"
              />

              <button className="absolute right-4 top-4 text-gray-500 hover:text-white">
                ↑
              </button>

            </div>

          </>

        ) : (

          <div className="flex-1 flex items-center justify-center writing-vertical text-gray-600 font-bold tracking-[0.3em] text-base transform -rotate-90 mt-10 font-['Outfit']">
            CHAT
          </div>

        )}

      </div>

    </div>
  );
}