from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import os

# Stripe SDK would be imported here in production
# import stripe

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("billing-bridge")

app = FastAPI(title="Chickenhawk Billing Bridge", version="1.0.0")

# In production, load from Secret Manager
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_xxx")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_xxx")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "re_xxx")

class CreateCheckoutRequest(BaseModel):
    user_id: str
    plan: str  # 'starter', 'professional', 'enterprise'
    success_url: str
    cancel_url: str

class CustomerPortalRequest(BaseModel):
    user_id: str
    return_url: str

class SendEmailRequest(BaseModel):
    to: str
    subject: str
    template: str  # 'welcome', 'receipt', 'trial_expiring'
    data: Optional[Dict[str, Any]] = {}

@app.get("/")
def health():
    return {"status": "online", "service": "billing-bridge", "providers": ["stripe", "resend"]}

@app.post("/checkout/create")
async def create_checkout(req: CreateCheckoutRequest):
    """
    Create a Stripe Checkout session for subscription.
    """
    logger.info(f"Creating checkout for user {req.user_id}, plan: {req.plan}")
    
    # STUB: In production, use stripe.checkout.Session.create()
    # price_map = {
    #     "starter": "price_xxx",
    #     "professional": "price_yyy",
    #     "enterprise": "price_zzz"
    # }
    
    return {
        "status": "success",
        "checkout_url": f"https://checkout.stripe.com/stub/{req.user_id}/{req.plan}",
        "session_id": f"cs_stub_{req.user_id}"
    }

@app.post("/portal/create")
async def create_portal(req: CustomerPortalRequest):
    """
    Create a Stripe Customer Portal session for managing subscription.
    """
    logger.info(f"Creating portal for user {req.user_id}")
    
    # STUB: In production, use stripe.billing_portal.Session.create()
    return {
        "status": "success",
        "portal_url": f"https://billing.stripe.com/stub/portal/{req.user_id}",
    }

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks (subscription updates, payment success, etc.)
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    logger.info(f"Received Stripe webhook, signature: {sig_header[:20] if sig_header else 'None'}...")
    
    # STUB: In production, verify webhook signature and process events
    # event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    
    return {"received": True}

@app.post("/email/send")
async def send_email(req: SendEmailRequest):
    """
    Send transactional email via Resend.
    """
    logger.info(f"Sending email to {req.to}, template: {req.template}")
    
    # STUB: In production, use resend.Emails.send()
    # resend.api_key = RESEND_API_KEY
    # resend.Emails.send({
    #     "from": "SmelterOS <noreply@smelteros.com>",
    #     "to": req.to,
    #     "subject": req.subject,
    #     "html": render_template(req.template, req.data)
    # })
    
    return {
        "status": "success",
        "message_id": f"msg_stub_{req.template}_{req.to.replace('@', '_')}"
    }

@app.get("/subscription/{user_id}")
async def get_subscription(user_id: str):
    """
    Get subscription status for a user.
    """
    # STUB: In production, query Firestore or Stripe API
    return {
        "user_id": user_id,
        "plan": "professional",
        "status": "active",
        "current_period_end": "2026-02-13T00:00:00Z",
        "cancel_at_period_end": False
    }
