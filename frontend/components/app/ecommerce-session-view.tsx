'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
// Chat transcript removed for store-first design
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind, RoomEvent } from 'livekit-client';
import { useChatMessages } from '@/hooks/useChatMessages';
import FilterStatusBar from './filter-status-bar';
import ActiveFiltersChips from './active-filters-chips';
import ManualFilters from './manual-filters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url: string;
  rating: number;
  reviews: number;
}

interface Order {
  id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_amount: number;
    currency: string;
  }>;
  total: number;
  currency: string;
  status: string;
  created_at: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_amount: number;
  currency: string;
}

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      y: 0,
    },
    hidden: {
      opacity: 0,
      y: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: [0.4, 0, 0.2, 1] as const,
  },
} as const;

interface EcommerceSessionViewProps {
  appConfig: AppConfig;
  isSessionActive?: boolean;
  onStartCall?: () => void;
  onAnimationComplete?: () => void;
}

export const EcommerceSessionView = ({
  appConfig,
  isSessionActive = false,
  onStartCall,
  onAnimationComplete,
  ...props
}: React.ComponentProps<'section'> & EcommerceSessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  // Call onAnimationComplete when component mounts (animation complete)
  useEffect(() => {
    if (onAnimationComplete) {
      // Small delay to match animation duration
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  const room = useRoomContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null);
  const [filterMinPrice, setFilterMinPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'orders' | 'cart'>('orders');
  const [isListening, setIsListening] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  
  // Get agent messages for parsing
  const messages = useChatMessages();
  
  // Helper: Parse agent message to extract filter parameters
  const parseAgentMessageForFilters = useCallback((messageText: string) => {
    const lowerText = messageText.toLowerCase();
    const originalText = messageText;
    const filters: {
      searchTerm?: string;
      category?: string | null;
      maxPrice?: number | null;
      minPrice?: number | null;
      sortBy?: string | null;
      clearAll?: boolean; // Flag to indicate all filters should be cleared
    } = {};
    
    // ========== EXTRACT PRICE RANGES ==========
    
    // Extract max price - more comprehensive patterns
    const maxPricePatterns = [
      /(?:under|below|less than|up to|maximum|max|maximum price of|cheaper than|lower than)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000|grand)?/i,
      /(?:₹|rs\.?|inr|rupees?)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000|grand)?\s*(?:or less|and below|and under)/i,
      /price.*?(?:under|below|less than|up to|maximum|max)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?/i,
    ];
    
    for (const pattern of maxPricePatterns) {
      const match = lowerText.match(pattern);
      if (match && match[1]) {
        let price = match[1].replace(/,/g, '');
        const priceNum = parseFloat(price);
        
        // Check if the number itself is already large (>= 1000), don't multiply
        // Only multiply if it's a small number (< 1000) AND has "thousand", "k", or "grand" mentioned
        const context = lowerText.substring(Math.max(0, match.index! - 20), Math.min(lowerText.length, match.index! + match[0].length + 20));
        const hasThousandKeyword = /\b(thousand|k|grand)\b/i.test(context);
        
        // Only multiply if:
        // 1. The number is small (< 1000) - meaning it's likely "10" with "thousand" mentioned
        // 2. AND there's a thousand keyword in the context
        // Don't multiply if the number is already >= 1000 (like "10000")
        if (hasThousandKeyword && priceNum < 1000 && !isNaN(priceNum)) {
          price = (priceNum * 1000).toString();
        }
        
        const finalPrice = parseInt(price, 10);
        if (!isNaN(finalPrice) && finalPrice > 0) {
          filters.maxPrice = finalPrice;
          console.log('💰 Extracted max price:', finalPrice, 'from:', match[0]);
          break;
        }
      }
    }
    
    // Extract min price - more comprehensive patterns
    const minPricePatterns = [
      /(?:above|more than|at least|minimum|min|minimum price of|from|starting from|greater than)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000|grand)?/i,
      /(?:₹|rs\.?|inr|rupees?)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000|grand)?\s*(?:or more|and above|and up)/i,
      /price.*?(?:above|more than|at least|minimum|from)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?/i,
    ];
    
    for (const pattern of minPricePatterns) {
      const match = lowerText.match(pattern);
      if (match && match[1]) {
        let price = match[1].replace(/,/g, '');
        const priceNum = parseFloat(price);
        
        // Check if the number itself is already large (>= 1000), don't multiply
        // Only multiply if it's a small number (< 1000) AND has "thousand", "k", or "grand" mentioned
        const context = lowerText.substring(Math.max(0, match.index! - 20), Math.min(lowerText.length, match.index! + match[0].length + 20));
        const hasThousandKeyword = /\b(thousand|k|grand)\b/i.test(context);
        
        // Only multiply if:
        // 1. The number is small (< 1000) - meaning it's likely "10" with "thousand" mentioned
        // 2. AND there's a thousand keyword in the context
        // Don't multiply if the number is already >= 1000 (like "10000")
        if (hasThousandKeyword && priceNum < 1000 && !isNaN(priceNum)) {
          price = (priceNum * 1000).toString();
        }
        
        const finalPrice = parseInt(price, 10);
        if (!isNaN(finalPrice) && finalPrice > 0) {
          filters.minPrice = finalPrice;
          console.log('💰 Extracted min price:', finalPrice, 'from:', match[0]);
          break;
        }
      }
    }
    
    // Pattern: "between ₹X and ₹Y" or "₹X to ₹Y"
    const betweenPatterns = [
      /between\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?\s*(?:and|to|-)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?/i,
      /(?:₹|rs\.?|inr|rupees?)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?\s*(?:to|-|and)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k|000)?/i,
    ];
    
    for (const pattern of betweenPatterns) {
      const match = lowerText.match(pattern);
      if (match && match[1] && match[2]) {
        let minPrice = match[1].replace(/,/g, '');
        let maxPrice = match[2].replace(/,/g, '');
        const minPriceNum = parseFloat(minPrice);
        const maxPriceNum = parseFloat(maxPrice);
        
        // Check if numbers are already large (>= 1000), don't multiply
        // Only multiply if they're small numbers (< 1000) AND has "thousand", "k", or "grand" mentioned
        const context = lowerText.substring(Math.max(0, match.index! - 20), Math.min(lowerText.length, match.index! + match[0].length + 20));
        const hasThousandKeyword = /\b(thousand|k|grand)\b/i.test(context);
        
        // Only multiply if:
        // 1. The numbers are small (< 1000) - meaning it's likely "10" with "thousand" mentioned
        // 2. AND there's a thousand keyword in the context
        // Don't multiply if the numbers are already >= 1000 (like "10000")
        if (hasThousandKeyword && minPriceNum < 1000 && maxPriceNum < 1000 && !isNaN(minPriceNum) && !isNaN(maxPriceNum)) {
          minPrice = (minPriceNum * 1000).toString();
          maxPrice = (maxPriceNum * 1000).toString();
        }
        
        const minNum = parseInt(minPrice, 10);
        const maxNum = parseInt(maxPrice, 10);
        if (!isNaN(minNum) && !isNaN(maxNum) && minNum > 0 && maxNum > 0) {
          filters.minPrice = Math.min(minNum, maxNum);
          filters.maxPrice = Math.max(minNum, maxNum);
          console.log('💰 Extracted price range:', filters.minPrice, 'to', filters.maxPrice, 'from:', match[0]);
          break;
        }
      }
    }
    
    // ========== EXTRACT SEARCH TERMS ==========
    
    // PRIORITY 0: Check for "show all products" intent - if detected, don't extract any search terms
    // This prevents extracting keywords from product listings when user wants to see everything
    // IMPORTANT: "I found 4 cameras" is NOT "show all" - it's a filtered search
    // Only "I found 22 products" (large number + generic "products") indicates "show all"
    const showAllPatterns = [
      /(?:show|display|list|see|view|get|find)\s+(?:all|every|each)\s+(?:products?|items?|things?)/i,
      /(?:all|every)\s+(?:products?|items?|things?)/i,
      /(?:i\s+)?found\s+\d{2,}\s+products?\s*[.!]?$/i, // "I found 22 products" (large number) - indicates listing all
      /here\s+are\s+(?:all|the)\s+(?:products?|items?)/i, // "here are all products" but NOT "here are some"
      /showing\s+(?:all|every)\s+(?:products?|items?)/i,
    ];
    
    const isShowAllIntent = showAllPatterns.some(pattern => pattern.test(lowerText));
    
    // If it's a "show all" intent, don't extract any search terms
    if (isShowAllIntent) {
      console.log('🔍 Detected "show all products" intent - skipping search term extraction');
      // Return empty filters to trigger clearing
      return {
        searchTerm: null,
        category: null,
        maxPrice: null,
        minPrice: null,
        sortBy: null,
        clearAll: true, // Flag to indicate all filters should be cleared
      };
    }
    
    // PRIORITY 1: Extract common product keywords FIRST (before pattern matching)
    // This ensures "cameras", "echo", etc. are extracted even if agent phrases are present
    // ALWAYS extract common keywords - they represent user intent (e.g., "I found 4 cameras" means user asked for cameras)
    // Check for plural forms first, then singular
    const commonKeywords = [
      'cameras', 'camera', 
      'speakers', 'speaker', 
      'tablets', 'tablet', 
      'doorbells', 'doorbell', 
      'security systems', 'security system', 'security',
      'smart home', 'smart homes',
      'lighting', 'lights',
      'thermostats', 'thermostat', 
      'locks', 'lock', 
      'switches', 'switch',
      'e-readers', 'e-reader', 'ereaders', 'ereader',
      'echo', 'echoes', // Add echo products
    ];
    
    // Sort by length (longest first) to match "security systems" before "security"
    const sortedKeywords = commonKeywords.sort((a, b) => b.length - a.length);
    
    // ALWAYS check for common keywords - they represent user intent
    // Even if it's a product listing, "I found 4 cameras" means the user asked for cameras
    for (const keyword of sortedKeywords) {
      // Use word boundary to avoid partial matches
      const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(lowerText)) {
        filters.searchTerm = keyword;
        console.log('🔍 Extracted search term from common keyword:', keyword, 'from message:', lowerText.substring(0, 100));
        break; // Found a common keyword, use it and skip pattern matching
      }
    }
    
    // PRIORITY 2: If no common keyword found, try pattern matching
    // First, filter out common agent response phrases that shouldn't be extracted as search terms
    if (!filters.searchTerm) {
      const agentResponsePhrases = [
        /^here are (some|all|the)\s+/i,
        /^i have (found|removed|updated|set)\s+/i,
        /^i found\s+/i,
        /^these are\s+/i,
        /^here (is|are)\s+/i,
      ];
      
      // Check if message starts with agent response phrase - if so, extract from after the phrase
      let searchableText = originalText;
      for (const phrasePattern of agentResponsePhrases) {
        if (phrasePattern.test(originalText)) {
          // Extract text after the phrase
          const match = originalText.match(phrasePattern);
          if (match) {
            searchableText = originalText.substring(match[0].length).trim();
            console.log('🔍 Filtered out agent response phrase, searching in:', searchableText.substring(0, 50));
          }
          break;
        }
      }
      
      // Check if this looks like a product listing (agent listing products, not user search)
      // If it's a listing, don't extract product names from it
      const isProductListing = /(?:found|here are|showing|these are|products?:|items?:)\s+[^.!?]*(?:echo|kindle|fire|ring|blink|wyze|philips|smart|nest|roku)/i.test(lowerText);
      
      // List of known product brand/name prefixes to avoid extracting
      const productBrands = ['blink', 'ring', 'echo', 'kindle', 'fire', 'wyze', 'philips', 'nest', 'roku', 'smart'];
      
      const searchPatterns = [
        // "show me X", "find X", "search for X", "looking for X", "I want X", "I need X", "I asked for X"
        /(?:show me|find|search for|looking for|i want|i need|get me|display|show|list|browse|i asked for|asked for|i'm looking for)\s+([^,.!?]+?)(?:\s+(?:under|below|above|between|sorted|by|in|from|with|that|which))?/i,
        // "X products", "X items", "X cameras" - but avoid "Here are some X products" or "some X products"
        // Only match if it's a single word or short phrase before "products"
        /(?:^|[^h])([a-z]+(?:\s+[a-z]+){0,2})\s+(?:products?|items?|cameras?|devices?|gadgets?)(?:\s|$|:)/i,
        // "products called X", "items named X"
        /(?:products?|items?|cameras?)\s+(?:called|named|like|such as|including)\s+([^,.!?]+)/i,
        // Generic product keywords - expanded patterns
        /(?:looking for|want|need|show|find|asked for|asked|searching for|searching)\s+(cameras?|speakers?|tablets?|e-readers?|doorbells?|security\s+systems?|smart\s+home|lighting|thermostats?|echo)/i,
      ];
      
      for (const pattern of searchPatterns) {
        const match = searchableText.match(pattern);
        if (match && match[1]) {
          let term = match[1].trim();
          // Clean up the term - remove common agent phrases
          term = term.replace(/^(here are|here is|i have|i found|these are|some|all|the)\s+/i, '');
          term = term.replace(/\s+(under|below|above|between|sorted|by|in|from|with|that|which).*$/i, '');
          
          // Skip if it's a product brand/name (when it's a listing)
          const termLower = term.toLowerCase();
          const isProductBrand = productBrands.some(brand => termLower.startsWith(brand) || termLower.includes(brand));
          
          // Skip if it's just a price, currency, or common filter words
          // Also skip if it's a full sentence (contains "are" or "is" in the middle)
          // Skip if it contains multiple words that look like a sentence
          // Skip product brands if it's a listing
          if (!term.match(/^(under|below|above|between|₹|rs|inr|\d+|sort|price|category|here|some|all|the)/i) 
              && !term.match(/\s+(are|is|have|found)\s+/i) 
              && term.length > 2 
              && term.length < 30  // Reduced from 50 to avoid long phrases
              && term.split(/\s+/).length <= 3 // Limit to 3 words max
              && !(isProductListing && isProductBrand)) { // Don't extract product brands from listings
            filters.searchTerm = term;
            console.log('🔍 Extracted search term from pattern:', term);
            break; // Found a match, stop searching
          }
        }
      }
    }
    
    // PRIORITY 3: Extract specific product names ONLY if no common keyword was found
    // This prevents extracting product names from listings when user asked for a category
    // NEVER extract product names from listings - only from explicit search queries
    if (!filters.searchTerm) {
      // Check if this is a product listing (agent showing products)
      const isProductListing = /(?:found|here are|showing|these are|products?:|items?:)\s+[^.!?]*(?:echo|kindle|fire|ring|blink|wyze|philips|smart|nest|roku)/i.test(lowerText);
      
      // If it's a listing, don't extract product names
      if (!isProductListing) {
        const productNames = [
          'echo dot', 'echo show', 'echo studio', 'echo buds',
          'kindle paperwhite', 'kindle oasis', 'kindle',
          'fire tv', 'fire tablet', 'fire tv stick', 'fire tv cube',
          'ring doorbell', 'ring floodlight', 'ring alarm',
          'blink outdoor', 'blink mini', 'blink',
          'wyze cam', 'wyze',
          'philips hue', 'philips',
          'smart plug', 'smart lock', 'smart switch',
          'nest thermostat', 'nest',
          'roku',
        ];
        
        for (const productName of productNames) {
          if (lowerText.includes(productName)) {
            // Only extract if it appears in a search context, not just in a product listing
            // Check if message contains "found", "here are", "options" (product listing) vs "show", "find", "looking" (search intent)
            const isSearchIntent = /(?:show|find|looking|search|want|need|asked)/i.test(lowerText);
            
            // Only extract if it's clearly a search intent
            if (isSearchIntent) {
              filters.searchTerm = productName;
              console.log('🔍 Extracted search term from product name:', productName);
              break;
            }
          }
        }
      } else {
        console.log('🔍 Skipping product name extraction - appears to be a product listing');
      }
    }
    
    // ========== EXTRACT CATEGORIES ==========
    
    // Map to actual categories in catalog: electronics, smart-home, home-security
    const categoryKeywords: Record<string, string> = {
      // Smart home
      'smart home': 'smart-home',
      'smart-home': 'smart-home',
      'smart home devices': 'smart-home',
      'smart devices': 'smart-home',
      'home automation': 'smart-home',
      'automation': 'smart-home',
      'smart lighting': 'smart-home',
      'smart thermostat': 'smart-home',
      'smart plug': 'smart-home',
      'smart switch': 'smart-home',
      'smart lock': 'smart-home',
      'hue': 'smart-home',
      'philips hue': 'smart-home',
      'nest': 'smart-home',
      'thermostat': 'smart-home',
      
      // Home security
      'home security': 'home-security',
      'home-security': 'home-security',
      'security': 'home-security',
      'security camera': 'home-security',
      'security cameras': 'home-security',
      'camera': 'home-security', // Most cameras are in home-security
      'cameras': 'home-security',
      'doorbell': 'home-security',
      'doorbells': 'home-security',
      'alarm': 'home-security',
      'alarms': 'home-security',
      'ring': 'home-security',
      'blink': 'home-security',
      'wyze': 'home-security',
      
      // Electronics (default for most tech products)
      'electronics': 'electronics',
      'electronic': 'electronics',
      'smartphone': 'electronics',
      'phone': 'electronics',
      'tablet': 'electronics',
      'laptop': 'electronics',
      'speaker': 'electronics',
      'speakers': 'electronics',
      'audio': 'electronics',
      'headphone': 'electronics',
      'earbuds': 'electronics',
      'earbud': 'electronics',
      'echo': 'electronics',
      'kindle': 'electronics',
      'fire': 'electronics',
      'roku': 'electronics',
      'streaming': 'electronics',
      'e-reader': 'electronics',
      'ereader': 'electronics',
    };
    
    // Check for category keywords (longest matches first)
    const sortedCategoryKeywords = Object.entries(categoryKeywords).sort((a, b) => b[0].length - a[0].length);
    for (const [keyword, category] of sortedCategoryKeywords) {
      if (lowerText.includes(keyword)) {
        filters.category = category;
        break;
      }
    }
    
    // ========== EXTRACT SORT OPTIONS ==========
    
    // More comprehensive sort pattern matching
    const sortPatterns = [
      // Price sorting
      { pattern: /(?:sort|sorted|order|arrange|organize|show).*?(?:by|according to).*?(?:price|cost).*?(?:low|cheap|ascending|asc|lowest|smallest|minimum)/i, value: 'price_asc' },
      { pattern: /(?:cheapest|lowest price|low price|price.*?low)/i, value: 'price_asc' },
      { pattern: /(?:sort|sorted|order|arrange|organize|show).*?(?:by|according to).*?(?:price|cost).*?(?:high|expensive|descending|desc|highest|largest|maximum)/i, value: 'price_desc' },
      { pattern: /(?:most expensive|highest price|high price|price.*?high)/i, value: 'price_desc' },
      
      // Rating sorting
      { pattern: /(?:sort|sorted|order|arrange|organize|show).*?(?:by|according to).*?(?:rating|rated|stars?|review|reviews)/i, value: 'rating_desc' },
      { pattern: /(?:highest rated|best rated|top rated|highest rating)/i, value: 'rating_desc' },
      { pattern: /(?:most reviews|highest reviews)/i, value: 'rating_desc' },
      
      // Name sorting
      { pattern: /(?:sort|sorted|order|arrange|organize|show).*?(?:by|according to).*?(?:name|alphabetical|alphabet).*?(?:a to z|ascending|asc)/i, value: 'name_asc' },
      { pattern: /(?:sort|sorted|order|arrange|organize|show).*?(?:by|according to).*?(?:name|alphabetical|alphabet).*?(?:z to a|descending|desc)/i, value: 'name_desc' },
      { pattern: /(?:alphabetically|alphabetical order)/i, value: 'name_asc' },
    ];
    
    for (const { pattern, value } of sortPatterns) {
      if (pattern.test(lowerText)) {
        filters.sortBy = value;
        break;
      }
    }
    
    // Debug logging
    if (Object.keys(filters).length > 0) {
      console.log('🔍 Parsed filters from message:', {
        message: messageText.substring(0, 100),
        extracted: filters
      });
    }
    
    return filters;
  }, []);
  
  // Parse agent messages to extract and apply filters
  useEffect(() => {
    if (!isSessionActive) {
      console.log('⏸️ Session not active, skipping message parsing');
      return;
    }
    
    if (messages.length === 0) {
      console.log('⏸️ No messages available yet');
      return;
    }
    
    console.log(`📨 Total messages: ${messages.length}`);
    console.log('📨 All messages:', messages.map(m => ({
      id: m.id,
      message: m.message?.substring(0, 50),
      isLocal: m.from?.isLocal,
      from: m.from?.identity
    })));
    
    // Get the latest agent message (not from user)
    const agentMessages = messages.filter(msg => !msg.from?.isLocal);
    console.log(`📨 Agent messages: ${agentMessages.length}`);
    
    if (agentMessages.length === 0) {
      console.log('⏸️ No agent messages found');
      return;
    }
    
    const latestAgentMessage = agentMessages[agentMessages.length - 1];
    const messageText = latestAgentMessage.message || '';
    
    console.log('📨 Latest agent message:', {
      id: latestAgentMessage.id,
      message: messageText.substring(0, 100),
      messageLength: messageText.length,
      isLocal: latestAgentMessage.from?.isLocal,
      lastProcessedId: lastProcessedMessageId.current
    });
    
    // Handle streaming messages: transcriptions come in chunks with the same ID
    // We need to track message length to detect when it's complete
    const currentLength = messageText.length;
    const processedKey = `${latestAgentMessage.id}_${currentLength}`;
    
    // Check if we've already processed this exact message (ID + length combination)
    if (lastProcessedMessageId.current === processedKey) {
      console.log('⏸️ Message already processed (same ID and length):', processedKey);
      return;
    }
    
    // Skip if message is too short (likely still streaming)
    if (currentLength < 20) {
      console.log('⏸️ Message too short (likely streaming):', messageText);
      // Don't mark as processed - wait for more content
      return;
    }
    
    // Check if this is a streaming update of a message we've seen before
    // Extract the ID from lastProcessedMessageId (format: "id_length")
    const lastProcessedParts = lastProcessedMessageId.current?.split('_') || [];
    const lastProcessedId = lastProcessedParts[0];
    const lastProcessedLen = lastProcessedParts[1] ? parseInt(lastProcessedParts[1], 10) : 0;
    const isStreamingUpdate = lastProcessedId === latestAgentMessage.id;
    
    if (isStreamingUpdate) {
      // If message hasn't grown significantly (less than 30 chars), skip
      if (currentLength <= lastProcessedLen + 30) {
        console.log('⏸️ Message streaming but no significant new content', {
          lastProcessed: lastProcessedLen,
          current: currentLength,
          diff: currentLength - lastProcessedLen
        });
        return;
      }
      console.log('📝 Message updated significantly, processing...', {
        lastProcessed: lastProcessedLen,
        current: currentLength,
        diff: currentLength - lastProcessedLen
      });
    }
    
    // Wait a bit for streaming to complete if message doesn't seem complete
    // Check if message ends with punctuation or is long enough
    const seemsComplete = /[.!?]\s*$/.test(messageText.trim()) || currentLength > 150;
    
    if (!seemsComplete && currentLength < 100) {
      // Message might still be streaming, wait a bit
      console.log('⏸️ Message might still be streaming, waiting...', {
        length: currentLength,
        endsWithPunct: /[.!?]\s*$/.test(messageText.trim())
      });
      return;
    }
    
    console.log('🤖 Parsing agent message for filters (full message):', messageText);
    const extractedFilters = parseAgentMessageForFilters(messageText);
    
    // Check if this is a "clear all filters" request (show all products)
    if (extractedFilters.clearAll === true) {
      console.log('🧹 Clearing all filters - showing all products');
      setSearchTerm('');
      setFilterCategory(null);
      setFilterMaxPrice(null);
      setFilterMinPrice(null);
      setSortBy(null);
      setIsApplyingFilter(true);
      setTimeout(() => setIsApplyingFilter(false), 500);
      lastProcessedMessageId.current = `${latestAgentMessage.id}_${currentLength}`;
      return;
    }
    
    if (Object.keys(extractedFilters).length > 0) {
      console.log('✅ Extracted filters from agent message:', extractedFilters);
      
      // If a new search term is detected, clear old filters first (except the new search term)
      const hasNewSearchTerm = extractedFilters.searchTerm !== undefined 
        && extractedFilters.searchTerm.trim() !== '' 
        && extractedFilters.searchTerm.trim() !== searchTerm;
      
      if (hasNewSearchTerm) {
        console.log('🔄 New search term detected, clearing old filters');
        // Clear old filters but keep the new search term
        setFilterCategory(null);
        setFilterMaxPrice(null);
        setFilterMinPrice(null);
        // Don't clear sortBy - user might want to keep sorting
      }
      
      // Update filters from agent's spoken response
      // Always update if found (don't check if already set - agent might be refining filters)
      let filtersUpdated = false;
      
      if (extractedFilters.searchTerm !== undefined && extractedFilters.searchTerm.trim() !== '') {
        console.log('🔍 Setting search term:', extractedFilters.searchTerm);
        setSearchTerm(extractedFilters.searchTerm.trim());
        filtersUpdated = true;
      } else if (hasNewSearchTerm) {
        // If we cleared filters but no new search term was extracted, clear search term too
        console.log('🔍 Clearing search term (no valid term extracted)');
        setSearchTerm('');
        filtersUpdated = true;
      }
      if (extractedFilters.category !== undefined) {
        console.log('📁 Setting category:', extractedFilters.category);
        setFilterCategory(extractedFilters.category);
        filtersUpdated = true;
      }
      if (extractedFilters.maxPrice !== undefined && extractedFilters.maxPrice > 0) {
        console.log('💰 Setting max price:', extractedFilters.maxPrice);
        setFilterMaxPrice(extractedFilters.maxPrice);
        filtersUpdated = true;
      }
      if (extractedFilters.minPrice !== undefined && extractedFilters.minPrice > 0) {
        console.log('💰 Setting min price:', extractedFilters.minPrice);
        setFilterMinPrice(extractedFilters.minPrice);
        filtersUpdated = true;
      }
      if (extractedFilters.sortBy !== undefined && extractedFilters.sortBy.trim() !== '') {
        console.log('🔀 Setting sort by:', extractedFilters.sortBy);
        setSortBy(extractedFilters.sortBy);
        filtersUpdated = true;
      }
      
      if (filtersUpdated) {
        console.log('✅ Filters updated from agent message');
        // Show animation to indicate filter update
        setIsApplyingFilter(true);
        setTimeout(() => setIsApplyingFilter(false), 500);
        // Mark as processed only after successfully extracting and applying filters
        // Use a combination of ID and length to handle streaming updates
        lastProcessedMessageId.current = `${latestAgentMessage.id}_${currentLength}`;
      } else {
        console.log('ℹ️ No filter values to update (all empty)');
        // Mark as processed to avoid re-processing
        lastProcessedMessageId.current = `${latestAgentMessage.id}_${currentLength}`;
      }
    } else {
      console.log('ℹ️ No filters extracted from agent message');
      // Mark as processed to avoid re-processing
      lastProcessedMessageId.current = `${latestAgentMessage.id}_${currentLength}`;
    }
  }, [messages, isSessionActive, parseAgentMessageForFilters]);
  
  // Helper: Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory(null);
    setFilterMaxPrice(null);
    setFilterMinPrice(null);
    setSortBy(null);
    lastProcessedMessageId.current = null; // Reset so we can re-parse if needed
    console.log('🧹 All filters cleared');
  }, []);
  
  // Listen for data messages containing FILTER metadata (only when room is connected)
  useEffect(() => {
    if (!room || !isSessionActive) return;
    
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      console.log('📦 Data received event:', { 
        topic, 
        from: participant?.identity,
        kind,
        payloadLength: payload.length 
      });
      
      // Accept messages with topic "chat" or no topic
      if (topic === 'chat' || !topic) {
        try {
          const message = new TextDecoder().decode(payload);
          console.log('📦 Received data message (decoded):', message);
          
          // Check if this is FILTER metadata
          const filterMatch = message.match(/\[FILTER:([^\]]+)\]/);
          if (filterMatch) {
            console.log('✅ Found FILTER metadata in data message:', filterMatch[0]);
            
            // Extract the filter string and parse using URLSearchParams
            const filterString = filterMatch[1];
            console.log('🔍 Filter string:', filterString);
            
            // Parse key=value pairs using URLSearchParams (handles & separators)
            const params = new URLSearchParams(filterString);
            
            const newSearchTerm = params.get("search_term") || "";
            const newCategory = params.get("category") || null;
            const maxPriceStr = params.get("max_price");
            const minPriceStr = params.get("min_price");
            const newSortBy = params.get("sort_by") || null;
            
            const newMaxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : null;
            const newMinPrice = minPriceStr ? parseInt(minPriceStr, 10) : null;
            
            // Validate prices
            const validatedMaxPrice = (newMaxPrice && !isNaN(newMaxPrice) && newMaxPrice > 0) ? newMaxPrice : null;
            const validatedMinPrice = (newMinPrice && !isNaN(newMinPrice) && newMinPrice > 0) ? newMinPrice : null;
            
            console.log('✅ Parsed filters from data channel:', {
              searchTerm: newSearchTerm,
              category: newCategory,
              maxPrice: validatedMaxPrice,
              minPrice: validatedMinPrice,
              sortBy: newSortBy,
            });
            
            // Update filter state with animation
            setIsApplyingFilter(true);
            if (newSearchTerm.trim()) {
              console.log('🔍 Setting search term from data channel:', newSearchTerm);
              setSearchTerm(newSearchTerm.trim());
            } else {
              setSearchTerm('');
            }
            if (newCategory && newCategory.trim() !== "") {
              console.log('📁 Setting category from data channel:', newCategory);
              setFilterCategory(newCategory);
            } else {
              setFilterCategory(null);
            }
            if (validatedMaxPrice) {
              console.log('💰 Setting max price from data channel:', validatedMaxPrice);
              setFilterMaxPrice(validatedMaxPrice);
            } else {
              setFilterMaxPrice(null);
            }
            if (validatedMinPrice) {
              console.log('💰 Setting min price from data channel:', validatedMinPrice);
              setFilterMinPrice(validatedMinPrice);
            } else {
              setFilterMinPrice(null);
            }
            if (newSortBy && newSortBy.trim() !== "" && newSortBy !== 'default') {
              console.log('🔀 Setting sort by from data channel:', newSortBy);
              setSortBy(newSortBy);
            } else {
              setSortBy(null);
            }
            
            // Remove animation after 500ms
            setTimeout(() => setIsApplyingFilter(false), 500);
            
            console.log('🎯 Applied filter from data message');
          } else {
            console.log('ℹ️ Data message is not FILTER metadata');
          }
        } catch (e) {
          console.error('Error parsing data message:', e);
        }
      } else {
        console.log('ℹ️ Ignoring data message with topic:', topic);
      }
    };
    
    room.on(RoomEvent.DataReceived, handleDataReceived);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: false, // No chat UI in store-first design
    camera: false,
    screenShare: false,
  };

  // Fetch products
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error fetching products:', err));
  }, []);

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  // Poll orders every 2-3 seconds
  useEffect(() => {
    const fetchOrders = () => {
      fetch('/api/orders')
        .then((res) => {
          if (!res.ok) {
            console.error('❌ Failed to fetch orders:', res.status, res.statusText);
            return [];
          }
          return res.json();
        })
        .then((data) => {
          const ordersArray = Array.isArray(data) ? data : [];
          console.log('📦 Fetched orders:', ordersArray.length, 'orders');
          if (ordersArray.length > 0) {
            console.log('📦 First order:', ordersArray[0]);
          }
          setOrders(ordersArray);
          
          // Auto-open sidebar for 3 seconds when new order is placed
          if (ordersArray.length > lastOrderCount && lastOrderCount > 0) {
            console.log('🆕 New order detected! Opening sidebar...');
            setSidebarOpen(true);
            setSidebarView('orders');
            // Clear any existing timeout
            if (sidebarTimeoutRef.current) {
              clearTimeout(sidebarTimeoutRef.current);
            }
            // Auto-close after 3 seconds
            sidebarTimeoutRef.current = setTimeout(() => {
              setSidebarOpen(false);
            }, 3000);
          }
          // If orders exist on first load and sidebar is closed, keep it closed but show badge
          setLastOrderCount(ordersArray.length);
        })
        .catch((err) => console.error('❌ Error fetching orders:', err));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 2500); // Poll every 2.5 seconds
    return () => {
      clearInterval(interval);
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, [lastOrderCount]);

  // Poll cart every 2-3 seconds
  useEffect(() => {
    const fetchCart = () => {
      fetch('/api/cart')
        .then((res) => {
          if (!res.ok) {
            console.error('❌ Failed to fetch cart:', res.status, res.statusText);
            return [];
          }
          return res.json();
        })
        .then((data) => {
          const cartArray = Array.isArray(data) ? data : [];
          console.log('🛒 Fetched cart:', cartArray.length, 'items');
          setCart(cartArray);
        })
        .catch((err) => console.error('❌ Error fetching cart:', err));
    };

    fetchCart();
    const interval = setInterval(fetchCart, 2500); // Poll every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  // Monitor voice activity for microphone indicator (only when room is connected)
  useEffect(() => {
    if (!room || !isSessionActive) return;

    // Monitor local participant (user) speaking
    const updateLocalSpeaking = () => {
      setIsListening(room.localParticipant.isSpeaking);
    };

    // Monitor remote participants (agent) speaking
    const updateRemoteSpeaking = () => {
      let agentSpeaking = false;
      room.remoteParticipants.forEach((participant) => {
        if (participant.isSpeaking) {
          agentSpeaking = true;
        }
      });
      setIsAgentSpeaking(agentSpeaking);
    };

    // Set up listeners
    room.localParticipant.on('isSpeakingChanged', updateLocalSpeaking);
    room.on('participantConnected', (participant) => {
      participant.on('isSpeakingChanged', updateRemoteSpeaking);
    });
    room.on('participantDisconnected', updateRemoteSpeaking);

    // Check existing participants
    updateLocalSpeaking();
    updateRemoteSpeaking();

    // Poll for speaking status (fallback)
    const speakingInterval = setInterval(() => {
      updateLocalSpeaking();
      updateRemoteSpeaking();
    }, 500);

    return () => {
      clearInterval(speakingInterval);
      room.localParticipant.off('isSpeakingChanged', updateLocalSpeaking);
    };
  }, [room]);

  // Note: Filter metadata is now handled via data channel (RoomEvent.DataReceived)
  // No need to parse messages since we're using store-first design without chat transcript

  // Filter and sort products based on model's search parameters
  const filteredProducts = useMemo(() => {
    console.log('🔄 useMemo recalculating - sortBy:', sortBy, 'products count:', products.length);
    // First, filter products
    let filtered = products.filter((p) => {
      // If no filters are set, show all products
      if (!searchTerm && !filterCategory && !filterMaxPrice && !filterMinPrice) {
        return true;
      }
      
      // Check search term (matches name, description, or category)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        const nameLower = p.name.toLowerCase();
        const descLower = p.description.toLowerCase();
        const categoryLower = p.category.toLowerCase();
        
        // Exact match or substring match
        const matchesSearch =
          nameLower.includes(searchLower) ||
          descLower.includes(searchLower) ||
          categoryLower.includes(searchLower) ||
          // Handle plural/singular variations (e.g., "cameras" matches "camera")
          (searchLower.endsWith('s') && nameLower.includes(searchLower.slice(0, -1))) ||
          (searchLower.endsWith('s') && descLower.includes(searchLower.slice(0, -1))) ||
          (!searchLower.endsWith('s') && nameLower.includes(searchLower + 's')) ||
          (!searchLower.endsWith('s') && descLower.includes(searchLower + 's'));
        
        if (!matchesSearch) {
          console.log(`❌ Product "${p.name}" doesn't match search term "${searchTerm}"`);
          return false;
        }
        console.log(`✅ Product "${p.name}" matches search term "${searchTerm}"`);
      }
      
      // Check category filter
      if (filterCategory) {
        if (p.category.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }
      
      // Check max price filter
      if (filterMaxPrice !== null) {
        if (p.price > filterMaxPrice) {
          return false;
        }
      }
      
      // Check min price filter
      if (filterMinPrice !== null) {
        if (p.price < filterMinPrice) {
          return false;
        }
      }
      
      return true;
    });

    // Then, apply sorting if specified
    if (sortBy) {
      console.log('🔀 Applying sort:', sortBy, 'to', filtered.length, 'products');
      console.log('🔀 Products before sort:', filtered.map(p => `${p.name}: ₹${p.price}`));
      const sorted = [...filtered];
      switch (sortBy) {
        case 'price_asc':
        case 'price_low_to_high':
          sorted.sort((a, b) => a.price - b.price);
          console.log('✅ Sorted by price (asc):', sorted.map(p => `${p.name}: ₹${p.price}`));
          return sorted;
        case 'price_desc':
        case 'price_high_to_low':
          sorted.sort((a, b) => b.price - a.price);
          console.log('✅ Sorted by price (desc):', sorted.map(p => `${p.name}: ₹${p.price}`));
          return sorted;
        case 'rating_desc':
        case 'rating_high_to_low':
          sorted.sort((a, b) => b.rating - a.rating);
          console.log('✅ Sorted by rating:', sorted.map(p => `${p.name}: ${p.rating}★`));
          return sorted;
        case 'name_asc':
        case 'name_a_to_z':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          console.log('✅ Sorted by name (A-Z):', sorted.map(p => p.name));
          return sorted;
        case 'name_desc':
        case 'name_z_to_a':
          sorted.sort((a, b) => b.name.localeCompare(a.name));
          console.log('✅ Sorted by name (Z-A):', sorted.map(p => p.name));
          return sorted;
        default:
          console.warn('⚠️ Unknown sort type:', sortBy);
          return filtered;
      }
    }
    
    console.log('ℹ️ No sorting applied, sortBy:', sortBy);
    return filtered;
  }, [products, searchTerm, filterCategory, filterMaxPrice, filterMinPrice, sortBy]);

  const getSortLabel = (sortBy: string): string => {
    const labels: { [key: string]: string } = {
      'price_asc': 'Price: Low to High',
      'price_low_to_high': 'Price: Low to High',
      'price_desc': 'Price: High to Low',
      'price_high_to_low': 'Price: High to Low',
      'rating_desc': 'Rating: Highest First',
      'rating_high_to_low': 'Rating: Highest First',
      'name_asc': 'Name: A to Z',
      'name_a_to_z': 'Name: A to Z',
      'name_desc': 'Name: Z to A',
      'name_z_to_a': 'Name: Z to A',
    };
    return labels[sortBy] || sortBy;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <section
      className="relative z-10 h-full w-full overflow-hidden bg-gradient-to-b from-[#F9FAFB] to-[#EEF1F5]"
      {...props}
    >
      <style jsx>{`
        /* Hide scrollbars but keep scrolling functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>

      {/* Amazon Navbar with soft shadow */}
      <nav className="bg-[#232F3E] text-white px-4 py-3 shadow-lg sticky top-0 z-50" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">amazon.in</h1>
          </div>

          {/* Center: Search (optional, can be removed for cleaner look) */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
              />
            </div>

          {/* Right: Hamburger Menu & Microphone Indicator */}
          <div className="flex items-center space-x-4">
            {/* Microphone Pulse Indicator - Only show when session is active */}
            {isSessionActive && (
              <div className="relative">
                <button
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20",
                    isListening || isAgentSpeaking
                      ? "bg-[#FF9900] animate-pulse shadow-lg shadow-[#FF9900]/50"
                      : ""
                  )}
                  title={isListening ? "Listening..." : isAgentSpeaking ? "Agent speaking" : "Voice assistant ready"}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {(isListening || isAgentSpeaking) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9900] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF9900] shadow-lg shadow-[#FF9900]/50"></span>
                  </span>
                )}
          </div>
            )}

            {/* Filter Button */}
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={cn(
                "relative p-2 rounded-lg transition-all hover:bg-white/10",
                filterPanelOpen && "bg-white/20"
              )}
              aria-label="Toggle filters"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {(searchTerm || filterCategory || filterMaxPrice || filterMinPrice || sortBy) && (
                <span className="absolute -top-1 -right-1 bg-[#FF9900] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg shadow-[#FF9900]/50">
                  •
                </span>
              )}
            </button>

            {/* Cart Icon with Badge */}
              <button
              onClick={() => {
                setSidebarView('cart');
                setSidebarOpen(!sidebarOpen);
              }}
              className="relative p-2 rounded-lg transition-all hover:bg-white/10"
              aria-label="Toggle cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF9900] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-[#FF9900]/50">
                  {cart.length > 9 ? '9+' : cart.length}
                </span>
              )}
              </button>

            {/* Hamburger Menu with Order Count Badge */}
            <button
              onClick={() => {
                setSidebarView('orders');
                setSidebarOpen(!sidebarOpen);
              }}
              className="relative p-2 rounded-lg transition-all hover:bg-white/10"
              aria-label="Toggle order history"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-purple-400/50">
                  {orders.length > 9 ? '9+' : orders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)] relative flex-col">
        {/* Manual Filter Controls - Collapsible */}
        {filterPanelOpen && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <ManualFilters
              searchTerm={searchTerm}
              category={filterCategory}
              maxPrice={filterMaxPrice}
              minPrice={filterMinPrice}
              sortBy={sortBy}
              onSearchChange={setSearchTerm}
              onCategoryChange={setFilterCategory}
              onMaxPriceChange={setFilterMaxPrice}
              onMinPriceChange={setFilterMinPrice}
              onSortChange={setSortBy}
              onClearAll={handleClearAllFilters}
              availableCategories={availableCategories}
            />
          </div>
        )}

        {/* Filter Status Bar & Active Filters */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/20">
          {/* FilterStatusBar hidden per user request */}
          {/* <FilterStatusBar
            totalProducts={products.length}
            filteredProducts={filteredProducts.length}
            filters={{
              searchTerm,
              category: filterCategory,
              maxPrice: filterMaxPrice,
              minPrice: filterMinPrice,
              sortBy,
            }}
          /> */}

          {/* Active Filter Chips */}
          {(searchTerm ||
            filterCategory ||
            filterMaxPrice ||
            filterMinPrice ||
            sortBy) && (
            <ActiveFiltersChips
              filters={{
                searchTerm,
                category: filterCategory,
                maxPrice: filterMaxPrice,
                minPrice: filterMinPrice,
                sortBy,
              }}
              onClearAll={handleClearAllFilters}
            />
            )}
          </div>

        {/* Main Canvas - Product Grid */}
        <div className={cn(
          "flex-1 overflow-y-auto p-6 transition-all duration-300 hide-scrollbar",
          sidebarOpen ? "w-4/5" : "w-full",
          isApplyingFilter ? "opacity-75" : "opacity-100"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" key={`products-${sortBy || 'none'}-${filteredProducts.length}`}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-lg shadow-black/20 p-3 hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:shadow-cyan-500/10 transition-all"
              >
                <div className="aspect-square mb-2 backdrop-blur-md bg-white/5 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Use a data URI as fallback to avoid network requests
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'fallback-placeholder w-full h-full flex items-center justify-center text-gray-400 text-xs';
                        placeholder.textContent = 'No Image';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
                <h3 className="font-medium text-xs text-white mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center mb-1.5">
                  <span className="text-yellow-400 text-xs drop-shadow-lg">
                    {'★'.repeat(Math.floor(product.rating))}
                  </span>
                  <span className="text-xs text-white/70 ml-1">
                    ({product.reviews.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-baseline mb-1.5">
                  <span className="text-base font-bold text-cyan-400 drop-shadow-lg">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-white/60 ml-1">INR</span>
                </div>
                <div className="flex items-center text-xs text-purple-300 mb-2">
                  <span className="font-semibold">Prime</span>
                  <span className="ml-1">✓</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
                      });
                      if (response.ok) {
                        const order = await response.json();
                        // Refresh orders to show the new one
                        fetch('/api/orders')
                          .then((res) => res.json())
                          .then((data) => setOrders(Array.isArray(data) ? data : []))
                          .catch((err) => console.error('Error fetching orders:', err));
                        alert(`Order placed! Order ID: ${order.id}\nTotal: ₹${order.total.toLocaleString()}`);
                      } else {
                        alert('Failed to place order. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error placing order:', error);
                      alert('Error placing order. Please try again.');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/70"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-lg">
                <p className="text-2xl text-white/80 mb-4">📦 No products found</p>
                <p className="text-white/60 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/50 hover:shadow-xl"
                >
                  Clear Filters
                </button>
            </div>
            </div>
          ) : null}
            </div>

        {/* Slide-out Drawer - Order History (20%, hidden by default) */}
        <div
          className={cn(
            "fixed top-16 right-0 h-[calc(100vh-64px)] w-80 backdrop-blur-2xl bg-white/10 border-l border-white/20 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto hide-scrollbar",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarView('cart')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    sidebarView === 'cart'
                      ? "bg-[#FF9900] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  )}
                >
                  Cart ({cart.length})
                </button>
                <button
                  onClick={() => setSidebarView('orders')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    sidebarView === 'orders'
                      ? "bg-[#FF9900] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  )}
                >
                  Orders ({orders.length})
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/70 hover:text-white backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-1 transition-all hover:bg-white/20"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
        </div>

            {sidebarView === 'cart' ? (
              cart.length === 0 ? (
                <div className="text-sm text-white/60 text-center py-8 backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-4">
                  Your cart is empty. Add items via voice or click "Buy Now"!
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.product_id}-${idx}`}
                      className="backdrop-blur-xl bg-white/10 rounded-xl p-3 border border-white/20 shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-white flex-1">
                          {item.product_name}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-white/70">
                          {formatPrice(item.unit_amount)} each
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/70">Qty:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                const newQuantity = Math.max(1, item.quantity - 1);
                                
                                // Optimistic update
                                setCart((prevCart) => {
                                  return prevCart.map((cartItem) => {
                                    if (cartItem.product_id === item.product_id) {
                                      return { ...cartItem, quantity: newQuantity };
                                    }
                                    return cartItem;
                                  });
                                });
                                
                                try {
                                  const response = await fetch('/api/cart', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      product_id: item.product_id,
                                      quantity: newQuantity,
                                    }),
                                  });
                                  if (!response.ok) {
                                    // Revert on error
                                    fetch('/api/cart')
                                      .then((res) => res.json())
                                      .then((data) => setCart(Array.isArray(data) ? data : []))
                                      .catch((err) => console.error('Error fetching cart:', err));
                                  }
                                } catch (error) {
                                  console.error('Error updating quantity:', error);
                                  // Revert on error
                                  fetch('/api/cart')
                                    .then((res) => res.json())
                                    .then((data) => setCart(Array.isArray(data) ? data : []))
                                    .catch((err) => console.error('Error fetching cart:', err));
                                }
                              }}
                              disabled={item.quantity <= 1}
                              className="w-6 h-6 flex items-center justify-center backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm font-semibold transition-all"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={async (e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                if (newQuantity < 1) return;
                                
                                // Optimistic update
                                setCart((prevCart) => {
                                  return prevCart.map((cartItem) => {
                                    if (cartItem.product_id === item.product_id) {
                                      return { ...cartItem, quantity: newQuantity };
                                    }
                                    return cartItem;
                                  });
                                });
                                
                                try {
                                  const response = await fetch('/api/cart', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      product_id: item.product_id,
                                      quantity: newQuantity,
                                    }),
                                  });
                                  if (!response.ok) {
                                    // Revert on error
                                    fetch('/api/cart')
                                      .then((res) => res.json())
                                      .then((data) => setCart(Array.isArray(data) ? data : []))
                                      .catch((err) => console.error('Error fetching cart:', err));
                                  }
                                } catch (error) {
                                  console.error('Error updating quantity:', error);
                                  // Revert on error
                                  fetch('/api/cart')
                                    .then((res) => res.json())
                                    .then((data) => setCart(Array.isArray(data) ? data : []))
                                    .catch((err) => console.error('Error fetching cart:', err));
                                }
                              }}
                              className="w-12 h-6 text-center text-sm font-medium text-white backdrop-blur-md bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                            <button
                              onClick={async () => {
                                const newQuantity = item.quantity + 1;
                                
                                // Optimistic update
                                setCart((prevCart) => {
                                  return prevCart.map((cartItem) => {
                                    if (cartItem.product_id === item.product_id) {
                                      return { ...cartItem, quantity: newQuantity };
                                    }
                                    return cartItem;
                                  });
                                });
                                
                                try {
                                  const response = await fetch('/api/cart', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      product_id: item.product_id,
                                      quantity: newQuantity,
                                    }),
                                  });
                                  if (!response.ok) {
                                    // Revert on error
                                    fetch('/api/cart')
                                      .then((res) => res.json())
                                      .then((data) => setCart(Array.isArray(data) ? data : []))
                                      .catch((err) => console.error('Error fetching cart:', err));
                                  }
                                } catch (error) {
                                  console.error('Error updating quantity:', error);
                                  // Revert on error
                                  fetch('/api/cart')
                                    .then((res) => res.json())
                                    .then((data) => setCart(Array.isArray(data) ? data : []))
                                    .catch((err) => console.error('Error fetching cart:', err));
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 rounded text-white text-sm font-semibold transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/20">
                        <span className="text-sm font-semibold text-cyan-400">
                          Subtotal: {formatPrice(item.unit_amount * item.quantity)}
                        </span>
                        <button
                          onClick={async () => {
                            if (!confirm(`Remove ${item.product_name} from cart?`)) return;
                            // The agent will handle the removal via voice, but we can also add a direct API call here if needed
                            // For now, just refresh the cart
                            fetch('/api/cart')
                              .then((res) => res.json())
                              .then((data) => setCart(Array.isArray(data) ? data : []))
                              .catch((err) => console.error('Error fetching cart:', err));
                          }}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-white">
                        Total: {formatPrice(
                          cart.reduce((sum, item) => sum + (item.unit_amount * item.quantity), 0)
                        )}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          // Call checkout_cart via agent or direct API
                          const response = await fetch('/api/cart/checkout', {
                            method: 'POST',
                          });
                          if (response.ok) {
                            setCart([]);
                            alert('Order placed! Check your orders.');
                            setSidebarView('orders');
                            // Refresh orders
                            fetch('/api/orders')
                              .then((res) => res.json())
                              .then((data) => setOrders(Array.isArray(data) ? data : []))
                              .catch((err) => console.error('Error fetching orders:', err));
                          }
                        } catch (error) {
                          console.error('Error checking out:', error);
                          alert('Please use voice to checkout: "Checkout my cart"');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/50 hover:shadow-xl"
                    >
                      Checkout Cart
                    </button>
                  </div>
                </div>
              )
            ) : orders.length === 0 ? (
              <div className="text-sm text-white/60 text-center py-8 backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-4">
                No orders yet. Place an order via voice or click "Buy Now"!
                </div>
              ) : (
                <div className="space-y-3">
                {orders.slice().reverse().map((order) => (
                    <div
                      key={order.id}
                      className="backdrop-blur-xl bg-white/10 rounded-xl p-3 border border-white/20 shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-white/60">
                        Order #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-lg backdrop-blur-md border',
                            order.status === 'CONFIRMED'
                              ? 'bg-green-500/20 border-green-400/50 text-green-300'
                              : 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
                          )}
                        >
                          {order.status}
                        </span>
                      </div>
                      {order.items.map((item, idx) => (
                      <div key={idx} className="mb-2 pb-2 border-b border-white/20 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-white flex-1">
                            {item.product_name}
                          </div>
                          </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-white/70">
                            {formatPrice(item.unit_amount)} each
                          </div>
                          <div className="text-sm font-medium text-white">
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-purple-300">
                            Subtotal: {formatPrice(item.unit_amount * item.quantity)}
                          </div>
                          <button
                            onClick={async () => {
                              if (!confirm(`Remove ${item.product_name} from this order?`)) return;
                              
                              try {
                                const response = await fetch('/api/orders', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    order_id: order.id,
                                    item_index: idx,
                                  }),
                                });
                                if (response.ok) {
                                  // Refresh orders
                                  fetch('/api/orders')
                                    .then((res) => res.json())
                                    .then((data) => setOrders(Array.isArray(data) ? data : []))
                                    .catch((err) => console.error('Error fetching orders:', err));
                                } else {
                                  alert('Failed to remove item. Please try again.');
                                }
                              } catch (error) {
                                console.error('Error removing item:', error);
                                alert('Error removing item. Please try again.');
                              }
                            }}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/20">
                        <span className="text-sm font-semibold text-white">
                        Total: {formatPrice(
                          order.items.reduce((sum: number, item: any) => 
                            sum + (item.unit_amount * item.quantity), 0
                          )
                        )}
                        </span>
                        <span className="text-xs text-white/60">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
            </div>

        {/* Overlay when sidebar is open (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Bottom Control Bar - START CALL button when not active, control bar when active */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center items-end pb-6 md:pb-8 pointer-events-none"
      >
        {!isSessionActive ? (
          <button
            onClick={onStartCall}
            className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/80 to-purple-500/80 hover:from-cyan-400 hover:to-purple-400 border border-white/30 text-white font-semibold py-4 px-10 rounded-full text-lg transition-all shadow-2xl flex items-center gap-3 pointer-events-auto transform hover:scale-105 active:scale-95"
            style={{
              boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4), 0 0 20px rgba(168, 85, 247, 0.3)',
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            START CALL
          </button>
        ) : (
          <div className="pointer-events-auto">
            <AgentControlBar 
              controls={controls} 
              className="backdrop-blur-2xl bg-white/10 border border-white/20 text-white rounded-full px-4 py-3 shadow-2xl"
            />
        </div>
        )}
      </MotionBottom>
    </section>
  );
};

