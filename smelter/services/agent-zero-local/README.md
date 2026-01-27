# Agent Zero Local Bridge
# Bridge to local Docker container

This service acts as a bridge to allow SmelterOS to dispatch tasks to your local Agent Zero instance.

## Local Docker Image
```bash
docker tag agent-zero:latest us-central1-docker.pkg.dev/smelter-os/smelter-containers/agent-zero:local
```

## Configuration
- Source: `upstream/agent-zero`
- Modify: `prompts/default/agent.system.md` to align with SmelterOS protocols
