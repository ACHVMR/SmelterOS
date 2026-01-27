"""
HITL (Human-in-the-Loop) Controller + Resend Notifications
═══════════════════════════════════════════════════════════════════════════════

Provides checkpoints for human approval in the autonomous loop and
notifications via Resend when the human is not at their desk.

HITL Checkpoints:
- HIGH_RISK: Destructive operations, production deploys, financial
- MAJOR_CHANGE: Architecture changes, schema migrations, API breaking
- COST_THRESHOLD: When token spend exceeds configured limit
- GATE_FAILURE: When ORACLE gates fail after max retries
- SCHEDULED: Periodic check-ins (e.g., every N tasks)

Notification Channels:
- Email (via Resend)
- Webhook (Slack, Discord, etc.)
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List, Callable
import httpx

logger = logging.getLogger("hitl_controller")


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@smelteros.com")
HITL_NOTIFY_EMAIL = os.getenv("HITL_NOTIFY_EMAIL", "")
HITL_WEBHOOK_URL = os.getenv("HITL_WEBHOOK_URL", "")
HITL_TIMEOUT_MINUTES = int(os.getenv("HITL_TIMEOUT_MINUTES", "30"))
HITL_AUTO_APPROVE_LOW_RISK = os.getenv("HITL_AUTO_APPROVE_LOW_RISK", "true").lower() == "true"


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS & TYPES
# ═══════════════════════════════════════════════════════════════════════════

class HITLReason(str, Enum):
    """Reasons for requiring human intervention."""
    HIGH_RISK = "high_risk"
    MAJOR_CHANGE = "major_change"
    COST_THRESHOLD = "cost_threshold"
    GATE_FAILURE = "gate_failure"
    SCHEDULED = "scheduled"
    EXPLICIT_REQUEST = "explicit_request"


class HITLStatus(str, Enum):
    """Status of a HITL checkpoint."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TIMEOUT = "timeout"
    AUTO_APPROVED = "auto_approved"


@dataclass
class HITLCheckpoint:
    """A human-in-the-loop checkpoint."""
    checkpoint_id: str
    task_id: str
    reason: HITLReason
    description: str
    context: Dict[str, Any] = field(default_factory=dict)
    status: HITLStatus = HITLStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# RESEND NOTIFICATION CLIENT
# ═══════════════════════════════════════════════════════════════════════════

class ResendNotifier:
    """Send notifications via Resend email API."""
    
    def __init__(self, api_key: str = RESEND_API_KEY):
        self.api_key = api_key
        self.base_url = "https://api.resend.com"
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send an email via Resend."""
        if not self.api_key:
            logger.warning("No Resend API key configured, skipping email")
            return False
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": RESEND_FROM_EMAIL,
                        "to": [to],
                        "subject": subject,
                        "html": html_body,
                        "text": text_body or html_body
                    }
                )
                response.raise_for_status()
                logger.info(f"Email sent to {to}: {subject}")
                return True
            except Exception as e:
                logger.error(f"Failed to send email: {e}")
                return False
    
    async def send_hitl_notification(
        self,
        checkpoint: HITLCheckpoint,
        approve_url: str,
        reject_url: str
    ) -> bool:
        """Send HITL checkpoint notification email."""
        subject = f"🦅 HITL Required: {checkpoint.reason.value.upper()} - {checkpoint.task_id}"
        
        html_body = f"""
        <html>
        <body style="font-family: 'JetBrains Mono', monospace; background: #0a0e14; color: #e0e0e0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a222d; border: 1px solid #00ff88; border-radius: 8px; padding: 24px;">
                <h1 style="color: #00ff88; margin: 0 0 20px 0;">🦅 CHICKEN HAWK HITL</h1>
                
                <div style="background: #0d1117; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #8b949e;">Task ID:</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; color: #fff;">{checkpoint.task_id}</p>
                </div>
                
                <div style="background: #0d1117; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #ff6b35;">Reason: {checkpoint.reason.value.upper()}</p>
                    <p style="margin: 8px 0 0 0; color: #e0e0e0;">{checkpoint.description}</p>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <a href="{approve_url}" style="flex: 1; display: block; background: #00ff88; color: #0a0e14; padding: 14px 24px; text-decoration: none; border-radius: 4px; text-align: center; font-weight: bold;">
                        ✓ APPROVE
                    </a>
                    <a href="{reject_url}" style="flex: 1; display: block; background: #ff3366; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 4px; text-align: center; font-weight: bold;">
                        ✗ REJECT
                    </a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    This checkpoint will auto-timeout in {HITL_TIMEOUT_MINUTES} minutes.
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to=HITL_NOTIFY_EMAIL,
            subject=subject,
            html_body=html_body
        )


