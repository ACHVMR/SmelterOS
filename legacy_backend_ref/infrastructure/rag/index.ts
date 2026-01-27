/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS RAG Module Index
 * Exports all RAG (Retrieval-Augmented Generation) components
 * ═══════════════════════════════════════════════════════════════════════════
 */

// File Manager RAG - The Vault backbone
export {
  FileManagerRAG,
  getFileManagerRAG,
} from './file-manager.js';

// Types
export type {
  VaultDocument,
  DocumentMetadata,
  RetrievalRequest,
  RetrievalResult,
  IndexingResult,
  VaultStats,
} from './file-manager.js';
