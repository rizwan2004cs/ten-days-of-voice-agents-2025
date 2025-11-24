'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/livekit/button';
const TeacherAvatar = () => (
  <svg width="90" height="90" viewBox="0 0 140 140" className="drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]">
    <defs>
      <linearGradient id="teacherGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="70%" stopColor="rgba(148,163,184,0.25)" />
        <stop offset="100%" stopColor="rgba(30,41,59,0.05)" />
      </linearGradient>
    </defs>
    <circle cx="70" cy="46" r="26" fill="url(#teacherGlow)" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" />
    <circle cx="70" cy="92" r="32" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3.5" />
  </svg>
);

const StudentAvatar = () => (
  <svg width="80" height="80" viewBox="0 0 140 140" className="drop-shadow-[0_10px_25px_rgba(248,113,113,0.35)]">
    <defs>
      <linearGradient id="studentGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
        <stop offset="70%" stopColor="rgba(253,186,116,0.25)" />
        <stop offset="100%" stopColor="rgba(127,29,29,0.08)" />
      </linearGradient>
    </defs>
    <circle cx="70" cy="46" r="24" fill="url(#studentGlow)" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" />
    <rect x="35" y="84" width="70" height="44" rx="20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3.5" />
  </svg>
);


const TeacherStudentAnimation = () => {
  return (
    <motion.div
      className="relative w-full max-w-3xl aspect-[16/9] rounded-[36px] bg-gradient-to-br from-slate-900/80 via-stone-900/60 to-gray-900/80 border border-white/10 shadow-[0px_25px_120px_rgba(15,23,42,0.6)] overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Constellation grid */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 21) % 100}%`,
            }}
            animate={{
              opacity: [0.15, 0.5, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Digital blackboard */}
      <motion.div
        className="absolute left-6 right-6 top-6 h-2/3 rounded-3xl bg-gradient-to-br from-gray-900 to-slate-900 border border-white/5 shadow-inner"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        {/* board content */}
        <div className="absolute inset-0 px-8 py-6 text-slate-200/60 font-medium text-sm">
          <motion.p
            className="mb-4"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Today: Active Recall on Loops & Conditionals
          </motion.p>
          <motion.div
            className="flex gap-10 text-xs uppercase tracking-[0.3em] text-slate-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span>Explain</span>
            <span>Quiz</span>
            <span>Teach-Back</span>
          </motion.div>
        </div>
        {/* glowing equations */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400/30 blur-lg"
            style={{
              width: `${40 + i * 20}px`,
              height: `${40 + i * 20}px`,
              left: `${15 + i * 18}%`,
              top: `${25 + (i % 2) * 20}%`,
            }}
            animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 4 + i, repeat: Infinity }}
          />
        ))}
      </motion.div>

      {/* teacher */}
      <motion.div
        className="absolute left-10 bottom-6 flex items-end gap-6"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-400/40 to-cyan-400/25 border border-white/15 backdrop-blur flex items-center justify-center">
          <TeacherAvatar />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-32 bg-gradient-to-t from-slate-900 to-slate-800 rounded-[30px] shadow-[0_10px_30px_rgba(15,23,42,0.5)] -z-10" />
      </motion.div>
        <motion.div
          className="h-24 w-1 rounded-full bg-cyan-400/80"
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* student */}
      <motion.div
        className="absolute right-10 bottom-6 flex items-end gap-4"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      >
        <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/35 to-rose-400/25 border border-white/15 backdrop-blur flex items-center justify-center">
          <StudentAvatar />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-24 bg-gradient-to-t from-gray-900 to-gray-800 rounded-[24px] -z-10" />
      </motion.div>
        <motion.div
          className="w-24 h-16 rounded-2xl bg-white/10 border border-white/10 backdrop-blur shadow-lg flex flex-col justify-center px-4 text-xs text-slate-200"
          animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-white/80 font-semibold">Concept mastery</span>
          <span className="text-cyan-300 font-bold">+12% this session</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const PhysicsBadge = () => (
  <motion.div
    className="flex items-center gap-3 justify-center flex-wrap mb-6"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    <div className="glass-card rounded-full px-5 py-2 border border-white/10 flex items-center gap-3">
      <img
        src="/pw-logo.svg"
        alt="Physics Wallah Logo"
        className="h-6 w-6"
      />
      <span className="text-sm font-semibold tracking-[0.4em] uppercase text-slate-100">
        Physics Wallah
      </span>
    </div>
    <div className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/30">
      Active Recall Coach
    </div>
  </motion.div>
);

interface TeacherWelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const TeacherWelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & TeacherWelcomeViewProps) => {
  return (
    <div
      ref={ref}
      className="w-full min-h-screen flex flex-col items-center justify-start pt-12 pb-8 px-6 relative overflow-hidden"
    >
      {/* floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${(i * 23) % 100}%`,
              top: `${(i * 37) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 6 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <PhysicsBadge />

      <motion.div
        className="text-center mb-10 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-4">
          Teach-the-Tutor
        </h1>
        <p className="text-slate-200 text-lg md:text-xl max-w-3xl">
          Step inside Physics Wallah’s interactive lab where the agent learns with you.
          Explain concepts, get quizzed, and teach them back in immersive Murf-powered voices.
        </p>
      </motion.div>

      <TeacherStudentAnimation />

      <motion.div
        className="mt-10 flex flex-col items-center gap-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          size="lg"
          onClick={onStartCall}
          className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white px-10 py-6 text-lg font-semibold rounded-full shadow-[0_20px_60px_rgba(56,189,248,0.3)] hover:scale-[1.02] transition-transform"
        >
          {startButtonText}
        </Button>
        <div className="grid sm:grid-cols-3 gap-4 text-left text-sm text-slate-200 max-w-3xl">
          {[
            'Dynamic Murf Falcon voices per learning mode',
            'Concept mastery trackers update in realtime',
            'Guided explain → quiz → teach-back rituals',
          ].map((item) => (
            <div key={item} className="glass-card rounded-2xl px-5 py-4 border border-white/5">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

