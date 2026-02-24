

# 🎙️ Live Interview Answer Assistant

A real-time interview helper app that listens to interview questions, transcribes them live, and generates AI-powered professional answers displayed in a teleprompter-style view — personalized to your profile.

## 🏠 Landing / Setup Page
- Clean, modern landing page with app branding
- **Profile Setup Section**: Form to paste your resume, enter your name, experience level, key skills, and any talking points you want the AI to weave into answers
- **Audio Source Selector**: Toggle between microphone input or system/tab audio capture, with clear instructions for each
- **"Start Session" button** to begin the live interview assistance

## 🎧 Live Interview Session Screen
The main screen during an active interview with a clean, minimal layout:

### Audio Capture & Transcription
- Real-time audio capture from your chosen source (mic or system audio via browser screen/tab share)
- Live speech-to-text transcription using ElevenLabs Realtime Transcription (ultra-low latency)
- Automatic detection of questions vs. general conversation using AI

### 📺 Teleprompter Display (Main View)
- Large, easy-to-read scrolling text showing the AI-generated answer
- Auto-scrolls as new content streams in
- Clean, high-contrast text on a dark background for easy reading
- Current question shown at the top in a smaller, highlighted bar
- Font size controls so you can adjust readability

### Side Panel (Collapsible)
- Scrollable history of all detected questions and their generated answers
- Ability to tap any past question to bring its answer back to the teleprompter
- Live transcription feed showing what's being heard in real-time

## 🤖 AI Answer Engine
- Powered by Lovable AI (Gemini) via a Supabase Edge Function
- Streaming responses — answers appear word-by-word in the teleprompter as they're generated
- AI is instructed to answer as YOU based on your profile/resume
- Answers are concise, professional, and interview-ready
- Handles technical, behavioral, and general questions

## ⚙️ Settings & Controls
- Pause/Resume listening button
- Audio source switching mid-session
- Font size and display theme adjustments
- Option to edit your profile mid-session
- Session timer showing how long the interview has been running

## 🛠️ Technical Approach
- **Frontend**: React web app (runs in your browser)
- **Audio Capture**: Web Audio API + Screen Capture API for system audio, MediaDevices API for microphone
- **Transcription**: ElevenLabs Realtime Speech-to-Text via WebSocket
- **AI Answers**: Lovable AI Gateway through Supabase Edge Function with streaming
- **Backend**: Supabase (Edge Functions for AI + transcription token generation)

