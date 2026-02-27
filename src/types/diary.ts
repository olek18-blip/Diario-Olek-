export interface VoiceEntry {
  id: string;
  date: Date;
  audioUrl?: string;
  transcript: string;
  summary?: string;
  events?: DiaryEvent[];
  duration: number;
  createdAt: Date;
}

export interface DiaryEvent {
  id: string;
  title: string;
  date: Date;
  description?: string;
  entryId: string;
  reminded: boolean;
}

export interface DaySummary {
  date: Date;
  entries: VoiceEntry[];
  summary: string;
  mood?: 'great' | 'good' | 'neutral' | 'low' | 'difficult';
}
