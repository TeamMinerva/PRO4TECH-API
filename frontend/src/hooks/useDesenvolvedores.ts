import { useEffect, useState } from 'react';
import { API_URL, authFetch } from '../services/authService';

export interface Desenvolvedor {
  id: string;
  nome: string;
}

export function useDesenvolvedores() {
  const [devsDisponiveis, setDevsDisponiveis] = useState<Desenvolvedor[]>([]);

  useEffect(() => {
    async function carregarDesenvolvedores() {
      try {
        const resposta = await authFetch(
          `${API_URL}/api/developers-gallery?active=true`
        );
        if (!resposta.ok) throw new Error('Erro ao buscar desenvolvedores.');

        const dados: { id: number; name: string }[] = await resposta.json();
        setDevsDisponiveis(dados.map((d) => ({ id: String(d.id), nome: d.name })));
      } catch (erro) {
        console.error('Erro ao carregar desenvolvedores:', erro);
      }
    }

    carregarDesenvolvedores();
  }, []);

  return devsDisponiveis;
}
