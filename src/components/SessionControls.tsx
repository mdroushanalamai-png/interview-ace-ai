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
      const m = String(Math.floor(diff / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleSubmitManual = () => {
    if (manualQ.trim()) {
      onManualQuestion(manualQ.trim());
      setManualQ("");
    }
  };

  return (
    <div className="glass-strong border-t border-border flex-shrink-0">
      {/* Primary row */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaused ? 'bg-yellow-500' : 'bg-primary animate-glow-pulse'}`} />

        {/* Timer */}
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{elapsed}</span>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Pause */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTogglePause}>
          {isPaused ? <Play className="w-4 h-4 text-primary" /> : <Pause className="w-4 h-4" />}
        </Button>

        {/* End */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEnd}>
          <Square className="w-3.5 h-3.5 text-destructive" />
        </Button>

        {/* Audio toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => onSwitchAudio(audioSource === "microphone" ? "system" : "microphone")}>
          {audioSource === "microphone" ? <Mic className="w-4 h-4" /> : <Monitor className="w-4 h-4 text-primary" />}
        </Button>

        <div className="flex-1" />

        {/* Font size - desktop */}
        <div className="hidden sm:flex items-center gap-2 min-w-[130px]">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          <Slider value={[fontSize]} min={18} max={56} step={2}
            onValueChange={v => onFontSizeChange(v[0])} className="w-20" />
          <span className="text-[10px] text-muted-foreground font-mono w-6">{fontSize}</span>
        </div>

        {/* Side panel - desktop */}
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8" onClick={onToggleSidePanel}>
          {sidePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>

        {/* Expand - mobile */}
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded mobile */}
      {expanded && (
        <div className="sm:hidden px-3 pb-2.5 space-y-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <Type className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Slider value={[fontSize]} min={18} max={56} step={2}
              onValueChange={v => onFontSizeChange(v[0])} className="flex-1" />
            <span className="text-[10px] text-muted-foreground font-mono w-6">{fontSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Type a question..." className="h-8 text-xs flex-1 bg-background/50"
              value={manualQ} onChange={e => setManualQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmitManual()} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSubmitManual} disabled={!manualQ.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Desktop manual question */}
      <div className="hidden sm:flex items-center gap-2 px-4 pb-2.5">
        <Input placeholder="Type a question manually..." className="h-8 text-xs bg-background/50"
          value={manualQ} onChange={e => setManualQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmitManual()} />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSubmitManual} disabled={!manualQ.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
