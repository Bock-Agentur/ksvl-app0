/**
 * Realtime Subscription Manager (Singleton)
 * 
 * Manages Supabase Realtime channels to prevent duplicate subscriptions
 * and ensure proper cleanup.
 * 
 * Problem: Every component that uses realtime creates its own channel,
 * leading to multiple subscriptions to the same table.
 * 
 * Solution: Singleton pattern that reuses existing channels and manages
 * multiple listeners per channel.
 */

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChannelCallback = (payload: any) => void;
type TableEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface ChannelConfig {
  table: string;
  event: TableEvent;
  schema?: string;
}

interface ManagedChannel {
  channel: RealtimeChannel;
  listeners: Map<string, ChannelCallback>;
  config: ChannelConfig;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private channels: Map<string, ManagedChannel> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    console.log('🔌 [RealtimeManager] Initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  /**
   * Generate unique channel name from config
   */
  private getChannelName(config: ChannelConfig): string {
    return `${config.schema || 'public'}:${config.table}:${config.event}`;
  }

  /**
   * Subscribe to table changes with automatic deduplication
   * 
   * @param config Table and event configuration
   * @param listenerId Unique identifier for this listener
   * @param callback Function to call when change occurs
   * @param debounceMs Optional debounce time in milliseconds
   * @returns Unsubscribe function
   */
  subscribe(
    config: ChannelConfig,
    listenerId: string,
    callback: ChannelCallback,
    debounceMs: number = 0
  ): () => void {
    const channelName = this.getChannelName(config);
    const fullListenerId = `${channelName}:${listenerId}`;

    console.log(`📡 [RealtimeManager] Subscribe: ${fullListenerId}`);

    // Get or create channel
    let managed = this.channels.get(channelName);

    if (!managed) {
      console.log(`🆕 [RealtimeManager] Creating new channel: ${channelName}`);
      
      const channel = supabase.channel(channelName);
      
      managed = {
        channel,
        listeners: new Map(),
        config,
      };

      // Set up the postgres_changes listener
      const realtimeChannel = channel.on(
        'postgres_changes' as any,
        {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
        },
        (payload: any) => {
          console.log(`🔔 [RealtimeManager] Change detected: ${channelName}`, payload.eventType || payload.event);
          
          // Call all registered listeners for this channel
          managed!.listeners.forEach((listenerCallback, lid) => {
            console.log(`📤 [RealtimeManager] Notifying listener: ${lid}`);
            listenerCallback(payload);
          });
        }
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`📡 [RealtimeManager] Channel status [${channelName}]:`, status);
      });

      this.channels.set(channelName, managed);
    }

    // Wrap callback with debounce if requested
    const wrappedCallback = debounceMs > 0
      ? (payload: any) => {
          const timerId = `${fullListenerId}:debounce`;
          
          // Clear existing timer
          const existingTimer = this.debounceTimers.get(timerId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set new timer
          const timer = setTimeout(() => {
            callback(payload);
            this.debounceTimers.delete(timerId);
          }, debounceMs);

          this.debounceTimers.set(timerId, timer);
        }
      : callback;

    // Register listener
    managed.listeners.set(fullListenerId, wrappedCallback);
    console.log(`✅ [RealtimeManager] Listener registered: ${fullListenerId} (${managed.listeners.size} total)`);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName, fullListenerId);
  }

  /**
   * Unsubscribe a specific listener
   */
  private unsubscribe(channelName: string, listenerId: string): void {
    console.log(`🔌 [RealtimeManager] Unsubscribe: ${listenerId}`);

    const managed = this.channels.get(channelName);
    if (!managed) {
      console.warn(`⚠️ [RealtimeManager] Channel not found: ${channelName}`);
      return;
    }

    // Remove listener
    managed.listeners.delete(listenerId);
    console.log(`✅ [RealtimeManager] Listener removed: ${listenerId} (${managed.listeners.size} remaining)`);

    // If no more listeners, clean up channel
    if (managed.listeners.size === 0) {
      console.log(`🗑️ [RealtimeManager] Removing channel (no listeners): ${channelName}`);
      supabase.removeChannel(managed.channel);
      this.channels.delete(channelName);
    }

    // Clear any pending debounce timers for this listener
    const debounceTimerId = `${listenerId}:debounce`;
    const timer = this.debounceTimers.get(debounceTimerId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(debounceTimerId);
    }
  }

  /**
   * Unsubscribe all listeners and clean up all channels
   */
  cleanup(): void {
    console.log('🧹 [RealtimeManager] Cleaning up all channels');
    
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Remove all channels
    this.channels.forEach((managed, channelName) => {
      console.log(`🗑️ [RealtimeManager] Removing channel: ${channelName}`);
      supabase.removeChannel(managed.channel);
    });
    
    this.channels.clear();
    console.log('✅ [RealtimeManager] Cleanup complete');
  }

  /**
   * Get current statistics
   */
  getStats() {
    const stats = {
      totalChannels: this.channels.size,
      channels: Array.from(this.channels.entries()).map(([name, managed]) => ({
        name,
        listeners: managed.listeners.size,
        config: managed.config,
      })),
    };
    
    console.log('📊 [RealtimeManager] Stats:', stats);
    return stats;
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance();

/**
 * React hook wrapper for realtime subscriptions
 * Automatically handles cleanup on unmount
 */
import { useEffect } from "react";

export function useRealtimeSubscription(
  config: ChannelConfig,
  listenerId: string,
  callback: ChannelCallback,
  debounceMs: number = 0,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = realtimeManager.subscribe(
      config,
      listenerId,
      callback,
      debounceMs
    );

    return () => {
      unsubscribe();
    };
  }, [config.table, config.event, config.schema, listenerId, enabled, debounceMs]);
}
