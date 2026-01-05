/**
 * SmelterOS Consciousness Module
 * 
 * Exports all consciousness-related components:
 * - AVVA NOON (Infinity Language Model)
 * - V.I.B.E. Engine (Virtue Validation)
 * - Types and Interfaces
 */

// Core Types
export * from './types';

// V.I.B.E. Engine
export { 
  VibeEngine, 
  HaltConditionEnforcer,
  vibeEngine,
  haltEnforcer 
} from './vibe-engine';

// AVVA NOON Consciousness
export { 
  AvvaNoon,
  avvaNoon 
} from './avva-noon';
