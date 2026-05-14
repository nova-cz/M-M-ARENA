export type ActivityType = 'Running' | 'Swimming' | 'Walk' | 'Calisthenics' | 'Squats' | 'Gym';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  partnerId?: string;
  partnerName?: string;
  partnerCode: string; // unique 6-char code to link partners
  streakCount: number;
  lastWorkoutDate?: string;
  totalPoints: number;
  weeklyPoints: number;
  joinedAt: string;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  userName: string;
  arenaId?: string;
  activity: ActivityType;
  mainPoints: number;
  bonusPoints: number;
  totalPoints: number;
  timestamp: string;
  metadata: Record<string, any>;
  proofUrl?: string;
  hasWeightPack?: boolean;
  hasResistanceBand?: boolean;
  kudos: string[]; // array of userIds who gave kudos
}

export interface ArenaParticipant {
  userId: string;
  userName: string;
  currentPoints: number;
  color: string;
}

export interface Arena {
  id: string;
  name: string;
  goalPoints: number;
  deadline: string;
  type: 'private' | 'public';
  createdBy: string;
  inviteCode: string;
  participants: ArenaParticipant[];
  participantIds: string[];
  createdAt: string;
}

// Legacy alias for backwards compatibility
export interface Challenge extends Arena {}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}
