export type MoodLevel =
  | 'energized'
  | 'calm'
  | 'okay'
  | 'very_happy'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'grateful'
  | 'stressed'
  | 'burned_out';

export type LifeSyncVisibility = 'private' | 'anonymous_hr' | 'hr_visible';
export type WorkloadLevel = 'light' | 'manageable' | 'heavy' | 'overloaded';

export interface MoodCheckin {
  id: string;
  mood: MoodLevel;
  note?: string;
  userId: string;
  confidence?: number;
  supported?: number;
  connection?: number;
  workload?: WorkloadLevel;
  visibility?: LifeSyncVisibility;
  followUpRequested?: boolean;
  urgentSupport?: boolean;
  createdAt: number;
}