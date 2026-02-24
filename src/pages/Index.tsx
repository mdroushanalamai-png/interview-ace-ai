import { useState } from "react";
import { SetupPage } from "@/components/SetupPage";
import { SessionScreen } from "@/components/SessionScreen";
import { UserProfile, AudioSource } from "@/lib/types";

const Index = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");

  const handleStart = (p: UserProfile, source: AudioSource) => {
    setProfile(p);
    setAudioSource(source);
    setSessionActive(true);
  };

  if (sessionActive && profile) {
    return (
      <SessionScreen
        profile={profile}
        initialAudioSource={audioSource}
        onEnd={() => setSessionActive(false)}
      />
    );
  }

  return <SetupPage onStart={handleStart} />;
};

export default Index;
