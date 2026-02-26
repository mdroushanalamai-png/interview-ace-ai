import { useState, useCallback, useEffect } from "react";
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
}

export function SessionScreen({ profile, initialAudioSource, mode, onEnd, remoteStream }: SessionScreenProps) {
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const session = useSession(profile);

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

  // Start on mount
  useEffect(() => {
    session.startSession();
    if (initialAudioSource === "remote" && remoteStream) {
      audio.startFromStream(remoteStream).catch(e => {
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: e.message || "Failed to start remote audio",
        });
      });
    } else {
      audio.startCapture(initialAudioSource).catch(e => {
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: e.message || "Failed to start audio capture",
        });
      });
    }

    return () => {
      audio.stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = () => {
    audio.stopCapture();
    session.endSession();
    onEnd();
  };

  const handleSwitchAudio = async (source: AudioSource) => {
    audio.stopCapture();
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
    <div className="h-screen flex flex-col bg-background">
      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Teleprompter */}
        <div className="flex-1 p-4">
          <Teleprompter
            question={session.state.currentQuestion}
            answer={session.state.currentAnswer}
            isGenerating={session.state.isGenerating}
            fontSize={session.state.fontSize}
          />
        </div>

        {/* Side panel */}
        {sidePanelOpen && (
          <div className="w-80 flex-shrink-0">
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
