"use client";

import { useState } from "react";
import { Globe2, X } from "lucide-react";
import GlobeQuiz from "./GlobeQuiz";
import { playSound } from "@/lib/sounds";

export default function ArticleQuizButton() {
  const [quizOpen, setQuizOpen] = useState(false);

  if (quizOpen) {
    return (
      <div className="mt-3 relative">
        <button
          onClick={() => setQuizOpen(false)}
          className="absolute top-2 right-2 z-10 p-1 rounded text-text-secondary/60 hover:text-text-secondary transition-colors"
          aria-label="Close quiz"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <GlobeQuiz onClose={() => setQuizOpen(false)} />
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        playSound("click");
        setQuizOpen(true);
      }}
      className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-mono hover:bg-accent-cyan/20 transition-colors cursor-pointer"
    >
      <Globe2 className="w-4 h-4" />
      Start Quiz
    </button>
  );
}
