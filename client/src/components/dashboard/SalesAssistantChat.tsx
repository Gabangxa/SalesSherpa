import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatTime } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserInitials } from "@/lib/utils";

interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

interface SalesAssistantChatProps {
  userName: string;
}

export default function SalesAssistantChat({ userName }: SalesAssistantChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat'],
  });
  
  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (newMessage: string) => {
      return apiRequest('POST', '/api/chat', {
        message: newMessage,
        sender: 'user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    sendMessage.mutate(message);
    setMessage('');
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // To display user initials in chat
  const userInitials = getUserInitials(userName || "Jordan Doe");
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8 overflow-hidden">
      <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 01-.659 1.591L9.5 14.5m3.25-3.125L13.1 14.25M4.5 19.5h15a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0019.5 7.5h-1.5m-15 0A2.25 2.25 0 004.5 7.5h1.5m0 0v5.25M4.5 7.5h7.5" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-neutral-900">FinSales Assistant</h2>
            <p className="text-sm text-neutral-500">Your virtual sales coach</p>
          </div>
        </div>
        <div>
          <button className="text-neutral-400 hover:text-neutral-600">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <ScrollArea className="p-6 h-80">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-600"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent-100 flex-shrink-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 01-.659 1.591L9.5 14.5m3.25-3.125L13.1 14.25M4.5 19.5h15a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0019.5 7.5h-1.5m-15 0A2.25 2.25 0 004.5 7.5h1.5m0 0v5.25M4.5 7.5h7.5" />
                  </svg>
                </div>
              )}
              
              <div 
                className={`${msg.sender === 'assistant' 
                  ? 'ml-3 bg-neutral-100 rounded-lg py-2 px-4 max-w-[80%]' 
                  : 'mr-3 bg-primary-600 rounded-lg py-2 px-4 max-w-[80%]'}`}
              >
                <p 
                  className={msg.sender === 'assistant' 
                    ? 'text-sm text-neutral-800' 
                    : 'text-sm text-white'}
                >
                  {msg.message}
                </p>
                <p 
                  className={msg.sender === 'assistant' 
                    ? 'text-xs text-neutral-500 mt-1' 
                    : 'text-xs text-primary-200 mt-1'}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
              
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-300 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-neutral-700">{userInitials}</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <div className="px-6 py-4 border-t border-neutral-200">
        <form className="flex items-center" onSubmit={handleSubmit}>
          <Input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 border-0 focus-visible:ring-0 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="ml-3 h-8 w-8 p-0" 
            disabled={sendMessage.isPending}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
}
