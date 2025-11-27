'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { Button } from '@/components/livekit/button';

const MotionText = motion.create('h1');
const MotionSubtext = motion.create('p');

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {

  return (
    <div ref={ref}>
      {/* Animated Wave Background */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#fe5206]">
        <div className="wave-container absolute inset-0">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
          <div className="wave wave4"></div>
        </div>
      </div>
      <section className="relative z-10 flex min-h-svh w-full flex-col items-center justify-center text-center">
        {/* Logo and Swiggy text side by side */}
        <motion.div
          className="mb-2 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.4,
          }}
        >
          {/* Logo with fade-in and scale animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
          >
            <Image
              src="/swiggy-logo.png"
              alt="Swiggy Logo"
              width={100}
              height={100}
              priority
              className="h-auto w-auto"
            />
          </motion.div>

          {/* Large gradient text "Swiggy" */}
          <MotionText className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-7xl lg:text-8xl">
            Swiggy
          </MotionText>
        </motion.div>

        {/* Large gradient text "Instamart" */}
        <MotionText
          className="mb-8 bg-gradient-to-r from-white/90 via-white to-white/80 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6,
          }}
        >
          Instamart
        </MotionText>

        {/* Subtitle with fade-in */}
        <MotionSubtext
          className="max-w-prose px-4 pt-2 text-balance text-lg leading-6 font-medium text-white/95 md:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.8,
          }}
        >
          Genie at your service—adding groceries, munchies, or SOS supplies with superfast delivery
          promises.
        </MotionSubtext>

        {/* Pill badge with slide-up */}
        <motion.div
          className="mt-6 rounded-full bg-white px-6 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#4D148C] shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 1,
          }}
        >
          Free delivery above ₹199 · Late-night Instamart cravings covered
        </motion.div>

        {/* Button with bounce-in */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 1.2,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onStartCall}
            className="mt-8 w-64 border-none bg-white font-mono text-[#ff5200] transition-all hover:scale-105 hover:bg-gray-100"
          >
            {startButtonText}
          </Button>
        </motion.div>
      </section>
    </div>
  );
};
