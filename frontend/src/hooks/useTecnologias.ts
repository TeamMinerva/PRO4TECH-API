import { useCallback, useEffect, useState } from 'react';
import {
  createTechnology,
  deleteTechnology,
  getTechnologies,
  updateTechnology,
  type Technology,
} from '../services/technologyService';

const ordenar = (lista: Technology[]) =>
  [...lista].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

export function useTecnologias() {
  const [tecnologias, setTecnologias] = useState<Technology[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    getTechnologies()
      .then((data) => {
        if (ativo) setTecnologias(ordenar(data));
      })
      .catch((error) => {
        console.error('Erro ao carregar tecnologias:', error);
        if (ativo) setErro(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const criar = useCallback(async (nome: string) => {
    const criada = await createTechnology(nome);
    setTecnologias((atuais) => ordenar([...atuais, criada]));
    return criada;
  }, []);

  const editar = useCallback(async (id: number, nome: string) => {
    const atualizada = await updateTechnology(id, nome);
    setTecnologias((atuais) =>
      ordenar(atuais.map((t) => (t.id === id ? atualizada : t)))
    );
    return atualizada;
  }, []);

  const remover = useCallback(async (id: number) => {
    await deleteTechnology(id);
    setTecnologias((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  return { tecnologias, carregando, erro, criar, editar, remover };
}

export type GerenciadorTecnologias = ReturnType<typeof useTecnologias>;
