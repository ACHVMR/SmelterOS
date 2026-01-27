"use client";

import React, { useState, useEffect } from "react";

interface APIKey {
  provider: string;
  key: string;
  isValid: boolean;
  lastValidated?: Date;
}

export default function BYOKPanel() {
  const [keys, setKeys] = useState<Record<string, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
    google: "",
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const res = await fetch("/api/user/keys");
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
        setValidationStatus(data.validationStatus || {});
      }
    } catch (error) {
      console.error("Failed to load keys:", error);
    }
  }

  async function saveKey(provider: string) {
    setSaving(true);
    try {
      await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keys[provider] }),
      });
    } catch (error) {
      console.error("Failed to save key:", error);
    } finally {
      setSaving(false);
    }
  }

  async function validateKey(provider: string) {
    setValidating(provider);
    try {
      const res = await fetch("/api/user/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keys[provider] }),
      });
      const data = await res.json();
      setValidationStatus((prev) => ({ ...prev, [provider]: data.valid }));
    } catch (error) {
      setValidationStatus((prev) => ({ ...prev, [provider]: false }));
    } finally {
      setValidating(null);
    }
  }

  const providers = [
    {
      id: "openrouter",
      name: "OpenRouter",
      icon: "🌐",
      description: "Access 100+ models via unified API",
      docsUrl: "https://openrouter.ai/keys",
      placeholder: "sk-or-v1-...",
    },
    {
      id: "openai",
      name: "OpenAI",
      icon: "🟢",
      description: "GPT-4, GPT-4o, o1 models",
      docsUrl: "https://platform.openai.com/api-keys",
      placeholder: "sk-...",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      icon: "🟠",
      description: "Claude 3.5, Claude 3 models",
      docsUrl: "https://console.anthropic.com/settings/keys",
      placeholder: "sk-ant-...",
    },
    {
      id: "google",
      name: "Google AI",
      icon: "💫",
      description: "Gemini 2.0, Gemini Pro models",
      docsUrl: "https://aistudio.google.com/app/apikey",
      placeholder: "AIza...",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0a0e1a] to-[#0a0a0a] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bring Your Own Keys</h1>
          <p className="text-gray-400">
            Use your own API keys for unlimited access without a subscription.
            Your keys are encrypted and stored securely.
          </p>
        </div>

        {/* Key Cards */}
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{provider.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{provider.name}</h3>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </div>
                </div>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-400 hover:underline"
                >
                  Get API Key →
                </a>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="password"
                    value={keys[provider.id] || ""}
                    onChange={(e) =>
                      setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                    }
                    placeholder={provider.placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                  {validationStatus[provider.id] !== undefined && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        validationStatus[provider.id] ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {validationStatus[provider.id] ? "✓" : "✕"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => validateKey(provider.id)}
                  disabled={!keys[provider.id] || validating === provider.id}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 text-sm"
                >
                  {validating === provider.id ? "..." : "Test"}
                </button>
                <button
                  onClick={() => saveKey(provider.id)}
                  disabled={!keys[provider.id] || saving}
                  className="px-4 py-2 bg-orange-500 rounded-lg text-white font-semibold hover:bg-orange-600 disabled:opacity-50 text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-blue-400 mb-2">🔒 Security</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Keys are encrypted with AES-256 before storage</li>
            <li>• Keys are never logged or exposed in responses</li>
            <li>• You can delete your keys at any time</li>
            <li>• BYOK usage is not rate-limited</li>
          </ul>
        </div>

        {/* Priority Order */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">API Key Priority</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
              <span className="text-gray-300">Your BYOK</span>
            </div>
            <span className="text-gray-500">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
              <span className="text-gray-300">OpenRouter (shared)</span>
            </div>
            <span className="text-gray-500">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
              <span className="text-gray-300">Rate limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
