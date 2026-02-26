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
    <div className="bg-card border-t border-border flex-shrink-0">
      {/* Primary controls row - always visible */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3">
        {/* Timer */}
        <span className="font-mono text-xs sm:text-sm text-muted-foreground tabular-nums">{elapsed}</span>

        {/* Pause/Resume */}
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={onTogglePause}>
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>

        {/* End */}
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={onEnd}>
          <Square className="w-4 h-4 text-destructive" />
        </Button>

        {/* Audio source toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => onSwitchAudio(audioSource === "microphone" ? "system" : "microphone")}
        >
          {audioSource === "microphone" ? <Mic className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Font size - desktop only inline */}
        <div className="hidden sm:flex items-center gap-2 min-w-[140px]">
          <Type className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[fontSize]}
            min={18}
            max={56}
            step={2}
            onValueChange={v => onFontSizeChange(v[0])}
            className="w-24"
          />
        </div>

        {/* Side panel toggle - desktop */}
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 sm:h-10 sm:w-10" onClick={onToggleSidePanel}>
          {sidePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>

        {/* Expand toggle - mobile only */}
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded controls - mobile */}
      {expanded && (
        <div className="sm:hidden px-3 pb-3 space-y-2">
          {/* Font size */}
          <div className="flex items-center gap-3">
            <Type className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[fontSize]}
              min={18}
              max={56}
              step={2}
              onValueChange={v => onFontSizeChange(v[0])}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">{fontSize}</span>
          </div>

          {/* Manual question */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a question..."
              className="h-8 text-sm flex-1"
              value={manualQ}
              onChange={e => setManualQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmitManual()}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSubmitManual} disabled={!manualQ.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Desktop manual question - inline */}
      <div className="hidden sm:flex items-center gap-2 px-4 pb-3">
        <Input
          placeholder="Type a question manually..."
          className="h-8 text-sm"
          value={manualQ}
          onChange={e => setManualQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmitManual()}
        />
        <Button variant="ghost" size="icon" onClick={handleSubmitManual} disabled={!manualQ.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
