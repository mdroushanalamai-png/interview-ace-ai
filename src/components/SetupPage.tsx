import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { UserProfile, AudioSource } from "@/lib/types";
import { Mic, Monitor, Zap, Brain, Shield, Smartphone, Laptop } from "lucide-react";

interface SetupPageProps {
  onStart: (profile: UserProfile, audioSource: AudioSource) => void;
  onMultiDevice: (role: "sender" | "receiver") => void;
}

export function SetupPage({ onStart, onMultiDevice }: SetupPageProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    resume: "",
    experienceLevel: "",
    skills: "",
    talkingPoints: "",
  });
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");

  const handleStart = () => {
    onStart(profile, audioSource);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Interview Assistant
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Ace Every Interview
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time AI answers personalized to your profile. Listen to questions, get instant professional responses on your teleprompter.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Brain, title: "AI Answers", desc: "Streaming answers personalized to your resume" },
            { icon: Mic, title: "Live Transcription", desc: "Ultra-low latency speech-to-text" },
            { icon: Shield, title: "Your Data", desc: "Profile stays in your browser, never stored" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Experience Level</Label>
                <Input
                  id="exp"
                  placeholder="e.g. Senior, 5 years"
                  value={profile.experienceLevel}
                  onChange={e => setProfile(p => ({ ...p, experienceLevel: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Key Skills</Label>
              <Input
                id="skills"
                placeholder="React, TypeScript, Node.js, AWS..."
                value={profile.skills}
                onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume">Resume / Background</Label>
              <Textarea
                id="resume"
                placeholder="Paste your resume or write a summary of your experience..."
                className="min-h-[120px]"
                value={profile.resume}
                onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Talking Points</Label>
              <Textarea
                id="points"
                placeholder="Key achievements, projects, or points you want the AI to mention..."
                className="min-h-[80px]"
                value={profile.talkingPoints}
                onChange={e => setProfile(p => ({ ...p, talkingPoints: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audio Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Mic className={`w-5 h-5 ${audioSource === "microphone" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={audioSource === "microphone" ? "font-medium" : "text-muted-foreground"}>Microphone</span>
              </div>
              <Switch
                checked={audioSource === "system"}
                onCheckedChange={v => setAudioSource(v ? "system" : "microphone")}
              />
              <div className="flex items-center gap-3">
                <span className={audioSource === "system" ? "font-medium" : "text-muted-foreground"}>System Audio</span>
                <Monitor className={`w-5 h-5 ${audioSource === "system" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {audioSource === "system"
                ? "You'll be asked to share a browser tab. Make sure to check 'Share tab audio'."
                : "Uses your microphone to pick up audio from your speakers."}
            </p>
          </CardContent>
        </Card>

        {/* Multi-Device Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multi-Device Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stream audio from your laptop to your phone over WiFi. The phone transcribes and shows AI answers.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onMultiDevice("sender")}>
                <Laptop className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Laptop</div>
                  <div className="text-xs text-muted-foreground">Send audio</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onMultiDevice("receiver")}>
                <Smartphone className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Phone</div>
                  <div className="text-xs text-muted-foreground">Receive & process</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold glow-primary"
          onClick={handleStart}
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Interview Session
        </Button>
      </div>
    </div>
  );
}
