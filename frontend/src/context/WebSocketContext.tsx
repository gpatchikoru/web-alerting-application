import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  subscribe: (topics: string[]) => void;
  unsubscribe: (topics: string[]) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws';
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Resubscribe to topics after reconnection
        if (subscriptions.length > 0) {
          websocket.send(JSON.stringify({
            type: 'subscribe',
            topics: subscriptions
          }));
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isConnected) {
            connectWebSocket();
          }
        }, 5000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'update':
        // Handle real-time updates
        console.log('Received update:', data);
        // You can dispatch to a global state manager here
        break;
      case 'alert':
        // Handle new alerts
        console.log('Received alert:', data);
        break;
      case 'subscribed':
        console.log('Subscribed to topics:', data.topics);
        break;
      case 'unsubscribed':
        console.log('Unsubscribed from topics:', data.topics);
        break;
      case 'pong':
        // Handle ping/pong for connection health
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const subscribe = (topics: string[]) => {
    if (ws && isConnected) {
      const newSubscriptions = [...new Set([...subscriptions, ...topics])];
      setSubscriptions(newSubscriptions);
      
      ws.send(JSON.stringify({
        type: 'subscribe',
        topics
      }));
    }
  };

  const unsubscribe = (topics: string[]) => {
    if (ws && isConnected) {
      const newSubscriptions = subscriptions.filter(topic => !topics.includes(topic));
      setSubscriptions(newSubscriptions);
      
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        topics
      }));
    }
  };

  const value: WebSocketContextType = {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 