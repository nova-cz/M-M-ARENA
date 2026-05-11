import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { WorkoutEntry, Arena, UserProfile, ActivityType } from '../types';

const ARENA_COLORS = ['#D3FF33', '#18181b', '#FF6B6B', '#4ECDC4', '#45B7D1'];

interface AppContextValue {
  workouts: WorkoutEntry[];
  myArenas: Arena[];
  publicArenas: Arena[];
  partnerProfile: UserProfile | null;
  primaryArena: Arena | null;
  loadingData: boolean;
  logWorkout: (data: {
    activity: ActivityType;
    mainPoints: number;
    bonusPoints: number;
    totalPoints: number;
    metadata: Record<string, any>;
    hasWeightPack?: boolean;
    hasResistanceBand?: boolean;
    imageFile?: File | null;
    imageBase64?: string | null;
  }) => Promise<void>;
  toggleKudos: (workoutId: string) => Promise<void>;
  createArena: (name: string, goalPoints: number, deadline: string, type: 'private' | 'public') => Promise<Arena>;
  joinArenaByCode: (code: string) => Promise<Arena>;
  joinPublicArena: (arenaId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [myArenas, setMyArenas] = useState<Arena[]>([]);
  const [publicArenas, setPublicArenas] = useState<Arena[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Load all data in parallel on mount / profile change
  useEffect(() => {
    if (!userProfile) {
      setWorkouts([]);
      setMyArenas([]);
      setPartnerProfile(null);
      setLoadingData(false);
      return;
    }

    const fetchAll = async () => {
      setLoadingData(true);
      
      const [myArenasRes, publicArenasRes, partnerRes] = await Promise.all([
        supabase.from('arenas').select('*').contains('participantIds', [userProfile.id]),
        supabase.from('arenas').select('*').eq('type', 'public'),
        userProfile.partnerId ? supabase.from('users').select('*').eq('id', userProfile.partnerId).single() : Promise.resolve({ data: null })
      ]);
      
      const fetchedMyArenas = (myArenasRes.data || []) as Arena[];
      const fetchedPublicArenas = (publicArenasRes.data || []) as Arena[];
      
      const ids = new Set([userProfile.id]);
      if (userProfile.partnerId) ids.add(userProfile.partnerId);
      fetchedMyArenas.forEach(a => {
        a.participantIds?.forEach(id => ids.add(id));
      });
      
      const workoutsRes = await supabase.from('workouts').select('*').in('userId', Array.from(ids)).order('timestamp', { ascending: false });
      
      setWorkouts((workoutsRes.data || []) as WorkoutEntry[]);
      setMyArenas(fetchedMyArenas);
      setPublicArenas(fetchedPublicArenas);
      if (partnerRes.data) setPartnerProfile(partnerRes.data as UserProfile);
      
      setLoadingData(false);
    };

    fetchAll();

    const workoutsChannel = supabase.channel('public:workouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, () => {
        fetchAll();
      })
      .subscribe();

    const myArenasChannel = supabase.channel('public:arenas:my')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arenas' }, () => {
        fetchAll();
      })
      .subscribe();

    const publicArenasChannel = supabase.channel('public:arenas:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arenas', filter: 'type=eq.public' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(workoutsChannel);
      supabase.removeChannel(myArenasChannel);
      supabase.removeChannel(publicArenasChannel);
    };
  }, [userProfile?.id, userProfile?.partnerId]);

  const primaryArena = myArenas.find(a => a.type === 'private') || myArenas[0] || null;

  async function uploadImage(imageFile: File | null, imageBase64: string | null, workoutId: string): Promise<string | undefined> {
    if (!userProfile) return undefined;

    const path = `workouts/${userProfile.id}/${workoutId}`;

    if (imageFile) {
      const { error } = await supabase.storage.from('workouts').upload(path, imageFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('workouts').getPublicUrl(path);
      return data.publicUrl;
    }

    if (imageBase64) {
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('workouts').upload(path, blob);
      if (!error) {
        const { data } = supabase.storage.from('workouts').getPublicUrl(path);
        return data.publicUrl;
      }
    }

    return undefined;
  }

  const logWorkout = useCallback(async (data: {
    activity: ActivityType;
    mainPoints: number;
    bonusPoints: number;
    totalPoints: number;
    metadata: Record<string, any>;
    hasWeightPack?: boolean;
    hasResistanceBand?: boolean;
    imageFile?: File | null;
    imageBase64?: string | null;
  }) => {
    if (!userProfile) return;

    const newWorkout = {
      userId: userProfile.id,
      userName: userProfile.name,
      arenaId: primaryArena?.id || null,
      activity: data.activity,
      mainPoints: data.mainPoints,
      bonusPoints: data.bonusPoints,
      totalPoints: data.totalPoints,
      metadata: data.metadata,
      hasWeightPack: data.hasWeightPack || false,
      hasResistanceBand: data.hasResistanceBand || false,
      kudos: [],
      proofUrl: null as string | null,
    };

    const { data: insertedWorkout, error: insertError } = await supabase
      .from('workouts')
      .insert([newWorkout])
      .select()
      .single();

    if (insertError) throw insertError;
    if (!insertedWorkout) throw new Error("Failed to insert workout");

    // Upload image if present
    const proofUrl = await uploadImage(
      data.imageFile || null,
      data.imageBase64 || null,
      insertedWorkout.id
    );

    if (proofUrl) {
      await supabase.from('workouts').update({ proofUrl }).eq('id', insertedWorkout.id);
    }

    // Update user total and weekly points
    const { data: currentUser } = await supabase.from('users').select('*').eq('id', userProfile.id).single();
    let finalPointsAdded = data.totalPoints;

    if (currentUser) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = currentUser.lastWorkoutDate?.split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = currentUser.streakCount || 0;

      if (lastDate === yesterday) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      // Apply 20 pts bonus if they complete a multiple of 6 days
      if (lastDate !== today && newStreak > 0 && newStreak % 6 === 0) {
        finalPointsAdded += 20;
      }

      const { error: userUpdateError } = await supabase.from('users').update({
        totalPoints: (currentUser.totalPoints || 0) + finalPointsAdded,
        weeklyPoints: (currentUser.weeklyPoints || 0) + finalPointsAdded,
        lastWorkoutDate: new Date().toISOString(),
        streakCount: newStreak
      }).eq('id', userProfile.id);
      if (userUpdateError) throw userUpdateError;
    }

    // Update arena participant points for ALL arenas the user is in
    const arenaPromises = myArenas.map(async (arena) => {
      // Fetch latest arena state to prevent race conditions overwriting other users' points
      const { data: latestArena } = await supabase.from('arenas').select('participants').eq('id', arena.id).single();
      if (latestArena && latestArena.participants) {
        const updatedParticipants = latestArena.participants.map((p: any) =>
          p.userId === userProfile.id
            ? { ...p, currentPoints: (p.currentPoints || 0) + finalPointsAdded }
            : p
        );
        return supabase.from('arenas').update({ participants: updatedParticipants }).eq('id', arena.id);
      }
    });

    await Promise.all(arenaPromises);

  }, [userProfile, primaryArena, myArenas]);

  const toggleKudos = useCallback(async (workoutId: string) => {
    if (!userProfile) return;
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const hasKudos = workout.kudos.includes(userProfile.id);
    const newKudos = hasKudos 
      ? workout.kudos.filter(id => id !== userProfile.id)
      : [...workout.kudos, userProfile.id];

    await supabase.from('workouts').update({ kudos: newKudos }).eq('id', workoutId);
  }, [userProfile, workouts]);

  const createArena = useCallback(async (
    name: string,
    goalPoints: number,
    deadline: string,
    type: 'private' | 'public'
  ): Promise<Arena> => {
    if (!userProfile) throw new Error('Not authenticated');

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const color = ARENA_COLORS[0];

    const arenaData = {
      name: name.toUpperCase(),
      goalPoints,
      deadline,
      type,
      createdBy: userProfile.id,
      inviteCode,
      participantIds: [userProfile.id],
      participants: [{
        userId: userProfile.id,
        userName: userProfile.name,
        currentPoints: userProfile.totalPoints || 0,
        color,
      }]
    };

    const { data, error } = await supabase.from('arenas').insert([arenaData]).select().single();
    if (error) throw error;
    
    return data as Arena;
  }, [userProfile]);

  const joinArenaByCode = useCallback(async (code: string): Promise<Arena> => {
    if (!userProfile) throw new Error('Not authenticated');

    const { data: snaps } = await supabase.from('arenas').select('*').eq('inviteCode', code.toUpperCase());

    if (!snaps || snaps.length === 0) throw new Error('Arena not found. Check the invite code.');

    const arena = snaps[0];

    if (arena.participantIds?.includes(userProfile.id)) {
      throw new Error('You are already in this arena.');
    }

    const color = ARENA_COLORS[arena.participants.length % ARENA_COLORS.length];
    const newParticipant = {
      userId: userProfile.id,
      userName: userProfile.name,
      currentPoints: userProfile.totalPoints || 0,
      color,
    };

    const newParticipantIds = [...(arena.participantIds || []), userProfile.id];
    const newParticipants = [...(arena.participants || []), newParticipant];

    await supabase.from('arenas').update({
      participantIds: newParticipantIds,
      participants: newParticipants
    }).eq('id', arena.id);

    return { ...arena, participants: newParticipants } as Arena;
  }, [userProfile]);

  const joinPublicArena = useCallback(async (arenaId: string) => {
    if (!userProfile) return;

    const { data: arena } = await supabase.from('arenas').select('*').eq('id', arenaId).single();
    if (!arena) return;

    if (arena.participantIds?.includes(userProfile.id)) return;

    const color = ARENA_COLORS[arena.participants.length % ARENA_COLORS.length];
    const newParticipant = {
      userId: userProfile.id,
      userName: userProfile.name,
      currentPoints: userProfile.totalPoints || 0,
      color,
    };

    const newParticipantIds = [...(arena.participantIds || []), userProfile.id];
    const newParticipants = [...(arena.participants || []), newParticipant];

    await supabase.from('arenas').update({
      participantIds: newParticipantIds,
      participants: newParticipants
    }).eq('id', arenaId);
  }, [userProfile]);

  return (
    <AppContext.Provider value={{
      workouts,
      myArenas,
      publicArenas,
      partnerProfile,
      primaryArena,
      loadingData,
      logWorkout,
      toggleKudos,
      createArena,
      joinArenaByCode,
      joinPublicArena,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
