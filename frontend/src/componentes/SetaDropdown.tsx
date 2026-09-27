export function SetaDropdown({ aberto }: { aberto: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
        aberto ? 'rotate-180 text-gray-300' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
