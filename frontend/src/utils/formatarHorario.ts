const formatadorHoraMinuto = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatarHorario(dataIso?: string | Date | null): string {
  if (!dataIso) return '';
  const data = dataIso instanceof Date ? dataIso : new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '';
  return formatadorHoraMinuto.format(data);
}
