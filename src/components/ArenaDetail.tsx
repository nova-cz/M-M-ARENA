import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, Globe, MessageCircle, Activity, User, Send, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabase';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Colors assigned by rank position — always distinct and visible
const RANK_COLORS = ['#D3FF33', '#FF6B35', '#4ECDC4', '#A855F7', '#F97316'];

interface ArenaMessage {
  id: string;
  arenaId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export default function ArenaDetail() {
  const { arenaId } = useParams<{ arenaId: string }>();
  const navigate = useNavigate();
  const { myArenas, workouts } = useApp();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'activities' | 'chat'>('activities');
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const arena = myArenas.find(a => a.id === arenaId);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load and subscribe to chat messages
  useEffect(() => {
    if (!arenaId || activeTab !== 'chat') return;

    setChatError(false);

    supabase
      .from('arena_messages')
      .select('*')
      .eq('arenaId', arenaId)
      .order('timestamp', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setChatError(true);
          return;
        }
        if (data) setMessages(data as ArenaMessage[]);
      });

    const channel = supabase
      .channel(`arena_chat_${arenaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_messages',
          filter: `arenaId=eq.${arenaId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ArenaMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [arenaId, activeTab]);

  if (!arena) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Trophy size={32} className="text-muted-foreground" />
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Arena not found
        </p>
        <button
          onClick={() => navigate('/challenges')}
          className="text-[10px] font-bold uppercase tracking-widest underline hover:text-volt transition-colors"
        >
          ← Back to Arenas
        </button>
      </div>
    );
  }

