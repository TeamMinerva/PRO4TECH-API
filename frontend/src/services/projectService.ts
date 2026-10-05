export interface Desenvolvedor {
  id: number;
  name: string;
  skills?: string[];
}

export interface ProjetoSemelhante {
  id: number;
  name: string;
  technologies?: string[];
  status?: string;
}

export interface PBIBacklog {
  id: number;
  title: string;
  userStory?: string;
  acceptanceCriteria?: string;
  developers: Desenvolvedor[];
}

export interface ProjetoDetalhes {
  id: number;
  name: string;
  status: string;
  technologies: string[];
  developers: Desenvolvedor[];
  similarProjects: ProjetoSemelhante[];
  backlog: PBIBacklog[];
  epics?: any[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getProjectById(id: number | string): Promise<ProjetoDetalhes> {
  const response = await fetch(`${API_URL}/api/projects/${id}`);

  if (!response.ok) {
    let errorMsg = 'Erro ao buscar detalhes do projeto.';
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Usa mensagem padrão
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
