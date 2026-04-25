import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatTime } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mountain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserInitials } from "@/lib/utils";
import { webSocketService, WebSocketMessageType } from "@/lib/websocketService";

interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  sender: "user" | "assistant";
  timestamp: string;
}

interface SalesAssistantChatProps {
  userName: string;
}

export default function SalesAssistantChat({ userName }: SalesAssistantChatProps) {
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    staleTime: 300000,
  });

  const sendMessage = useMutation({
    mutationFn: (newMessage: string) => {
      setWaitingForResponse(true);
      return apiRequest("POST", "/api/chat", { message: newMessage, sender: "user" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate(message);
    setMessage("");
  };

  useEffect(() => {
    if (webSocketService.getStatus() === "CLOSED") {
      webSocketService.connect();
    }
    const unsubscribe = webSocketService.on(WebSocketMessageType.MESSAGE, (payload) => {
      if (payload.type === "ai_chat_response") {
        setWaitingForResponse(false);
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // ScrollArea (Radix) renders a custom viewport — scrollIntoView walks up to the
    // page and scrolls the wrong container. Target the viewport directly instead.
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, waitingForResponse]);

  const userInitials = getUserInitials(userName || "User");

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl border border-earth/20 dark:border-earth/10 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-earth/15 dark:border-earth/10 px-6 py-4 flex items-center justify-between bg-sage/5 dark:bg-sage/10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sage flex items-center justify-center shadow-md">
            <Mountain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-forest dark:text-parchment">Sherpa Assistant</h2>
            <p className="text-xs text-forest/50 dark:text-parchment/50">AI-powered guidance</p>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Online" />
      </div>

      {/* Messages */}
      <ScrollArea className="p-5 h-80" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-full gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent" />
            <p className="text-sm text-forest/50 dark:text-parchment/50">Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center mb-4">
              <Mountain className="h-7 w-7 text-sage" />
            </div>
            <h3 className="text-base font-bold text-forest dark:text-parchment mb-2">
              Welcome to Sherpa Assistant
            </h3>
            <p className="text-sm text-forest/50 dark:text-parchment/50 mb-5">
              Ask about sales strategies, meeting prep, or get guidance on hitting your targets.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {[
                "How can I improve my close rate?",
                "Tips for better client meetings",
                "Help me with follow-up strategies",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setMessage(suggestion);
                    setTimeout(() => sendMessage.mutate(suggestion), 50);
                  }}
                  className="text-sm px-4 py-2.5 rounded-2xl border border-earth/30 hover:bg-earth/10 transition-colors text-left text-forest dark:text-parchment"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 group ${msg.sender === "user" ? "justify-end" : ""}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-sage flex-shrink-0 flex items-center justify-center shadow-sm border border-sage/20 mr-3">
                    <Mountain className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={
                    msg.sender === "assistant"
                      ? "bg-cream dark:bg-dark-bg/60 border border-earth/15 dark:border-earth/10 rounded-2xl rounded-tl-md py-3 px-4 max-w-[82%]"
                      : "mr-3 bg-clay rounded-2xl rounded-tr-md py-3 px-4 max-w-[82%]"
                  }
                >
                  <p
                    className={`text-sm leading-relaxed ${
                      msg.sender === "assistant"
                        ? "text-forest dark:text-parchment"
                        : "text-white"
                    }`}
                  >
                    {msg.message}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === "assistant"
                        ? "text-forest/40 dark:text-parchment/40"
                        : "text-white/70"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>

                {msg.sender === "user" && (
                  <div className="w-9 h-9 rounded-xl bg-forest/20 flex-shrink-0 flex items-center justify-center shadow-sm ml-0">
                    <span className="text-xs font-bold text-forest dark:text-parchment">{userInitials}</span>
                  </div>
                )}
              </div>
            ))}

            {waitingForResponse && (
              <div className="flex mb-4">
                <div className="w-9 h-9 rounded-xl bg-sage flex-shrink-0 flex items-center justify-center shadow-sm border border-sage/20 mr-3">
                  <Mountain className="h-4 w-4 text-white" />
                </div>
                <div className="bg-cream dark:bg-dark-bg/60 border border-earth/15 rounded-2xl rounded-tl-md py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {[0, 300, 600].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-clay/60 rounded-full animate-pulse"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-5 py-4 border-t border-earth/15 dark:border-earth/10 bg-cream/50 dark:bg-dark-bg/30">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Ask your Sherpa…"
            className="flex-1 rounded-2xl border-earth/30 dark:border-earth/15 focus-visible:ring-1 focus-visible:ring-clay bg-white dark:bg-dark-card text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            className="bg-clay hover:bg-clay/90 text-white rounded-2xl px-5"
            disabled={sendMessage.isPending || !message.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
