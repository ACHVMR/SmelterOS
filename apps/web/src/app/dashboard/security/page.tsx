"use client"

import React from "react"
import { Panel, Button, Input, Switch, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Separator } from "@/components/ui"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Security Settings</h1>
          <p className="text-mono text-[rgb(var(--text-secondary))]">
            DASHBOARD // SECURITY
          </p>
        </div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Password & Authentication">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-default))]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-default))]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-default))]"
                  />
                </div>
                <Button className="bg-[rgb(var(--accent-green))] text-black">
                  Update Password
                </Button>
              </div>
            </Panel>

            <Panel title="Security Features">
              <div className="space-y-4">
                {[
                  { id: "2fa", label: "Two-Factor Authentication", description: "Add an extra layer of security", enabled: true },
                  { id: "sessions", label: "Session Monitoring", description: "Track active login sessions", enabled: true },
                  { id: "alerts", label: "Security Alerts", description: "Receive notifications for suspicious activity", enabled: false },
                  { id: "api-restrictions", label: "API Key Restrictions", description: "Limit API access by IP", enabled: false }
                ].map((feature) => (
                  <Card key={feature.id} className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-subtle))]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{feature.label}</div>
                          <div className="text-sm text-[rgb(var(--text-secondary))]">{feature.description}</div>
                        </div>
                        <Switch defaultChecked={feature.enabled} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Panel>

            <Panel title="Active Sessions">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">Chrome on macOS</TableCell>
                    <TableCell className="text-mono text-sm">192.168.1.1</TableCell>
                    <TableCell className="text-sm text-[rgb(var(--text-secondary))]">Just now</TableCell>
                    <TableCell><span className="text-[rgb(var(--status-success))] text-xs">CURRENT</span></TableCell>
                  </TableRow>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">Safari on iOS</TableCell>
                    <TableCell className="text-mono text-sm">192.168.1.50</TableCell>
                    <TableCell className="text-sm text-[rgb(var(--text-secondary))]">2 hours ago</TableCell>
                    <TableCell><Button variant="outline" size="sm">Revoke</Button></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Connected Accounts">
              <div className="space-y-4">
                {[
                  { provider: "GitHub", connected: true },
                  { provider: "Google", connected: true },
                  { provider: "Discord", connected: false }
                ].map((account) => (
                  <div key={account.provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[rgb(var(--bg-elevated))] rounded-lg flex items-center justify-center border border-[rgb(var(--border-subtle))]">
                        <span className="font-bold text-sm">{account.provider[0]}</span>
                      </div>
                      <div>
                        <div className="font-medium">{account.provider}</div>
                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                          {account.connected ? "Connected" : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {account.connected ? "Unlink" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Security Score">
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-[rgb(var(--status-success))] mb-2">85%</div>
                <div className="text-[rgb(var(--text-secondary))] mb-4">Good Security</div>
                <Separator className="my-4 bg-[rgb(var(--border-subtle))]" />
                <div className="text-sm text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[rgb(var(--status-success))]">✓</span>
                    <span>2FA Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[rgb(var(--status-success))]">✓</span>
                    <span>Strong Password</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[rgb(var(--status-warning))]">!</span>
                    <span>Enable Security Alerts</span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
