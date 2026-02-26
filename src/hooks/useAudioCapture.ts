import { useState, useRef, useCallback, useEffect } from "react";
import { AudioSource } from "@/lib/types";

const SCRIBE_TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`;

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

  // --- System mode refs (MediaRecorder + WebSocket) ---
  const systemStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scribeTokenRef = useRef<string | null>(null);

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
  //  MIC MODE — Web Speech API (unchanged logic)
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
  //  SYSTEM MODE — MediaRecorder + ElevenLabs Scribe WebSocket
  //  Captures ONLY the other tab's audio, no echo.
  // =============================================

  const fetchScribeToken = useCallback(async (): Promise<string> => {
    const res = await fetch(SCRIBE_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to get transcription token");
    }
    const { token } = await res.json();
    return token;
  }, []);

  const startSystemCapture = useCallback(async (stream: MediaStream) => {
    // 1. Get a scribe token
    console.log("Fetching ElevenLabs Scribe token...");
    const token = await fetchScribeToken();
    scribeTokenRef.current = token;

    systemStreamRef.current = stream;

    // 2. Connect WebSocket to ElevenLabs Scribe
    const ws = new WebSocket(`wss://api.elevenlabs.io/v1/scribe?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Scribe WebSocket connected");

      // Send config message
      ws.send(JSON.stringify({
        type: "config",
        data: {
          language: "en",
          model: "scribe_v1",
          encoding: "pcm_s16le",
          sample_rate: 16000,
        }
      }));

      // 3. Use AudioContext to capture tab audio at 16kHz PCM and send to WS
      // Output is muted (gain=0) to prevent echo — audio only goes to Scribe
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // MUTE output — no echo
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        if (ws.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(int16.buffer);
      };

      // Route: source → processor → gain(0) → destination (silent)
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Store for cleanup
      (stream as any).__audioCtx = audioCtx;
      (stream as any).__processor = processor;
    };

    ws.onmessage = (event) => {
      if (isPausedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        // ElevenLabs Scribe sends transcript events
        if (data.type === "transcript" && data.data?.text) {
          const text = data.data.text.trim();
          if (text) {
            onTranscriptChunk(text);
            if (data.data.is_final) {
              detectQuestion(text);
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onerror = (e) => {
      console.error("Scribe WebSocket error:", e);
    };

    ws.onclose = (e) => {
      console.log("Scribe WebSocket closed:", e.code, e.reason);
    };

    // Track ended (user stops sharing)
    stream.getAudioTracks().forEach(track => {
      track.onended = () => {
        console.log("Tab audio share stopped by user");
        stopCapture();
      };
    });

    setIsCapturing(true);
    setAudioSource("system");
    console.log("System audio capture started via Scribe WebSocket");
  }, [fetchScribeToken, onTranscriptChunk, detectQuestion]);

  // ---- Cleanup ----
  const stopCapture = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Stop mic recognition
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    // Stop system audio
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (systemStreamRef.current) {
      const ctx = (systemStreamRef.current as any).__audioCtx as AudioContext | undefined;
      const proc = (systemStreamRef.current as any).__processor as ScriptProcessorNode | undefined;
      proc?.disconnect();
      ctx?.close();
      systemStreamRef.current.getTracks().forEach(t => t.stop());
      systemStreamRef.current = null;
    }

    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

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
    await startSystemCapture(stream);
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
  };
}