  const sorted = [...arena.participants].sort((a, b) => b.currentPoints - a.currentPoints);
  const topPoints = sorted[0]?.currentPoints || 1;
  const daysLeft = Math.max(0, Math.ceil((new Date(arena.deadline).getTime() - Date.now()) / 86400000));
  const participantIds = new Set(arena.participants.map((p) => p.userId));
  const arenaWorkouts = workouts.filter((w) => participantIds.has(w.userId));

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('arena_messages').insert([
        {
          arenaId,
          userId: userProfile.id,
          userName: userProfile.name,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
        },
      ]);
      if (error) setChatError(true);
      else setNewMessage('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pb-24 min-h-screen bg-white">
      {/* Sticky header — dark bar */}
      <div className="bg-jet text-volt sticky top-0 z-20 border-b-2 border-volt/30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/challenges')}
            className="hover:opacity-60 transition-opacity shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg leading-none truncate">{arena.name}</h2>
            <p className="text-[9px] font-bold tracking-widest opacity-60 mt-0.5">
              {arena.participants.length} ATHLETES · {daysLeft} DAYS LEFT
            </p>
          </div>
          {arena.type === 'private' ? (
            <Shield size={14} className="opacity-50 shrink-0" />
          ) : (
            <Globe size={14} className="opacity-50 shrink-0" />
          )}
        </div>

        {/* Leaderboard inside header */}
        <div className="px-4 pb-4 space-y-2">
          {sorted.map((p, i) => {
            const currentPts = p.currentPoints || 0;
            const pct =
              arena.goalPoints > 0
                ? Math.min((currentPts / arena.goalPoints) * 100, 100)
                : Math.min((currentPts / topPoints) * 100, 100);
            const color = RANK_COLORS[i % RANK_COLORS.length];
            const isMe = p.userId === userProfile?.id;

            return (
              <div key={p.userId} className="space-y-1">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/profile/${p.userId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                    style={{ color: color }}
                  >
                    <User size={9} />
                    <span>
                      {i + 1}. {p.userName}
                    </span>
                    {isMe && (
                      <span className="text-[8px] bg-volt text-jet px-1 py-0.5 font-black">
                        YOU
                      </span>
                    )}
                  </Link>
                  <span className="text-[10px] font-bold" style={{ color: color }}>
                    {p.currentPoints} PTS
                  </span>
                </div>
                {/* Progress bar — fondo semi-transparente para contraste */}
                <div className="h-1.5 w-full rounded-none" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
          {arena.goalPoints > 0 && (
            <p className="text-[8px] font-bold tracking-widest opacity-50 pt-1">
              GOAL: {arena.goalPoints} PTS
            </p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b-2 border-jet">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
            activeTab === 'activities'
              ? 'bg-volt text-jet'
              : 'bg-white text-muted-foreground hover:bg-paper'
          }`}
        >
          <Activity size={12} />
          ACTIVITIES
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
            activeTab === 'chat'
              ? 'bg-volt text-jet'
              : 'bg-white text-muted-foreground hover:bg-paper'
          }`}
        >
          <MessageCircle size={12} />
          CHAT
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'activities' ? (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-4 space-y-8"
          >
            {/* Activity Graph */}
            <div className="h-40 border-2 border-jet bg-paper p-4">
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4 text-center">ACTIVITY GRAPH</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sorted.map((p, i) => ({ name: p.userName.split(' ')[0], pts: p.currentPoints || 0, fill: RANK_COLORS[i % RANK_COLORS.length] }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#18181b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', color: '#D3FF33', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '0', border: 'none' }}
                    itemStyle={{ color: '#D3FF33' }}
                  />
                  <Bar dataKey="pts" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {sorted.map((p, i) => {
              const color = RANK_COLORS[i % RANK_COLORS.length];
              const isMe = p.userId === userProfile?.id;
              const userWorkouts = arenaWorkouts
                .filter((w) => w.userId === p.userId)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

              return (
                <div key={p.userId} className="space-y-3">
                  {/* Section header — participant */}
                  <div className="flex items-center gap-3 pb-2 border-b-2" style={{ borderColor: color }}>
                    <div className="w-3 h-6 shrink-0" style={{ backgroundColor: color }} />
                    <Link
                      to={`/profile/${p.userId}`}
                      className="text-[11px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <User size={10} />
                      {p.userName}
                      {isMe && (
                        <span className="text-[8px] bg-jet text-volt px-1 font-black">YOU</span>
                      )}
                    </Link>
                    <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                      {p.currentPoints} PTS TOTAL
                    </span>
                  </div>

                  {userWorkouts.length === 0 ? (
                    <p className="text-[9px] text-muted-foreground uppercase font-bold pl-5 tracking-widest py-2">
                      No workouts logged yet.
                    </p>
                  ) : (
                    <div className="space-y-2 pl-2">
                      {userWorkouts.map((w) => (
                        <div
                          key={w.id}
                          className="p-3 bg-paper border-l-[3px] space-y-2"
                          style={{ borderColor: color }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest truncate">
                                {w.activity}
                              </p>
                              <p className="text-[9px] text-muted-foreground uppercase font-medium">
                                {new Date(w.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                {w.hasWeightPack && ' · WEIGHT PACK'}
                                {w.hasResistanceBand && ' · RESISTANCE BAND'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-jet shrink-0">
                              +{w.totalPoints} PTS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
            style={{ height: 'calc(100dvh - 280px)' }}
          >
            {chatError ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-3 max-w-xs">
                  <MessageCircle size={36} className="mx-auto text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Chat no disponible
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Para activar el chat, crea la tabla{' '}
                    <code className="bg-paper px-1 font-mono">arena_messages</code> en Supabase
                    con las columnas:{' '}
                    <code className="bg-paper px-1 font-mono">
                      id, arenaId, userId, userName, message, timestamp
                    </code>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-2">
                      <MessageCircle size={28} className="mx-auto text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        No hay mensajes aún.
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        ¡Manda el primero!
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.userId === userProfile?.id;
                    const senderIdx = sorted.findIndex((p) => p.userId === msg.userId);
                    const bubbleColor =
                      senderIdx >= 0 ? RANK_COLORS[senderIdx % RANK_COLORS.length] : '#D3FF33';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {!isMe && (
                          <p
                            className="text-[8px] font-bold uppercase tracking-widest ml-1"
                            style={{ color: bubbleColor }}
                          >
                            {msg.userName}
                          </p>
                        )}
                        <div
                          className={`max-w-[78%] px-3 py-2 text-[11px] font-medium leading-snug ${
                            isMe
                              ? 'bg-jet text-volt'
                              : 'bg-paper border border-border text-jet'
                          }`}
                          style={
                            isMe ? { borderLeft: `3px solid ${bubbleColor}` } : {}
                          }
                        >
                          {msg.message}
                        </div>
                        <p className="text-[8px] text-muted-foreground mx-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form
                  onSubmit={sendMessage}
                  className="flex gap-2 p-3 border-t-2 border-jet bg-white shrink-0"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="MOTIVACIÓN, TRASH TALK..."
                    maxLength={200}
                    className="flex-1 border-2 border-jet px-3 py-2 text-[11px] font-medium uppercase tracking-wider outline-none focus:border-volt transition-colors bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-jet text-volt px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-volt hover:text-jet transition-colors flex items-center gap-1"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
