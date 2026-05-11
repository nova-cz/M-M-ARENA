/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivityType } from './types';

export const ACTIVITIES: ActivityType[] = ['Running', 'Swimming', 'Walk', 'Calisthenics', 'Squats'];

export const POINTS_CONFIG = {
  Running: (distance: number) => Math.round(distance * 2), // 2 pts per km
  Swimming: (minutes: string) => minutes === '30 min' ? 15 : 7,
  Walk: (minutes: number) => Math.round(minutes * 0.5),
  Calisthenics: (minutes: string) => minutes === '30 min' ? 12 : 6,
  Squats: (reps: string) => reps === '50 Squats' ? 10 : 2,
};

export const BONUS_POINTS = 2;

// Legacy static data kept for reference only; real data comes from Firestore
export const CURRENT_CHALLENGE_LEGACY = {
  id: 'c1',
  name: 'ARCTIC SUMMIT 2026',
  goalPoints: 500,
  deadline: '2026-05-30T23:59:59Z',
  participants: [
    { userId: '1', userName: 'MIGUEL', currentPoints: 142, color: '#D3FF33' },
    { userId: '2', userName: 'MATILDA', currentPoints: 138, color: '#FFFFFF' },
  ],
};

export const MOCK_USERS = [
  { id: '1', name: 'MIGUEL', partnerName: 'MATILDA', weeklyPoints: 42, streakCount: 4 },
  { id: '2', name: 'MATILDA', partnerName: 'MIGUEL', weeklyPoints: 38, streakCount: 6 },
];

export const MOCK_HISTORY = [
  {
    id: 'h1',
    userId: '1',
    userName: 'MIGUEL',
    activity: 'Running' as const,
    mainPoints: 10,
    bonusPoints: 2,
    totalPoints: 12,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    hasWeightPack: true,
    proofUrl: 'https://picsum.photos/seed/run1/600/600',
    metadata: { distance: 5 }
  },
  {
    id: 'h2',
    userId: '2',
    userName: 'MATILDA',
    activity: 'Swimming' as const,
    mainPoints: 15,
    bonusPoints: 0,
    totalPoints: 15,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    proofUrl: 'https://picsum.photos/seed/swim1/600/600',
    metadata: { duration: '30 min' }
  },
  {
    id: 'h3',
    userId: '2',
    userName: 'MATILDA',
    activity: 'Running' as const,
    mainPoints: 20,
    bonusPoints: 2,
    totalPoints: 22,
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    proofUrl: 'https://picsum.photos/seed/run2/600/600',
    metadata: { distance: 10 }
  },
  {
    id: 'h4',
    userId: '2',
    userName: 'MATILDA',
    activity: 'Squats' as const,
    mainPoints: 10,
    bonusPoints: 0,
    totalPoints: 10,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    proofUrl: 'https://picsum.photos/seed/squat1/600/600',
    metadata: { reps: '50 Squats' }
  }
];
