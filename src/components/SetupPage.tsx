import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserProfile, AudioSource, SessionMode } from "@/lib/types";
import {
  Mic, Monitor, Zap, Smartphone, Laptop, Headphones,
  MessageSquare, Upload, FileText, Loader2, X, ArrowRight,
  Radio, Volume2, Wifi
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";

interface SetupPageProps {
  onStart: (profile: UserProfile, audioSource: AudioSource, mode: SessionMode, stream?: MediaStream) => void;
  onMultiDevice: (role: "sender" | "receiver") => void;
}

export function SetupPage({ onStart, onMultiDevice }: SetupPageProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: "", resume: "", experienceLevel: "", skills: "", talkingPoints: "",
  });
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");
  const [sessionMode, setSessionMode] = useState<SessionMode>("interview");
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0=profile, 1=config
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  const handleStart = async () => {
    if (audioSource === "system") {
      try {
        setIsCapturing(true);
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        // Stop video tracks - we only need audio
        stream.getVideoTracks().forEach(t => t.stop());
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("No audio captured. Make sure to check 'Share tab audio' when selecting the tab.");
        }
        onStart(profile, audioSource, sessionMode, new MediaStream(audioTracks));
      } catch (e: any) {
        setIsCapturing(false);
        if (e.name === "NotAllowedError") {
          toast({ variant: "destructive", title: "Cancelled", description: "Tab sharing was cancelled. Please try again and select a tab with audio." });
        } else {
          toast({ variant: "destructive", title: "Audio Capture Failed", description: e.message || "Could not capture tab audio. Make sure to share a Chrome tab with 'Share tab audio' checked." });
        }
        return;
      }
    } else {
      onStart(profile, audioSource, sessionMode);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload a PDF." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Too large", description: "Max 10MB." });
      return;
    }
    setIsParsing(true);
    setUploadedFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Parse failed");
      const { text } = await res.json();
      setProfile(p => ({ ...p, resume: text }));
      toast({ title: "Done!", description: "Resume extracted." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
      setUploadedFileName(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background noise">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[50%] h-[50%] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight">InterviewAI</span>
        </div>
        <ThemeToggle />
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        {/* Hero */}
        <div className="text-center pt-8 sm:pt-14 pb-10 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            v2.0 — AI Interview Copilot
          </div>
          <h1 className="font-heading text-3xl sm:text-[42px] font-extrabold tracking-tight leading-[1.1] mb-3">
            Your secret weapon
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              for every interview
            </span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-[15px] max-w-md mx-auto leading-relaxed">
            Real-time AI answers tailored to your resume. Works with Zoom, Meet, WhatsApp — even with headphones on.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <button onClick={() => setStep(0)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              step === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold
              ${step === 0 ? 'border-primary-foreground/40' : 'border-muted-foreground/40'}">1</span>
            Profile
          </button>
          <div className="w-6 h-px bg-border" />
          <button onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold">2</span>
            Configure
          </button>
        </div>

        {/* Step 0: Profile */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                  <Input placeholder="John Doe" value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="h-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Experience</Label>
                  <Input placeholder="Senior, 5 years" value={profile.experienceLevel}
                    onChange={e => setProfile(p => ({ ...p, experienceLevel: e.target.value }))}
                    className="h-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Key Skills</Label>
                <Input placeholder="React, TypeScript, Node.js, AWS..." value={profile.skills}
                  onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
                  className="h-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-colors" />
              </div>

              {/* PDF Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Resume</Label>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                {uploadedFileName ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{uploadedFileName}</span>
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : (
                      <button onClick={() => { setUploadedFileName(null); setProfile(p => ({ ...p, resume: "" })); }}
                        className="p-1 rounded-md hover:bg-muted transition-colors">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} disabled={isParsing}
                    className="w-full py-5 rounded-xl border-2 border-dashed border-border hover:border-primary/30 bg-muted/30 hover:bg-primary/5 transition-all flex flex-col items-center gap-1.5 group">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Upload PDF resume</span>
                    <span className="text-[10px] text-muted-foreground/60">Max 10MB</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Resume Text {uploadedFileName && <span className="text-primary">(extracted)</span>}
                </Label>
                <Textarea placeholder="Paste resume or upload PDF above..."
                  className="min-h-[90px] text-sm bg-muted/50 border-border/50 focus:border-primary/50 transition-colors resize-none"
                  value={profile.resume}
                  onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Talking Points</Label>
                <Textarea placeholder="Key projects, achievements to highlight..."
                  className="min-h-[70px] text-sm bg-muted/50 border-border/50 focus:border-primary/50 transition-colors resize-none"
                  value={profile.talkingPoints}
                  onChange={e => setProfile(p => ({ ...p, talkingPoints: e.target.value }))} />
              </div>
            </div>

            <Button className="w-full h-11 font-heading font-semibold text-sm" onClick={() => setStep(1)}>
              Continue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Step 1: Configure */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>

            {/* Session Mode */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold text-sm mb-3">Session Mode</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { v: "interview" as SessionMode, icon: MessageSquare, t: "Q&A Mode", d: "Detects questions, generates answers" },
                  { v: "solo" as SessionMode, icon: Headphones, t: "Hands-Free", d: "Fully automatic, no buttons needed" },
                ] as const).map(({ v, icon: Icon, t, d }) => (
                  <button key={v} onClick={() => setSessionMode(v)}
                    className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                      sessionMode === v
                        ? 'border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                        : 'border-border/60 hover:border-border bg-card hover:bg-muted/30'
                    }`}>
                    {sessionMode === v && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                    )}
                    <Icon className={`w-5 h-5 mb-2 ${sessionMode === v ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-semibold mb-0.5">{t}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{d}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Source */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold text-sm mb-3">Audio Source</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { v: "microphone" as AudioSource, icon: Mic, t: "Microphone", d: "In-person interviews. Uses your mic." },
                  { v: "system" as AudioSource, icon: Volume2, t: "Tab Audio", d: "Zoom, Meet, WhatsApp — captures call audio directly." },
                ] as const).map(({ v, icon: Icon, t, d }) => (
                  <button key={v} onClick={() => setAudioSource(v)}
                    className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                      audioSource === v
                        ? 'border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                        : 'border-border/60 hover:border-border bg-card hover:bg-muted/30'
                    }`}>
                    {audioSource === v && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                    )}
                    <Icon className={`w-5 h-5 mb-2 ${audioSource === v ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-semibold mb-0.5">{t}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{d}</p>
                  </button>
                ))}
              </div>

              {audioSource === "system" && (
                <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/15 animate-scale-up">
                  <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                    <Radio className="w-3 h-3" /> How Tab Audio Works
                  </p>
                  <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                    <li>Open your call in a <span className="text-foreground font-medium">Chrome tab</span> (Zoom Web, Meet, WhatsApp Web)</li>
                    <li>Click "Launch Session" → select that tab to share</li>
                    <li>Check <span className="text-foreground font-medium">"Share tab audio"</span></li>
                    <li>Audio is captured directly — <span className="text-foreground font-medium">headphones OK</span></li>
                  </ol>
                </div>
              )}
            </div>

            {/* Multi-Device */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-semibold text-sm">Multi-Device</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">STEALTH</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Laptop sends audio → Phone shows AI answers. Hidden from screen-share.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => onMultiDevice("sender")}
                  className="p-3 rounded-xl border border-border/60 hover:border-primary/30 bg-card hover:bg-primary/5 transition-all flex flex-col items-center gap-1.5 group">
                  <Laptop className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold">Laptop</span>
                  <span className="text-[10px] text-muted-foreground">Send audio</span>
                </button>
                <button onClick={() => onMultiDevice("receiver")}
                  className="p-3 rounded-xl border border-border/60 hover:border-primary/30 bg-card hover:bg-primary/5 transition-all flex flex-col items-center gap-1.5 group">
                  <Smartphone className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold">Phone</span>
                  <span className="text-[10px] text-muted-foreground">View answers</span>
                </button>
              </div>
            </div>

            {/* Launch */}
            <Button size="lg" onClick={handleStart}
              className="w-full h-12 sm:h-13 font-heading font-bold text-sm sm:text-base tracking-wide glow-primary animate-fade-up"
              style={{ animationDelay: '0.2s' }}>
              <Zap className="w-4 h-4 mr-2" />
              Launch Session
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/60 pb-4">
              Chrome or Edge recommended • Data stays in your browser
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
