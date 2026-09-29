import { estimateCost, usage } from './provider.js';

export class BudgetError extends Error {
  constructor(code, message, snapshot) {
    super(message);
    this.name = 'BudgetError';
    this.code = code;
    this.requiresApproval = true;
    this.snapshot = snapshot;
  }
}

export class TurnBudget {
  constructor(limits = {}) {
    this.limits = {
      maxCalls: limits.maxCalls ?? 4,
      maxInputTokens: limits.maxInputTokens ?? 30_000,
      maxOutputTokens: limits.maxOutputTokens ?? 8_000,
      maxCostUsd: limits.maxCostUsd ?? 1,
    };
    this.calls = 0;
    this.tokens = usage();
    this.costUsd = 0;
    this.approved = false;
  }

  approve() {
    this.approved = true;
  }

  beforeCall(estimate = {}) {
    const projectedCalls = this.calls + 1;
    const projectedCost = this.costUsd + (estimate.costUsd || 0);
    if (!this.approved && (projectedCalls > this.limits.maxCalls ||
        projectedCost > this.limits.maxCostUsd)) {
      throw new BudgetError(
        'budget_preflight',
        'AI turn budget would be exceeded before the next call.',
        this.snapshot(),
      );
    }
    this.calls = projectedCalls;
  }

  record(tokenUsage, pricing) {
    const tokens = usage(tokenUsage);
    this.tokens.inputTokens += tokens.inputTokens;
    this.tokens.outputTokens += tokens.outputTokens;
    this.tokens.cacheReadTokens += tokens.cacheReadTokens;
    this.tokens.cacheWriteTokens += tokens.cacheWriteTokens;
    this.costUsd += estimateCost(tokens, pricing) || 0;
    if (!this.approved && (
      this.tokens.inputTokens > this.limits.maxInputTokens ||
      this.tokens.outputTokens > this.limits.maxOutputTokens ||
      this.costUsd > this.limits.maxCostUsd
    )) {
      throw new BudgetError(
        'budget_exceeded',
        'AI turn budget was exceeded by provider usage.',
        this.snapshot(),
      );
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      calls: this.calls,
      usage: { ...this.tokens },
      costUsd: Math.round(this.costUsd * 1_000_000) / 1_000_000,
      limits: { ...this.limits },
      approved: this.approved,
    };
  }
}

