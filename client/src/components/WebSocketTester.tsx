import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket, WebSocketMessageType, WebSocketStatus } from '@/lib/websocketService';

export function WebSocketTester() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const {
    status,
    messages,
    sendMessage,
    reconnect,
    isConnected,
    isConnecting,
    isDisconnected
  } = useWebSocket();

  // Display toast when connection status changes
  useEffect(() => {
    toast({
      title: `WebSocket ${status}`,
      description: `Connection is now ${status.toLowerCase()}`,
      variant: status === WebSocketStatus.OPEN ? 'default' : 'destructive',
    });
  }, [status, toast]);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (isConnected) {
      sendMessage(WebSocketMessageType.MESSAGE, { message });
      setMessage('');
    } else {
      toast({
        title: 'Not connected',
        description: 'Cannot send message while disconnected',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          WebSocket Tester
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 
            isConnecting ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}></span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md h-[200px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center italic">No messages yet</p>
          ) : (
            <ul className="space-y-2">
              {messages.map((msg, index) => (
                <li key={index} className="p-2 text-sm border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold">{msg.type}:</span>{' '}
                  <span className="text-muted-foreground">
                    {typeof msg.payload === 'object' 
                      ? JSON.stringify(msg.payload) 
                      : msg.payload}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!isConnected}
          />
          <Button onClick={handleSendMessage} disabled={!isConnected}>
            Send
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Status: <span className="font-medium">{status}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={reconnect}
          disabled={isConnecting}
        >
          {isDisconnected ? 'Connect' : 'Reconnect'}
        </Button>
      </CardFooter>
    </Card>
  );
}