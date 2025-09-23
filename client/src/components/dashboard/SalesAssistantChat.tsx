import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatTime } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, Bot } from "lucide-react";
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
  
  // State to track if we're waiting for an AI response
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  // Fetch chat messages with automatic polling
  const { data: messages = [], isLoading, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat'],
    refetchInterval: waitingForResponse ? 1000 : false, // Poll every second when waiting for a response
  });
  
  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (newMessage: string) => {
      setWaitingForResponse(true); // Start waiting for AI response
      return apiRequest('POST', '/api/chat', {
        message: newMessage,
        sender: 'user'
      });
    },
    onSuccess: () => {
      // Immediately fetch new messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
      
      // Set up a check to see if AI has responded
      const checkForResponse = async () => {
        const { data: latestMessages } = await refetch();
        
        // Check if the last message is from the assistant
        if (latestMessages && latestMessages.length > 0) {
          const lastMessage = latestMessages[latestMessages.length - 1];
          if (lastMessage.sender === 'assistant') {
            setWaitingForResponse(false); // Stop polling when we get the AI response
          } else {
            // If we still don't have a response, check again in a moment
            setTimeout(checkForResponse, 1000);
          }
        }
      };
      
      // Start checking for the response
      setTimeout(checkForResponse, 1000);
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
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-bold text-white">Sales Sherpa Assistant</h2>
            <p className="text-sm text-gray-300 font-medium">AI-powered guidance</p>
          </div>
        </div>
        <div>
          <button 
            className="text-white/80 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Expand chat"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <ScrollArea className="p-5 h-96">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-full gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Welcome to your Sales Sherpa Assistant</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions about sales strategies, meeting preparation, or get guidance on achieving your targets.
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                  {["How can I improve my close rate?", "Tips for better client meetings", "Help me with follow-up strategies"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setMessage(suggestion);
                        setTimeout(() => {
                          handleSubmit(new Event('click') as any);
                        }, 100);
                      }}
                      className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted/80 transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div 
                    key={msg.id} 
                    className={`flex mb-6 ${msg.sender === 'user' ? 'justify-end' : ''} group`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    {msg.sender === 'user' && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10 order-2">
                        <span className="text-white font-semibold text-sm">{userInitials}</span>
                      </div>
                    )}
                    
                    <div 
                      className={`${msg.sender === 'assistant' 
                        ? 'ml-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-sm border border-white/10 rounded-2xl rounded-tl-md py-4 px-5 max-w-[85%] shadow-xl' 
                        : 'mr-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-md py-4 px-5 max-w-[85%] shadow-xl border border-blue-500/30'}`}
                    >
                      <p 
                        className={msg.sender === 'assistant' 
                          ? 'text-sm text-gray-100 leading-relaxed font-medium' 
                          : 'text-sm text-white leading-relaxed font-medium'}
                      >
                        {msg.message}
                      </p>
                      <div className="flex justify-between items-center mt-1.5">
                        <p 
                          className={msg.sender === 'assistant' 
                            ? 'text-[10px] text-muted-foreground' 
                            : 'text-[10px] text-primary-foreground/80'}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                        
                        {msg.sender === 'assistant' && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1 text-muted-foreground hover:text-foreground"
                              aria-label="Copy message"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.message);
                                // Could add toast here
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                ))}
                
                {/* AI thinking indicator */}
                {waitingForResponse && (
                  <div className="flex mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="ml-3 bg-muted rounded-2xl rounded-tl-none py-3 px-4 max-w-[85%] shadow-sm min-w-[80px]">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <div className="px-5 py-4 border-t border-border/40 bg-card">
        <form className="flex items-center" onSubmit={handleSubmit}>
          <Input 
            type="text" 
            placeholder="Ask your Sales Sherpa Assistant..."
            className="flex-1 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary text-sm rounded-lg py-2.5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            size="default" 
            className="ml-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5" 
            disabled={sendMessage.isPending || message.trim() === ''}
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
}
