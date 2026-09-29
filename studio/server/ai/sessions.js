import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class SessionStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SessionStoreError';
    this.code = code;
  }
}

export class SessionStore {
  constructor(workspace) {
    this.directory = path.join(path.resolve(workspace), 'ai');
    this.file = path.join(this.directory, 'sessions.sqlite');
    this.database = null;
  }

  async init() {
    await mkdir(this.directory, { recursive: true });
    this.database = new DatabaseSync(this.file);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        fixture_id TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        context_revision INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_target
        ON sessions(project_id, fixture_id, updated_at DESC);
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        provider TEXT,
        model TEXT,
        status TEXT NOT NULL,
        usage_json TEXT,
        error_code TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        input_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_proposals (
        proposal_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        base_revision INTEGER NOT NULL,
        applied_revision INTEGER
      );
    `);
    return this;
  }

  close() {
    this.database?.close();
    this.database = null;
  }

  getOrCreate(projectId, fixtureId, revision, requestedId) {
    let session = requestedId
      ? this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(requestedId)
      : this.database.prepare(`
          SELECT * FROM sessions
          WHERE project_id = ? AND fixture_id = ?
          ORDER BY updated_at DESC LIMIT 1
        `).get(projectId, fixtureId);
    if (session && (session.project_id !== projectId || session.fixture_id !== fixtureId)) {
      throw new SessionStoreError('session_target_mismatch', 'Session belongs to another target.');
    }
    if (!session) {
      const now = new Date().toISOString();
      const id = randomUUID();
      this.database.prepare(`
        INSERT INTO sessions
          (id, project_id, fixture_id, context_revision, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, projectId, fixtureId, revision, now, now);
      session = this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    }
    return this.present(session);
  }

  latest(projectId, fixtureId) {
    const session = this.database.prepare(`
      SELECT * FROM sessions
      WHERE project_id = ? AND fixture_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).get(projectId, fixtureId);
    return session ? this.publicSession(session.id) : null;
  }

  publicSession(id) {
    const session = this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    if (!session) throw new SessionStoreError('session_not_found', 'AI session does not exist.');
    const messages = this.database.prepare(`
      SELECT role, content, created_at AS createdAt
      FROM messages WHERE session_id = ? ORDER BY id
    `).all(id);
    const latestProposal = this.database.prepare(`
      SELECT proposal_id AS id, status, base_revision AS baseRevision,
        applied_revision AS appliedRevision
      FROM session_proposals WHERE session_id = ?
      ORDER BY rowid DESC LIMIT 1
    `).get(id) || null;
    return { ...this.present(session), messages, latestProposal };
  }

  context(id, revision, limit = 8) {
    const session = this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    if (!session) throw new SessionStoreError('session_not_found', 'AI session does not exist.');
    const messages = this.database.prepare(`
      SELECT role, content FROM (
        SELECT id, role, content FROM messages
        WHERE session_id = ? ORDER BY id DESC LIMIT ?
      ) ORDER BY id
    `).all(id, limit);
    return {
      summary: session.context_revision === revision ? session.summary : '',
      messages,
    };
  }

  addMessage(id, role, content) {
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)
    `).run(id, role, content, now);
    this.touch(id, now);
  }

  beginCall(sessionId) {
    const id = randomUUID();
    this.database.prepare(`
      INSERT INTO calls (id, session_id, status, created_at) VALUES (?, ?, 'running', ?)
    `).run(id, sessionId, new Date().toISOString());
    return id;
  }

  completeCall(id, result) {
    this.database.prepare(`
      UPDATE calls SET provider = ?, model = ?, status = 'completed',
        usage_json = ?, completed_at = ? WHERE id = ?
    `).run(
      result.provider || null,
      result.model || null,
      JSON.stringify({ ...(result.usage || {}), costUsd: result.costUsd }),
      new Date().toISOString(),
      id,
    );
    for (const operation of result.operations) {
      this.database.prepare(`
        INSERT INTO tool_calls (call_id, name, input_json) VALUES (?, ?, ?)
      `).run(id, operation.type, JSON.stringify(operation));
    }
  }

  failCall(id, error) {
    this.database.prepare(`
      UPDATE calls SET status = 'failed', error_code = ?, completed_at = ? WHERE id = ?
    `).run(error?.code || 'internal_error', new Date().toISOString(), id);
  }

  linkProposal(sessionId, callId, proposal) {
    this.database.prepare(`
      INSERT INTO session_proposals
        (proposal_id, session_id, call_id, status, base_revision)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(proposal.id, sessionId, callId, proposal.baseRevision);
  }

  markProposal(proposalId, status, appliedRevision, summaries = []) {
    const link = this.database.prepare(`
      SELECT session_id FROM session_proposals WHERE proposal_id = ?
    `).get(proposalId);
    if (!link) return;
    this.database.prepare(`
      UPDATE session_proposals SET status = ?, applied_revision = ? WHERE proposal_id = ?
    `).run(status, appliedRevision || null, proposalId);
    if (status === 'applied') {
      const session = this.database.prepare('SELECT summary FROM sessions WHERE id = ?')
        .get(link.session_id);
      const next = [session.summary, ...summaries].filter(Boolean).join('\n').slice(-4000);
      this.database.prepare(`
        UPDATE sessions SET summary = ?, context_revision = ?, updated_at = ? WHERE id = ?
      `).run(next, appliedRevision, new Date().toISOString(), link.session_id);
    } else if (status === 'undone') {
      this.database.prepare(`
        UPDATE sessions SET summary = '', context_revision = ?, updated_at = ? WHERE id = ?
      `).run(appliedRevision, new Date().toISOString(), link.session_id);
    }
  }

  touch(id, now = new Date().toISOString()) {
    this.database.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(now, id);
  }

  present(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      fixtureId: row.fixture_id,
      summary: row.summary,
      contextRevision: row.context_revision,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
