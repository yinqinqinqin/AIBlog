import { useEffect, useState } from "react";

export default function useEntryReady() {
  const [isReady, setIsReady] = useState(() => {
    if (typeof document === "undefined") return true;

    return !document.getElementById("entry-loader");
  });

  useEffect(() => {
    if (isReady || typeof window === "undefined") return undefined;

    const handleReady = () => setIsReady(true);
    window.addEventListener("entry-loader:ready", handleReady, { once: true });

    if (!document.getElementById("entry-loader")) {
      setIsReady(true);
    }

    return () => {
      window.removeEventListener("entry-loader:ready", handleReady);
    };
  }, [isReady]);

  return isReady;
}
