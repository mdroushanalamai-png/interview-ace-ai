import { useState, useRef, useCallback } from "react";
import { SessionState, UserProfile, QAEntry } from "@/lib/types";
import { streamAnswer } from "@/lib/ai-stream";

const initialState: SessionState = {
  isActive: false,
  isPaused: false,
  startTime: null,
  currentQuestion: "",
  currentAnswer: "",
  isGenerating: false,
  history: [],
  liveTranscript: "",
  fontSize: 32,
};

export function useSession(profile: UserProfile) {
  const [state, setState] = useState<SessionState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const transcriptBuffer = useRef("");

  const startSession = useCallback(() => {
    setState({ ...initialState, isActive: true, startTime: new Date() });
  }, []);

  const endSession = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isActive: false, isPaused: false }));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, fontSize: size }));
  }, []);

  const updateLiveTranscript = useCallback((text: string) => {
    setState(prev => ({ ...prev, liveTranscript: text }));
  }, []);

  const appendTranscript = useCallback((text: string) => {
    transcriptBuffer.current += " " + text;
    setState(prev => ({ ...prev, liveTranscript: transcriptBuffer.current.trim() }));
  }, []);

  const processQuestion = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({
      ...prev,
      currentQuestion: question,
      currentAnswer: "",
      isGenerating: true,
    }));

    let fullAnswer = "";

    try {
      await streamAnswer({
        question,
        profile,
        signal: controller.signal,
        onDelta: (chunk) => {
          fullAnswer += chunk;
          setState(prev => ({ ...prev, currentAnswer: fullAnswer }));
        },
        onDone: () => {
          const entry: QAEntry = {
            id: crypto.randomUUID(),
            question,
            answer: fullAnswer,
            timestamp: new Date(),
          };
          setState(prev => ({
            ...prev,
            isGenerating: false,
            history: [entry, ...prev.history],
          }));
        },
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Answer generation failed:", e);
        setState(prev => ({
          ...prev,
          isGenerating: false,
          currentAnswer: `Error: ${e.message}`,
        }));
      }
    }
  }, [profile]);

  const showHistoryAnswer = useCallback((entry: QAEntry) => {
    setState(prev => ({
      ...prev,
      currentQuestion: entry.question,
      currentAnswer: entry.answer,
      isGenerating: false,
    }));
  }, []);

  const clearTranscriptBuffer = useCallback(() => {
    transcriptBuffer.current = "";
  }, []);

  return {
    state,
    startSession,
    endSession,
    togglePause,
    setFontSize,
    updateLiveTranscript,
    appendTranscript,
    processQuestion,
    showHistoryAnswer,
    clearTranscriptBuffer,
  };
}
