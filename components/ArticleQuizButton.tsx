"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import GlobeQuiz from "./GlobeQuiz";
import { playSound } from "@/lib/sounds";

export default function ArticleQuizButton() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
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

      {quizOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", background: "rgba(7, 12, 20, 0.6)" }}
        >
          <div className="relative w-full max-w-sm mx-4">
            <GlobeQuiz onClose={() => setQuizOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
