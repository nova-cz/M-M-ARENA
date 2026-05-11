import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Shield, Globe, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Arena } from '../types';

// Colors assigned by rank position — always visible, always distinct
const RANK_COLORS = ['#D3FF33', '#FF6B35', '#4ECDC4', '#A855F7', '#F97316'];

export default function Challenges() {
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading">GROUPS & ARENAS</h2>
        <div className="flex gap-2">
          <JoinArenaDialog />
          <CreateArenaDialog />
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-2 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'my' ? 'border-b-2 border-volt text-jet' : 'text-muted-foreground'}`}
        >
          MY ARENAS
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-2 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'discover' ? 'border-b-2 border-volt text-jet' : 'text-muted-foreground'}`}
        >
          DISCOVER
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-4"
        >
          {activeTab === 'my' ? <MyArenas /> : <DiscoverArenas />}
        </motion.div>
      </AnimatePresence>

      <section className="bg-paper p-6 space-y-3">
        <div className="flex items-center gap-2 text-jet">
          <Shield size={16} />
          <h4 className="text-[10px] font-bold tracking-widest uppercase">PRIVACY PROTOCOL</h4>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-medium">
          Private arenas are end-to-end isolated. Only your selected partners can view your workout proof and points.
        </p>
      </section>
    </div>
  );
}

