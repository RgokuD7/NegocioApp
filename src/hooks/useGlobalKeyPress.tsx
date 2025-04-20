import { useEffect, useRef } from "react";

function useGlobalKeyPress(targetKey: string, callback: () => void) {
  const callbackRef = useRef(callback);

  // Actualiza el callback si cambia
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey && !event.repeat) {
        event.preventDefault(); // Evita acciones por defecto (opcional)
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetKey]);
}

export default useGlobalKeyPress;