export function ErroCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p data-erro className="text-[#ff641f] text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {mensagem}
    </p>
  );
}
