import { useState, useCallback } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Wifi, WifiOff, Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SenderPageProps {
  onBack: () => void;
}

export function SenderPage({ onBack }: SenderPageProps) {
  const { roomCode, status, startSender, cleanup } = useWebRTC("sender");
  const [copied, setCopied] = useState(false);

  const handleStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      // Stop video tracks
      stream.getVideoTracks().forEach((t) => t.stop());
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio track. Make sure to share a tab with audio enabled.");
      }
      const audioStream = new MediaStream(audioTracks);
      await startSender(audioStream);
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

  const statusConfig = {
    idle: { icon: Monitor, label: "Ready to stream", color: "text-muted-foreground" },
    waiting: { icon: Loader2, label: "Waiting for phone to connect...", color: "text-amber-500" },
    connecting: { icon: Loader2, label: "Establishing connection...", color: "text-amber-500" },
    connected: { icon: Wifi, label: "Connected & Streaming", color: "text-green-500" },
    failed: { icon: WifiOff, label: "Connection failed", color: "text-destructive" },
  };

  const { icon: StatusIcon, label, color } = statusConfig[status];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Laptop — Audio Sender</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className={`flex items-center gap-3 ${color}`}>
            <StatusIcon className={`w-5 h-5 ${status === "waiting" || status === "connecting" ? "animate-spin" : ""}`} />
            <span className="font-medium">{label}</span>
          </div>

          {/* Room Code */}
          {roomCode && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Room Code — enter this on your phone:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center text-4xl font-mono font-bold tracking-[0.3em] py-4 rounded-xl bg-muted border border-border">
                  {roomCode}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {status === "idle" && (
            <Button className="w-full" size="lg" onClick={handleStart}>
              <Monitor className="w-4 h-4 mr-2" />
              Share System Audio
            </Button>
          )}

          {(status === "connected" || status === "waiting" || status === "connecting") && (
            <Button variant="destructive" className="w-full" onClick={() => { cleanup(); }}>
              Stop Streaming
            </Button>
          )}

          {status === "failed" && (
            <Button className="w-full" onClick={handleStart}>
              Try Again
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Keep this tab open. Audio is streamed peer-to-peer to your phone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
