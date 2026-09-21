import React, { useState } from 'react';

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

// --- COMPONENTE PRINCIPAL ---
export default function CadastroProjeto() {
  const [projeto, setProjeto] = useState<Projeto>({
    nome: '',
    status: '',
    tecnologias: [],
    epicos: []
  });

  const devsDisponiveis: Desenvolvedor[] = [
    { id: '1', nome: 'Dev Frontend' },
    { id: '2', nome: 'Dev Backend' },
  ];

  // --- FUNÇÕES DE MANIPULAÇÃO DE ESTADO ---
  const adicionarEpico = () => {
    const novo: Epico = { id: crypto.randomUUID(), nome: '', descricao: '', objetivo: '', resultadoEsperado: '', features: [] };
    setProjeto((prev: Projeto) => ({ ...prev, epicos: [...prev.epicos, novo] }));
  };

  const adicionarFeature = (epicoId: string) => {
    const nova: Feature = { id: crypto.randomUUID(), nome: '', descricao: '', criteriosAprovacao: '', pbis: [] };
    setProjeto((prev: Projeto) => ({
      ...prev,
      epicos: prev.epicos.map((e: Epico) => e.id === epicoId ? { ...e, features: [...e.features, nova] } : e)
    }));
  };

  const adicionarPBI = (epicoId: string, featureId: string) => {
    const novo: PBI = { id: crypto.randomUUID(), titulo: '', userStory: '', criteriosAprovacao: '', desenvolvedores: [] };
    setProjeto((prev: Projeto) => ({
      ...prev,
      epicos: prev.epicos.map((e: Epico) => e.id === epicoId ? {
        ...e,
        features: e.features.map((f: Feature) => f.id === featureId ? { ...f, pbis: [...f.pbis, novo] } : f)
      } : e)
    }));
  };

  const handleSalvar = () => {
    console.log("Payload para a API:", projeto);
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="flex h-screen bg-[#1c1c1c] text-[#a0a0a0] font-sans">

      {/* COLUNA ESQUERDA: FORMULÁRIO */}
      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-700">
        <button className="mb-6 text-gray-400 hover:text-white">← Voltar</button>

        {/* Nível 0: Projeto */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Nome do projeto"
            className="w-full bg-transparent text-3xl font-semibold text-white mb-4 outline-none placeholder-gray-500"
            value={projeto.nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjeto({ ...projeto, nome: e.target.value })}
          />
          <div className="flex flex-col gap-2 text-sm mb-6 border-b border-gray-800 pb-6">
            <input type="text" placeholder="Status v" className="bg-transparent outline-none w-1/3" />
            <input type="text" placeholder="Tecnologias" className="bg-transparent outline-none w-1/3" />
          </div>
        </div>

        {/* Nível 1: Épicos */}
        <div className="border-l-2 border-[#333] pl-6 ml-2 space-y-8 relative">
          {projeto.epicos.map((epico: Epico, iE: number) => (
            <div key={epico.id} className="space-y-3">
              <input type="text" placeholder={`1.${iE}.0 Nome do Épico`} className="w-full bg-transparent text-white font-medium outline-none" />
              <input type="text" placeholder="Descrição" className="w-full bg-transparent text-sm outline-none" />
              <input type="text" placeholder="Objetivo" className="w-full bg-transparent text-sm outline-none" />
              <input type="text" placeholder="Resultado esperado" className="w-full bg-transparent text-sm outline-none mb-4" />

              {/* Nível 2: Features */}
              <div className="border-l-2 border-[#444] pl-6 space-y-6">
                {epico.features.map((feature: Feature, iF: number) => (
                  <div key={feature.id} className="space-y-3">
                    <input type="text" placeholder={`1.${iE}.${iF} Nome da Feature`} className="w-full bg-transparent text-gray-200 font-medium outline-none" />
                    <input type="text" placeholder="Descrição" className="w-full bg-transparent text-sm outline-none" />
                    <input type="text" placeholder="Critérios de aprovação" className="w-full bg-transparent text-sm outline-none mb-4" />

                    {/* Nível 3: PBIs */}
                    <div className="border-l-2 border-[#555] pl-6 space-y-4">
                      {feature.pbis.map((pbi: PBI, iP: number) => (
                        <div key={pbi.id} className="space-y-2 bg-[#252525] p-4 rounded-lg">
                          <input type="text" placeholder={`1.${iE}.${iF}.${iP} Título do PBI`} className="w-full bg-transparent text-white text-sm font-medium outline-none" />
                          <input type="text" placeholder="User Story" className="w-full bg-transparent text-sm outline-none" />
                          <input type="text" placeholder="Critérios de aprovação" className="w-full bg-transparent text-sm outline-none" />

                          <div className="pt-2">
                            <span className="text-xs mb-1 block">Desenvolvedores</span>
                            <select multiple className="w-full bg-[#1c1c1c] text-sm p-2 rounded outline-none border border-gray-700">
                              {devsDisponiveis.map(dev => (
                                <option key={dev.id} value={dev.id}>{dev.nome}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => adicionarPBI(epico.id, feature.id)} className="text-xs text-gray-500 hover:text-white mt-2 block">Novo PBI</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => adicionarFeature(epico.id)} className="text-xs text-gray-500 hover:text-white mt-2 block">Nova Feature</button>
              </div>
            </div>
          ))}
          <button onClick={adicionarEpico} className="text-sm text-gray-500 hover:text-white mt-4 block">Novo Épico</button>
        </div>

        {/* Rodapé: Ações */}
        <div className="mt-12 flex items-center gap-6">
          <button className="text-sm hover:text-white transition-colors">Analisar projeto</button>
          <button onClick={handleSalvar} className="bg-[#111] hover:bg-black text-white px-6 py-2 rounded text-sm transition-colors border border-[#333]">Salvar</button>
        </div>
      </div>

      {/* COLUNA DIREITA: CHAT */}
      <div className="w-[400px] bg-[#141414] border-l border-[#222] p-6 flex flex-col relative">
        <div className="absolute top-6 right-6 opacity-50 cursor-pointer">
          <div className="w-4 h-0.5 bg-gray-400 mb-1"></div>
          <div className="w-4 h-0.5 bg-gray-400"></div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 flex flex-col justify-center gap-4 opacity-40">
          <div className="w-64 h-12 bg-[#2a2a2a] rounded-xl self-start"></div>
          <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>
          <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>
        </div>

        {/* Input do Chat */}
        <div className="mt-6 relative">
          <input
            type="text"
            placeholder="Digite uma mensagem."
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-gray-500 transition-colors"
          />
          <button className="absolute right-3 top-3 text-gray-500 hover:text-white">
            ↑
          </button>
        </div>
      </div>

    </div>
  );
}