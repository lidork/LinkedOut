import { useState, useCallback } from "react";

export default function useToast(duration = 3000) {
  const [toast, setToast] = useState("");
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  }, [duration]);
  return { toast, showToast };
}
