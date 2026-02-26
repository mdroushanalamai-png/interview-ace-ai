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
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const sentenceBuffer = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(isPaused);

  // Keep ref in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    const trimmed = sentenceBuffer.current.trim();

    if (/[.?!]$/.test(trimmed) || trimmed.length > 150) {
      flushBuffer();
      return;
    }

    silenceTimerRef.current = setTimeout(() => {
      flushBuffer();
    }, 2000);
  }, [flushBuffer]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported in this browser. Please use Chrome or Edge.");
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

      // Send interim updates for live display
      if (interimTranscript) {
        onTranscriptChunk(interimTranscript);
      }

      // Process final transcript for question detection
      if (finalTranscript) {
        onTranscriptChunk(finalTranscript);
        detectQuestion(finalTranscript);
      }
    };

    // Auto-restart on end (silence timeout)
    recognition.onend = () => {
      console.log("Speech recognition ended, restarting...");
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        isListeningRef.current = false;
        setIsCapturing(false);
      }
      // For "no-speech" or "aborted", onend will handle restart
    };

    return recognition;
  }, [onTranscriptChunk, detectQuestion]);

  const startCapture = useCallback(async (source: AudioSource) => {
    // For system audio, we still need getDisplayMedia but use Web Speech API for transcription
    if (source === "system") {
      // Request mic permission for Web Speech API (it uses its own mic access)
      await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (!isListeningRef.current) {
      isListeningRef.current = true;
      recognitionRef.current.start();
    }

    setIsCapturing(true);
    setAudioSource(source);
    console.log("Speech recognition started");
  }, [initRecognition]);

  const startFromStream = useCallback(async (_stream: MediaStream) => {
    // For remote streams, we use Web Speech API listening to the mic
    // The remote audio plays through speakers, mic picks it up
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (!isListeningRef.current) {
      isListeningRef.current = true;
      recognitionRef.current.start();
    }

    setIsCapturing(true);
    setAudioSource("remote");
    console.log("Speech recognition started (remote mode)");
  }, [initRecognition]);

  const stopCapture = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsCapturing(false);
    sentenceBuffer.current = "";
    console.log("Speech recognition stopped");
  }, []);

  return {
    audioSource,
    isCapturing,
    startCapture,
    startFromStream,
    stopCapture,
    setAudioSource,
  };
}