function MyArenas() {
  const { myArenas } = useApp();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyCode(code: string, arenaId: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(arenaId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (myArenas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <Shield size={32} className="text-muted-foreground" />
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          You are not in any arena yet.<br />Create one or join with a code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myArenas.map((arena) => {
        const daysLeft = Math.max(0, Math.ceil((new Date(arena.deadline).getTime() - Date.now()) / 86400000));
        const sorted = [...arena.participants].sort((a, b) => b.currentPoints - a.currentPoints);
        const topPoints = sorted[0]?.currentPoints || 1;

        return (
          <Card
            key={arena.id}
            className="rounded-none border-2 border-jet hover:border-volt transition-colors cursor-pointer text-left"
            onClick={() => navigate(`/challenges/${arena.id}`)}
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {arena.type === 'private' ? <Shield size={12} /> : <Globe size={12} />}
                    <h3 className="text-xs font-bold uppercase tracking-tight">{arena.name}</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    {arena.participants.length} ATHLETES · {daysLeft} DAYS LEFT
                  </p>
                </div>
                {arena.type === 'private' && (
                  <button
                    onClick={(e) => copyCode(arena.inviteCode, arena.id, e)}
                    className="flex items-center gap-1 bg-paper px-2 py-1 text-[10px] font-bold tracking-widest uppercase hover:bg-volt/20 transition-colors"
                  >
                    {copiedId === arena.id ? <Check size={10} /> : <Copy size={10} />}
                    {arena.inviteCode}
                  </button>
                )}
              </div>

              {/* Leaderboard mini — colores por posición, fondo oscuro para visibilidad */}
              <div className="space-y-2">
                {sorted.map((p, i) => {
                  const currentPts = p.currentPoints || 0;
                  const pct = arena.goalPoints > 0
                    ? Math.min((currentPts / arena.goalPoints) * 100, 100)
                    : Math.min((currentPts / topPoints) * 100, 100);
                  const barColor = RANK_COLORS[i % RANK_COLORS.length];
                  return (
                    <div key={p.userId} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                        <span>{i + 1}. {p.userName}</span>
                        <span>{p.currentPoints} PTS</span>
                      </div>
                      {/* Contenedor oscuro para que cualquier color sea visible */}
                      <div className="h-2 w-full" style={{ backgroundColor: 'rgba(0,0,0,0.10)' }}>
                        <motion.div
                          className="h-full"
                          style={{ backgroundColor: barColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>{arena.goalPoints > 0 ? `GOAL: ${arena.goalPoints} PTS` : 'NO POINT GOAL'}</span>
                <span className="text-volt tracking-widest">TAP TO ENTER →</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DiscoverArenas() {
  const { publicArenas, myArenas, joinPublicArena } = useApp();
  const [joining, setJoining] = useState<string | null>(null);
  const myIds = new Set(myArenas.map(a => a.id));

  async function handleJoin(arenaId: string) {
    setJoining(arenaId);
    try {
      await joinPublicArena(arenaId);
    } finally {
      setJoining(null);
    }
  }

  if (publicArenas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <Globe size={32} className="text-muted-foreground" />
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          No public arenas available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publicArenas.map((arena) => (
        <Card key={arena.id} className="rounded-none border-2 border-jet">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe size={12} />
                <h3 className="text-xs font-bold uppercase tracking-tight">{arena.name}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {arena.participants.length} ATHLETES ACTIVE
              </p>
            </div>
            {myIds.has(arena.id) ? (
              <div className="bg-volt text-jet px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase">
                JOINED
              </div>
            ) : (
              <Button
                className="rounded-none bg-jet text-volt h-10 px-4 font-heading text-xs"
                onClick={() => handleJoin(arena.id)}
                disabled={joining === arena.id}
              >
                {joining === arena.id ? '...' : 'JOIN'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreateArenaDialog() {
  const { createArena } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [goalPoints, setGoalPoints] = useState('500');
  const [hasGoal, setHasGoal] = useState(true);
  const [deadline, setDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !deadline) return;
    setLoading(true);
    setError('');
    try {
      const arena = await createArena(
        name,
        hasGoal ? (parseInt(goalPoints) || 500) : 0,
        deadline,
        isPublic ? 'public' : 'private'
      );
      if (!isPublic) {
        setCreatedCode(arena.inviteCode);
      } else {
        setOpen(false);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create arena.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName('');
    setGoalPoints('500');
    setHasGoal(true);
    setDeadline('');
    setIsPublic(false);
    setCreatedCode(null);
    setError('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-none bg-volt text-jet hover:bg-volt/90">
          <Plus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs rounded-none border-2 border-jet bg-white p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">COMMISSION NEW ARENA</DialogTitle>
        </DialogHeader>

        {createdCode ? (
          <div className="space-y-6 pt-4">
            <div className="bg-jet text-volt p-6 text-center space-y-2">
              <p className="text-[10px] font-bold tracking-widest uppercase">Arena Created! Share this code:</p>
              <p className="text-4xl font-heading tracking-[0.3em]">{createdCode}</p>
              <p className="text-[9px] text-volt/70 uppercase tracking-wider">Your partner enters this code to join</p>
            </div>
            <Button
              className="w-full h-14 rounded-none bg-jet text-volt font-heading"
              onClick={() => { setOpen(false); resetForm(); }}
            >
              CLOSE
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-6 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase">ARENA NAME</label>
              <Input
                placeholder="E.G. SUMMER PEAK 2026"
                className="rounded-none border-2 border-jet h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between items-center p-3 bg-paper">
              <Label className="text-[10px] font-bold tracking-widest uppercase">ENABLE POINT GOAL</Label>
              <Switch checked={hasGoal} onCheckedChange={setHasGoal} />
            </div>
            <AnimatePresence>
              {hasGoal && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-bold tracking-widest uppercase">CHALLENGE GOAL (PTS)</label>
                  <Input
                    type="number"
                    placeholder="500"
                    className="rounded-none border-2 border-jet h-12"
                    value={goalPoints}
                    onChange={(e) => setGoalPoints(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase">DEADLINE</label>
              <Input
                type="date"
                className="rounded-none border-2 border-jet h-12"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-between items-center p-3 bg-paper">
              <Label className="text-[10px] font-bold tracking-widest uppercase">PUBLIC ARENA</Label>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-400 p-3 text-xs font-bold text-red-600 uppercase">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-14 rounded-none bg-jet text-volt font-heading text-lg"
              disabled={loading}
            >
              {loading ? 'CREATING...' : 'INITIATE'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function JoinArenaDialog() {
  const { joinArenaByCode } = useApp();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await joinArenaByCode(code);
      setOpen(false);
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to join arena.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCode(''); setError(''); } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-none border-2 border-jet font-heading text-xs h-10 px-3"
        >
          JOIN
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs rounded-none border-2 border-jet bg-white p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">JOIN ARENA</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoin} className="space-y-6 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase">INVITE CODE</label>
            <Input
              placeholder="E.G. A1B2C3"
              className="rounded-none border-2 border-jet h-12 text-lg font-heading uppercase tracking-widest text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border-2 border-red-400 p-3 text-xs font-bold text-red-600 uppercase">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-14 rounded-none bg-jet text-volt font-heading text-lg"
            disabled={loading || code.length < 6}
          >
            {loading ? 'JOINING...' : 'ENTER ARENA'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

