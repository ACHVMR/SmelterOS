"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PaywallProps {
  children: React.ReactNode;
  requiredTier?: "free" | "dataEntry" | "premium";
}

export function PaywallGate({ children, requiredTier = "dataEntry" }: PaywallProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      
      setIsAuthenticated(data.authenticated);
      setIsSubscribed(data.subscribed);
      setUserTier(data.tier);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-orange-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0a0e1a] to-[#0a0a0a] p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">🦅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Chicken Hawk Mode</h1>
          <p className="text-gray-400 mb-8">Sign in to access the AI Command Center</p>
          
          <button
            onClick={() => router.push("/auth/signin")}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-semibold text-white hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Sign In
          </button>
          
          <p className="mt-6 text-sm text-gray-500">
            Don't have an account?{" "}
            <button onClick={() => router.push("/auth/signup")} className="text-orange-400 hover:underline">
              Create one
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return <SubscriptionWall currentTier={userTier} requiredTier={requiredTier} />;
  }

  return <>{children}</>;
}

function SubscriptionWall({ currentTier, requiredTier }: { currentTier: string | null; requiredTier: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubscribe(priceId: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const plans = [
    {
      id: "dataEntry",
      name: "Data Entry",
      price: "$29",
      period: "/month",
      features: [
        "500 requests/day",
        "ii-agent access",
        "Codex Terminal",
        "Gemini CLI",
        "Basic support",
      ],
      priceId: "price_dataentry", // Replace with actual Stripe price ID
      popular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$199",
      period: "/month",
      features: [
        "Unlimited requests",
        "All 19 modules",
        "Agent Zero access",
        "Multi-agent teams",
        "Priority support",
        "Custom agents",
      ],
      priceId: "price_premium", // Replace with actual Stripe price ID
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0a0e1a] to-[#0a0a0a] p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-2">Unlock Chicken Hawk Mode</h1>
          <p className="text-gray-400">Choose a plan to access the AI Command Center</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-xl border rounded-2xl p-8 ${
                plan.popular ? "border-orange-500/50" : "border-white/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 rounded-full text-xs font-semibold text-white">
                  MOST POPULAR
                </div>
              )}
              
              <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {isLoading ? "Processing..." : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-gray-500">
          Or use your own API keys →{" "}
          <a href="/dashboard/byok" className="text-orange-400 hover:underline">
            BYOK Panel
          </a>
        </p>
      </div>
    </div>
  );
}
