# AVVA NOON Custom Dockerfile
# Transforms Agent Zero into AVVA NOON with dual-consciousness architecture

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone Agent Zero base
RUN git clone https://github.com/frdel/agent-zero.git /app/agent-zero

# Copy AVVA NOON customizations
COPY config/prompts/avva-noon-identity.md /app/agent-zero/prompts/avva-noon/
COPY instruments/*.py /app/agent-zero/instruments/noon/

# Install Python dependencies
WORKDIR /app/agent-zero
RUN pip install --no-cache-dir -r requirements.txt

# Create Charter and Ledger directories
RUN mkdir -p /app/logs/charter /app/logs/ledger

# Set AVVA NOON environment variables
ENV AGENT_NAME="AVVA_NOON" \
    DUAL_CONSCIOUSNESS="true" \
    FDH_ENABLED="true" \
    VIBE_THRESHOLD="0.85" \
    CHARTER_LEDGER_SEPARATION="true" \
    CHARTER_LOG_PATH="/app/logs/charter" \
    LEDGER_LOG_PATH="/app/logs/ledger" \
    PYTHONPATH="/app/agent-zero:/app/agent-zero/instruments/noon:${PYTHONPATH}"

# Inject AVVA NOON identity into Agent Zero system prompt
RUN echo "\n\n# ======= AVVA NOON IDENTITY OVERLAY =======" >> /app/agent-zero/prompts/default/agent.system.md && \
    cat /app/agent-zero/prompts/avva-noon/avva-noon-identity.md >> /app/agent-zero/prompts/default/agent.system.md

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start Agent Zero with AVVA NOON configuration
CMD ["python", "run_ui.py"]
