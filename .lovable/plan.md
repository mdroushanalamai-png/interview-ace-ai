

# Multi-Device Mode: Stream Audio from Laptop to Phone

## Overview

Add a **multi-device mode** where you open the app on both your laptop and phone. The laptop captures system audio (from Zoom/Meet) and streams it over the local network to your phone, which then transcribes and shows AI-generated answers -- all within the browser, no extra software needed.

## How It Works

```text
+------------------+         WebRTC (peer-to-peer)        +------------------+
|    LAPTOP        |  ──────────────────────────────────>  |     PHONE        |
|  (Browser Tab)   |       audio stream over WiFi         |  (Browser Tab)   |
|                  |                                       |                  |
|  - Captures      |   Signaling via Lovable Cloud DB     |  - Receives      |
|    system audio  |  <─────────────────────────────────>  |    audio stream  |
|  - Shows status  |                                       |  - Transcribes   |
|                  |                                       |  - Shows AI      |
|                  |                                       |    answers on    |
|                  |                                       |    teleprompter  |
+------------------+                                       +------------------+
```

**No virtual audio cables, no Python servers, no extra apps.** Just two browser tabs on the same WiFi.

## User Flow

1. On **Setup Page**, choose a new mode: "Multi-Device (Stream to Phone)"
2. Laptop browser shows a **6-digit Room Code** and starts capturing system audio via Screen Share
3. Open the app on your **phone browser**, enter the Room Code and your profile
4. WebRTC peer connection is established -- audio flows laptop to phone
5. Phone receives audio, sends it to ElevenLabs for transcription, and shows AI answers in the teleprompter

## Technical Approach

### 1. Signaling via Database
- Create a `rooms` table to exchange WebRTC signaling data (SDP offers/answers, ICE candidates)
- Enable Realtime on this table so both devices get instant updates
- Rooms auto-expire after 2 hours
- No authentication required -- rooms are identified by a random 6-digit code

### 2. Laptop Side (Sender)
- New component: `SenderPage` -- captures system audio via `getDisplayMedia`, creates a WebRTC `RTCPeerConnection`, adds the audio track, and sends SDP offer to the room
- Shows connection status and a simple "Connected / Streaming" indicator
- No transcription or AI processing happens here

### 3. Phone Side (Receiver)
- New component: `ReceiverPage` -- joins the room, completes WebRTC handshake, receives the remote audio stream
- Feeds received audio into the existing `useAudioCapture` hook (modified to accept a remote MediaStream)
- Shows the full teleprompter UI with AI answers

### 4. Changes to Existing Code
- **`useAudioCapture.ts`**: Add a new `startFromStream(stream: MediaStream)` method that skips the mic/screen capture step and directly connects an existing stream to the ElevenLabs WebSocket
- **`AudioSource` type**: Add `'remote'` option
- **`SetupPage`**: Add a "Multi-Device" option card
- **`Index.tsx`**: Add routing for sender/receiver modes

### 5. New Files
- `src/components/SenderPage.tsx` -- Laptop UI (capture + stream)
- `src/components/ReceiverPage.tsx` -- Phone UI (receive + process)
- `src/hooks/useWebRTC.ts` -- WebRTC connection logic with signaling via the database

### 6. Database
- New `rooms` table:
  - `code` (text, primary key) -- 6-digit room code
  - `offer` (jsonb) -- WebRTC SDP offer
  - `answer` (jsonb) -- WebRTC SDP answer
  - `ice_candidates` (jsonb array) -- ICE candidates from both peers
  - `created_at` (timestamp) -- for auto-expiry
- Realtime enabled on this table
- No RLS (public access by room code -- ephemeral data only)

### 7. Latency
- WebRTC peer-to-peer on local WiFi: ~50-100ms audio latency
- Plus ElevenLabs transcription: ~200-500ms
- Plus AI answer generation: streaming, first tokens in ~1-2s
- **Total: you see answers within 2-3 seconds of the question being asked**
