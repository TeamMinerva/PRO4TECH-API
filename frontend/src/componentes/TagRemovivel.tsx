interface TagRemovivelProps {
  label: string;
  onRemove: () => void;
}

export function TagRemovivel({ label, onRemove }: TagRemovivelProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-[#252525] text-gray-200 border border-[#333]">
      {label}
      <button
        type="button"
        title={`Remover ${label}`}
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 font-bold ml-1 transition-colors leading-none cursor-pointer"
      >
        ×
      </button>
    </span>
  );
}
