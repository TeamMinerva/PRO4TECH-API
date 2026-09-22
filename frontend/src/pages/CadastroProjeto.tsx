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

  // --- FUNÇÕES DE MANIPULAÇÃO DE ESTADO ---
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

  const handleSalvar = async () => {
    try {
      console.log("Enviando payload para a API:", projeto);
      const resposta = await fetch('http://localhost:3000/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projeto),
      });

      if (resposta.ok) {
        alert('Projeto salvo com sucesso!');
      } else {
        alert('Erro ao salvar o projeto.');
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      alert('Não foi possível conectar ao servidor.');
    }
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="flex h-screen bg-[#1c1c1c] text-[#a0a0a0]">

      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-700 transition-all duration-300">
        <button className="mb-6 text-gray-400 hover:text-white font-['Poppins'] text-lg">← Voltar</button>

        {/* Nível 0: Projeto (Único que continua como placeholder) */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Nome do projeto"
            className="w-full bg-transparent text-3xl font-semibold text-white mb-4 outline-none placeholder-gray-500 font-['Outfit']"
            value={projeto.nome}
            onChange={(e) => setProjeto({ ...projeto, nome: e.target.value })}
          />
          <div className="flex flex-col gap-3 text-lg mb-6 border-b border-gray-800 pb-6 font-['Poppins']">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 w-32">Status:</span>
              <input type="text" className="bg-transparent outline-none flex-1 text-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 w-32">Tecnologias:</span>
              <input type="text" className="bg-transparent outline-none flex-1 text-gray-200" />
            </div>
          </div>
        </div>

        {/* Nível 1: Épicos */}
        <div className="border-l-2 border-[#333] pl-6 ml-2 space-y-10 relative">
          {projeto.epicos.map((epico, iE) => (
            <div key={epico.id} className="space-y-4">

              {/* Título do Épico - Outfit */}
              <div className="flex items-center gap-3">
                <span className="text-white text-xl font-semibold whitespace-nowrap font-['Outfit']">{iE + 1}.0.0  Épico:</span>
                <input
                  type="text"
                  className="w-full bg-transparent text-white text-xl font-medium outline-none pb-1 font-['Outfit']"
                  value={epico.nome}
                  onChange={(e) => atualizarEpico(epico.id, 'nome', e.target.value)}
                />
              </div>

              {/* Subcampos do Épico - Poppins */}
              <div className="flex items-center gap-3 font-['Poppins']">
                <span className="text-lg text-gray-300 whitespace-nowrap">Descrição:</span>
                <input type="text" value={epico.descricao} onChange={(e) => atualizarEpico(epico.id, 'descricao', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
              </div>
              <div className="flex items-center gap-3 font-['Poppins']">
                <span className="text-lg text-gray-300 whitespace-nowrap">Objetivo:</span>
                <input type="text" value={epico.objetivo} onChange={(e) => atualizarEpico(epico.id, 'objetivo', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
              </div>
              <div className="flex items-center gap-3 font-['Poppins'] mb-6">
                <span className="text-lg text-gray-300 whitespace-nowrap">Resultado esperado:</span>
                <input type="text" value={epico.resultadoEsperado} onChange={(e) => atualizarEpico(epico.id, 'resultadoEsperado', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
              </div>

              {/* Nível 2: Features */}
              <div className="border-l-2 border-[#444] pl-6 space-y-8">
                {epico.features.map((feature, iF) => (
                  <div key={feature.id} className="space-y-4">

                    {/* Título da Feature - Outfit */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-200 font-semibold text-xl font-medium whitespace-nowrap font-['Outfit']">{iE + 1}.{iF + 1}.0  Feature:</span>
                      <input
                        type="text"
                        className="w-full bg-transparent text-gray-200 text-xl font-medium outline-none pb-1 font-['Outfit']"
                        value={feature.nome}
                        onChange={(e) => atualizarFeature(epico.id, feature.id, 'nome', e.target.value)}
                      />
                    </div>

                    {/* Subcampos da Feature - Poppins */}
                    <div className="flex items-center gap-3 font-['Poppins']">
                      <span className="text-lg text-gray-300 whitespace-nowrap">Descrição:</span>
                      <input type="text" value={feature.descricao} onChange={(e) => atualizarFeature(epico.id, feature.id, 'descricao', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
                    </div>
                    <div className="flex items-center gap-3 font-['Poppins'] mb-6">
                      <span className="text-lg text-gray-300 whitespace-nowrap">Critérios de aprovação:</span>
                      <input type="text" value={feature.criteriosAprovacao} onChange={(e) => atualizarFeature(epico.id, feature.id, 'criteriosAprovacao', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
                    </div>

                    {/* Nível 3: PBIs */}
                    <div className="border-l-2 border-[#555] pl-6 space-y-4">
                      {feature.pbis.map((pbi, iP) => (
                        <div key={pbi.id} className="space-y-4 bg-[#252525] p-5 rounded-lg">

                          {/* Título do PBI - Outfit */}
                          <div className="flex items-center gap-3">
                            <span className="text-white font-semibold text-lg font-medium whitespace-nowrap font-['Outfit']">{iE + 1}.{iF + 1}.{iP + 1}  PBI:</span>
                            <input
                              type="text"
                              className="w-full bg-transparent text-white text-lg font-medium outline-none pb-1 font-['Outfit']"
                              value={pbi.titulo}
                              onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'titulo', e.target.value)}
                            />
                          </div>

                          {/* Subcampos do PBI - Poppins */}
                          <div className="flex items-center gap-3 font-['Poppins']">
                            <span className="text-lg text-gray-300 whitespace-nowrap">User Story:</span>
                            <input type="text" value={pbi.userStory} onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'userStory', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
                          </div>
                          <div className="flex items-center gap-3 font-['Poppins']">
                            <span className="text-lg text-gray-300 whitespace-nowrap">Critérios de aprovação:</span>
                            <input type="text" value={pbi.criteriosAprovacao} onChange={(e) => atualizarPBI(epico.id, feature.id, pbi.id, 'criteriosAprovacao', e.target.value)} className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1" />
                          </div>

                          <div className="pt-2 font-['Poppins']">
                            <span className="text-base mb-1 block text-gray-300">Desenvolvedores vinculados:</span>
                            <select multiple className="w-full bg-[#1c1c1c] text-lg p-2 rounded outline-none border border-gray-700 text-gray-200">
                              {devsDisponiveis.map(dev => (
                                <option key={dev.id} value={dev.id}>{dev.nome}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => adicionarPBI(epico.id, feature.id)} className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']">+ Novo PBI</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => adicionarFeature(epico.id)} className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']">+ Nova Feature</button>
              </div>
            </div>
          ))}
          <button onClick={adicionarEpico} className="text-lg text-[#ff5722] hover:text-orange-400 mt-4 block font-['Poppins']">+ Novo Épico</button>
        </div>

        {/* Rodapé*/}
        <div className="mt-12 flex items-center gap-6 font-['Poppins']">
          <button className="text-lg hover:text-white transition-colors">Analisar projeto</button>
          <button className="bg-[#111] hover:bg-black text-white px-8 py-3 rounded text-lg transition-colors border border-[#333]">Salvar</button>
        </div>
      </div>

      {/* CHAT LADO DIREITO */}
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

            <div className="mt-6 relative font-['Poppins']">
              <input
                type="text"
                placeholder="Digite uma mensagem."
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 px-5 text-lg text-white outline-none focus:border-gray-500 transition-colors"
              />
              <button className="absolute right-4 top-4 text-gray-500 hover:text-white">↑</button>
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