import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile, AudioSource, SessionMode } from "@/lib/types";
import { Mic, Monitor, Zap, Brain, Shield, Smartphone, Laptop, Headphones, MessageSquare, Upload, FileText, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SetupPageProps {
  onStart: (profile: UserProfile, audioSource: AudioSource, mode: SessionMode) => void;
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
  const [sessionMode, setSessionMode] = useState<SessionMode>("interview");
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    onStart(profile, audioSource, sessionMode);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload a PDF file." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 10MB." });
      return;
    }

    setIsParsing(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to parse PDF" }));
        throw new Error(err.error || "Failed to parse PDF");
      }

      const { text } = await response.json();
      setProfile(p => ({ ...p, resume: text }));
      toast({ title: "Resume parsed!", description: "Your PDF has been extracted successfully." });
    } catch (err: any) {
      console.error("PDF parse error:", err);
      toast({ variant: "destructive", title: "Parse failed", description: err.message });
      setUploadedFileName(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearUpload = () => {
    setUploadedFileName(null);
    setProfile(p => ({ ...p, resume: "" }));
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

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>Resume PDF</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              {uploadedFileName ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{uploadedFileName}</span>
                  {isParsing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearUpload}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Resume PDF (max 10MB)</span>
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume / Background {uploadedFileName && "(extracted from PDF)"}</Label>
              <Textarea
                id="resume"
                placeholder="Paste your resume or upload a PDF above..."
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

        {/* Session Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setSessionMode("interview")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  sessionMode === "interview"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold">Interview Q&A</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detects questions and generates answers. Use manual input or wait for question detection.
                </p>
              </button>
              <button
                onClick={() => setSessionMode("solo")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  sessionMode === "solo"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Headphones className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold">Hands-Free Guide</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fully automatic. Listens, detects when speech stops, generates answer instantly. No buttons needed.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Audio Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audio Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: "microphone" as AudioSource,
                  icon: Mic,
                  title: "Microphone",
                  desc: "In-person interview. Picks up audio from your mic.",
                },
                {
                  value: "system" as AudioSource,
                  icon: Monitor,
                  title: "Virtual Call",
                  desc: "Zoom, Meet, WhatsApp calls. Captures system audio even with headphones.",
                },
              ].map(({ value, icon: Icon, title, desc }) => (
                <button
                  key={value}
                  onClick={() => setAudioSource(value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    audioSource === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
            {audioSource === "system" && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How it works:</p>
                <p>1. Click Start → you'll be asked to share a screen/tab</p>
                <p>2. Select the tab with your Zoom/WhatsApp/Meet call</p>
                <p>3. ✅ Check "Share tab audio" (important!)</p>
                <p>4. The app captures call audio directly — headphones won't block it</p>
              </div>
            )}
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
