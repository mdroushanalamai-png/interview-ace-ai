import { useState } from "react";
import { SetupPage } from "@/components/SetupPage";
import { SessionScreen } from "@/components/SessionScreen";
import { SenderPage } from "@/components/SenderPage";
import { ReceiverPage } from "@/components/ReceiverPage";
import { UserProfile, AudioSource, SessionMode } from "@/lib/types";

type Mode = "setup" | "session" | "sender" | "receiver";

const Index = () => {
  const [mode, setMode] = useState<Mode>("setup");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");
  const [sessionMode, setSessionMode] = useState<SessionMode>("interview");

  const handleStart = (p: UserProfile, source: AudioSource, sMode: SessionMode) => {
    setProfile(p);
    setAudioSource(source);
    setSessionMode(sMode);
    setMode("session");
  };

  if (mode === "sender") {
    return <SenderPage onBack={() => setMode("setup")} />;
  }

  if (mode === "receiver") {
    return <ReceiverPage onBack={() => setMode("setup")} />;
  }

  if (mode === "session" && profile) {
    return (
      <SessionScreen
        profile={profile}
        initialAudioSource={audioSource}
        mode={sessionMode}
        onEnd={() => setMode("setup")}
      />
    );
  }

  return (
    <SetupPage
      onStart={handleStart}
      onMultiDevice={(role) => setMode(role)}
    />
  );
};

export default Index;
