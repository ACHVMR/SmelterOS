"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Model {
  id: string;
  name: string;
  provider: string;
  icon: string | React.ReactNode;
  description: string;
  available: boolean;
}

const AVAILABLE_MODELS: Model[] = [
  {
    id: "chickenhawk",
    name: "Chicken Hawk",
    provider: "OpenRouter",
    icon: "/chickenhawk-logo.png",
    description: "SmelterOS Agentic Mode - Multi-agent orchestration",
    available: true,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    icon: "💫",
    description: "Fast, multimodal AI",
    available: true,
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    icon: "🟠",
    description: "Advanced reasoning",
    available: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: "🟢",
    description: "Omni model",
    available: true,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    icon: "🔵",
    description: "Reasoning model",
    available: true,
  },
];

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
      >
        {current.id === "chickenhawk" ? (
          <div className="w-8 h-8 relative">
            <Image
              src="/chickenhawk-logo.png"
              alt="Chicken Hawk"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <span className="text-2xl">{current.icon}</span>
        )}
        <div className="text-left">
          <p className="font-medium text-white">{current.name}</p>
          <p className="text-xs text-gray-400">{current.provider}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Select Model</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all ${
                    currentModel === model.id ? "bg-white/10" : ""
                  }`}
                >
                  {model.id === "chickenhawk" ? (
                    <div className="w-10 h-10 relative">
                      <Image
                        src="/chickenhawk-logo.png"
                        alt="Chicken Hawk"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-3xl w-10 text-center">{model.icon}</span>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{model.name}</p>
                    <p className="text-xs text-gray-400">{model.description}</p>
                  </div>
                  {currentModel === model.id && (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 bg-black/20">
              <p className="text-xs text-gray-500">Powered by OpenRouter API</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
