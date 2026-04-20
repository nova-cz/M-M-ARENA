import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Link, User } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth, generatePartnerCode } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetupProfile() {
  const { firebaseUser, refreshProfile } = useAuth();
  const [step, setStep] = useState<'name' | 'partner'>('name');
  const [name, setName] = useState(firebaseUser?.user_metadata?.full_name?.toUpperCase() || firebaseUser?.user_metadata?.name?.toUpperCase() || '');
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('partner');
  }

  async function handleFinish(linkPartner: boolean) {
    if (!firebaseUser) return;
    setError('');
    setLoading(true);

    try {
      const myCode = generatePartnerCode();
      let partnerId: string | undefined;
      let partnerName: string | undefined;

      if (linkPartner && partnerCode.trim()) {
        const { data: partnerSnap, error: partnerErr } = await supabase
          .from('users')
          .select('*')
          .eq('partnerCode', partnerCode.trim().toUpperCase());

        if (partnerErr || !partnerSnap || partnerSnap.length === 0) {
          setError('Partner code not found. Ask your partner for their code.');
          setLoading(false);
          return;
        }

        const partnerDoc = partnerSnap[0];
        partnerId = partnerDoc.id;
        partnerName = partnerDoc.name;

        // Update partner's record to link back
        await supabase
          .from('users')
          .update({
            partnerId: firebaseUser.id,
            partnerName: name.trim().toUpperCase(),
          })
          .eq('id', partnerId);
      }

      const displayName = name.trim().toUpperCase();
      
      const newUser = {
        id: firebaseUser.id,
        name: displayName,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.user_metadata?.avatar_url || null,
        partnerCode: myCode,
        partnerId: partnerId || null,
        partnerName: partnerName || null,
        streakCount: 0,
        lastWorkoutDate: null,
        totalPoints: 0,
        weeklyPoints: 0,
        joinedAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('users').upsert([newUser]);
      
      if (insertError) throw insertError;

      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-8 justify-center w-full mx-auto border-x md:max-w-xl">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <div className="bg-jet text-volt px-3 py-1 text-[10px] font-bold tracking-widest inline-block uppercase">
                STEP 1 OF 2
              </div>
              <h1 className="text-4xl font-heading leading-tight">SET YOUR<br />ATHLETE NAME</h1>
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                This is how your partner will see you in the arena.
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold tracking-widest uppercase">DISPLAY NAME</Label>
                <Input
                  placeholder="E.G. MIGUEL"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="h-14 rounded-none border-2 border-jet text-lg font-heading uppercase"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-16 rounded-none bg-jet text-volt font-heading text-lg group"
              >
                NEXT <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        )}

        {step === 'partner' && (
          <motion.div
            key="partner"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <div className="bg-jet text-volt px-3 py-1 text-[10px] font-bold tracking-widest inline-block uppercase">
                STEP 2 OF 2
              </div>
              <h1 className="text-4xl font-heading leading-tight">LINK YOUR<br />RIVAL</h1>
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                Enter your partner's code to compete together. You can skip this and do it later.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold tracking-widest uppercase">PARTNER CODE</Label>
                <Input
                  placeholder="E.G. A1B2C3"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  className="h-14 rounded-none border-2 border-jet text-lg font-heading uppercase tracking-widest"
                  maxLength={6}
                />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  Ask your partner to share their code from their profile.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-400 p-3 text-xs font-bold text-red-600 uppercase tracking-wider">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full h-16 rounded-none bg-jet text-volt font-heading text-lg group"
                  onClick={() => handleFinish(true)}
                  disabled={loading || !partnerCode.trim()}
                >
                  {loading ? 'LINKING...' : 'LINK & ENTER ARENA'}
                  <Link className="ml-2" size={18} />
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-none border-2 border-jet font-heading text-sm"
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                >
                  {loading ? 'SAVING...' : 'SKIP FOR NOW'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
