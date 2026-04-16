"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface HistoryBackButtonProps {
  fallbackHref: string;
  label: string;
  className?: string;
}

export default function HistoryBackButton({ fallbackHref, label, className = "" }: HistoryBackButtonProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "auto";
    }
  }, []);

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallbackHref;
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-cyan transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
