'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { BarVisualizer, useVoiceAssistant, useTranscriptions, useRoomContext } from '@livekit/components-react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Room } from 'livekit-client';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

interface CyberpunkTerminalViewProps {
  appConfig: AppConfig;
}

export const CyberpunkTerminalView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & CyberpunkTerminalViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const room = useRoomContext();
  const transcriptions = useTranscriptions();
  const [chatOpen, setChatOpen] = useState(true);
  const [startupComplete, setStartupComplete] = useState(false);
  const [startupText, setStartupText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [worldState, setWorldState] = useState<any>({
    player: { 
      hp: 100, 
      max_hp: 100, 
      mana: 50, 
      max_mana: 50, 
      inventory: [],
      name: 'Adventurer',
      class: 'Warrior',
      strength: 10,
      intelligence: 10,
      luck: 10,
      status: 'Healthy',
    },
    quests: [],
    current_location: 'Neo-Kyoto Alleyway',
    npcs: [],
    events: [],
    turn_count: 0,
  });

  const {
    state: agentState,
    audioTrack: agentAudioTrack,
  } = useVoiceAssistant();

  // Merge transcriptions with messages for real-time streaming display, deduplicating by ID
  const allMessages = useMemo(() => {
    // Create a map to track messages by ID, preferring completed messages over streaming ones
    const messageMap = new Map<string, any>();

    // First, add all completed messages
    messages.forEach((msg) => {
      messageMap.set(msg.id, {
        ...msg,
        isStreaming: false,
      });
    });

    // Then, add streaming transcriptions only if they don't already exist as completed messages
    transcriptions.forEach((transcription) => {
      const isLocal = transcription.participantInfo.identity === room.localParticipant.identity;
      const transcriptionId = transcription.streamInfo.id;
      
      // Only add if we don't already have a completed version
      if (!messageMap.has(transcriptionId)) {
        messageMap.set(transcriptionId, {
          id: transcriptionId,
          timestamp: transcription.streamInfo.timestamp,
          message: transcription.text,
          from: isLocal ? room.localParticipant : Array.from(room.remoteParticipants.values()).find(
            (p) => p.identity === transcription.participantInfo.identity
          ),
          isStreaming: true, // Mark as streaming
        });
      }
    });

    // Convert map to array and sort by timestamp
    const combined = Array.from(messageMap.values());
    return combined.sort((a, b) => a.timestamp - b.timestamp);
  }, [transcriptions, messages, room]);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: false,
    camera: false,
    screenShare: false,
  };

  // Startup sequence
  useEffect(() => {
    const startupSequence = [
      'System initializing...',
      'Connecting to neural net...',
      'Link established.',
      'Welcome to the Terminal.',
    ];
    
    let currentIndex = 0;
    let currentText = '';
    
    const typeInterval = setInterval(() => {
      if (currentIndex < startupSequence.length) {
        const targetText = startupSequence[currentIndex];
        if (currentText.length < targetText.length) {
          currentText = targetText.substring(0, currentText.length + 1);
          setStartupText(currentText);
        } else {
          currentIndex++;
          currentText = '';
          if (currentIndex < startupSequence.length) {
            setStartupText(prev => prev + '\n');
          }
        }
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setStartupComplete(true);
        }, 500);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && allMessages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [allMessages]);

  // Extract world state from messages (if agent sends it) - parse BEFORE messages are displayed
  useEffect(() => {
    // Check if any messages contain world state updates
    const hasWorldUpdate = allMessages.some((msg: any) => 
      msg?.from?.isAgent && 
      msg.message && 
      (msg.message.includes('<world_update>') || 
       msg.message.includes('<set_player_character') || 
       msg.message.includes('<set_location') ||
       msg.message.match(/\{[\s\S]*"player"[\s\S]*\}/))
    );
    
    if (!hasWorldUpdate) return;
    
    // Use functional update to build complete state from all messages
    setWorldState((prevState: any) => {
        const newWorldState: any = { ...prevState };
        
        // Re-parse all messages to build complete state
        allMessages.forEach((msg: any) => {
          if (msg?.from?.isAgent && msg.message) {
            const messageText = msg.message;
            const worldUpdateMatch = messageText.match(/<world_update>([\s\S]*?)<\/world_update>/i);
            
            if (worldUpdateMatch) {
              const worldUpdate = worldUpdateMatch[1];
              
              // Parse player character
              const playerMatch = worldUpdate.match(/<set_player_character\s+([^>]+)>([\s\S]*?)<\/set_player_character>/i);
              if (playerMatch) {
                const attrs = playerMatch[1];
                const content = playerMatch[2];
                
                const nameMatch = attrs.match(/name="([^"]+)"/i);
                const professionMatch = attrs.match(/profession="([^"]+)"/i);
                const hpMatch = attrs.match(/hp="(\d+)"/i);
                const maxHpMatch = attrs.match(/max_hp="(\d+)"/i);
                const manaMatch = attrs.match(/mana="(\d+)"/i);
                const maxManaMatch = attrs.match(/max_mana="(\d+)"/i);
                const statusMatch = attrs.match(/status="([^"]+)"/i);
                
                const inventoryItems: string[] = [];
                const inventoryMatches = content.matchAll(/<item\s+name="([^"]+)"[^>]*>/gi);
                for (const match of inventoryMatches) {
                  inventoryItems.push(match[1]);
                }
                
                const skills: any = {};
                const skillMatches = content.matchAll(/<skill\s+name="([^"]+)"\s+level="(\d+)"[^>]*>/gi);
                for (const match of skillMatches) {
                  skills[match[1].toLowerCase()] = parseInt(match[2]);
                }
                
                newWorldState.player = {
                  name: nameMatch ? nameMatch[1] : prevState?.player?.name || 'Adventurer',
                  class: professionMatch ? professionMatch[1] : prevState?.player?.class || 'Warrior',
                  hp: hpMatch ? parseInt(hpMatch[1]) : prevState?.player?.hp || 100,
                  max_hp: maxHpMatch ? parseInt(maxHpMatch[1]) : prevState?.player?.max_hp || 100,
                  mana: manaMatch ? parseInt(manaMatch[1]) : prevState?.player?.mana || 50,
                  max_mana: maxManaMatch ? parseInt(maxManaMatch[1]) : prevState?.player?.max_mana || 50,
                  inventory: inventoryItems.length > 0 ? inventoryItems : prevState?.player?.inventory || [],
                  status: statusMatch ? statusMatch[1] : prevState?.player?.status || 'Healthy',
                  strength: skills.strength || skills.combat || prevState?.player?.strength || 10,
                  intelligence: skills.intelligence || skills.tech || prevState?.player?.intelligence || 10,
                  luck: skills.luck || prevState?.player?.luck || 10,
                };
              }
              
              // Parse location
              const locationMatch = worldUpdate.match(/<set_location\s+name="([^"]+)"[^>]*>/i);
              if (locationMatch) {
                newWorldState.current_location = locationMatch[1];
              }
              
              // Parse NPCs
              const npcMatches = worldUpdate.matchAll(/<add_npc\s+name="([^"]+)"[^>]*role="([^"]+)"[^>]*>/gi);
              for (const match of npcMatches) {
                const npcName = match[1];
                const npcRole = match[2];
                newWorldState.npcs = newWorldState.npcs || [];
                if (!newWorldState.npcs.some((n: any) => n.name === npcName)) {
                  newWorldState.npcs.push({ name: npcName, role: npcRole, alive: true });
                }
              }
              
              // Parse Quests
              const questMatches = worldUpdate.matchAll(/<add_quest\s+id="([^"]+)"[^>]*title="([^"]+)"[^>]*status="([^"]+)"[^>]*>/gi);
              for (const match of questMatches) {
                const questId = match[1];
                const questTitle = match[2];
                const questStatus = match[3] || 'active';
                newWorldState.quests = newWorldState.quests || [];
                const existingQuest = newWorldState.quests.find((q: any) => q.id === questId);
                if (existingQuest) {
                  existingQuest.status = questStatus;
                } else {
                  newWorldState.quests.push({ id: questId, title: questTitle, status: questStatus });
                }
              }
              
              // Parse Events
              const eventMatches = worldUpdate.matchAll(/<add_event\s+type="([^"]*)"[^>]*description="([^"]+)"[^>]*>/gi);
              for (const match of eventMatches) {
                newWorldState.events = newWorldState.events || [];
                newWorldState.events.unshift({ type: match[1] || 'event', description: match[2] });
                if (newWorldState.events.length > 3) newWorldState.events.pop();
              }
              
              // Parse Turn Count
              const turnCountMatch = worldUpdate.match(/<set_turn_count\s+value="(\d+)"[^>]*>/i);
              if (turnCountMatch) {
                newWorldState.turn_count = parseInt(turnCountMatch[1]);
              }
            }
          }
        });
        
        console.log('Updated world state:', newWorldState);
        return newWorldState;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages]);

  if (!startupComplete) {
    return (
      <section className="relative z-10 h-full w-full overflow-hidden terminal-bg" {...props}>
        <div className="flex h-full items-center justify-center">
          <div className="border-2 border-[#00ff41] rounded-lg p-8 bg-[#0a0a0a]">
            <pre className="text-[#00ff41] font-mono text-sm" style={{ textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41' }}>
              {startupText}
              <span className="animate-pulse">_</span>
            </pre>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 h-full w-full overflow-hidden terminal-bg scanline" {...props}>
      {/* Three-Panel Grid Layout */}
      <div className="grid grid-cols-[300px_1fr_300px] gap-4 p-4 mb-24" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Panel 1: The Neuro-Link (Voice Visualizer) */}
        <div className="border-2 border-[#00ff41] rounded-lg p-4 bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
            <div className="mb-2 text-xs text-[#ffb300] flex-shrink-0" style={{ textShadow: '0 0 5px #ffb300, 0 0 10px #ffb300' }}>
              {'>'} INCOMING TRANSMISSION...
            </div>
            <div className="flex-1 flex items-center justify-center">
              {agentAudioTrack ? (
                <BarVisualizer
                  barCount={20}
                  state={agentState}
                  options={{ minHeight: 2 }}
                  trackRef={agentAudioTrack}
                  className="flex h-full w-full items-center justify-center gap-1"
                >
                  <span
                    className={cn([
                      'h-full w-1 rounded-full transition-colors duration-150',
                      'bg-[#00ff41]',
                      'data-[lk-highlighted=true]:bg-[#00ff41]',
                      'data-[lk-muted=true]:bg-[#003b00]',
                    ])}
                  />
                </BarVisualizer>
              ) : (
                <div className="text-[#003b00] text-xs">Awaiting signal...</div>
              )}
            </div>
        </div>

        {/* Panel 2: The Mainframe (Chat History) */}
        <div className="border-2 border-[#00ff41] rounded-lg p-4 bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
          <div className="mb-2 text-xs text-[#ffb300] flex-shrink-0" style={{ textShadow: '0 0 5px #ffb300, 0 0 10px #ffb300' }}>
            {'>'} MAINFRAME LOG
          </div>
          <ScrollArea ref={scrollAreaRef} className="flex-1 no-scrollbar overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="space-y-2 font-mono text-sm">
              {allMessages.map((msg: any) => {
                const isGM = !msg.from?.isLocal;
                const prefix = isGM ? '> SYSTEM (GM):' : '> USER (YOU):';
                
                // Strip XML/HTML tags from message for display - do this IMMEDIATELY
                let displayMessage = msg.message || '';
                // Remove world_update tags and their entire content (including nested tags)
                displayMessage = displayMessage.replace(/<world_update>[\s\S]*?<\/world_update>/gi, '');
                // Remove standalone XML tags like <update_location>, <set_player_character>, etc.
                displayMessage = displayMessage.replace(/<update_location[^>]*>/gi, '');
                displayMessage = displayMessage.replace(/<set_player_character[^>]*>[\s\S]*?<\/set_player_character>/gi, '');
                displayMessage = displayMessage.replace(/<item[^>]*>/gi, '');
                displayMessage = displayMessage.replace(/<skill[^>]*>/gi, '');
                displayMessage = displayMessage.replace(/<npc[^>]*>/gi, '');
                displayMessage = displayMessage.replace(/<quest[^>]*>/gi, '');
                // Remove any remaining XML/HTML tags (self-closing and regular)
                displayMessage = displayMessage.replace(/<[^>]+>/g, '');
                // Clean up extra whitespace and newlines (but preserve paragraph breaks)
                displayMessage = displayMessage.replace(/\n\s*\n/g, '\n\n'); // Preserve double newlines
                displayMessage = displayMessage.replace(/[ \t]+/g, ' '); // Collapse multiple spaces
                displayMessage = displayMessage.trim();
                
                // Only show message if there's content after stripping
                if (!displayMessage) return null;
                
                return (
                  <div key={msg.id} className="text-[#00ff41]">
                    <span 
                      className={cn(isGM && 'glow')}
                      style={isGM ? { textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41' } : {}}
                    >
                      {prefix} {displayMessage}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-[#00ff41] animate-pulse" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Panel 3: System Status (World State) */}
        <div className="border-2 border-[#00ff41] rounded-lg p-4 bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
          <div className="mb-2 text-xs text-[#ffb300] flex-shrink-0" style={{ textShadow: '0 0 5px #ffb300, 0 0 10px #ffb300' }}>
            {'>'} SYSTEM STATUS
          </div>
          <ScrollArea className="flex-1 text-xs font-mono no-scrollbar overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="space-y-4 text-[#00ff41]">
              {/* Player Stats */}
              <div>
                <div className="mb-1 text-[#ffb300]">PLAYER STATS</div>
                <div className="space-y-1">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>HP:</span>
                      <span>
                        {worldState.player?.hp || 100}/{worldState.player?.max_hp || 100}
                      </span>
                    </div>
                    <div className="h-2 bg-[#003b00] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#00ff41] transition-all"
                        style={{
                          width: `${
                            ((worldState.player?.hp || 100) /
                              (worldState.player?.max_hp || 100)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>MANA:</span>
                      <span>
                        {worldState.player?.mana || 50}/{worldState.player?.max_mana || 50}
                      </span>
                    </div>
                    <div className="h-2 bg-[#003b00] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#ffb300] transition-all"
                        style={{
                          width: `${
                            ((worldState.player?.mana || 50) /
                              (worldState.player?.max_mana || 50)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  {worldState.player?.status && (
                    <div className="mt-1">
                      STATUS: <span className="text-[#ffb300]">{worldState.player.status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Name and Class */}
              <div>
                <div className="mb-1 text-[#ffb300]">CHARACTER</div>
                <div className="text-[#00ff41] space-y-0.5">
                  <div>NAME: {worldState.player?.name || 'Adventurer'}</div>
                  <div>CLASS: {worldState.player?.class || 'Warrior'}</div>
                </div>
              </div>

              {/* Inventory */}
              {worldState.player?.inventory && worldState.player.inventory.length > 0 && (
                <div>
                  <div className="mb-1 text-[#ffb300]">INVENTORY</div>
                  <div className="space-y-0.5">
                    {worldState.player.inventory.map((item: string, idx: number) => (
                      <div key={idx} className="text-[#00ff41]">
                        {'>'} {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Location */}
              <div>
                <div className="mb-1 text-[#ffb300]">LOCATION</div>
                <div className="text-[#00ff41]">{worldState.current_location || 'Unknown'}</div>
              </div>

              {/* Player Attributes/Skills */}
              <div>
                <div className="mb-1 text-[#ffb300]">ATTRIBUTES</div>
                <div className="space-y-0.5 text-[#00ff41]">
                  <div>STR: {worldState.player?.strength || 10}</div>
                  <div>INT: {worldState.player?.intelligence || 10}</div>
                  <div>LUCK: {worldState.player?.luck || 10}</div>
                </div>
              </div>

              {/* Active Quests */}
              {worldState.quests && worldState.quests.length > 0 && (
                <div>
                  <div className="mb-1 text-[#ffb300]">ACTIVE QUESTS</div>
                  <div className="space-y-1">
                    {worldState.quests
                      .filter((q: any) => q.status === 'active')
                      .map((quest: any) => (
                        <div key={quest.id} className="text-[#00ff41]">
                          {'>'} {quest.title}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* NPCs */}
              {worldState.npcs && worldState.npcs.length > 0 && (
                <div>
                  <div className="mb-1 text-[#ffb300]">KNOWN NPCS</div>
                  <div className="space-y-0.5">
                    {worldState.npcs
                      .filter((npc: any) => npc.alive !== false)
                      .slice(0, 5)
                      .map((npc: any, idx: number) => (
                        <div key={idx} className="text-[#00ff41]">
                          {'>'} {npc.name} ({npc.role})
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Events */}
              {worldState.events && worldState.events.length > 0 && (
                <div>
                  <div className="mb-1 text-[#ffb300]">RECENT EVENTS</div>
                  <div className="space-y-0.5">
                    {worldState.events
                      .slice(-3)
                      .map((event: any, idx: number) => (
                        <div key={idx} className="text-[#00ff41] text-[10px]">
                          {'>'} {event.description || event.type}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Turn Count */}
              {worldState.turn_count && (
                <div>
                  <div className="mb-1 text-[#ffb300]">SESSION INFO</div>
                  <div className="text-[#00ff41] text-[10px]">
                    TURNS: {worldState.turn_count}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom: Command Input (Microphone Toggle) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
      </div>
    </section>
  );
};

