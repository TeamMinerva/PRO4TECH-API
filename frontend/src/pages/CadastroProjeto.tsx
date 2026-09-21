import { useState } from 'react';


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

  const [chatAberto, setChatAberto] = useState(true);

  const devsDisponiveis: Desenvolvedor[] = [
    { id: '1', nome: 'Dev Frontend' },
    { id: '2', nome: 'Dev Backend' },
  ];


  const adicionarEpico = () => {
    const novo: Epico = { id: crypto.randomUUID(), nome: '', descricao: '', objetivo: '', resultadoEsperado: '', features: [] };
    setProjeto((prev) => ({ ...prev, epicos: [...prev.epicos, novo] }));
  };

  const adicionarFeature = (epicoId: string) => {
    const nova: Feature = { id: crypto.randomUUID(), nome: '', descricao: '', criteriosAprovacao: '', pbis: [] };
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) => e.id === epicoId ? { ...e, features: [...e.features, nova] } : e)
    }));
  };

  const adicionarPBI = (epicoId: string, featureId: string) => {
    const novo: PBI = { id: crypto.randomUUID(), titulo: '', userStory: '', criteriosAprovacao: '', desenvolvedores: [] };
    setProjeto((prev) => ({
      ...prev,
      epicos: prev.epicos.map((e) => e.id === epicoId ? {
        ...e,
        features: e.features.map((f) => f.id === featureId ? { ...f, pbis: [...f.pbis, novo] } : f)
      } : e)
    }));
  };

  // --- FUNÇÕES DE ATUALIZAÇÃO DE TEXTO ---
  const atualizarEpico = (epicoId: string, campo: keyof Epico, valor: string) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e => e.id === epicoId ? { ...e, [campo]: valor } : e)
    }));
  };

  const atualizarFeature = (epicoId: string, featureId: string, campo: keyof Feature, valor: string) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e => e.id === epicoId ? {
        ...e,
        features: e.features.map(f => f.id === featureId ? { ...f, [campo]: valor } : f)
      } : e)
    }));
  };

  const atualizarPBI = (epicoId: string, featureId: string, pbiId: string, campo: keyof PBI, valor: string) => {
    setProjeto(prev => ({
      ...prev,
      epicos: prev.epicos.map(e => e.id === epicoId ? {
        ...e,
        features: e.features.map(f => f.id === featureId ? {
          ...f,
          pbis: f.pbis.map(p => p.id === pbiId ? { ...p, [campo]: valor } : p)
        } : f)
      } : e)
    }));
  };

  const handleSalvar = () => {
    console.log("Payload para a API:", projeto);
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="flex h-screen bg-[#1c1c1c] text-[#a0a0a0] font-sans">

      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-700 transition-all duration-300">
        <button className="mb-6 text-gray-400 hover:text-white">← Voltar</button>

        {/* Projeto */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Nome do projeto"
            className="w-full bg-transparent text-3xl font-semibold text-white mb-4 outline-none placeholder-gray-500"
            value={projeto.nome}
            onChange={(e) => setProjeto({ ...projeto, nome: e.target.value })}
          />
          <div className="flex flex-col gap-2 text-sm mb-6 border-b border-gray-800 pb-6">
            <input type="text" placeholder="Status" className="bg-transparent outline-none w-1/3" />
            <input type="text" placeholder="Tecnologias" className="bg-transparent outline-none w-1/3" />
          </div>
        </div>

        {/* Épicos */}
        <div className="border-l-2 border-[#333] pl-6 ml-2 space-y-8 relative">
          {projeto.epicos.map((epico, iE) => (
            <div key={epico.id} className="space-y-3">


              <div className="flex items-center gap-2">
                <span className="text-white font-medium whitespace-nowrap">{iE + 1}.0.0</span>
                <input
                  type="text"
                  placeholder="Nome do Épico"
                  className="w-full bg-transparent text-white font-medium outline-none placeholder-gray-600"
                  value={epico.nome}
                  onChange={(e) => atualizarEpico(epico.id, 'nome', e.target.value)}
                />
              </div>

              <input type="text" placeholder="Descrição" value={epico.descricao} onChange={(e) => atualizarEpico(epico.id, 'descricao', e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder-gray-600" />
              <input type="text" placeholder="Objetivo" value={epico.objetivo} onChange={(e) => atualizarEpico(epico.id, 'objetivo', e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder-gray-600" />
              <input type="text" placeholder="Resultado esperado" value={epico.resultadoEsperado} onChange={(e) => atualizarEpico(epico.id, 'resultadoEsperado', e.target.value)} className="w-full bg-transparent text-sm outline-none mb-4 placeholder-gray-600" />

              {/* Features */}
              <div className="border-l-2 border-[#444] pl-6 space-y-6">
                {epico.features.map((feature, iF) => (
                  <div key={feature.id} className="space-y-3">

                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-medium whitespace-nowrap">{iE + 1}.{iF + 1}.0</span>
                      <input
                        type="text"
                        placeholder="Nome da Feature"
                        className="w-full bg-transparent text-gray-200 font-medium outline-none placeholder-gray-600"
                        value={feature.nome}
                        onChange={(e) => atualizarFeature(epico.id, feature.id, 'nome', e.target.value)}
                      />
                    </div>

                    <input type="text" placeholder="Descrição" value={feature.descricao} onChange={(e) => atualizarFeature(epico.id, feature.id, 'descricao', e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder-gray-600" />
                    <input type="text" placeholder="Critérios de aprovação" value={feature.criteriosAprovacao} onChange={(e) => atualizarFeature(epico.id, feature.id, 'criteriosAprovacao', e.target.value)} className="w-full bg-transparent text-sm outline-none mb-4 placeholder-gray-600" />

                    {/* PBIs */}
                    <div className="border-l-2 border-[#555] pl-6 space-y-4">
                      {feature.pbis.map((pbi, iP) => (
                        <div key={pbi.id} className="space-y-2 bg-[#252525] p-4 rounded-lg">


                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium whitespace-nowrap">{iE + 1}.{iF + 1}.{iP + 1}</span>
                            <input
                              type="text"
                              placeholder="Título do PBI"
                              className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-gray-500"
                              value={pbi.titulo}
                              onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'titulo', e.target.value)}
                            />
                          </div>

                          <input type="text" placeholder="User Story" value={pbi.userStory} onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'userStory', e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder-gray-500" />
                          <input type="text" placeholder="Critérios de aprovação" value={pbi.criteriosAprovacao} onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'criteriosAprovacao', e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder-gray-500" />

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

        {/* Rodapé*/}
        <div className="mt-12 flex items-center gap-6">
          <button className="text-sm hover:text-white transition-colors">Analisar projeto</button>
          <button onClick={handleSalvar} className="bg-[#111] hover:bg-black text-white px-6 py-2 rounded text-sm transition-colors border border-[#333]">Salvar</button>
        </div>
      </div>

      {/* CHAT */}
      <div className={`bg-[#141414] border-l border-[#222] flex flex-col relative transition-all duration-300 ${chatAberto ? 'w-[400px] p-6' : 'w-[80px] p-4 items-center'}`}>

        <div onClick={() => setChatAberto(!chatAberto)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 cursor-pointer z-10 transition-opacity p-2">
          {chatAberto ? (
            <div className="w-4 h-3 flex flex-col justify-between">
              <div className="w-full h-[2px] bg-gray-400"></div>
              <div className="w-full h-[2px] bg-gray-400"></div>
            </div>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

            <div className="mt-6 relative">
              <input
                type="text"
                placeholder="Digite uma mensagem."
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-gray-500 transition-colors"
              />
              <button className="absolute right-3 top-3 text-gray-500 hover:text-white">↑</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center writing-vertical text-gray-600 font-bold tracking-[0.3em] text-xs transform -rotate-90 mt-10">
            CHAT
          </div>
        )}
      </div>

    </div>
  );
}