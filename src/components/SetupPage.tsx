import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserProfile, AudioSource, SessionMode } from "@/lib/types";
import { Mic, Monitor, Zap, Brain, Shield, Smartphone, Laptop, Headphones, MessageSquare, Upload, FileText, Loader2, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";

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

  const features = [
    { icon: Brain, title: "AI Answers", desc: "Personalized to your resume" },
    { icon: Mic, title: "Live STT", desc: "Ultra-low latency transcription" },
    { icon: Shield, title: "Private", desc: "Data stays in your browser" },
  ];

  const audioOptions = [
    {
      value: "microphone" as AudioSource,
      icon: Mic,
      title: "Microphone",
      desc: "In-person. Picks up audio from mic.",
    },
    {
      value: "system" as AudioSource,
      icon: Monitor,
      title: "Virtual Call",
      desc: "Zoom, Meet, WhatsApp. Captures system audio even with headphones.",
    },
  ];

  const modeOptions = [
    {
      value: "interview" as SessionMode,
      icon: MessageSquare,
      title: "Interview Q&A",
      desc: "Detects questions, generates answers on demand.",
    },
    {
      value: "solo" as SessionMode,
      icon: Headphones,
      title: "Hands-Free",
      desc: "Fully auto. Listens, detects, answers instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg relative">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 scan-lines" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono tracking-wider mb-6 animate-fade-in glow-border">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
            SYSTEM ONLINE
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">Interview</span>{" "}
            <span className="text-foreground">Copilot</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Real-time AI answers personalized to your profile. Listen, detect, respond — seamlessly.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Feature chips */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="tech-card p-3 sm:p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold">{title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile */}
        <section className="tech-card p-4 sm:p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <h2 className="font-display text-sm tracking-wider text-primary uppercase">Your Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input id="name" placeholder="John Doe" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="h-9 text-sm bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp" className="text-xs">Experience</Label>
              <Input id="exp" placeholder="e.g. Senior, 5 years" value={profile.experienceLevel}
                onChange={e => setProfile(p => ({ ...p, experienceLevel: e.target.value }))}
                className="h-9 text-sm bg-background/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills" className="text-xs">Skills</Label>
            <Input id="skills" placeholder="React, TypeScript, Node.js, AWS..."
              value={profile.skills}
              onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
              className="h-9 text-sm bg-background/50" />
          </div>

          {/* PDF Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">Resume PDF</Label>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
            {uploadedFileName ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-medium truncate flex-1">{uploadedFileName}</span>
                {isParsing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearUpload}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full h-16 border-dashed flex-col gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Upload PDF (max 10MB)</span>
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resume" className="text-xs">Resume {uploadedFileName && "(extracted)"}</Label>
            <Textarea id="resume" placeholder="Paste your resume or upload PDF above..."
              className="min-h-[100px] text-sm bg-background/50"
              value={profile.resume}
              onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="points" className="text-xs">Talking Points</Label>
            <Textarea id="points" placeholder="Key achievements, projects to highlight..."
              className="min-h-[70px] text-sm bg-background/50"
              value={profile.talkingPoints}
              onChange={e => setProfile(p => ({ ...p, talkingPoints: e.target.value }))} />
          </div>
        </section>

        {/* Session Mode */}
        <section className="tech-card p-4 sm:p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-display text-sm tracking-wider text-primary uppercase">Mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {modeOptions.map(({ value, icon: Icon, title, desc }) => (
              <button key={value} onClick={() => setSessionMode(value)}
                className={`select-card ${sessionMode === value ? 'select-card--active' : 'select-card--inactive'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${sessionMode === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs sm:text-sm font-semibold">{title}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Audio Source */}
        <section className="tech-card p-4 sm:p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <h2 className="font-display text-sm tracking-wider text-primary uppercase">Audio Source</h2>
          <div className="grid grid-cols-2 gap-3">
            {audioOptions.map(({ value, icon: Icon, title, desc }) => (
              <button key={value} onClick={() => setAudioSource(value)}
                className={`select-card ${audioSource === value ? 'select-card--active' : 'select-card--inactive'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${audioSource === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs sm:text-sm font-semibold">{title}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{desc}</p>
              </button>
            ))}
          </div>
          {audioSource === "system" && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1 font-mono">
              <p className="text-primary font-semibold text-[11px]">// SETUP</p>
              <p>1. Click Start → share a screen/tab</p>
              <p>2. Select your Zoom/WhatsApp/Meet tab</p>
              <p>3. ✅ Check "Share tab audio"</p>
              <p>4. Audio captured directly — headphones OK</p>
            </div>
          )}
        </section>

        {/* Multi-Device */}
        <section className="tech-card p-4 sm:p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="font-display text-sm tracking-wider text-primary uppercase">Multi-Device</h2>
          <p className="text-xs text-muted-foreground">
            Stream audio from laptop to phone via WiFi. Phone transcribes and shows AI answers.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 tech-btn" onClick={() => onMultiDevice("sender")}>
              <Laptop className="w-5 h-5" />
              <span className="font-semibold text-xs">Laptop</span>
              <span className="text-[10px] text-muted-foreground">Send audio</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 tech-btn" onClick={() => onMultiDevice("receiver")}>
              <Smartphone className="w-5 h-5" />
              <span className="font-semibold text-xs">Phone</span>
              <span className="text-[10px] text-muted-foreground">Receive & process</span>
            </Button>
          </div>
        </section>

        {/* Start Button */}
        <Button size="lg" className="w-full h-12 sm:h-14 text-sm sm:text-base font-display font-bold tracking-wider glow-primary animate-fade-in-up"
          style={{ animationDelay: '0.55s' }}
          onClick={handleStart}>
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          LAUNCH SESSION
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground pb-8">
          Works best in Chrome or Edge • Your data never leaves your browser
        </p>
      </div>
    </div>
  );
}
