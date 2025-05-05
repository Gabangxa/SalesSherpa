import { WebSocketTester } from '@/components/WebSocketTester';

export default function WebSocketTest() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">WebSocket Testing Page</h1>
      <WebSocketTester />
      
      <div className="mt-8 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold mb-4">Help & Information</h2>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
          <p className="mb-2">This page allows you to test the WebSocket connection. Here's what you can do:</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Send messages to the server</li>
            <li>See real-time responses</li>
            <li>Monitor connection status</li>
            <li>Reconnect if the connection is lost</li>
          </ul>
          <p className="text-sm text-muted-foreground">The WebSocket server is running on the same host as the application, but on a dedicated '/ws' path.</p>
        </div>
      </div>
    </div>
  );
}