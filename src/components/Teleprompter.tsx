import { useEffect, useRef } from "react";

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

  const animateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const diff = targetScrollRef.current - el.scrollTop;
    if (Math.abs(diff) < 1) {
      el.scrollTop = targetScrollRef.current;
      scrollAnimRef.current = null;
      return;
    }
    el.scrollTop += diff * 0.08;
    scrollAnimRef.current = requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    if (!scrollRef.current || !textRef.current) return;
    const newLen = answer.length;
    const oldLen = prevAnswerLenRef.current;
    prevAnswerLenRef.current = newLen;

    if (newLen <= oldLen) {
      targetScrollRef.current = 0;
      scrollRef.current.scrollTop = 0;
      return;
    }

    const el = scrollRef.current;
    const contentHeight = el.scrollHeight;
    const viewportHeight = el.clientHeight;
    if (contentHeight <= viewportHeight) return;

    targetScrollRef.current = contentHeight - viewportHeight;
    if (!scrollAnimRef.current) {
      scrollAnimRef.current = requestAnimationFrame(animateScroll);
    }
  }, [answer]);

  useEffect(() => {
    return () => { if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current); };
  }, []);

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border/30 relative scan-lines"
      style={{ background: 'hsl(var(--teleprompter-bg))' }}>

      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Question bar */}
      {question && (
        <div className="px-4 sm:px-6 py-3 border-b border-primary/20 flex-shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.08)' }}>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] teleprompter-muted mb-0.5">
            // QUESTION DETECTED
          </p>
          <p className="text-sm sm:text-lg font-semibold teleprompter-question line-clamp-3">{question}</p>
        </div>
      )}

      {/* Answer area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {!question && !answer && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
            <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center animate-glow-pulse">
              <div className="w-3 h-3 rounded-full bg-primary/60" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-display font-bold teleprompter-muted">LISTENING</p>
              <p className="text-xs teleprompter-muted mt-1 font-mono">
                Awaiting question detection...
              </p>
            </div>
          </div>
        )}

        {answer && (
          <p ref={textRef} className="teleprompter-text leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}>
            {answer}
            {isGenerating && (
              <span className="inline-block ml-1 text-primary animate-glow-pulse">▌</span>
            )}
          </p>
        )}

        {isGenerating && !answer && (
          <div className="flex items-center gap-3 teleprompter-muted font-mono text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" style={{ animationDelay: '0.3s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            Generating...
          </div>
        )}

        {answer && <div className="h-[40vh]" />}
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
