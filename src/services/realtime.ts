// Realtime Event Broadcaster & WebSocket Simulation
// Provides instant reactive updates across accounts and tabs without requiring page refresh

type EventCallback = (data: any) => void;

class RealtimeBroadcaster {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('sinilai_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { type, data } = event.data;
          this.notifyLocal(type, data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted, falling back to window storage', e);
      }
    }
  }

  // Subscribe to specific realtime event
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  // Broadcast event locally and across tabs
  publish(eventType: string, data: any) {
    this.notifyLocal(eventType, data);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: eventType, data });
    }
  }

  private notifyLocal(eventType: string, data: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in realtime listener for ${eventType}:`, err);
        }
      });
    }

    // Also trigger global wildcard listeners
    const allCallbacks = this.listeners.get('*');
    if (allCallbacks) {
      allCallbacks.forEach((cb) => cb({ type: eventType, data }));
    }
  }

  // Helper to format date in Indonesian Western Time (WIB)
  static formatWIB(date: Date = new Date()): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date) + ' WIB';
  }
}

export const realtime = new RealtimeBroadcaster();

// Event Name Constants
export const REALTIME_EVENTS = {
  PERMISSIONS_UPDATED: 'TEACHER_PERMISSIONS_UPDATED',
  GRADE_CHANGED: 'GRADE_CHANGED',
  SUBMISSION_CHANGED: 'SUBMISSION_CHANGED',
  DEADLINE_CHANGED: 'DEADLINE_CHANGED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
};
