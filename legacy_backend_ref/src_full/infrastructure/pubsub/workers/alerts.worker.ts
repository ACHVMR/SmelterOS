/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Alerts Worker
 * Async Alert Processing, Notifications, and Incident Triggers
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, AlertPayload, PubSubMessage } from '../config.js';
import { getFirestoreClient } from '../../database/firestore-client.js';
import { GCP_PROJECT } from '../../gcp/config.js';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// TYPES
// =============================================================================

interface AlertResult {
  id: string;
  alertId: string;
  severity: string;
  category: string;
  title: string;
  deliveredTo: string[];
  failedChannels: string[];
  processingTime: number;
}

interface ChannelConfig {
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  serviceKey?: string;
}

// =============================================================================
// WORKER
// =============================================================================

export class AlertsWorker extends BaseWorker<AlertPayload> {
  private channelConfigs: Record<string, ChannelConfig> = {
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    email: {
      enabled: false,
      email: process.env.ALERT_EMAIL,
    },
    pagerduty: {
      enabled: false,
      serviceKey: process.env.PAGERDUTY_KEY,
    },
    webhook: {
      enabled: true,
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
    },
  };

  constructor() {
    super('alerts', PUBSUB_TOPICS.ALERTS, {
      maxConcurrency: 20,
      pollIntervalMs: 100,
      circuitId: 'alerts',
    });
  }

  protected async process(
    payload: AlertPayload,
    message: PubSubMessage<AlertPayload>
  ): Promise<WorkerResult<AlertResult>> {
    const startTime = Date.now();

    try {
      console.log(`🔔 Processing alert: ${payload.severity.toUpperCase()}`);
      console.log(`   Title: ${payload.title}`);
      console.log(`   Category: ${payload.category}`);
      console.log(`   Channels: ${payload.channels.join(', ')}`);

      const alertId = generateUUID();
      const deliveredTo: string[] = [];
      const failedChannels: string[] = [];

      // Send to each channel
      for (const channel of payload.channels) {
        try {
          const success = await this.sendToChannel(channel, payload, alertId);
          if (success) {
            deliveredTo.push(channel);
          } else {
            failedChannels.push(channel);
          }
        } catch (error) {
          console.error(`   ✗ Failed to send to ${channel}:`, error);
          failedChannels.push(channel);
        }
      }

      // Persist alert to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument(
        'alerts',
        alertId,
        {
          id: alertId,
          alertId,
          severity: payload.severity,
          category: payload.category,
          title: payload.title,
          message: payload.message,
          context: payload.context,
          channels: payload.channels,
          deliveredTo,
          failedChannels,
          createdAt: new Date().toISOString(),
          jobId: payload.jobId,
          correlationId: payload.correlationId,
        }
      );

      const result: AlertResult = {
        id: alertId,
        alertId,
        severity: payload.severity,
        category: payload.category,
        title: payload.title,
        deliveredTo,
        failedChannels,
        processingTime: Date.now() - startTime,
      };

      console.log(`   ✓ Alert delivered to ${deliveredTo.length}/${payload.channels.length} channels`);

      return {
        success: true,
        jobId: payload.jobId,
        data: result,
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ Alert processing failed:`, error);
      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  private async sendToChannel(
    channel: 'email' | 'slack' | 'pagerduty' | 'webhook',
    payload: AlertPayload,
    alertId: string
  ): Promise<boolean> {
    const config = this.channelConfigs[channel];
    if (!config?.enabled) {
      console.log(`   ⚠ Channel ${channel} is not enabled`);
      return false;
    }

    switch (channel) {
      case 'slack':
        return this.sendSlack(config, payload, alertId);
      case 'email':
        return this.sendEmail(config, payload, alertId);
      case 'pagerduty':
        return this.sendPagerDuty(config, payload, alertId);
      case 'webhook':
        return this.sendWebhook(config, payload, alertId);
      default:
        return false;
    }
  }

  private async sendSlack(
    config: ChannelConfig,
    payload: AlertPayload,
    alertId: string
  ): Promise<boolean> {
    if (!config.webhookUrl) {
      console.log('   ⚠ Slack webhook not configured, simulating send');
      return true; // Simulate success for development
    }

    const severityEmoji: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🔴',
      critical: '🚨',
    };

    const categoryEmoji: Record<string, string> = {
      system: '⚙️',
      security: '🔐',
      performance: '📊',
      business: '💼',
      agent: '🤖',
    };

    const slackMessage = {
      text: `${severityEmoji[payload.severity] || '📢'} *${payload.title}*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${severityEmoji[payload.severity] || '📢'} ${payload.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity:*\n${payload.severity.toUpperCase()}` },
            { type: 'mrkdwn', text: `*Category:*\n${categoryEmoji[payload.category] || ''} ${payload.category}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Alert ID: ${alertId} | ${new Date().toISOString()}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    return response.ok;
  }

  private async sendEmail(
    config: ChannelConfig,
    payload: AlertPayload,
    alertId: string
  ): Promise<boolean> {
    // In production, use SendGrid, SES, or similar
    console.log(`   📧 Would send email to: ${config.email}`);
    console.log(`      Subject: [${payload.severity.toUpperCase()}] ${payload.title}`);
    return true; // Simulate success
  }

  private async sendPagerDuty(
    config: ChannelConfig,
    payload: AlertPayload,
    alertId: string
  ): Promise<boolean> {
    if (!config.serviceKey) {
      console.log('   ⚠ PagerDuty service key not configured');
      return true; // Simulate success
    }

    const severity = payload.severity === 'critical' ? 'critical' : 
                     payload.severity === 'error' ? 'error' :
                     payload.severity === 'warning' ? 'warning' : 'info';

    const pagerDutyEvent = {
      routing_key: config.serviceKey,
      event_action: 'trigger',
      dedup_key: alertId,
      payload: {
        summary: `[${payload.category}] ${payload.title}`,
        severity,
        source: 'SmelterOS',
        custom_details: {
          message: payload.message,
          context: payload.context,
          alertId,
        },
      },
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagerDutyEvent),
    });

    return response.ok;
  }

  private async sendWebhook(
    config: ChannelConfig,
    payload: AlertPayload,
    alertId: string
  ): Promise<boolean> {
    if (!config.webhookUrl) {
      console.log('   ⚠ Custom webhook not configured');
      return true; // Simulate success
    }

    const webhookPayload = {
      alertId,
      severity: payload.severity,
      category: payload.category,
      title: payload.title,
      message: payload.message,
      context: payload.context,
      timestamp: new Date().toISOString(),
      source: 'SmelterOS',
      project: GCP_PROJECT.projectId,
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    return response.ok;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let worker: AlertsWorker | null = null;

export function getAlertsWorker(): AlertsWorker {
  if (!worker) {
    worker = new AlertsWorker();
  }
  return worker;
}
