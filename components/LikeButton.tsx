"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp } from "lucide-react";
import { playSound } from "@/lib/sounds";

interface LikeButtonProps {
  dbId: number;
  initialLikes?: number;
  size?: "sm" | "md";
}

const STORAGE_KEY = (id: number) => `liked_article_${id}`;

export default function LikeButton({ dbId, initialLikes = 0, size = "md" }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLiked(localStorage.getItem(STORAGE_KEY(dbId)) === "1");
    }
  }, [dbId]);

  const handleLike = useCallback(async () => {
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes ?? likes + 1);
        setLiked(true);
        localStorage.setItem(STORAGE_KEY(dbId), "1");
        playSound("click");
      }
    } finally {
      setLoading(false);
    }
  }, [dbId, liked, loading, likes]);

  const isSmall = size === "sm";

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 font-mono
        ${isSmall ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}
        ${liked
          ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan cursor-default"
          : "border-white/10 bg-white/5 text-text-secondary hover:border-accent-cyan/30 hover:text-accent-cyan cursor-pointer"
        }
      `}
      title={liked ? "You liked this" : "Like this article"}
    >
      <ThumbsUp
        className={`flex-shrink-0 transition-transform ${liked ? "scale-110" : ""} ${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"}`}
      />
      <span>{likes > 0 ? likes : liked ? "1" : "Like"}</span>
    </button>
  );
}
