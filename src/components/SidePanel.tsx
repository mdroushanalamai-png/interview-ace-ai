import { QAEntry } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, History } from "lucide-react";

interface SidePanelProps {
  history: QAEntry[];
  liveTranscript: string;
  onSelectEntry: (entry: QAEntry) => void;
}

export function SidePanel({ history, liveTranscript, onSelectEntry }: SidePanelProps) {
  return (
    <div className="flex flex-col h-full glass-strong border-l border-border">
      {/* Live transcript */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
          <h3 className="text-xs font-display tracking-wider text-primary uppercase">Live Feed</h3>
        </div>
        <div className="h-20 overflow-y-auto rounded-lg bg-background/50 p-2.5 border border-border/50">
          <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
            {liveTranscript || "Waiting for audio..."}
          </p>
        </div>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <History className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-display tracking-wider text-primary uppercase">History</h3>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{history.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {history.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6 font-mono">
                No entries yet
              </p>
            )}
            {history.map(entry => (
              <button key={entry.id} onClick={() => onSelectEntry(entry)}
                className="w-full text-left p-2.5 rounded-lg bg-background/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-200">
                <p className="text-[11px] font-semibold text-primary truncate">{entry.question}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{entry.answer}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
