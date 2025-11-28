'use client';

import type { AppConfig } from '@/app-config';
import { CyberpunkTerminalView } from '@/components/app/cyberpunk-terminal-view';

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  return <CyberpunkTerminalView appConfig={appConfig} {...props} />;
};
