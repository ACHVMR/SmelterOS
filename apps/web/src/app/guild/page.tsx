"use client"

import React from "react"
import { Panel, StatusIndicator, Button, Card, CardContent } from "@/components/ui"

export default function GuildPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Guild Portal</h1>
          <p className="text-mono text-[rgb(var(--text-secondary))]">
            SMELTER<span className="text-[rgb(var(--accent-orange))]">OS</span> // GUILD NET
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Guild Members */}
          <Panel title="Guild Members" className="lg:col-span-1">
            <div className="space-y-3">
              {[
                { name: "TechSage", status: "active", level: 7 },
                { name: "CodeMaster", status: "active", level: 9 },
                { name:  "DevNinja", status: "inactive", level: 5 },
                { name: "BuilderX", status: "active", level: 6 }
              ].map((member) => (
                <div key={member.name} className="flex items-center justify-between p-2 bg-[rgb(var(--bg-elevated))] rounded-lg border border-[rgb(var(--border-subtle))]">
                  <div>
                    <div className="font-semibold text-sm">{member.name}</div>
                    <div className="text-xs text-[rgb(var(--text-secondary))]">Level {member.level}</div>
                  </div>
                  <StatusIndicator status={member.status as any} size="sm" showDot={true} label="" />
                </div>
              ))}
            </div>
          </Panel>

          {/* Guild Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Guild Feed">
              <div className="space-y-4">
                {[
                  { author: "TechSage", time: "5 min ago", content: "Just deployed a new AVVA NOON config with 95% efficiency!" },
                  { author: "CodeMaster", time: "1 hour ago", content: "Anyone tried the new V.I.B.E. scorer? Getting great results." },
                  { author: "BuilderX", time: "3 hours ago", content: "Looking for collaborators on a new agent project. DM me!" }
                ].map((post, idx) => (
                  <Card key={idx} className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-subtle))]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[rgb(var(--accent-green))] rounded-full flex items-center justify-center font-bold text-black">
                          {post.author[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{post.author}</span>
                            <span className="text-xs text-[rgb(var(--text-muted))] text-mono">{post.time}</span>
                          </div>
                          <p className="text-[rgb(var(--text-secondary))] text-sm">{post.content}</p>
                          <div className="flex gap-4 mt-3 text-sm text-[rgb(var(--text-muted))]">
                            <button className="hover:text-[rgb(var(--accent-cyan))]">Like</button>
                            <button className="hover:text-[rgb(var(--accent-cyan))]">Reply</button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Panel>
          </div>

          {/* Leaderboard */}
          <Panel title="Leaderboard" className="lg:col-span-1">
            <div className="space-y-3">
              {[
                { rank: 1, name: "CodeMaster", points: 1250 },
                { rank: 2, name: "TechSage", points: 980 },
                { rank: 3, name: "BuilderX", points: 875 },
                { rank: 4, name: "DevNinja", points: 720 }
              ].map((entry) => (
                <div key={entry.rank} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1 ? 'bg-[rgb(var(--status-warning))] text-black' :
                    entry.rank === 2 ? 'bg-[rgb(var(--text-secondary))] text-black' :
                    entry.rank === 3 ? 'bg-[rgb(var(--accent-orange))] text-black' :
                    'bg-[rgb(var(--bg-elevated))]'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{entry.name}</div>
                    <div className="text-xs text-mono text-[rgb(var(--text-secondary))]">{entry.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
