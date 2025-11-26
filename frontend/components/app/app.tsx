'use client';

import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionProvider } from '@/components/app/session-provider';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { ErrorBoundary } from '@/components/app/error-boundary';

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const agentDay = process.env.NEXT_PUBLIC_AGENT_DAY || '2';
  const gradientClass =
    agentDay === '6'
      ? 'bank-gradient'
      : agentDay === '4'
        ? 'pw-gradient'
        : agentDay === '3'
          ? 'apollo-gradient'
          : 'zepto-gradient';
  
  const mainScrollClass =
    agentDay === '6'
      ? 'overflow-hidden'
      : 'overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]';

  return (
    <ErrorBoundary>
      <SessionProvider appConfig={appConfig}>
        <main className={`${gradientClass} min-h-screen w-full ${mainScrollClass}`}>
          <ViewController />
        </main>
        <StartAudio label="Start Audio" />
        <RoomAudioRenderer />
        <Toaster />
      </SessionProvider>
    </ErrorBoundary>
  );
}
