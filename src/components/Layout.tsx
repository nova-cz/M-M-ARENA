import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, TrendingUp, User, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { firebaseUser } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col mx-auto relative shadow-2xl border-x w-full md:max-w-4xl lg:max-w-6xl">
      {/* Header */}
      <header className="p-6 border-b sticky top-0 bg-background z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter italic leading-none">M&M ARENA</h1>
          <div className="flex items-center gap-1 bg-jet text-volt px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
            LIVE <div className="w-1 h-1 rounded-full bg-volt animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <Outlet />
        <footer className="p-8 border-t bg-paper mt-12 mb-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-xl font-heading italic opacity-50">M&M ARENA</h2>
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">ENGINEERED FOR PERFORMANCE</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-jet uppercase">MADE BY MIGUEL CR</p>
            </div>
            <div className="h-[1px] w-8 bg-volt" />
            <p className="text-[8px] font-bold tracking-widest text-muted-foreground uppercase opacity-40">© 2026 ARCTIC SYSTEMS HOLDINGS</p>
          </div>
        </footer>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-4xl lg:max-w-6xl bg-background border-t p-4 flex justify-around items-center z-30">
        <NavButton to="/" icon={<Home size={20} />} label="Home" />
        <NavButton to="/history" icon={<ClipboardList size={20} />} label="Feed" />
        <NavButton to="/challenges" icon={<Trophy size={20} />} label="Arenas" />
        <NavButton
          to={`/profile/${firebaseUser?.id || ''}`}
          icon={<User size={20} />}
          label="You"
        />
      </nav>
    </div>
  );
}

function NavButton({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-volt' : 'text-muted-foreground'}`
      }
    >
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="flex flex-col items-center"
      >
        <div className="p-1">{icon}</div>
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </motion.div>
    </NavLink>
  );
}
