import { useState, useCallback, useEffect } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useKeepAlive } from "@/hooks/useKeepAlive";
import { Button } from "@/components/ui/button";
import { Monitor, Wifi, WifiOff, Loader2, ArrowLeft, Copy, Check, Activity, MinusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SenderPageProps {
  onBack: () => void;
}

export function SenderPage({ onBack }: SenderPageProps) {
  const { roomCode, status, startSender, cleanup } = useWebRTC("sender");
  const [copied, setCopied] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  // Keep-alive is active once connected
  const keepAliveActive = status === "connected" || status === "waiting" || status === "connecting";
  const { isAlive } = useKeepAlive(keepAliveActive);

  // Once connected, show minimal view after a brief delay
  useEffect(() => {
    if (status === "connected") {
      const t = setTimeout(() => setSetupDone(true), 3000);
      return () => clearTimeout(t);
    } else {
      setSetupDone(false);
    }
  }, [status]);

  const handleStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      stream.getVideoTracks().forEach((t) => t.stop());
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio track. Make sure to share a tab with audio enabled.");
      }
      await startSender(new MediaStream(audioTracks));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: e.message || "Failed to capture system audio",
      });
    }
  }, [startSender]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ultra-minimal connected view — designed to be minimized
  if (setupDone && status === "connected") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-2 select-none">
        <div className="flex items-center gap-2 text-green-500">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-mono">STREAMING</span>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1 font-mono">{roomCode}</p>
        <button
          onClick={() => { cleanup(); setSetupDone(false); }}
          className="mt-3 text-[10px] text-neutral-700 hover:text-red-500 transition-colors font-mono"
        >
          STOP
        </button>
      </div>
    );
  }

  const statusConfig = {
    idle: { icon: Monitor, label: "Ready to stream", color: "text-neutral-500" },
    waiting: { icon: Loader2, label: "Waiting for phone...", color: "text-amber-500" },
    connecting: { icon: Loader2, label: "Connecting...", color: "text-amber-500" },
    connected: { icon: Wifi, label: "Connected & Streaming", color: "text-green-500" },
    failed: { icon: WifiOff, label: "Connection failed", color: "text-red-500" },
  };

  const { icon: StatusIcon, label, color } = statusConfig[status];

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-mono font-bold tracking-wider uppercase text-neutral-400">
            Audio Sender
          </h1>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-3 ${color}`}>
          <StatusIcon className={`w-4 h-4 ${status === "waiting" || status === "connecting" ? "animate-spin" : ""}`} />
          <span className="text-sm font-mono">{label}</span>
          {keepAliveActive && isAlive && (
            <span className="text-[10px] text-green-800 font-mono ml-auto">● ALIVE</span>
          )}
        </div>

        {/* Room Code */}
        {roomCode && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 font-mono">Room Code — enter on phone:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center text-3xl font-mono font-bold tracking-[0.3em] py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100">
                {roomCode}
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {status === "idle" && (
          <Button
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
            size="lg"
            onClick={handleStart}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Share System Audio
          </Button>
        )}

        {(status === "connected" || status === "waiting" || status === "connecting") && (
          <Button
            variant="ghost"
            className="w-full text-red-500 hover:text-red-400 hover:bg-neutral-900 border border-neutral-800"
            onClick={() => cleanup()}
          >
            Stop Streaming
          </Button>
        )}

        {status === "failed" && (
          <Button
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            onClick={handleStart}
          >
            Try Again
          </Button>
        )}

        {/* Instructions */}
        {status === "connected" && (
          <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="flex items-center gap-2 text-amber-500">
              <MinusCircle className="w-3 h-3" />
              <span className="text-xs font-mono font-bold">MINIMIZE THIS WINDOW NOW</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono leading-relaxed">
              Audio will keep streaming in the background. In Zoom/Meet, share only your presentation window — this tab won't be visible.
            </p>
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-1.5 text-[11px] text-neutral-600 font-mono">
            <p>1. Click "Share System Audio" above</p>
            <p>2. Select your meeting tab (Zoom/Meet)</p>
            <p>3. Enter the code on your phone</p>
            <p>4. Minimize this window</p>
            <p className="text-neutral-700 mt-2">
              Tip: In Zoom, share a specific window — not "Entire Screen" — so this tab stays hidden.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
