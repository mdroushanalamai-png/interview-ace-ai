import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pause, Play, Square, Type, PanelRightOpen, PanelRightClose,
  Mic, Monitor, Send,
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
    <div className="flex items-center gap-3 px-4 py-3 bg-card border-t border-border">
      {/* Timer */}
      <span className="font-mono text-sm text-muted-foreground tabular-nums min-w-[50px]">{elapsed}</span>

      {/* Pause/Resume */}
      <Button variant="ghost" size="icon" onClick={onTogglePause} title={isPaused ? "Resume" : "Pause"}>
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </Button>

      {/* End */}
      <Button variant="ghost" size="icon" onClick={onEnd} title="End Session">
        <Square className="w-4 h-4 text-destructive" />
      </Button>

      {/* Audio source toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSwitchAudio(audioSource === "microphone" ? "system" : "microphone")}
        title={`Switch to ${audioSource === "microphone" ? "system" : "mic"} audio`}
      >
        {audioSource === "microphone" ? <Mic className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
      </Button>

      {/* Manual question input */}
      <div className="flex-1 flex items-center gap-2">
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

      {/* Font size */}
      <div className="flex items-center gap-2 min-w-[140px]">
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

      {/* Side panel toggle */}
      <Button variant="ghost" size="icon" onClick={onToggleSidePanel}>
        {sidePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
      </Button>
    </div>
  );
}
