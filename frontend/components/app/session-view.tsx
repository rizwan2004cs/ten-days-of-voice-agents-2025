'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import { useSession } from '@/components/app/session-provider';
import { useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { OrderReceipt } from './order-receipt';
import { AnimatePresence } from 'motion/react';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const orderDetails = useOrderDetails(messages);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isSessionActive } = useSession();
  const room = useRoomContext();

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  // Auto-open chat when session starts or when messages arrive
  useEffect(() => {
    if (isSessionActive && !chatOpen) {
      setChatOpen(true);
    }
  }, [isSessionActive, chatOpen]);

  // Auto-open chat when messages arrive and ensure transcriptions are visible
  useEffect(() => {
    if (messages.length > 0 && !chatOpen) {
      setChatOpen(true);
    }
  }, [messages.length, chatOpen]);

  // Auto-scroll to bottom when new messages arrive (including transcriptions)
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Ensure microphone is enabled when session is active
  useEffect(() => {
    if (isSessionActive && room && room.state === 'connected') {
      const checkAndEnableMic = async () => {
        try {
          const micPublication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          if (!micPublication || micPublication.isMuted) {
            console.log('SessionView: Ensuring microphone is enabled...');
            await room.localParticipant.setMicrophoneEnabled(true);
          }
        } catch (error) {
          console.error('SessionView: Error ensuring microphone is enabled:', error);
        }
      };
      
      // Check immediately and then periodically
      checkAndEnableMic();
      const interval = setInterval(checkAndEnableMic, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isSessionActive, room]);

  const agentDay = process.env.NEXT_PUBLIC_AGENT_DAY || '2';
  const gradientClass =
    agentDay === '6'
      ? 'bank-gradient'
      : agentDay === '4'
        ? 'pw-gradient'
        : agentDay === '3'
          ? 'apollo-gradient'
          : 'zepto-gradient';
  const transcriptPanelClass = cn(
    'space-y-3 transition-opacity duration-300 ease-out rounded-[32px] border px-6 py-6 backdrop-blur-2xl',
    orderDetails ? 'ml-auto max-w-2xl' : 'mx-auto max-w-2xl',
    agentDay === '4'
      ? 'bg-slate-950/60 border-white/10 shadow-[0_30px_140px_rgba(8,15,45,0.65)]'
      : agentDay === '3'
        ? 'bg-slate-900/70 border-cyan-200/15 shadow-[0_30px_140px_rgba(5,30,55,0.55)]'
        : agentDay === '6'
          ? 'bg-[#2b0411]/75 border-pink-200/20 shadow-[0_30px_140px_rgba(120,10,60,0.7)]'
          : 'bg-[#120822]/70 border-purple-200/15 shadow-[0_30px_140px_rgba(25,10,50,0.6)]'
  );
  const controlSurfaceClass = cn(
    'rounded-[28px] border px-4 py-3 backdrop-blur-2xl',
    agentDay === '4'
      ? 'border-white/10 bg-slate-950/80 shadow-[0_25px_120px_rgba(8,15,45,0.55)]'
      : agentDay === '3'
        ? 'border-cyan-200/15 bg-slate-900/80 shadow-[0_25px_120px_rgba(4,25,50,0.5)]'
        : agentDay === '6'
          ? 'border-pink-200/25 bg-[#18000a]/90 shadow-[0_25px_120px_rgba(140,10,60,0.6)]'
          : 'border-purple-200/15 bg-[#0c0618]/85 shadow-[0_25px_120px_rgba(20,6,40,0.55)]'
  );
  
  return (
    <section
      className={`${gradientClass} relative z-10 min-h-screen w-full overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <ThemeBackground agentDay={agentDay} />
      </div>
      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Order Receipt - Fixed Left Position */}
        <AnimatePresence mode="wait">
          {orderDetails && (
            <motion.div
              key="receipt-container"
              className="fixed left-4 md:left-8 top-20 md:top-24 z-50 pointer-events-none"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-80 md:w-96">
                <OrderReceipt order={orderDetails} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Transcript - Right Side */}
        <div
          className={cn(
            'fixed inset-0 grid grid-cols-1 grid-rows-1 z-40',
            !chatOpen && 'pointer-events-none'
          )}
        >
          <ScrollArea
            ref={scrollAreaRef}
            className={cn(
              'pt-40 pb-[150px] md:pb-[180px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
              orderDetails ? 'px-4 md:pl-[28rem] md:pr-6' : 'px-4 md:px-6'
            )}
          >
            <ChatTranscript
              hidden={messages.length === 0}
              messages={messages}
              className={transcriptPanelClass}
            />
          </ScrollArea>
        </div>

        {/* Tile Layout - Center (hidden when receipt is shown) */}
        <TileLayout chatOpen={chatOpen} orderDetails={orderDetails} />

        {/* Bottom Control Bar - Right Side */}
        <MotionBottom
          {...BOTTOM_VIEW_MOTION_PROPS}
          className={cn(
            'fixed bottom-0 z-50',
            orderDetails ? 'right-4 md:right-8 left-auto' : 'inset-x-3 md:inset-x-12'
          )}
        >
          {appConfig.isPreConnectBufferEnabled && (
            <PreConnectMessage messages={messages} className="pb-4" />
          )}
          <div
            className={cn(
              'relative pb-3 md:pb-12',
              orderDetails ? 'ml-auto max-w-2xl' : 'mx-auto max-w-2xl'
            )}
          >
            <div className={controlSurfaceClass}>
              <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
            </div>
          </div>
        </MotionBottom>
      </div>
    </section>
  );
};

interface ThemeBackgroundProps {
  agentDay: string;
}

const particlePositions = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index * 17) % 100}%`,
  top: `${(index * 29) % 100}%`,
}));

function FloatingParticles({
  colorClass,
  drift = 18,
  scale = [0.9, 1.35, 0.9],
}: {
  colorClass: string;
  drift?: number;
  scale?: [number, number, number];
}) {
  return (
    <>
      {particlePositions.map((position, index) => (
        <motion.span
          key={`${colorClass}-${index}`}
          className={cn(
            'absolute h-1.5 w-1.5 rounded-full blur-[0.5px]',
            colorClass
          )}
          style={position}
          animate={{
            opacity: [0.15, 0.6, 0.15],
            y: [0, -drift, 0],
            scale,
          }}
          transition={{
            duration: 6 + ((index + 1) % 4),
            repeat: Infinity,
            delay: index * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

function ThemeBackground({ agentDay }: ThemeBackgroundProps) {
  if (agentDay === '4') {
    return <TeacherSessionBackground />;
  }
  if (agentDay === '3') {
    return <ApolloSessionBackground />;
  }
  return <CoffeeSessionBackground />;
}

function TeacherSessionBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <FloatingParticles colorClass="bg-white/40" drift={20} />
      </div>
      <div className="absolute inset-0">
        <div className="absolute -left-16 top-6 h-72 w-72 rounded-full bg-cyan-400/25 blur-[140px]" />
        <div className="absolute right-[-5%] top-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute left-1/3 -bottom-24 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_75%_65%,rgba(14,165,233,0.12),transparent_50%)] opacity-70" />
      </div>
    </>
  );
}

function ApolloSessionBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <FloatingParticles colorClass="bg-cyan-200/60" drift={24} scale={[0.8, 1.2, 0.8]} />
      </div>
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-sky-500/25 blur-[170px]" />
        <div className="absolute right-[-10%] top-1/4 h-72 w-72 rounded-full bg-teal-400/25 blur-[150px]" />
        <div className="absolute left-1/4 -bottom-24 h-96 w-96 rounded-full bg-blue-900/40 blur-[200px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.15),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.15),transparent_50%)] opacity-70" />
      </div>
    </>
  );
}

function CoffeeSessionBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <FloatingParticles colorClass="bg-purple-200/60" drift={22} scale={[0.85, 1.25, 0.85]} />
      </div>
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-fuchsia-500/25 blur-[160px]" />
        <div className="absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-indigo-500/30 blur-[160px]" />
        <div className="absolute left-1/3 -bottom-28 h-96 w-96 rounded-full bg-purple-900/40 blur-[200px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.15),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(147,51,234,0.12),transparent_50%)] opacity-80" />
      </div>
    </>
  );
}