# ═══════════════════════════════════════════════════════════════════════════
# WEBHOOK NOTIFIER
# ═══════════════════════════════════════════════════════════════════════════

class WebhookNotifier:
    """Send notifications via webhook (Slack, Discord, etc.)."""
    
    def __init__(self, webhook_url: str = HITL_WEBHOOK_URL):
        self.webhook_url = webhook_url
    
    async def send_notification(self, checkpoint: HITLCheckpoint) -> bool:
        """Send webhook notification."""
        if not self.webhook_url:
            return False
        
        payload = {
            "text": f"🦅 HITL Required: {checkpoint.reason.value.upper()}",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🦅 Chicken Hawk HITL Checkpoint"}
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Task:*\n{checkpoint.task_id}"},
                        {"type": "mrkdwn", "text": f"*Reason:*\n{checkpoint.reason.value}"}
                    ]
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Description:*\n{checkpoint.description}"}
                }
            ]
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.webhook_url, json=payload)
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"Webhook failed: {e}")
                return False


# ═══════════════════════════════════════════════════════════════════════════
# HITL CONTROLLER
# ═══════════════════════════════════════════════════════════════════════════

class HITLController:
    """
    Human-in-the-Loop controller for the autonomous work loop.
    
    Manages checkpoints, notifications, and approval flow.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8095",
        stationary: bool = True
    ):
        self.base_url = base_url
        self.stationary = stationary  # True = human at desk, False = notify via Resend
        self.pending_checkpoints: Dict[str, HITLCheckpoint] = {}
        self.resend = ResendNotifier()
        self.webhook = WebhookNotifier()
        self.task_counter = 0
        self.check_interval = 5  # Check every N tasks
    
    def set_stationary(self, stationary: bool):
        """Update whether human is at their desk."""
        self.stationary = stationary
        logger.info(f"HITL stationary mode: {stationary}")
    
    async def checkpoint(
        self,
        task_id: str,
        reason: HITLReason,
        description: str,
        context: Optional[Dict] = None,
        blocking: bool = True
    ) -> HITLStatus:
        """
        Create a HITL checkpoint.
        
        Args:
            task_id: Current task identifier
            reason: Why human input is needed
            description: Human-readable description
            context: Additional context data
            blocking: If True, wait for resolution
        
        Returns:
            HITLStatus after resolution
        """
        import uuid
        
        checkpoint = HITLCheckpoint(
            checkpoint_id=f"HITL-{uuid.uuid4().hex[:8].upper()}",
            task_id=task_id,
            reason=reason,
            description=description,
            context=context or {}
        )
        
        # Auto-approve low-risk if configured
        if reason == HITLReason.SCHEDULED and HITL_AUTO_APPROVE_LOW_RISK:
            checkpoint.status = HITLStatus.AUTO_APPROVED
            checkpoint.resolved_at = datetime.now(timezone.utc)
            checkpoint.notes = "Auto-approved (low risk)"
            logger.info(f"Auto-approved checkpoint: {checkpoint.checkpoint_id}")
            return checkpoint.status
        
        self.pending_checkpoints[checkpoint.checkpoint_id] = checkpoint
        
        # Send notifications
        await self._notify(checkpoint)
        
        if not blocking:
            return HITLStatus.PENDING
        
        # Wait for resolution
        return await self._wait_for_resolution(checkpoint)
    
    async def _notify(self, checkpoint: HITLCheckpoint):
        """Send notifications for a checkpoint."""
        approve_url = f"{self.base_url}/hitl/{checkpoint.checkpoint_id}/approve"
        reject_url = f"{self.base_url}/hitl/{checkpoint.checkpoint_id}/reject"
        
        if not self.stationary:
            # Human is away - send email via Resend
            await self.resend.send_hitl_notification(
                checkpoint, approve_url, reject_url
            )
        
        # Always try webhook
        await self.webhook.send_notification(checkpoint)
        
        logger.info(
            f"HITL checkpoint created: {checkpoint.checkpoint_id} "
            f"(reason: {checkpoint.reason.value}, stationary: {self.stationary})"
        )
    
    async def _wait_for_resolution(
        self,
        checkpoint: HITLCheckpoint,
        timeout_minutes: int = HITL_TIMEOUT_MINUTES
    ) -> HITLStatus:
        """Wait for checkpoint resolution with timeout."""
        timeout_seconds = timeout_minutes * 60
        poll_interval = 5
        elapsed = 0
        
        while elapsed < timeout_seconds:
            if checkpoint.checkpoint_id not in self.pending_checkpoints:
                return checkpoint.status
            
            current = self.pending_checkpoints[checkpoint.checkpoint_id]
            if current.status != HITLStatus.PENDING:
                return current.status
            
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        
        # Timeout
        checkpoint.status = HITLStatus.TIMEOUT
        checkpoint.resolved_at = datetime.now(timezone.utc)
        checkpoint.notes = f"Timed out after {timeout_minutes} minutes"
        
        return HITLStatus.TIMEOUT
    
    def resolve(
        self,
        checkpoint_id: str,
        approved: bool,
        notes: Optional[str] = None,
        resolved_by: str = "human"
    ) -> Optional[HITLCheckpoint]:
        """Resolve a pending checkpoint."""
        if checkpoint_id not in self.pending_checkpoints:
            return None
        
        checkpoint = self.pending_checkpoints[checkpoint_id]
        checkpoint.status = HITLStatus.APPROVED if approved else HITLStatus.REJECTED
        checkpoint.resolved_at = datetime.now(timezone.utc)
        checkpoint.resolved_by = resolved_by
        checkpoint.notes = notes
        
        del self.pending_checkpoints[checkpoint_id]
        
        logger.info(
            f"HITL checkpoint resolved: {checkpoint_id} -> {checkpoint.status.value}"
        )
        
        return checkpoint
    
    def should_checkpoint_scheduled(self) -> bool:
        """Check if a scheduled checkpoint is due."""
        self.task_counter += 1
        return self.task_counter % self.check_interval == 0
    
    def detect_high_risk(self, task_description: str) -> bool:
        """Detect if a task is high-risk based on keywords."""
        high_risk_keywords = [
            "delete", "drop", "truncate", "rm -rf", "production",
            "deploy", "migrate", "rollback", "credentials", "secret",
            "payment", "billing", "financial", "admin", "sudo"
        ]
        task_lower = task_description.lower()
        return any(kw in task_lower for kw in high_risk_keywords)
    
    def detect_major_change(self, task_description: str) -> bool:
        """Detect if a task involves major architectural changes."""
        major_keywords = [
            "architecture", "schema", "database", "api breaking",
            "refactor", "redesign", "migration", "infrastructure"
        ]
        task_lower = task_description.lower()
        return any(kw in task_lower for kw in major_keywords)


# ═══════════════════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════════════════

hitl_controller = HITLController()


def get_hitl_controller() -> HITLController:
    """Get the global HITL controller instance."""
    return hitl_controller
