export interface CreateBugDTO {
  title: string;
  description: string;
  solution: string;
  projectId: number;
  developerId: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function createBug(data: CreateBugDTO): Promise<void> {
  const response = await fetch(`${API_URL}/api/bugs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.ok) return;

  let mensagem = 'Erro ao cadastrar bug.';
  try {
    const corpo = await response.json();
    const primeiroIssue = Array.isArray(corpo?.errors) ? corpo.errors[0]?.message : undefined;
    mensagem = primeiroIssue || corpo?.message || mensagem;
  } catch {
    
  }
  throw new Error(mensagem);
}
