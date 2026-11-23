import { X } from 'lucide-react';

interface TagRemovivelProps {
  label: string;
  onRemove?: () => void;
}

export function TagRemovivel({ label, onRemove }: TagRemovivelProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-[#141617] text-[#d6d6d6] border border-[#2d2d2d]">
      {label}
      {onRemove && (
        <button
          type="button"
          title={`Remover ${label}`}
          onClick={onRemove}
          className="text-[#5a5f5f] hover:text-[#ED6A32] ml-1 transition-colors leading-none cursor-pointer"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
