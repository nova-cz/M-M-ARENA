import React from 'react';
import { motion } from 'motion/react';
import { Plus, Timer, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { primaryArena, partnerProfile } = useApp();

  const arenaRival = primaryArena?.participants.find(p => p.userId !== userProfile?.id);
  const myPoints = primaryArena?.participants.find(p => p.userId === userProfile?.id)?.currentPoints ?? userProfile?.totalPoints ?? 0;
  
  const displayRivalName = partnerProfile?.name || arenaRival?.userName;
  const partnerPoints = partnerProfile
    ? (primaryArena?.participants.find(p => p.userId === partnerProfile.id)?.currentPoints ?? partnerProfile.totalPoints ?? 0)
    : (arenaRival?.currentPoints ?? 0);

  const streak = userProfile?.streakCount ?? 0;

  const arena = primaryArena;
  const daysRemaining = arena
    ? Math.max(0, Math.ceil((new Date(arena.deadline).getTime() - Date.now()) / 86400000))
    : null;

  const goalPoints = arena?.goalPoints ?? 500;

  const motivations = [
    'PUSH NEW LIMITS.\nNO EXCUSES ONLY RESULTS.',
    'EVERY SESSION COUNTS.\nYOUR RIVAL IS WATCHING.',
    'PAIN IS TEMPORARY.\nGLORY IS PERMANENT.',
    'EARN YOUR PLACE\nAT THE TOP OF THE ARENA.',
  ];
  const motivation = motivations[new Date().getDay() % motivations.length];

  return (
    <div className="p-6 space-y-8">
      {/* Race Track Section */}
      {arena ? (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h2 className="text-xs font-bold tracking-widest text-jet uppercase flex items-center gap-2">
                <Trophy size={14} className="text-volt fill-jet" /> {arena.name}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider flex items-center gap-1 uppercase">
                <Timer size={12} /> {daysRemaining} DAYS REMAINING
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ARENA DURATION</span>
              <div className="text-[10px] font-heading mt-1 text-jet tracking-widest">
                {new Date((arena as any).created_at || arena.createdAt || Date.now()).toLocaleDateString()} - {new Date(arena.deadline).toLocaleDateString()}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="border-2 border-dashed border-border p-6 space-y-2 text-center">
          <Trophy size={24} className="mx-auto text-muted-foreground" />
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">No active arena</p>
          <button
            onClick={() => navigate('/challenges')}
            className="text-[10px] font-bold tracking-widest text-volt uppercase underline underline-offset-4"
          >
            CREATE OR JOIN ONE
          </button>
        </section>
      )}

      {/* Points Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/profile/${userProfile?.id}`)}
          className="cursor-pointer"
        >
          <Card className="bg-jet text-white border-none h-full hover:bg-jet/90 transition-colors">
            <CardContent className="p-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-volt">{userProfile?.name ?? 'YOU'}</span>
              <div className="text-6xl font-heading mt-2">{myPoints}</div>
              <div className="text-xs text-muted-foreground uppercase mt-1">Total Points</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => {
            const rivalId = partnerProfile?.id || arenaRival?.userId;
            if (rivalId) navigate(`/profile/${rivalId}`);
          }}
          className={displayRivalName ? 'cursor-pointer' : ''}
        >
          <Card className={`border-none h-full hover:opacity-90 transition-opacity ${displayRivalName ? 'bg-[#FF6B36] text-white' : 'bg-paper hover:bg-paper/80'}`}>
            <CardContent className="p-6">
              {displayRivalName ? (
                <>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">{displayRivalName}</span>
                  <div className="text-6xl font-heading mt-2">{partnerPoints}</div>
                  <div className="text-xs text-white/70 uppercase mt-1">Total Points</div>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">RIVAL</span>
                  <div className="text-4xl font-heading mt-2 text-muted-foreground">—</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${userProfile?.id}`); }}
                    className="text-[9px] font-bold tracking-widest text-volt uppercase mt-1 underline underline-offset-2"
                  >
                    LINK PARTNER
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Consistency Streak */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-bold tracking-widest text-muted-foreground flex items-center gap-2">
            <Flame size={14} className="text-volt" /> CONSISTENCY STREAK
          </h3>
          <div className="text-2xl font-heading italic">{streak === 0 ? 0 : ((streak - 1) % 6) + 1}/6 DAYS</div>
        </div>
        <div className="flex justify-between gap-2">
          {[...Array(6)].map((_, i) => {
            const currentCycleDays = streak === 0 ? 0 : ((streak - 1) % 6) + 1;
            const isFilled = i < currentCycleDays;
            return (
              <motion.div
                key={i}
                className={`h-3 flex-1 border ${isFilled ? 'bg-volt border-volt' : 'bg-transparent border-border'}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Complete 6 days for a +20 PTS bonus
        </p>
      </section>

      {/* Motivation Card */}
      <Card className="border-2 border-jet rounded-none overflow-hidden">
        <div className="bg-jet text-volt p-2 text-[10px] font-bold tracking-widest text-center">
          ARENA STATUS: ACTIVE
        </div>
        <CardContent className="p-6 bg-white">
          <h4 className="text-lg font-heading leading-tight whitespace-pre-line">{motivation}</h4>
        </CardContent>
      </Card>
    </div>
  );
}
