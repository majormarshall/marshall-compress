/**
 * Types of asynchronous and streaming AI workloads.
 */
export enum AIJobType {
  SUMMARIZE = 'SUMMARIZE',
  TRANSCRIBE = 'TRANSCRIBE',
  QA = 'QA',
  ORGANIZE = 'ORGANIZE',
}

/**
 * Processing state of an AI execution job.
 */
export enum AIJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Supported underlying AI model providers.
 */
export enum AIProvider {
  OPENAI = 'OPENAI',
  GOOGLE = 'GOOGLE',
  ANTHROPIC = 'ANTHROPIC',
}

/**
 * Role of the participant in an AI message turn.
 */
export type AIMessageRole = 'system' | 'user' | 'assistant';

/**
 * Individual message within a conversational AI session.
 */
export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  tokensUsed?: number;
  modelUsed?: string;
  createdAt: string;
}

/**
 * Threaded conversation history with the AI Assistant.
 */
export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  provider: AIProvider;
  model: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Background AI job tracking for heavy inference tasks.
 */
export interface AIJob {
  id: string;
  userId: string;
  type: AIJobType;
  status: AIJobStatus;
  provider: AIProvider;
  model: string;
  inputPayload: Record<string, unknown>;
  outputResult: Record<string, unknown> | null;
  errorMessage: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalCostUsd: number | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Retrieval-Augmented Generation (RAG) Document Q&A request payload.
 */
export interface DocumentQARequest {
  documentId: string;
  query: string;
  conversationId?: string;
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
}

/**
 * Grounded passage excerpt referenced by the model.
 */
export interface RelevantPassage {
  pageNumber?: number;
  text: string;
  score: number;
}

/**
 * Answer returned by Document Q&A with citations.
 */
export interface DocumentQAResponse {
  answer: string;
  confidence: number;
  relevantPassages: RelevantPassage[];
  tokensUsed: number;
  providerUsed: AIProvider;
  modelUsed: string;
}
