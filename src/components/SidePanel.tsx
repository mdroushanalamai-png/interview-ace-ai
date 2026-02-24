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
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Live transcript */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Live Transcript</h3>
        </div>
        <div className="h-24 overflow-y-auto rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed font-mono">
            {liveTranscript || "Waiting for audio..."}
          </p>
        </div>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Q&A History</h3>
          <span className="ml-auto text-xs text-muted-foreground">{history.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No questions detected yet
              </p>
            )}
            {history.map(entry => (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="text-xs font-semibold text-primary truncate">{entry.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.answer}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
