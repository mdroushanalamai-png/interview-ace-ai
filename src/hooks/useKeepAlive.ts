import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook that keeps the browser tab alive when minimized by:
 * 1. Running a Web Worker (not throttled in background tabs)
 * 2. Playing a near-silent audio tone to keep AudioContext active
 */
export function useKeepAlive(active: boolean) {
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const isAlive = lastHeartbeat
    ? Date.now() - lastHeartbeat < 10000
    : false;

  const startKeepAlive = useCallback(() => {
    // Start Web Worker heartbeat
    const worker = new Worker(
      new URL("../workers/keep-alive.worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e) => {
      if (e.data.type === "heartbeat") {
        setLastHeartbeat(e.data.timestamp);
      }
    };
    worker.postMessage({ type: "start" });
    workerRef.current = worker;

    // Start silent audio oscillator to prevent AudioContext suspension
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // Near-silent
      osc.frequency.value = 1; // 1 Hz — inaudible
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
      oscillatorRef.current = osc;
    } catch {
      // AudioContext may fail in some environments
    }
  }, []);

  const stopKeepAlive = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" });
    workerRef.current?.terminate();
    workerRef.current = null;

    oscillatorRef.current?.stop();
    oscillatorRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    setLastHeartbeat(null);
  }, []);

  useEffect(() => {
    if (active) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }
    return stopKeepAlive;
  }, [active, startKeepAlive, stopKeepAlive]);

  return { isAlive, lastHeartbeat };
}
