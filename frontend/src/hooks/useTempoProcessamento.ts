
import { useCallback, useEffect, useRef, useState } from 'react';

export function useTempoProcessamento() {
  const [segundos, setSegundos] = useState(0);
  const [processando, setProcessando] = useState(false);

  const inicioRef = useRef<number | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = useCallback(() => {
    if (intervaloRef.current !== null) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    inicioRef.current = null;
    setProcessando(false);
  }, []);

  const iniciar = useCallback(() => {
    if (intervaloRef.current !== null) return;

    const inicio = Date.now();
    inicioRef.current = inicio;
    setSegundos(0);
    setProcessando(true);

    intervaloRef.current = setInterval(() => {
      if (inicioRef.current !== inicio) return;

      const decorrido = Math.floor((Date.now() - inicio) / 1000);
      setSegundos(decorrido);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (intervaloRef.current !== null) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
      inicioRef.current = null;
    };
  }, []);

  return { segundos, processando, iniciar, parar };
}
