import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ChevronLeft, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ACTIVITIES, POINTS_CONFIG, BONUS_POINTS } from '../constants';
import { ActivityType } from '../types';
import { useApp } from '../context/AppContext';

export default function LogWorkout() {
  const navigate = useNavigate();
  const { logWorkout, primaryArena } = useApp();
  const [activity, setActivity] = useState<ActivityType>('Running');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('15 min');
  const [walkMinutes, setWalkMinutes] = useState('');
  const [reps, setReps] = useState('10 Squats');
  const [hasBonus, setHasBonus] = useState(false);
  const [points, setPoints] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let base = 0;
    if (activity === 'Running') {
      base = POINTS_CONFIG[activity](parseFloat(distance) || 0);
    } else if (activity === 'Swimming') {
      base = POINTS_CONFIG.Swimming(duration);
    } else if (activity === 'Walk') {
      base = POINTS_CONFIG.Walk(parseFloat(walkMinutes) || 0);
    } else if (activity === 'Calisthenics') {
      base = POINTS_CONFIG.Calisthenics(duration);
    } else if (activity === 'Squats') {
      base = POINTS_CONFIG.Squats(reps);
    }
    setPoints(base + (hasBonus ? BONUS_POINTS : 0));
  }, [activity, distance, duration, walkMinutes, reps, hasBonus]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setError('Camera access denied. Please allow camera permissions or upload a photo.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setImagePreview(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.9);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSubmit() {
    if (points === 0) {
      setError('Please fill in your workout details before logging.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const metadata: Record<string, any> = {};
      if (activity === 'Running') metadata.distance = parseFloat(distance);
      else if (activity === 'Swimming' || activity === 'Calisthenics') metadata.duration = duration;
      else if (activity === 'Walk') metadata.duration = `${parseFloat(walkMinutes) || 0} min`;
      else if (activity === 'Squats') metadata.reps = reps;

      await logWorkout({
        activity,
        mainPoints: points - (hasBonus ? BONUS_POINTS : 0),
        bonusPoints: hasBonus ? BONUS_POINTS : 0,
        totalPoints: points,
        metadata,
        hasWeightPack: activity !== 'Squats' ? hasBonus : false,
        hasResistanceBand: activity === 'Squats' ? hasBonus : false,
        imageFile,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to log workout. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-8 pb-32 min-h-screen bg-background">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-heading">LOG WORKOUT</h2>
      </header>

      <div className="space-y-6">
        {/* Activity Selector */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">SELECT ACTIVITY</Label>
          <Select value={activity} onValueChange={(v) => setActivity(v as ActivityType)}>
            <SelectTrigger className="w-full h-14 rounded-none border-2 border-jet text-lg font-heading">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITIES.map(a => (
                <SelectItem key={a} value={a} className="font-heading">{a.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {activity === 'Running' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">DISTANCE (KM)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="h-14 rounded-none border-2 border-jet text-2xl font-heading"
                  min="0"
                  step="0.1"
                />
              </div>
            )}

            {(activity === 'Swimming' || activity === 'Calisthenics') && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">DURATION</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['15 min', '30 min'].map(d => (
                    <Button
                      key={d}
                      variant={duration === d ? 'default' : 'outline'}
                      className={`h-14 rounded-none border-2 ${duration === d ? 'bg-jet text-volt border-jet' : 'border-border'} font-heading uppercase`}
                      onClick={() => setDuration(d)}
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {activity === 'Walk' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">DURATION (MINUTES)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={walkMinutes}
                  onChange={(e) => setWalkMinutes(e.target.value)}
                  className="h-14 rounded-none border-2 border-jet text-2xl font-heading"
                  min="0"
                  step="1"
                />
              </div>
            )}

            {activity === 'Squats' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">REPETITIONS</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['10 Squats', '50 Squats'].map(r => (
                    <Button
                      key={r}
                      variant={reps === r ? 'default' : 'outline'}
                      className={`h-14 rounded-none border-2 ${reps === r ? 'bg-jet text-volt border-jet' : 'border-border'} font-heading uppercase`}
                      onClick={() => setReps(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Toggle */}
            <div className="p-4 bg-paper flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="text-xs font-bold tracking-tight">ADD-ON BONUS</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {activity === 'Squats' ? '+ RESISTANCE BAND (+2 PTS)' : '+ WEIGHT PACK (+2 PTS)'}
                </div>
              </div>
              <Switch checked={hasBonus} onCheckedChange={setHasBonus} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Camera Modal */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-4">
                <span className="text-white text-[10px] font-bold tracking-widest uppercase">CAPTURE PROOF</span>
                <button onClick={stopCamera} className="text-white">
                  <X size={24} />
                </button>
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="flex-1 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="p-6 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-transparent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proof Area */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">PROOF OF EFFORT (OPTIONAL)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={startCamera}
              className="aspect-square bg-paper border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-volt/5 transition-colors group"
            >
              <Camera size={24} className="text-muted-foreground group-hover:text-volt transition-colors" />
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-center leading-none">TAKE<br />PHOTO</span>
            </div>

            <label className="aspect-square bg-paper border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-volt/5 transition-colors group relative">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <ArrowRight className="-rotate-90 text-muted-foreground group-hover:text-volt transition-colors" size={24} />
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-center leading-none">UPLOAD<br />FILE</span>
            </label>
          </div>

          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-video border-2 border-jet relative group"
            >
              <img src={imagePreview} className="w-full h-full object-contain bg-black/5" />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-jet text-volt p-1"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 p-3 text-xs font-bold text-red-600 uppercase tracking-wider">
            {error}
          </div>
        )}
      </div>

      {/* Submit Section */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-6 flex items-center justify-between z-40">
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ESTIMATED POINTS</div>
          <div className="text-4xl font-heading leading-none">+{points}</div>
        </div>
        <Button
          className="h-16 px-8 rounded-none bg-jet text-volt hover:bg-jet/90 font-heading text-lg group"
          onClick={handleSubmit}
          disabled={saving || points === 0}
        >
          {saving ? 'SAVING...' : primaryArena ? 'LOG TO ARENA' : 'LOG WORKOUT'}
          {!saving && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </div>
    </div>
  );
}
