import { useState, useEffect } from 'react';
import { WebSocketTester } from '@/components/WebSocketTester';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon, AlertTriangle } from 'lucide-react';
import { webSocketService, WebSocketMessageType, WebSocketStatus } from '@/lib/websocketService';

export default function WebSocketTest() {
  const [status, setStatus] = useState<WebSocketStatus>(webSocketService.getStatus());
  const [messageCount, setMessageCount] = useState(0);
  
  // Listen for WebSocket status changes
  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = webSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    
    // Count messages for the singleton service demo
    const unsubscribeMessages = webSocketService.on(WebSocketMessageType.MESSAGE, () => {
      setMessageCount(prev => prev + 1);
    });
    
    // Connect the singleton service if not already connected
    if (status === WebSocketStatus.CLOSED) {
      webSocketService.connect();
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      unsubscribeMessages();
    };
  }, [status]);
  
  // Send a test message from the singleton service
  const sendTestMessage = () => {
    webSocketService.sendMessage(WebSocketMessageType.MESSAGE, {
      text: 'Test message from singleton service',
      time: new Date().toISOString()
    });
  };
  
  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WebSocket Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test and debug WebSocket connections and real-time messaging
          </p>
        </div>
        
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Development Tool</AlertTitle>
          <AlertDescription>
            This page provides tools for testing WebSocket functionality. The WebSocket implementation uses
            a React hook for components and a singleton service for non-React code.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="hook">
          <TabsList>
            <TabsTrigger value="hook">React Hook Implementation</TabsTrigger>
            <TabsTrigger value="service">Singleton Service</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hook" className="mt-6">
            <WebSocketTester />
          </TabsContent>
          
          <TabsContent value="service" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  WebSocket Singleton Service
                  <Badge 
                    variant={status === WebSocketStatus.OPEN ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Test the global WebSocket service that can be used outside React components
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div>
                    <p className="font-medium">Message Count</p>
                    <p className="text-2xl font-bold">{messageCount}</p>
                  </div>
                  <Button onClick={sendTestMessage} disabled={status !== WebSocketStatus.OPEN}>
                    Send Test Message
                  </Button>
                </div>
                
                {status !== WebSocketStatus.OPEN && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Not Connected</AlertTitle>
                    <AlertDescription>
                      The WebSocket service is not connected. Check the server implementation.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Implementation Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client-Side Implementation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc pl-5 space-y-2">
                  <li>React hook (<code>useWebSocket</code>) for component integration</li>
                  <li>Singleton service for global access</li>
                  <li>Automatic reconnection with exponential backoff</li>
                  <li>Type-safe message handling</li>
                  <li>Error boundary integration</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Server-Side Implementation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc pl-5 space-y-2">
                  <li>WebSocket server on <code>/ws</code> path</li>
                  <li>Connection tracking and management</li>
                  <li>Broadcast and targeted message support</li>
                  <li>Integration with existing Express server</li>
                  <li>Authentication for secure connections</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}