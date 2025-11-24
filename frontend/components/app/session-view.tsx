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
    agentDay === '4'
      ? 'pw-gradient'
      : agentDay === '3'
        ? 'apollo-gradient'
        : 'zepto-gradient';
  
  return (
    <section className={`${gradientClass} relative z-10 h-full w-full overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} {...props}>
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
            "pt-40 pb-[150px] md:pb-[180px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            orderDetails ? "px-4 md:pl-[28rem] md:pr-6" : "px-4 md:px-6"
          )}
        >
          <ChatTranscript
            hidden={messages.length === 0}
            messages={messages}
            className={cn(
              "space-y-3 transition-opacity duration-300 ease-out",
              orderDetails ? "ml-auto max-w-2xl" : "mx-auto max-w-2xl"
            )}
          />
        </ScrollArea>
      </div>

      {/* Tile Layout - Center (hidden when receipt is shown) */}
      <TileLayout chatOpen={chatOpen} orderDetails={orderDetails} />

      {/* Bottom Control Bar - Right Side */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className={cn(
          "fixed bottom-0 z-50",
          orderDetails 
            ? "right-4 md:right-8 left-auto" 
            : "inset-x-3 md:inset-x-12"
        )}
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className={cn(
          "relative pb-3 md:pb-12",
          orderDetails ? "ml-auto max-w-2xl" : "mx-auto max-w-2xl"
        )}>
          <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
        </div>
      </MotionBottom>
    </section>
  );
};
