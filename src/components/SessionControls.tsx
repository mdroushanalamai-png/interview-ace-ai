import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pause, Play, Square, Type, PanelRightOpen, PanelRightClose,
  Mic, Monitor, Send, ChevronUp, ChevronDown,
} from "lucide-react";
import { AudioSource } from "@/lib/types";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SessionControlsProps {
  isPaused: boolean;
  fontSize: number;
  audioSource: AudioSource;
  sidePanelOpen: boolean;
  startTime: Date | null;
  onTogglePause: () => void;
  onEnd: () => void;
  onFontSizeChange: (size: number) => void;
  onToggleSidePanel: () => void;
  onSwitchAudio: (source: AudioSource) => void;
  onManualQuestion: (q: string) => void;
}

export function SessionControls({
  isPaused, fontSize, audioSource, sidePanelOpen, startTime,
  onTogglePause, onEnd, onFontSizeChange, onToggleSidePanel,
  onSwitchAudio, onManualQuestion,
}: SessionControlsProps) {
  const [elapsed, setElapsed] = useState("00:00");
  const [manualQ, setManualQ] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(`${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const submit = () => {
    if (manualQ.trim()) { onManualQuestion(manualQ.trim()); setManualQ(""); }
  };

  return (
    <div className="glass-strong border-t border-border/60 flex-shrink-0 animate-slide-up">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse-soft'}`} />
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums min-w-[38px]">{elapsed}</span>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onTogglePause}>
          {isPaused ? <Play className="w-3.5 h-3.5 text-primary" /> : <Pause className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onEnd}>
          <Square className="w-3 h-3 text-destructive" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
          onClick={() => onSwitchAudio(audioSource === "microphone" ? "system" : "microphone")}>
          {audioSource === "microphone" ? <Mic className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5 text-primary" />}
        </Button>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-2">
          <Type className="w-3 h-3 text-muted-foreground" />
          <Slider value={[fontSize]} min={18} max={56} step={2}
            onValueChange={v => onFontSizeChange(v[0])} className="w-20" />
          <span className="text-[10px] font-mono text-muted-foreground w-5">{fontSize}</span>
        </div>

        <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 rounded-lg" onClick={onToggleSidePanel}>
          {sidePanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
        </Button>

        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 rounded-lg" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {expanded && (
        <div className="sm:hidden px-3 pb-2.5 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Type className="w-3 h-3 text-muted-foreground" />
            <Slider value={[fontSize]} min={18} max={56} step={2}
              onValueChange={v => onFontSizeChange(v[0])} className="flex-1" />
            <span className="text-[10px] font-mono text-muted-foreground w-5">{fontSize}</span>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type a question..." className="h-8 text-xs flex-1 bg-muted/50"
              value={manualQ} onChange={e => setManualQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={submit} disabled={!manualQ.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="hidden sm:flex items-center gap-2 px-4 pb-2.5">
        <Input placeholder="Type a question..." className="h-8 text-xs bg-muted/50"
          value={manualQ} onChange={e => setManualQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={submit} disabled={!manualQ.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
