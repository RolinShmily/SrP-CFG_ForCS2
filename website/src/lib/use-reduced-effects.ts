"use client";
import { useEffect, useState } from "react";
// Explicit subscription also responds when the OS preference changes after mount.
// The server and first client render agree; CSS supplies the pre-hydration fallback.
export function useReducedEffects() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}
