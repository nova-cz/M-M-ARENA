import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, MessageSquare, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function History() {
  const { workouts, toggleKudos, loadingData } = useApp();
  const { userProfile } = useAuth();

  if (loadingData) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-heading">ARENA FEED</h2>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-paper border border-border" />
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-paper" />
                  <div className="h-2 w-16 bg-paper" />
                </div>
              </div>
              <div className="aspect-[4/5] bg-paper" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-heading">ARENA FEED</h2>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Zap size={40} className="text-muted-foreground" />
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-center">
            No workouts yet.<br />Be the first to log a session.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-12 pr-4 pb-20">
            {workouts.map((entry, i) => {
              const hasKudos = entry.kudos?.includes(userProfile?.id ?? '') ?? false;
              const isOwnWorkout = entry.userId === userProfile?.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-none border border-jet">
                        <AvatarFallback className="bg-jet text-volt text-[10px] font-bold">
                          {entry.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold tracking-tight uppercase leading-none">
                          {entry.userName}
                          {isOwnWorkout && (
                            <span className="ml-2 text-[8px] bg-volt text-jet px-1 py-0.5 font-bold">YOU</span>
                          )}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                          {new Date(entry.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-heading text-jet leading-none uppercase">LOGGED {entry.activity}</p>
                      <p className="text-lg font-heading text-jet">+{entry.totalPoints} PTS</p>
                    </div>
                  </div>

                  {entry.proofUrl && (
                    <div className="aspect-[4/5] bg-paper relative group overflow-hidden border-2 border-jet">
                      <img
                        src={entry.proofUrl}
                        alt="Workout proof"
                        className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                      />
                      {entry.hasWeightPack && (
                        <div className="absolute top-4 left-4 bg-jet text-volt px-2 py-1 text-[8px] font-bold tracking-widest uppercase shadow-xl">
                          WEIGHT BONUS ACTIVATED
                        </div>
                      )}
                      {entry.hasResistanceBand && (
                        <div className="absolute top-4 left-4 bg-jet text-volt px-2 py-1 text-[8px] font-bold tracking-widest uppercase shadow-xl">
                          RESISTANCE BONUS ACTIVATED
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-2">
                    <button
                      onClick={() => !isOwnWorkout && toggleKudos(entry.id)}
                      disabled={isOwnWorkout}
                      className={`flex items-center gap-2 group transition-colors ${
                        isOwnWorkout
                          ? 'text-muted-foreground cursor-default'
                          : hasKudos
                          ? 'text-volt'
                          : 'text-jet hover:text-volt'
                      }`}
                    >
                      <motion.div whileTap={isOwnWorkout ? {} : { scale: 1.5, rotate: 15 }}>
                        <Zap
                          size={18}
                          fill={hasKudos ? 'currentColor' : 'none'}
                          className={hasKudos ? 'drop-shadow-[0_0_8px_rgba(211,255,51,0.8)]' : ''}
                        />
                      </motion.div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        KUDOS {entry.kudos?.length > 0 && `(${entry.kudos.length})`}
                      </span>
                    </button>
                    <button className="flex items-center gap-2 text-jet hover:text-volt transition-colors group">
                      <MessageSquare size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">COMMENT</span>
                    </button>
                    <button className="flex items-center gap-2 text-jet hover:text-volt transition-colors ml-auto">
                      <Share2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
