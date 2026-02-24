

# Background Audio Streaming -- What's Possible

## The Hard Truth

A **pure web app** (which is what Lovable builds) **cannot run without any browser tab open**. This is a browser security restriction -- when you close a tab, all JavaScript, WebSocket connections, and audio processing stop immediately. There is no workaround for this within a web browser.

True background audio capture (no window at all) requires **native desktop software** (Electron app, Python script, system tray app), which is outside the scope of what Lovable can build.

## What We CAN Do (Practical Solution)

The good news: **you don't need to hide the tab**. Here's why:

When screen sharing in Zoom / Google Meet / Teams, you have the option to **share a specific window or tab** (not your entire screen). If you share only your presentation window (e.g., PowerPoint, Google Slides), then:

- Other browser windows are **not visible** to anyone
- A minimized Chrome window is **not visible**
- The sender tab can sit in its own small browser window, minimized or behind other windows

## Proposed Changes

### 1. Make Sender Page Ultra-Minimal
- Reduce the sender page to the absolute minimum -- just a tiny status indicator
- Allow the browser window to be resized very small (no minimum width/height constraints)
- Dark/black background so it blends if accidentally visible

### 2. Add "Setup Then Minimize" Flow
- Clear instructions on the sender page: "Set up connection, then minimize this window"
- Auto-play a silent audio ping to keep the tab alive (browsers can throttle background tabs)
- Visual confirmation that streaming continues when minimized

### 3. Keep-Alive Mechanism
- Use a Web Worker to maintain the WebRTC connection when the tab is in the background
- Browsers throttle `setInterval` and `requestAnimationFrame` in background tabs, but Web Workers are not throttled
- Move the audio processing into a Web Worker to ensure it keeps running when minimized

### 4. Add User Instructions
- Add a brief guide on the sender page explaining: "Share only your presentation window in Zoom/Meet, not your entire screen"
- This ensures the sender tab is never visible to others

## Technical Details

### Web Worker for Background Audio (New File)
- Create `src/workers/audio-relay.worker.ts`
- Handles the WebRTC peer connection keep-alive
- Prevents browser from throttling audio when tab is not focused

### Updated Sender Page
- Minimal UI with just connection status
- Black background, small footprint
- Instructions to minimize after setup
- "Keep alive" indicator showing audio is still flowing

### Audio Keep-Alive
- Play a near-silent audio tone periodically to prevent Chrome from suspending the tab's audio context
- This is a known technique to keep `AudioContext` active in background tabs

## What This Achieves

```text
Before Meeting:
  1. Open sender tab in a separate small Chrome window
  2. Connect to phone (enter room code)
  3. Minimize the sender window

During Meeting:
  - Share only your presentation window in Zoom
  - Sender window runs minimized, invisible to screen share
  - Audio streams continuously to phone
  - Phone shows AI answers
```

## Limitations (Being Honest)
- The browser tab must remain **open** (minimized is fine, closed is not)
- If you share your **entire screen**, the minimized window could briefly flash if restored
- Solution: always share a **specific window**, never "Entire Screen"

