export function ErroCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p data-erro className="text-red-400 text-sm mt-1">
      {mensagem}
    </p>
  );
}
