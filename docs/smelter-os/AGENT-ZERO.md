# Agent Zero = AVVA NOON

## Quick Reference

This document clarifies the relationship between Agent Zero and AVVA NOON in SmelterOS.

## The Simple Truth

**AVVA NOON IS Agent Zero**

- Not a fork
- Not a wrapper  
- Not a custom implementation
- **It IS the official agent0ai/agent-zero container**

## Why Two Names?

### Agent Zero (Technology)
The underlying autonomous agent framework created by frdel
- **GitHub**: https://github.com/frdel/agent-zero
- **Docker**: agent0ai/agent-zero:latest
- **Community**: Open source AI agent framework

### AVVA NOON (Identity)
The SmelterOS branding for Agent Zero
- **Purpose**: Orchestration brain for SmelterOS
- **Role**: Breaks down tasks, coordinates agents
- **Configuration**: Integrated with SmelterOS ecosystem

## Think of it like this:

```
Agent Zero = The Engine
AVVA NOON = The Car (with Agent Zero engine inside)
```

Or more technically:

```
Docker Hub Image:    agent0ai/agent-zero:latest
Container Name:      avva_noon
Service Name:        AVVA NOON
Environment:         AGENT_NAME=AVVA_NOON
```

## In the Codebase

### docker-compose.yaml
```yaml
# AVVA N00N - The Brain (Agent Zero)
avva-noon:
  image: agent0ai/agent-zero:latest
  container_name: avva_noon
  environment:
    - AGENT_NAME=AVVA_NOON
```

### When to use which name?

| Context | Use |
|---------|-----|
| Documentation about the technology | Agent Zero |
| SmelterOS product/marketing | AVVA NOON |
| Docker commands | `avva_noon` (container) |
| User-facing UI | AVVA NOON |
| Technical discussions | Agent Zero |
| Configuration files | Both (clarify relationship) |

## Other Agent Zero Instances

SmelterOS also includes:

### Zero_Ang
- **Purpose**: Local development/testing bridge
- **Image**: agent0ai/agent-zero:latest (same as AVVA NOON)
- **Port**: 8003
- **Environment**: AGENT_NAME=Zero_Ang

## Summary

1. AVVA NOON = Agent Zero container
2. We use official Agent Zero image
3. AVVA NOON is just our name for it
4. Zero_Ang is a second instance for dev work
5. Both run the same Agent Zero code

## Need More Info?

- [SmelterOS Architecture](./ARCHITECTURE.md)
- [Agent Zero GitHub](https://github.com/frdel/agent-zero)
- [Agent Zero Documentation](https://github.com/frdel/agent-zero/wiki)

---

**One Agent. Two Names. Same Intelligence.**
