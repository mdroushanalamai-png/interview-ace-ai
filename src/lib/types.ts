export interface UserProfile {
  name: string;
  resume: string;
  experienceLevel: string;
  skills: string;
  talkingPoints: string;
}

export type AudioSource = 'microphone' | 'system';

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

export interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  startTime: Date | null;
  currentQuestion: string;
  currentAnswer: string;
  isGenerating: boolean;
  history: QAEntry[];
  liveTranscript: string;
  fontSize: number;
}
