export type MoodLevel =
  | 'very_happy'
  | 'happy'
  | 'neutral'
  | 'stressed'
  | 'burned_out';

export interface MoodCheckin {
  id: string;
  mood: MoodLevel;
  note?: string;
  userId: string;
  createdAt: number;
}