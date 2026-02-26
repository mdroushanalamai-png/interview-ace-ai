import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { UserProfile, AudioSource, SessionMode } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { Teleprompter } from "./Teleprompter";
import { SidePanel } from "./SidePanel";
import { SessionControls } from "./SessionControls";
import { toast } from "@/hooks/use-toast";


interface SessionScreenProps {
  profile: UserProfile;
  initialAudioSource: AudioSource;
  mode: SessionMode;
  onEnd: () => void;
  remoteStream?: MediaStream;
  systemStream?: MediaStream;
}

export function SessionScreen({ profile, initialAudioSource, mode, onEnd, remoteStream, systemStream }: SessionScreenProps) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const session = useSession(profile);
  const scribeConnectedRef = useRef(false);

  const handleTranscript = useCallback((text: string) => {
    if (!session.state.isPaused) {
      session.appendTranscript(text);
    }
  }, [session]);

  const handleQuestion = useCallback((question: string) => {
    if (!session.state.isPaused) {
      session.processQuestion(question);
    }
  }, [session]);

  const audio = useAudioCapture(handleTranscript, handleQuestion, session.state.isPaused, mode === "solo");

  // Setup useScribe for system/tab audio transcription
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    sampleRate: 16000,
    onPartialTranscript: (data) => {
      if (data.text) {
        handleTranscript(data.text);
      }
    },
    onCommittedTranscript: (data) => {
      if (data.text) {
        handleTranscript(data.text);
        audio.detectQuestion(data.text);
      }
    },
    onError: (error) => {
      console.error("Scribe error:", error);
      toast({ variant: "destructive", title: "Transcription Error", description: String(error) });
    },
  });

  // Register scribe.sendAudio into audio capture hook
  useEffect(() => {
    if (scribe.isConnected) {
      audio.registerScribeSendAudio(scribe.sendAudio);
    }
  }, [scribe.isConnected, scribe.sendAudio, audio.registerScribeSendAudio]);

  // Start on mount
  useEffect(() => {
    session.startSession();

    const initAudio = async () => {
      if (initialAudioSource === "system" && systemStream) {
        try {
          // Fetch scribe token and connect
          console.log("Fetching scribe token via direct fetch...");
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
            }
          );
          if (!res.ok) {
            const errText = await res.text();
            console.error("Token fetch failed:", res.status, errText);
            throw new Error(`Token fetch failed: ${res.status}`);
          }
          const data = await res.json();
          if (!data?.token) {
            throw new Error("No token in response");
          }
          console.log("Scribe token received, connecting...");
          await scribe.connect({ token: data.token });
          scribeConnectedRef.current = true;
          console.log("Scribe connected, starting system capture...");
          // Start audio processing (will send PCM to scribe via sendAudio)
          audio.startWithSystemStream(systemStream);
        } catch (e: any) {
          console.error("System audio init failed:", e);
          toast({ variant: "destructive", title: "Audio Error", description: e.message || "Failed to start system audio" });
        }
      } else if (initialAudioSource === "remote" && remoteStream) {
        audio.startFromStream(remoteStream).catch(e => {
          toast({ variant: "destructive", title: "Audio Error", description: e.message || "Failed to start remote audio" });
        });
      } else {
        audio.startCapture(initialAudioSource).catch(e => {
          toast({ variant: "destructive", title: "Audio Error", description: e.message || "Failed to start audio capture" });
        });
      }
    };

    initAudio();

    return () => {
      audio.stopCapture();
      if (scribeConnectedRef.current) {
        scribe.disconnect();
        scribeConnectedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = () => {
    audio.stopCapture();
    if (scribeConnectedRef.current) {
      scribe.disconnect();
      scribeConnectedRef.current = false;
    }
    session.endSession();
    onEnd();
  };

  const handleSwitchAudio = async (source: AudioSource) => {
    audio.stopCapture();
    if (scribeConnectedRef.current) {
      scribe.disconnect();
      scribeConnectedRef.current = false;
    }
    try {
      await audio.startCapture(source);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Audio Switch Failed",
        description: e.message,
      });
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Teleprompter - full width on mobile */}
        <div className="flex-1 p-2 sm:p-4 min-w-0">
          <Teleprompter
            question={session.state.currentQuestion}
            answer={session.state.currentAnswer}
            isGenerating={session.state.isGenerating}
            fontSize={session.state.fontSize}
          />
        </div>

        {/* Side panel */}
        {sidePanelOpen && (
          <div className="hidden sm:block w-80 flex-shrink-0">
            <SidePanel
              history={session.state.history}
              liveTranscript={session.state.liveTranscript}
              onSelectEntry={session.showHistoryAnswer}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <SessionControls
        isPaused={session.state.isPaused}
        fontSize={session.state.fontSize}
        audioSource={audio.audioSource}
        sidePanelOpen={sidePanelOpen}
        startTime={session.state.startTime}
        onTogglePause={session.togglePause}
        onEnd={handleEnd}
        onFontSizeChange={session.setFontSize}
        onToggleSidePanel={() => setSidePanelOpen(!sidePanelOpen)}
        onSwitchAudio={handleSwitchAudio}
        onManualQuestion={session.processQuestion}
      />
    </div>
  );
}
