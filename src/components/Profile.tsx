import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, Trophy, Copy, Check, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { workouts, partnerProfile } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);

  // Determine whose profile to show
  const isOwn = !userId || userId === userProfile?.id;
  const profile = isOwn ? userProfile : partnerProfile;

  const userWorkouts = workouts.filter(w => w.userId === profile?.id);
  const totalPoints = profile?.totalPoints ?? 0;

  // Calculate streak calendar (last 28 days)
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    return date.toISOString().split('T')[0];
  });

  const workoutDates = new Set(
    userWorkouts.map(w => new Date(w.timestamp).toISOString().split('T')[0])
  );

  async function handleLogout() {
    await logout();
  }

  function copyPartnerCode() {
    if (!userProfile?.partnerCode) return;
    navigator.clipboard.writeText(userProfile.partnerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (!profile) {
    return (
      <div className="p-6 space-y-8">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-none">
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-heading">PROFILE</h2>
        </header>
        <div className="flex items-center justify-center py-24">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {isOwn ? 'Loading...' : 'Partner profile not available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-none">
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-heading">{isOwn ? 'MY PROFILE' : `${profile.name}'S PROFILE`}</h2>
        </div>
        {isOwn && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-none text-muted-foreground hover:text-jet"
          >
            <LogOut size={20} />
          </Button>
        )}
      </header>

      {/* Profile Info */}
      <section className="flex items-center gap-6">
        <div className="w-24 h-24 border-2 border-jet bg-paper flex items-center justify-center font-heading text-4xl overflow-hidden relative">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            profile.name[0]
          )}
          {isOwn && (
            <div className="absolute bottom-0 right-0 bg-volt text-jet px-1 text-[8px] font-bold tracking-widest uppercase">
              PRO
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-heading">{profile.name}</h3>
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            {profile.partnerName ? `RIVAL: ${profile.partnerName}` : 'NO PARTNER LINKED'}
          </p>
          <div className="flex gap-2 pt-2">
            <div className="bg-jet text-volt px-2 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase">ELITE ATHLETE</div>
          </div>
        </div>
      </section>

      {/* Partner Code (own profile only) */}
      {isOwn && (
        <section className="bg-paper border-2 border-jet p-4 space-y-2">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">YOUR PARTNER CODE</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-heading tracking-[0.3em]">{userProfile?.partnerCode}</span>
            <button
              onClick={copyPartnerCode}
              className="flex items-center gap-1.5 bg-jet text-volt px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase hover:bg-jet/90 transition-colors"
            >
              {copiedCode ? <Check size={12} /> : <Copy size={12} />}
              {copiedCode ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
            Share this code with your partner so they can link to you.
          </p>
        </section>
      )}

      {/* Streak */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">CONSISTENCY STREAK</h3>
          <div className="flex items-center gap-2 text-volt bg-jet px-3 py-1 font-heading italic text-lg">
            <Flame size={18} fill="currentColor" /> {profile.streakCount} DAYS
          </div>
        </div>

        <Card className="rounded-none border-2 border-jet bg-paper/50">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-7 gap-1.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={`header-${i}`} className="flex justify-center">
                  <span className="text-[8px] font-bold text-muted-foreground">{day}</span>
                </div>
              ))}
              {last28Days.map((date, i) => {
                const isActive = workoutDates.has(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div key={date} className="flex justify-center">
                    <div
                      className={`w-7 h-7 flex items-center justify-center border text-[8px] font-bold ${
                        isActive
                          ? 'bg-volt border-volt text-jet'
                          : isToday
                          ? 'border-jet text-jet'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {isActive ? <div className="w-2 h-2 bg-jet rotate-45" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center border-t pt-4">
              {userWorkouts.length} SESSIONS LOGGED
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Activity Carousel */}
      {userWorkouts.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              ACTIVITY REEL <ArrowRight size={12} className="inline ml-2" />
            </h3>
            <span className="text-[10px] font-bold tracking-widest uppercase text-jet">
              {userWorkouts.length} ENTRIES
            </span>
          </div>

          <ScrollArea className="w-full whitespace-nowrap rounded-none">
            <div className="flex w-max space-x-4 pb-4">
              {userWorkouts.slice(0, 10).map((item) => (
                <motion.div
                  key={item.id}
                  className="w-64 space-y-3"
                  whileHover={{ y: -5 }}
                >
                  <div className="aspect-square bg-paper border-2 border-jet relative group overflow-hidden">
                    {item.proofUrl ? (
                      <img
                        src={item.proofUrl}
                        alt={item.activity}
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-paper">
                        <span className="text-4xl font-heading text-muted-foreground">{item.activity[0]}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-jet text-volt px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">
                      +{item.totalPoints} PTS
                    </div>
                  </div>
                  <div className="flex justify-between items-start px-1">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase tracking-tighter">{item.activity}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Trophy size={14} className="text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Lifetime Stats */}
      <Card className="rounded-none border-2 border-jet">
        <CardContent className="p-6 grid grid-cols-2 gap-8 divide-x-2 divide-jet/10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">TOTAL SESSIONS</p>
            <p className="text-3xl font-heading">{userWorkouts.length}</p>
          </div>
          <div className="pl-8 space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ALL-TIME PTS</p>
            <p className="text-3xl font-heading">{totalPoints}</p>
          </div>
        </CardContent>
      </Card>

      {!isOwn && (
        <Button className="w-full h-16 rounded-none bg-jet text-volt font-heading text-lg group" onClick={() => navigate('/challenges')}>
          CHALLENGE {profile.name} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
    </div>
  );
}
