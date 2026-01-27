"use client"

import React, { useState } from "react"
import { Panel, Button, Input, Separator, Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui"

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Support Hub</h1>
          <p className="text-mono text-[rgb(var(--text-secondary))]">
            DASHBOARD // SUPPORT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Submit a Ticket">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); setTimeout(() => setSubmitted(false), 3000) }}>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input 
                    placeholder="Brief description of your issue" 
                    className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-default))]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select 
                    className="w-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-[rgb(var(--text-primary))]"
                    title="Issue category"
                    aria-label="Select issue category"
                  >
                    <option>Technical Issue</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea 
                    rows={6}
                    placeholder="Detailed description of your issue..."
                    className="w-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-[rgb(var(--text-primary))]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className={`w-full ${submitted ? 'bg-[rgb(var(--status-success))]' : 'bg-[rgb(var(--accent-green))]'} text-black`}
                >
                  {submitted ? "✓ Submitted" : "Submit Ticket"}
                </Button>
              </form>
            </Panel>

            <Panel title="Frequently Asked Questions">
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="item-1" className="border-[rgb(var(--border-subtle))]">
                  <AccordionTrigger>How do I monitor AVVA NOON's execution?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to Mission Control to view real-time agent status, FDH runtime tracking, and V.I.B.E. scores.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-[rgb(var(--border-subtle))]">
                  <AccordionTrigger>What does a V.I.B.E. score below 0.85 mean?</AccordionTrigger>
                  <AccordionContent>
                    A V.I.B.E. score below 0.85 triggers a HALT condition. The code needs improvement in Verifiability, Idempotency, Boundedness, or Evidence before proceeding.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-[rgb(var(--border-subtle))]">
                  <AccordionTrigger>How are runtime_hours calculated in FDH?</AccordionTrigger>
                  <AccordionContent>
                    FDH (Foster-Develop-Hone) tracks actual execution time in hours, not calendar weeks. This typically achieves 90%+ time compression vs. traditional estimates.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-[rgb(var(--border-subtle))]">
                  <AccordionTrigger>What's the difference between Charter and Ledger logs?</AccordionTrigger>
                  <AccordionContent>
                    Charter logs are customer-safe (no internal costs/margins). Ledger logs contain complete audit trails including internal pricing. This separation ensures transparency while protecting sensitive data.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Quick Links">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  📚 Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  💬 Community Forum
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📹 Video Tutorials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🔧 API Reference
                </Button>
              </div>
            </Panel>

            <Panel title="Contact Support">
              <div  className="space-y-4">
                <div>
                  <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Email</div>
                  <div className="font-medium text-mono text-sm">support@smelteros.dev</div>
                </div>
                <Separator className="bg-[rgb(var(--border-subtle))]" />
                <div>
                  <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Response Time</div>
                  <div className="font-medium">&lt; 4 hours</div>
                </div>
                <Separator className="bg-[rgb(var(--border-subtle))]" />
                <div>
                  <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Availability</div>
                  <div className="font-medium">24/7 Support</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
