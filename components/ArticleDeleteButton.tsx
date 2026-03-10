"use client";

import { useState } from "react";

interface ArticleDeleteButtonProps {
  articleId: number;
}

export default function ArticleDeleteButton({ articleId }: ArticleDeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Obriši članak "#${articleId}" trajno?\n\nOvo će obrisati MDX file, slike i DB zapis.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/foto-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_article", articleId })
      });

      if (res.ok) {
        alert("✅ Članak obrisan. Vraćam se na home...");
        window.location.href = "/";
      } else {
        const err = await res.json();
        alert(`❌ Greška: ${err.error}`);
      }
    } catch (e) {
      alert(`❌ Greška pri brisanju: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="text-[10px] font-mono border border-red-500/40 rounded px-1.5 py-0.5 text-red-400/70 hover:border-red-500 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "⏳ Brisanje..." : "🗑️ DELETE"}
    </button>
  );
}
