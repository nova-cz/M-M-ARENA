import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Stats() {
  const { userProfile } = useAuth();
  const { workouts, partnerProfile } = useApp();

  const myName = userProfile?.name ?? 'YOU';
  const partnerName = partnerProfile?.name ?? 'RIVAL';

  // Weekly points: workouts in the last 7 days
  const weeklyData = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    const myWeekly = workouts
      .filter(w => w.userId === userProfile?.id && new Date(w.timestamp).getTime() > weekAgo)
      .reduce((sum, w) => sum + w.totalPoints, 0);

    const partnerWeekly = workouts
      .filter(w => w.userId === partnerProfile?.id && new Date(w.timestamp).getTime() > weekAgo)
      .reduce((sum, w) => sum + w.totalPoints, 0);

    return [
      { name: myName, points: myWeekly, color: '#000000' },
      { name: partnerName, points: partnerWeekly, color: '#D3FF33' },
    ];
  }, [workouts, userProfile?.id, partnerProfile?.id, myName, partnerName]);

  const leader = weeklyData[0].points >= weeklyData[1].points ? weeklyData[0] : weeklyData[1];
  const lead = Math.abs(weeklyData[0].points - weeklyData[1].points);

  // Monthly breakdown: last 4 weeks
  const monthlyData = useMemo(() => {
    const weeks = [
      { label: 'WEEK 01', start: 28, end: 21 },
      { label: 'WEEK 02', start: 21, end: 14 },
      { label: 'WEEK 03', start: 14, end: 7 },
      { label: 'WEEK 04', start: 7, end: 0 },
    ];

    return weeks.map(({ label, start, end }) => {
      const startMs = Date.now() - start * 86400000;
      const endMs = Date.now() - end * 86400000;

      const myPts = workouts
        .filter(w => w.userId === userProfile?.id && new Date(w.timestamp).getTime() > startMs && new Date(w.timestamp).getTime() <= endMs)
        .reduce((s, w) => s + w.totalPoints, 0);

      const partnerPts = workouts
        .filter(w => w.userId === partnerProfile?.id && new Date(w.timestamp).getTime() > startMs && new Date(w.timestamp).getTime() <= endMs)
        .reduce((s, w) => s + w.totalPoints, 0);

      return { name: label, me: myPts, partner: partnerPts };
    });
  }, [workouts, userProfile?.id, partnerProfile?.id]);

  // Activity breakdown for badges
  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts
      .filter(w => w.userId === userProfile?.id)
      .forEach(w => { counts[w.activity] = (counts[w.activity] || 0) + 1; });
    return counts;
  }, [workouts, userProfile?.id]);

  const badges = [
    { label: 'IRON LUNGS', activity: 'Running', threshold: 3 },
    { label: 'DEEP DIVE', activity: 'Swimming', threshold: 2 },
    { label: 'WALL SIT', activity: 'Calisthenics', threshold: 3 },
    { label: 'SPRINT KING', activity: 'Walk', threshold: 5 },
    { label: 'SQUAT GOD', activity: 'Squats', threshold: 5 },
    { label: 'CONSISTENT', activity: null, threshold: 10 },
  ].map(b => ({
    ...b,
    active: b.activity
      ? (activityCounts[b.activity] || 0) >= b.threshold
      : (Object.values(activityCounts) as number[]).reduce((s, v) => s + v, 0) >= b.threshold,
  }));

  return (
    <div className="p-6 space-y-8 pb-24">
      <h2 className="text-xl font-heading">ARENA STATISTICS</h2>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="w-full h-12 bg-paper rounded-none p-1 mb-6">
          <TabsTrigger value="weekly" className="flex-1 rounded-none data-[state=active]:bg-jet data-[state=active]:text-volt font-heading tracking-widest text-[10px]">WEEKLY</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 rounded-none data-[state=active]:bg-jet data-[state=active]:text-volt font-heading tracking-widest text-[10px]">MONTHLY</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-0">
          <Card className="rounded-none border-2 border-jet">
            <CardContent className="p-6">
              {weeklyData[0].points === 0 && weeklyData[1].points === 0 ? (
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-center py-8">
                  No workouts this week yet.
                </p>
              ) : (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} layout="vertical" margin={{ left: -20 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="points" radius={[0, 0, 0, 0]} barSize={40}>
                        {weeklyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-6 flex justify-between items-center text-xs font-bold tracking-widest border-t pt-4">
                <span>LEADER: {leader.name}</span>
                {lead > 0 && (
                  <span className="text-volt bg-jet px-2 py-0.5">+{lead} PTS LEAD</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-0 space-y-6">
          <Card className="rounded-none border-jet">
            <CardContent className="p-6">
              {monthlyData.every(d => d.me === 0 && d.partner === 0) ? (
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-center py-8">
                  No data for this month yet.
                </p>
              ) : (
                <>
                  <div className="flex gap-4 mb-4 text-[9px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-jet" /> {myName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-volt border border-border" /> {partnerName}
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold' }} />
                        <Tooltip />
                        <Bar dataKey="me" fill="#000000" radius={0} name={myName} />
                        <Bar dataKey="partner" fill="#D3FF33" radius={0} name={partnerName} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Badges Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">CONSISTENCY TROPHIES</h3>
        <div className="grid grid-cols-3 gap-4">
          {badges.map((badge, i) => (
            <div
              key={i}
              className={`aspect-square border-2 flex flex-col items-center justify-center p-2 text-center gap-2 transition-all ${
                badge.active ? 'border-jet bg-paper' : 'border-border opacity-30 grayscale'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${badge.active ? 'bg-volt' : 'bg-muted'} flex items-center justify-center font-bold text-xs`}>
                {badge.label[0]}
              </div>
              <span className="text-[8px] font-bold tracking-widest leading-tight">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <Card className="rounded-none border-2 border-jet">
        <CardContent className="p-6 grid grid-cols-2 gap-8 divide-x-2 divide-jet/10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">TOTAL SESSIONS</p>
            <p className="text-3xl font-heading">
              {workouts.filter(w => w.userId === userProfile?.id).length}
            </p>
          </div>
          <div className="pl-8 space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ALL-TIME PTS</p>
            <p className="text-3xl font-heading">{userProfile?.totalPoints ?? 0}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
