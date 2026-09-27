import { useEffect, useRef, useState } from 'react';

export function useDropdown<T extends HTMLElement = HTMLDivElement>() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  return { aberto, setAberto, ref };
}
