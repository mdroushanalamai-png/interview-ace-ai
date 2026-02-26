import { useState, useCallback, useEffect } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { UserProfile, AudioSource } from "@/lib/types";
import { SessionScreen } from "./SessionScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Smartphone, Loader2, WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReceiverPageProps {
  onBack: () => void;
}

export function ReceiverPage({ onBack }: ReceiverPageProps) {
  const { roomCode, status, remoteStream, joinRoom, cleanup } = useWebRTC("receiver");
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    resume: "",
    experienceLevel: "",
    skills: "",
    talkingPoints: "",
  });
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleJoin = useCallback(async () => {
    if (code.length !== 6) {
      toast({ variant: "destructive", title: "Invalid Code", description: "Enter a 6-digit room code." });
      return;
    }
    await joinRoom(code);
  }, [code, joinRoom]);

  // Start session when stream is received
  useEffect(() => {
    if (remoteStream && status === "connected" && !sessionStarted) {
      setSessionStarted(true);
    }
  }, [remoteStream, status, sessionStarted]);

  if (sessionStarted && remoteStream) {
    return (
      <SessionScreen
        profile={profile}
        initialAudioSource="remote"
        mode="interview"
        onEnd={() => {
          cleanup();
          setSessionStarted(false);
          onBack();
        }}
        remoteStream={remoteStream}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Phone — Receiver</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Room Code Input */}
          <div className="space-y-2">
            <Label>Room Code</Label>
            <Input
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl font-mono tracking-[0.2em]"
            />
          </div>

          {/* Minimal profile */}
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input
              placeholder="John Doe"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Key Skills</Label>
            <Input
              placeholder="React, TypeScript..."
              value={profile.skills}
              onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Resume / Background</Label>
            <Textarea
              placeholder="Brief summary..."
              className="min-h-[80px]"
              value={profile.resume}
              onChange={(e) => setProfile((p) => ({ ...p, resume: e.target.value }))}
            />
          </div>

          {/* Status */}
          {status === "connecting" && (
            <div className="flex items-center gap-2 text-amber-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Connecting to laptop...</span>
            </div>
          )}
          {status === "failed" && (
            <div className="flex items-center gap-2 text-destructive">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Connection failed. Check the code and try again.</span>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleJoin} disabled={status === "connecting"}>
            <Smartphone className="w-4 h-4 mr-2" />
            {status === "connecting" ? "Connecting..." : "Join & Start"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
