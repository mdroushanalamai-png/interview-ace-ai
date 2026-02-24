// Web Worker to prevent browser from throttling the sender tab
// Workers are NOT throttled in background tabs, unlike setInterval/requestAnimationFrame

let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data;

  if (type === "start") {
    // Send a heartbeat every 5 seconds so the main thread knows we're alive
    intervalId = setInterval(() => {
      self.postMessage({ type: "heartbeat", timestamp: Date.now() });
    }, 5000);
    self.postMessage({ type: "started" });
  }

  if (type === "stop") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    self.postMessage({ type: "stopped" });
  }
};
