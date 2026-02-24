import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface TeleprompterProps {
  question: string;
  answer: string;
  isGenerating: boolean;
  fontSize: number;
}

export function Teleprompter({ question, answer, isGenerating, fontSize }: TeleprompterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [answer]);

  return (
    <div className="flex flex-col h-full teleprompter-bg rounded-xl overflow-hidden border border-border/20">
      {/* Question bar */}
      {question && (
        <div className="px-6 py-4 border-b border-border/20 bg-primary/10">
          <p className="text-sm font-mono uppercase tracking-wider teleprompter-muted mb-1">Current Question</p>
          <p className="text-lg font-semibold teleprompter-question">{question}</p>
        </div>
      )}

      {/* Answer area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 scroll-smooth">
        {!question && !answer && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl font-semibold teleprompter-muted">Listening...</p>
            <p className="text-sm teleprompter-muted mt-2">
              When a question is detected, the AI answer will appear here
            </p>
          </div>
        )}

        {answer && (
          <p
            className="teleprompter-text leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            {answer}
            {isGenerating && (
              <span className="inline-block ml-1 animate-pulse">▌</span>
            )}
          </p>
        )}

        {isGenerating && !answer && (
          <div className="flex items-center gap-3 teleprompter-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating answer...</span>
          </div>
        )}
      </div>
    </div>
  );
}
