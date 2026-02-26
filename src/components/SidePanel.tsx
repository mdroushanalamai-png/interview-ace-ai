import { QAEntry } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock } from "lucide-react";

interface SidePanelProps {
  history: QAEntry[];
  liveTranscript: string;
  onSelectEntry: (entry: QAEntry) => void;
}

export function SidePanel({ history, liveTranscript, onSelectEntry }: SidePanelProps) {
  return (
    <div className="flex flex-col h-full glass-strong border-l border-border/50">
      {/* Live */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
          <h3 className="text-[11px] font-heading font-semibold tracking-wide uppercase text-muted-foreground">Live Feed</h3>
        </div>
        <div className="h-20 overflow-y-auto rounded-xl bg-muted/40 p-2.5 border border-border/30">
          <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
            {liveTranscript || "Awaiting audio..."}
          </p>
        </div>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[11px] font-heading font-semibold tracking-wide uppercase text-muted-foreground">History</h3>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">{history.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {history.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-8">No entries yet</p>
            )}
            {history.map(entry => (
              <button key={entry.id} onClick={() => onSelectEntry(entry)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/15 transition-all duration-200">
                <p className="text-[11px] font-semibold text-primary truncate">{entry.question}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{entry.answer}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
