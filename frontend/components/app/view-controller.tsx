'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoomContext } from '@livekit/components-react';
import { useSession } from '@/components/app/session-provider';
import { SessionView } from '@/components/app/session-view';
import { EcommerceSessionView } from '@/components/app/ecommerce-session-view';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(SessionView);
const MotionEcommerceSessionView = motion.create(EcommerceSessionView);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

export function ViewController() {
  const room = useRoomContext();
  const isSessionActiveRef = useRef(false);
  const { appConfig, isSessionActive, startSession } = useSession();

  // Check if this is Day 9 (E-commerce agent)
  const isDay9 = process.env.NEXT_PUBLIC_AGENT_DAY === '9' || 
                 appConfig.agentName?.toLowerCase().includes('ecommerce') ||
                 appConfig.agentName?.toLowerCase().includes('day9');

  // animation handler holds a reference to stale isSessionActive value
  isSessionActiveRef.current = isSessionActive;

  // disconnect room after animation completes
  const handleAnimationComplete = () => {
    if (!isSessionActiveRef.current && room.state !== 'disconnected') {
      room.disconnect();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* For Day 9: Always show e-commerce storefront (main page) */}
      {isDay9 && (
        <MotionEcommerceSessionView
          key="ecommerce-main"
          {...VIEW_MOTION_PROPS}
          appConfig={appConfig}
          isSessionActive={isSessionActive}
          onStartCall={startSession}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
      {/* For other days: Show welcome screen when not active */}
      {!isDay9 && !isSessionActive && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={startSession}
        />
      )}
      {/* For other days: Show session view when active */}
      {!isDay9 && isSessionActive && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          appConfig={appConfig}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </AnimatePresence>
  );
}
