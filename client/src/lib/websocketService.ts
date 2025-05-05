import { useEffect, useState, useCallback, useRef } from 'react';

// WebSocket message types
export enum WebSocketMessageType {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  NOTIFICATION = 'NOTIFICATION',
  ERROR = 'ERROR',
}

// Interface for WebSocket messages
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
}

// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

/**
 * WebSocket Service - Singleton for managing WebSocket connections
 */
class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private messageListeners: Set<(message: WebSocketMessage) => void> = new Set();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2s delay
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = '';

  // Private constructor for singleton pattern
  private constructor() {}

  // Get singleton instance
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   * @param url WebSocket server URL (defaults to current host with ws/wss protocol)
   */
  public connect(url?: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Set up WebSocket URL if not provided
    if (!url && !this.url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}/ws`;
    } else if (url) {
      this.url = url;
    }

    try {
      // Update status to connecting
      this.notifyStatusChange(WebSocketStatus.CONNECTING);
      
      // Create new WebSocket connection
      this.socket = new WebSocket(this.url);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyStatusChange(WebSocketStatus.CLOSED);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) return;
    
    try {
      this.notifyStatusChange(WebSocketStatus.CLOSING);
      this.socket.close();
      this.socket = null;
      this.clearReconnectTimeout();
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }

  /**
   * Send message to WebSocket server
   * @param type Message type
   * @param payload Message payload
   */
  public sendMessage(type: WebSocketMessageType, payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Add message listener
   * @param listener Function to call when message is received
   */
  public addMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners.add(listener);
  }

  /**
   * Remove message listener
   * @param listener Function to remove
   */
  public removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners.delete(listener);
  }

  /**
   * Add status listener
   * @param listener Function to call when status changes
   */
  public addStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners.add(listener);
  }

  /**
   * Remove status listener
   * @param listener Function to remove
   */
  public removeStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners.delete(listener);
  }

  /**
   * Get current WebSocket status
   */
  public getStatus(): WebSocketStatus {
    if (!this.socket) return WebSocketStatus.CLOSED;
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketStatus.CONNECTING;
      case WebSocket.OPEN:
        return WebSocketStatus.OPEN;
      case WebSocket.CLOSING:
        return WebSocketStatus.CLOSING;
      case WebSocket.CLOSED:
      default:
        return WebSocketStatus.CLOSED;
    }
  }

  // Private methods
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.notifyStatusChange(WebSocketStatus.OPEN);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.notifyMessageReceived(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.notifyStatusChange(WebSocketStatus.CLOSED);
    
    // Attempt to reconnect if not closed intentionally
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.notifyStatusChange(WebSocketStatus.CLOSED);
    this.attemptReconnect();
  }

  private notifyMessageReceived(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in WebSocket message listener:', error);
      }
    });
  }

  private notifyStatusChange(status: WebSocketStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in WebSocket status listener:', error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max WebSocket reconnect attempts reached');
      return;
    }

    this.clearReconnectTimeout();
    
    // Calculate exponential backoff delay
    const delay = Math.min(
      30000, // Max 30 seconds
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    );
    
    console.log(`Attempting WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

/**
 * React hook for using WebSocket service
 * @param url WebSocket server URL (optional)
 * @returns WebSocket utilities
 */
export function useWebSocket(url?: string) {
  const wsService = WebSocketService.getInstance();
  const [status, setStatus] = useState<WebSocketStatus>(wsService.getStatus());
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const messagesRef = useRef<WebSocketMessage[]>([]);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    const updatedMessages = [...messagesRef.current, message];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
  }, []);

  // Handle status changes
  const handleStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus);
  }, []);

  // Connect to WebSocket server
  useEffect(() => {
    wsService.addMessageListener(handleMessage);
    wsService.addStatusListener(handleStatus);
    wsService.connect(url);

    return () => {
      wsService.removeMessageListener(handleMessage);
      wsService.removeStatusListener(handleStatus);
    };
  }, [url, handleMessage, handleStatus]);

  // Send message method
  const sendMessage = useCallback((type: WebSocketMessageType, payload: any) => {
    return wsService.sendMessage(type, payload);
  }, []);

  // Clear messages method
  const clearMessages = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
  }, []);

  // Reconnect method
  const reconnect = useCallback(() => {
    wsService.disconnect();
    wsService.connect(url);
  }, [url]);

  // Return WebSocket utilities
  return {
    status,
    messages,
    sendMessage,
    clearMessages,
    reconnect,
    isConnecting: status === WebSocketStatus.CONNECTING,
    isConnected: status === WebSocketStatus.OPEN,
    isDisconnected: status === WebSocketStatus.CLOSED,
  };
}

// Export singleton instance
export default WebSocketService.getInstance();