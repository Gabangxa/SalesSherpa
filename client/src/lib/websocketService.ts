import { useState, useEffect, useCallback, useRef } from 'react';
import { processError, ErrorType, logError } from './errorService';

// WebSocket message types for type safety
export enum WebSocketMessageType {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  NOTIFICATION = 'NOTIFICATION',
  ERROR = 'ERROR',
}

// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

// Message structure for WebSocket communication
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
}

/**
 * Custom React hook for WebSocket communication
 * 
 * Provides:
 * - Connection status and state management
 * - Message sending and receiving
 * - Automatic reconnection
 * - Error handling
 */
export function useWebSocket() {
  // Reference to the WebSocket instance
  const socketRef = useRef<WebSocket | null>(null);
  
  // Store messages received from the server
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  // Connection status for UI feedback
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.CLOSED);
  
  // Convenience states for UI components
  const isConnected = status === WebSocketStatus.OPEN;
  const isConnecting = status === WebSocketStatus.CONNECTING;
  const isDisconnected = status === WebSocketStatus.CLOSED || status === WebSocketStatus.CLOSING;
  
  // Maximum reconnection attempts before giving up
  const maxReconnectAttempts = 5;
  const reconnectAttemptsRef = useRef(0);
  
  // Create the WebSocket connection
  const connect = useCallback(() => {
    try {
      // Close any existing connections
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Update state to connecting
      setStatus(WebSocketStatus.CONNECTING);
      
      // Determine the proper WebSocket URL based on the current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create a new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Set up event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus(WebSocketStatus.OPEN);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };
      
      socket.onmessage = (event) => {
        try {
          // Parse the incoming message
          const data = JSON.parse(event.data) as WebSocketMessage;
          
          // Update the messages state
          setMessages((prevMessages) => [...prevMessages, data]);
          
          // Handle different message types
          switch (data.type) {
            case WebSocketMessageType.ALERT:
              // Handle alerts (could trigger notifications, update UI, etc.)
              break;
              
            case WebSocketMessageType.NOTIFICATION:
              // Handle notifications
              break;
              
            case WebSocketMessageType.ERROR:
              // Handle error messages from server
              console.error('WebSocket server error:', data.payload);
              break;
              
            default:
              // Handle regular messages
              break;
          }
        } catch (err) {
          // Handle message parsing errors
          const error = processError(err, {
            context: 'WebSocket message processing',
            rawMessage: event.data,
          });
          error.type = ErrorType.WEBSOCKET;
          logError(error);
        }
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket closed with code: ${event.code}`);
        setStatus(WebSocketStatus.CLOSED);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          attemptReconnect();
        }
      };
      
      socket.onerror = (event) => {
        // Handle WebSocket errors
        const error = processError(new Error('WebSocket connection error'), {
          context: 'WebSocket error event',
          event,
        });
        error.type = ErrorType.WEBSOCKET;
        logError(error);
        
        // Socket will automatically close after an error
        setStatus(WebSocketStatus.CLOSING);
      };
    } catch (err) {
      // Handle connection initialization errors
      const error = processError(err, {
        context: 'WebSocket initialization',
      });
      error.type = ErrorType.WEBSOCKET;
      logError(error);
      setStatus(WebSocketStatus.CLOSED);
    }
  }, []);
  
  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      
      // Exponential backoff with jitter
      const baseDelay = 1000; // 1 second
      const maxDelay = 30000; // 30 seconds
      const expBackoff = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1)
      );
      const jitter = Math.random() * 0.3; // Add up to 30% random jitter
      const delay = expBackoff * (1 + jitter);
      
      console.log(`Attempting to reconnect in ${Math.round(delay / 1000)} seconds...`);
      
      setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }, [connect]);
  
  // Manual reconnect function for user-triggered reconnections
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset reconnect attempts for manual reconnection
    connect();
  }, [connect]);
  
  // Send a message to the server
  const sendMessage = useCallback((type: WebSocketMessageType, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  // Initialize connection on mount and clean up on unmount
  useEffect(() => {
    connect();
    
    return () => {
      // Close the connection when the component unmounts
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);
  
  // Return the WebSocket API for use in components
  return {
    // Connection status
    status,
    isConnected,
    isConnecting,
    isDisconnected,
    
    // Messages
    messages,
    
    // Actions
    sendMessage,
    reconnect,
    
    // For testing/debugging
    _socket: socketRef.current,
  };
}

// Export a singleton WebSocket class for use outside of React components
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<WebSocketMessageType, Array<(data: any) => void>> = new Map();
  private statusChangeHandlers: Array<(status: WebSocketStatus) => void> = [];
  private status: WebSocketStatus = WebSocketStatus.CLOSED;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  // Get the singleton instance
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  // Connect to the WebSocket server
  public connect(): void {
    try {
      // Close any existing connections
      if (this.socket) {
        this.socket.close();
      }
      
      this.setStatus(WebSocketStatus.CONNECTING);
      
      // Determine the proper WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create the connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (err) {
      const error = processError(err, {
        context: 'WebSocket service initialization',
      });
      error.type = ErrorType.WEBSOCKET;
      logError(error);
      this.setStatus(WebSocketStatus.CLOSED);
    }
  }
  
  // Disconnect from the server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
  }
  
  // Send a message to the server
  public sendMessage(type: WebSocketMessageType, payload: any): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  
  // Register a message handler
  public on(type: WebSocketMessageType, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler);
    
    // Return a function to remove this handler
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  // Register a connection status change handler
  public onStatusChange(handler: (status: WebSocketStatus) => void): () => void {
    this.statusChangeHandlers.push(handler);
    
    // Return a function to remove this handler
    return () => {
      const index = this.statusChangeHandlers.indexOf(handler);
      if (index !== -1) {
        this.statusChangeHandlers.splice(index, 1);
      }
    };
  }
  
  // Get the current connection status
  public getStatus(): WebSocketStatus {
    return this.status;
  }
  
  // Set status and notify handlers
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusChangeHandlers.forEach(handler => handler(status));
  }
  
  // Handle socket open event
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.setStatus(WebSocketStatus.OPEN);
    this.reconnectAttempts = 0;
  }
  
  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      
      // Notify type-specific handlers
      const handlers = this.messageHandlers.get(data.type);
      if (handlers) {
        handlers.forEach(handler => handler(data.payload));
      }
      
      // Notify general message handlers
      const allHandlers = this.messageHandlers.get('*' as WebSocketMessageType);
      if (allHandlers) {
        allHandlers.forEach(handler => handler(data));
      }
    } catch (err) {
      const error = processError(err, {
        context: 'WebSocket message processing',
        rawMessage: event.data,
      });
      error.type = ErrorType.WEBSOCKET;
      logError(error);
    }
  }
  
  // Handle socket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed with code: ${event.code}`);
    this.setStatus(WebSocketStatus.CLOSED);
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
  }
  
  // Handle socket error event
  private handleError(event: Event): void {
    const error = processError(new Error('WebSocket connection error'), {
      context: 'WebSocket error event',
      event,
    });
    error.type = ErrorType.WEBSOCKET;
    logError(error);
    
    this.setStatus(WebSocketStatus.CLOSING);
  }
  
  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      
      // Exponential backoff with jitter
      const baseDelay = 1000;
      const maxDelay = 30000;
      const expBackoff = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, this.reconnectAttempts - 1)
      );
      const jitter = Math.random() * 0.3;
      const delay = expBackoff * (1 + jitter);
      
      console.log(`Attempting to reconnect in ${Math.round(delay / 1000)} seconds...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();