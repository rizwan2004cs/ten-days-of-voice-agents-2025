'use client';

import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionProvider } from '@/components/app/session-provider';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  // Check if this is Day 9 (E-commerce) - use full width layout
  const isDay9 = process.env.NEXT_PUBLIC_AGENT_DAY === '9' || 
                 appConfig.agentName?.toLowerCase().includes('ecommerce') ||
                 appConfig.agentName?.toLowerCase().includes('day9');

  return (
    <SessionProvider appConfig={appConfig}>
      <main className={isDay9 ? "h-svh w-full" : "grid h-svh grid-cols-1 place-content-center"}>
        <ViewController />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
