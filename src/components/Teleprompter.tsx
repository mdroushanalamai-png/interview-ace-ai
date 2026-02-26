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
    if (el.scrollHeight <= el.clientHeight) return;
    targetScrollRef.current = el.scrollHeight - el.clientHeight;
    if (!scrollAnimRef.current) scrollAnimRef.current = requestAnimationFrame(animateScroll);
  }, [answer]);

  useEffect(() => {
    return () => { if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current); };
  }, []);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/40 relative"
      style={{ background: 'hsl(var(--teleprompter-bg))' }}>

      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Question */}
      {question && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-primary/15 flex-shrink-0 animate-fade-in"
          style={{ background: 'hsl(var(--primary) / 0.06)' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest teleprompter-muted mb-1">Question</p>
          <p className="text-sm sm:text-base font-heading font-semibold teleprompter-question line-clamp-3 leading-snug">{question}</p>
        </div>
      )}

      {/* Answer */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6">
        {!question && !answer && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/40 animate-pulse-soft" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-[ping_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <p className="font-heading font-bold text-base teleprompter-muted">Listening</p>
              <p className="text-xs teleprompter-muted mt-1">Speak or type a question to get started</p>
            </div>
          </div>
        )}

        {answer && (
          <p ref={textRef} className="teleprompter-text whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}>
            {answer}
            {isGenerating && <span className="inline-block ml-0.5 teleprompter-question animate-pulse-soft">▌</span>}
          </p>
        )}

        {isGenerating && !answer && (
          <div className="flex items-center gap-2.5 teleprompter-muted text-sm">
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
            <span className="font-mono text-xs">Generating answer...</span>
          </div>
        )}

        {answer && <div className="h-[40vh]" />}
      </div>
    </div>
  );
}
