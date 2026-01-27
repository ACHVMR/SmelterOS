"use client";

import React, { useState, useRef, useEffect } from "react";
import { TerminalContainer } from "@/components/layout/terminal-container";

interface Message {
  id: string;
  sender: "user" | "system" | "agent";
  text: string;
  timestamp: Date;
}

export function ConsoleTerminal() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "system",
      text: "SmelterOS v2.1.0 Online. Oracle Gateway connected.\nAwaiting command...",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          intent: "general",
          payload: { task: userMsg.text, context: {} } 
        }),
      });

      const data = await response.json();
      
      let replyText = "";
      if (data.error) {
        replyText = `ERROR: ${data.error}`;
      } else if (data.response && data.response.message) {
        replyText = data.response.message; // Adapt based on actual Gateway response
      } else {
        replyText = JSON.stringify(data.response || data, null, 2);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: replyText,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "system",
          text: `CONNECTION FAILURE: ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TerminalContainer header="console@smelter:~" className="h-[80vh] flex flex-col w-full max-w-5xl">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded px-3 py-2 text-sm font-mono whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-terminal-green/20 text-white border border-terminal-green/50"
                  : msg.sender === "system"
                  ? "text-gray-400 italic"
                  : "text-terminal-green"
              }`}
            >
              {msg.sender === "agent" && <span className="mr-2 select-none">{">"}</span>}
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-600 mt-1">
              {mounted ? msg.timestamp.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="text-terminal-green animate-pulse text-sm">
            Processing...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-terminal-green/30 pt-4">
        <span className="text-terminal-green">{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-gray-600"
          placeholder="Enter command or query..."
          autoFocus
        />
      </form>
    </TerminalContainer>
  );
}
