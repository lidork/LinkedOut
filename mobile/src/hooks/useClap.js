import { useCallback } from "react";
import { apiFetch } from "../api/client";

export default function useClap(userId, setPosts) {
  return useCallback(async (post) => {
    const alreadyClapped = Array.isArray(post.claps) && post.claps.includes(userId);
    setPosts((prev) => prev.map((p) => {
      if (p._id !== post._id) return p;
      const claps = alreadyClapped
        ? p.claps.filter((id) => id !== userId)
        : [...(p.claps || []), userId];
      return { ...p, claps };
    }));
    try {
      await apiFetch(`/api/posts/${post._id}/clap`, { method: "POST" });
    } catch {
      setPosts((prev) => prev.map((p) => p._id === post._id ? { ...p, claps: post.claps } : p));
    }
  }, [userId, setPosts]);
}
