'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/livekit/button';

interface FraudWelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

function ShieldIcon() {
  return (
    <motion.div
      className="relative mb-6"
      initial={{ scale: 0.9, opacity: 0, y: 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-64 h-64 bg-pink-500/25 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-48 h-48 bg-purple-500/25 rounded-full blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
        />
      </div>

      {/* Shield + card icon */}
      <motion.svg
        width="190"
        height="220"
        viewBox="0 0 140 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 25px 60px rgba(16, 185, 129, 0.55))' }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="shieldGrad" x1="40" y1="20" x2="100" y2="120">
            <stop offset="0%" stopColor="#dc2430" />
            <stop offset="50%" stopColor="#e73c7e" />
            <stop offset="100%" stopColor="#7b4397" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="40" y1="20" x2="100" y2="120">
            <stop offset="0%" stopColor="#ffe4f0" />
            <stop offset="100%" stopColor="#f5cffc" />
          </linearGradient>
        </defs>

        {/* Shield outline */}
        <motion.path
          d="M70 25L45 35C43 36 42 38 42 40V78C42 93 51 106 66 113L70 115L74 113C89 106 98 93 98 78V40C98 38 97 36 95 35L70 25Z"
          fill="url(#shieldGrad)"
          stroke="#022C22"
          strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />

        {/* Details inside shield */}
        <rect
          x="53"
          y="52"
          width="12"
          height="4"
          rx="1.5"
          fill="rgba(244, 114, 182, 0.95)"
        />
        <rect
          x="53"
          y="60"
          width="22"
          height="2.5"
          rx="1.25"
          fill="rgba(248, 250, 252, 0.8)"
        />
        <rect
          x="53"
          y="65"
          width="16"
          height="2.5"
          rx="1.25"
          fill="rgba(248, 250, 252, 0.7)"
        />
        <circle cx="83" cy="66" r="3" fill="rgba(244, 114, 182, 0.95)" />

        {/* Checkmark badge */}
        <motion.circle
          cx="93"
          cy="46"
          r="9"
          fill="rgba(248, 250, 252, 0.96)"
          stroke="rgba(220, 36, 48, 0.9)"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8, type: 'spring', stiffness: 220 }}
        />
        <path
          d="M89.5 46L92 48.5L97 43.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulsing ring */}
        {[0, 1].map((i) => (
          <motion.circle
            key={i}
            cx="70"
            cy="75"
            r={30 + i * 10}
            fill="none"
            stroke="url(#accentGrad)"
            strokeWidth="2"
            initial={{ opacity: 0.4, scale: 0.9 }}
            animate={{ opacity: [0.4, 0, 0.4], scale: [0.9, 1.25, 0.9] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}

export const FraudWelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & FraudWelcomeViewProps) => {
  return (
    <div
      ref={ref}
      className="w-full h-screen flex flex-col items-center justify-start pt-14 md:pt-20 pb-8 px-6 relative overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => {
          const positions = [8, 20, 32, 44, 56, 68, 80, 92];
          const x = positions[i % positions.length];
          const y = positions[Math.floor(i / 2) % positions.length];
          return (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-emerald-300/24 rounded-full"
              initial={{
                x: `${x}%`,
                y: `${y}%`,
                opacity: 0.18,
              }}
              animate={{
                y: [`${y}%`, `${(y + 26) % 100}%`],
                opacity: [0.18, 0.55, 0.18],
              }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      {/* Brand */}
      <motion.div
        className="mb-10 text-center relative z-10 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2 text-xs md:text-sm font-semibold uppercase tracking-[0.35em] text-white">
          NOVATRUST BANK
        </p>
        <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
          Fraud Protection Desk
        </h1>
        <p className="mt-5 text-white text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-[0_3px_16px_rgba(0,0,0,0.55)]">
          Speak with a NovaTrust fraud assistant that reads suspicious activity from your account profile,
          verifies you safely, and confirms whether a card transaction is legitimate.
        </p>
      </motion.div>

      {/* CTA – placed directly under headline so it's visible without scrolling */}
      <motion.div
        className="relative z-10 mt-6 mb-6"
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 210 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        <Button
          variant="primary"
          size="lg"
          onClick={onStartCall}
          className="relative w-64 md:w-72 h-14 md:h-16 text-base md:text-lg font-semibold bg-gradient-to-r from-[#dc2430] via-[#e73c7e] to-[#7b4397] hover:from-[#e73c7e] hover:via-[#dc2430] hover:to-[#7b4397] text-white rounded-full glow-bank overflow-hidden group transition-all duration-300 shadow-lg shadow-fuchsia-500/40"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {startButtonText || 'START FRAUD ALERT SESSION'}
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.1, repeat: Infinity, repeatDelay: 1.1 }}
          />
        </Button>
      </motion.div>

      {/* Icon */}
      <motion.div
        className="mb-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <ShieldIcon />
      </motion.div>
    </div>
  );
};


