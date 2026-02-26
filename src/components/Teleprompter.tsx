import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface TeleprompterProps {
  question: string;
  answer: string;
  isGenerating: boolean;
  fontSize: number;
}

export function Teleprompter({ question, answer, isGenerating, fontSize }: TeleprompterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const prevAnswerLenRef = useRef(0);
  const scrollAnimRef = useRef<number | null>(null);
  const targetScrollRef = useRef(0);

  // Smooth scroll animation - scrolls at a steady pace to target
  const animateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const diff = targetScrollRef.current - el.scrollTop;
    if (Math.abs(diff) < 1) {
      el.scrollTop = targetScrollRef.current;
      scrollAnimRef.current = null;
      return;
    }

    // Smooth easing - scroll ~8% of remaining distance per frame
    el.scrollTop += diff * 0.08;
    scrollAnimRef.current = requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    if (!scrollRef.current || !textRef.current) return;

    const newLen = answer.length;
    const oldLen = prevAnswerLenRef.current;
    prevAnswerLenRef.current = newLen;

    if (newLen <= oldLen) {
      // Answer was reset (new question) - scroll to top
      targetScrollRef.current = 0;
      scrollRef.current.scrollTop = 0;
      return;
    }

    // Calculate how far to scroll: keep the "reading line" near the top 1/3
    const el = scrollRef.current;
    const contentHeight = el.scrollHeight;
    const viewportHeight = el.clientHeight;

    if (contentHeight <= viewportHeight) return; // no scrolling needed

    // Target: content bottom minus 2/3 of viewport (keeps new text in upper portion)
    const target = contentHeight - viewportHeight;
    targetScrollRef.current = target;

    if (!scrollAnimRef.current) {
      scrollAnimRef.current = requestAnimationFrame(animateScroll);
    }
  }, [answer]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full teleprompter-bg rounded-xl overflow-hidden border border-border/20">
      {/* Question bar */}
      {question && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/20 bg-primary/10 flex-shrink-0">
          <p className="text-xs font-mono uppercase tracking-wider teleprompter-muted mb-0.5">Question</p>
          <p className="text-sm sm:text-lg font-semibold teleprompter-question line-clamp-3">{question}</p>
        </div>
      )}

      {/* Answer area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {!question && !answer && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-xl sm:text-2xl font-semibold teleprompter-muted">Listening...</p>
            <p className="text-xs sm:text-sm teleprompter-muted mt-2">
              When a question is detected, the AI answer will appear here
            </p>
          </div>
        )}

        {answer && (
          <p
            ref={textRef}
            className="teleprompter-text leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
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

        {/* Spacer so text doesn't stop at very bottom */}
        {answer && <div className="h-[40vh]" />}
      </div>
    </div>
  );
}
