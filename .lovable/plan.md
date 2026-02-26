

## Problem

The "failed to fetch" / audio capture failure has two root causes:

1. **Wrong WebSocket protocol**: The code manually connects to `wss://api.elevenlabs.io/v1/scribe?token=...` with a custom message format (`type: "config"`, `model: "scribe_v1"`). This URL/protocol is incorrect — ElevenLabs uses a different WebSocket endpoint and message format for realtime scribe.

2. **Reinventing the wheel**: The `@elevenlabs/react` package already installed has a `useScribe` hook that handles WebSocket connection, audio format, and transcription properly. We should use it instead of raw WebSocket code.

## Plan

### 1. Refactor `useAudioCapture.ts` — Replace raw WebSocket with `useScribe`

- Import `useScribe` from `@elevenlabs/react`
- For **system/tab audio mode**: Use `useScribe` with `sendAudio()` to feed captured tab audio as base64 PCM chunks
- For **microphone mode**: Keep existing `SpeechRecognition` approach (it works)
- Use `AudioContext` + `ScriptProcessor` to capture tab audio, convert to base64, and call `scribe.sendAudio()`
- Set gain to 0 to prevent echo (keep existing approach)
- Wire `onCommittedTranscript` and `onPartialTranscript` callbacks to existing `onTranscriptChunk` and `detectQuestion`

### 2. Update `SessionScreen.tsx` — Pass token fetching

- Fetch scribe token before calling `scribe.connect({ token })` 
- The `useScribe` hook's `connect()` accepts a token option

### 3. Keep edge function as-is

- The `elevenlabs-scribe-token` edge function works correctly (confirmed via test call)

### Technical approach

```text
Tab Audio Flow:
  1. SetupPage: getDisplayMedia() → MediaStream (on button click)
  2. SessionScreen: fetch scribe token from edge function
  3. useScribe.connect({ token }) 
  4. AudioContext captures PCM from stream
  5. Convert float32 → int16 → base64
  6. scribe.sendAudio(base64) continuously
  7. onCommittedTranscript → detectQuestion → generate answer
```

This eliminates the manual WebSocket code that was using wrong URLs/protocols and leverages the official SDK that's already installed.

