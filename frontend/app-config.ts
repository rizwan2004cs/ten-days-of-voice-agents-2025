export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Improv Battle',
  pageTitle: 'Improv Battle - AI-powered voice improv game show',
  pageDescription: 'AI-powered voice improv game show',

  supportsChatInput: false,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#8b5cf6',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#a78bfa',
  startButtonText: 'Start Improv Battle',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
