import Image from 'next/image';
import { Button } from '@/components/livekit/button';

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
    <div ref={ref} className="terminal-bg scanline h-full w-full">
      <section className="flex h-full flex-col items-center justify-center text-center relative pb-20">
        {/* Cyberpunk Logo */}
        <div className="mb-6 relative">
          <Image
            src="/cyberpunk-logo.png"
            alt="Cyberpunk"
            width={600}
            height={300}
            className="object-contain"
            priority
            style={{
              filter: 'drop-shadow(0 0 30px rgba(0, 255, 65, 0.6)) drop-shadow(0 0 60px rgba(0, 255, 65, 0.4))',
            }}
          />
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          onClick={onStartCall} 
          className="mt-2 w-64 font-mono border-2 border-[#00ff41] bg-[#0a0a0a] text-[#00ff41] hover:bg-[#00ff41] hover:text-[#050505] transition-all"
          style={{ textShadow: '0 0 5px #00ff41' }}
        >
          {startButtonText || 'START CALL'}
        </Button>
      </section>
    </div>
  );
};
