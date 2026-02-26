import { useState, useRef, useCallback } from "react";
import { AudioSource } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export function useAudioCapture(
  onTranscriptChunk: (text: string) => void,
  onQuestionDetected: (question: string) => void,
  isPaused: boolean,
  autoDetectAll: boolean = false
) {
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone");
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sentenceBuffer = useRef("");

  const detectQuestion = useCallback((text: string) => {
    sentenceBuffer.current += " " + text;
    const trimmed = sentenceBuffer.current.trim();
    
    // Simple heuristic: if the accumulated text ends with ? or contains question patterns
    const questionPatterns = [
      /\?$/,
      /^(what|how|why|when|where|who|which|can you|could you|tell me|describe|explain|walk me through)/i,
      /^(have you|do you|did you|are you|were you|will you|would you)/i,
    ];

    // Check if we have a complete sentence
    if (/[.?!]$/.test(trimmed) || trimmed.length > 150) {
      if (autoDetectAll) {
        // Solo mode: treat every utterance as a question
        onQuestionDetected(trimmed);
      } else {
        const isQuestion = questionPatterns.some(p => p.test(trimmed));
        if (isQuestion) {
          onQuestionDetected(trimmed);
        }
      }
      sentenceBuffer.current = "";
    }
  }, [onQuestionDetected, autoDetectAll]);

  const startCapture = useCallback(async (source: AudioSource) => {
    try {
      let stream: MediaStream;
      
      if (source === "system") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true, // required by browser, we'll ignore video
        });
        // Stop video tracks - we only need audio
        stream.getVideoTracks().forEach(t => t.stop());
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("No audio track found. Make sure to share a tab with audio enabled.");
        }
        stream = new MediaStream(audioTracks);
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      }

      streamRef.current = stream;

      // Get ElevenLabs scribe token
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) {
        throw new Error("Failed to get transcription token");
      }

      // Connect to ElevenLabs Realtime Scribe WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${data.token}&language_code=en`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Scribe WebSocket connected");
        // Set up audio processing
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        contextRef.current = audioCtx;
        const src = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isPaused || ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16
          const int16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          // Base64 encode
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          ws.send(JSON.stringify({ audio: base64 }));
        };

        src.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "transcript" && msg.data?.text) {
            const text = msg.data.text;
            onTranscriptChunk(text);
            if (msg.data.is_final) {
              detectQuestion(text);
            }
          }
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      ws.onerror = (e) => console.error("Scribe WS error:", e);
      ws.onclose = () => console.log("Scribe WS closed");

      setIsCapturing(true);
      setAudioSource(source);
    } catch (e) {
      console.error("Audio capture failed:", e);
      throw e;
    }
  }, [isPaused, onTranscriptChunk, detectQuestion]);

  const startFromStream = useCallback(async (stream: MediaStream) => {
    try {
      streamRef.current = stream;

      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) {
        throw new Error("Failed to get transcription token");
      }

      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${data.token}&language_code=en`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Scribe WebSocket connected (remote stream)");
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        contextRef.current = audioCtx;
        const src = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isPaused || ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          ws.send(JSON.stringify({ audio: btoa(binary) }));
        };

        src.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "transcript" && msg.data?.text) {
            onTranscriptChunk(msg.data.text);
            if (msg.data.is_final) {
              detectQuestion(msg.data.text);
            }
          }
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      ws.onerror = (e) => console.error("Scribe WS error:", e);
      ws.onclose = () => console.log("Scribe WS closed");

      setIsCapturing(true);
      setAudioSource("remote");
    } catch (e) {
      console.error("Remote stream capture failed:", e);
      throw e;
    }
  }, [isPaused, onTranscriptChunk, detectQuestion]);

  const stopCapture = useCallback(() => {
    wsRef.current?.close();
    processorRef.current?.disconnect();
    contextRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current = null;
    processorRef.current = null;
    contextRef.current = null;
    streamRef.current = null;
    setIsCapturing(false);
    sentenceBuffer.current = "";
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
