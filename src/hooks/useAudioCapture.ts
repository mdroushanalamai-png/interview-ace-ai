import { useState, useRef, useCallback, useEffect } from "react";
import { AudioSource } from "@/lib/types";

export function useAudioCapture(
  onTranscriptChunk: (text: string) => void,
  onQuestionDetected: (question: string) => void,
  isPaused: boolean,
  autoDetectAll: boolean = false
) {
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");
  const [isCapturing, setIsCapturing] = useState(false);

  // --- Shared refs ---
  const isPausedRef = useRef(isPaused);
  const sentenceBuffer = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Mic mode refs (SpeechRecognition) ---
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // --- System mode refs ---
  const systemStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sendAudioRef = useRef<((base64: string) => void) | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ---- Question detection (shared) ----
  const flushBuffer = useCallback(() => {
    const trimmed = sentenceBuffer.current.trim();
    if (!trimmed || trimmed.length < 10) return;

    const questionPatterns = [
      /\?/,
      /^(what|how|why|when|where|who|which|can you|could you|tell me|describe|explain|walk me through)/i,
      /^(have you|do you|did you|are you|were you|will you|would you)/i,
    ];

    if (autoDetectAll) {
      onQuestionDetected(trimmed);
    } else {
      const isQuestion = questionPatterns.some(p => p.test(trimmed));
      if (isQuestion) {
        onQuestionDetected(trimmed);
      }
    }
    sentenceBuffer.current = "";
  }, [onQuestionDetected, autoDetectAll]);

  const detectQuestion = useCallback((text: string) => {
    sentenceBuffer.current += " " + text;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const trimmed = sentenceBuffer.current.trim();
    if (/[.?!]$/.test(trimmed) || trimmed.length > 150) {
      flushBuffer();
      return;
    }

    silenceTimerRef.current = setTimeout(() => {
      flushBuffer();
    }, 2000);
  }, [flushBuffer]);

  // =============================================
  //  MIC MODE — Web Speech API
  // =============================================
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported. Use Chrome or Edge.");
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      if (isPausedRef.current) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) onTranscriptChunk(interimTranscript);
      if (finalTranscript) {
        onTranscriptChunk(finalTranscript);
        detectQuestion(finalTranscript);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch (e) { console.error("Restart failed:", e); }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
      if (event.error === "not-allowed") {
        isListeningRef.current = false;
        setIsCapturing(false);
      }
    };

    return recognition;
  }, [onTranscriptChunk, detectQuestion]);

  const startMicRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (!isListeningRef.current) {
      isListeningRef.current = true;
      recognitionRef.current.start();
    }
    setIsCapturing(true);
    setAudioSource("microphone");
    console.log("Mic recognition started");
  }, [initRecognition]);

  // =============================================
  //  SYSTEM MODE — AudioContext + useScribe (sendAudio provided externally)
  // =============================================

  /** Register the scribe sendAudio function from the parent component */
  const registerScribeSendAudio = useCallback((fn: (base64: string) => void) => {
    sendAudioRef.current = fn;
  }, []);

  const startSystemCapture = useCallback((stream: MediaStream) => {
    systemStreamRef.current = stream;

    // Create AudioContext at 16kHz for optimal scribe input
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0; // MUTE output — no echo

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isPausedRef.current) return;
      if (!sendAudioRef.current) return;

      const float32 = e.inputBuffer.getChannelData(0);
      
      // Convert float32 PCM to int16 PCM
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert int16 to base64
      const bytes = new Uint8Array(int16.buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      sendAudioRef.current(base64);
    };

    // Route: source → processor → gain(0) → destination (silent)
    source.connect(processor);
    processor.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Track ended (user stops sharing)
    stream.getAudioTracks().forEach(track => {
      track.onended = () => {
        console.log("Tab audio share stopped by user");
        stopCapture();
      };
    });

    setIsCapturing(true);
    setAudioSource("system");
    console.log("System audio capture started — sending PCM to Scribe SDK");
  }, []);

  // ---- Cleanup ----
  const stopCapture = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Stop mic recognition
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    // Stop system audio processing
    processorRef.current?.disconnect();
    processorRef.current = null;

    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(t => t.stop());
      systemStreamRef.current = null;
    }

    setIsCapturing(false);
    sentenceBuffer.current = "";
    console.log("All audio capture stopped");
  }, []);

  // ---- Public API ----
  const startCapture = useCallback(async (source: AudioSource) => {
    if (source === "microphone") {
      startMicRecognition();
    }
    // system mode is handled via startWithSystemStream
  }, [startMicRecognition]);

  const startWithSystemStream = useCallback(async (stream: MediaStream) => {
    startSystemCapture(stream);
  }, [startSystemCapture]);

  const startFromStream = useCallback(async (_stream: MediaStream) => {
    startMicRecognition();
  }, [startMicRecognition]);

  return {
    audioSource,
    isCapturing,
    startCapture,
    startWithSystemStream,
    startFromStream,
    stopCapture,
    setAudioSource,
    detectQuestion,
    registerScribeSendAudio,
  };
}
