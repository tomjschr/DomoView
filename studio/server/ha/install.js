import { access, copyFile, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';

export class InstallError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InstallError';
    this.code = code;
  }
}

function safeRelative(value) {
  const relative = String(value || '').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!relative || relative.includes('..') ||
      !/^(www\/domoview\/packs\/[a-zA-Z0-9_-]+\/|lovelace\/)/.test(relative)) {
    throw new InstallError('invalid_path', `Install path "${value}" is not allowed.`);
  }
  return relative;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export class HomeAssistantInstaller {
  constructor(targetRoot) {
    this.root = targetRoot ? path.resolve(targetRoot) : null;
  }

  configured() {
    return !!this.root;
  }

  async plan(files) {
    if (!this.configured()) throw new InstallError('not_configured', 'HA install target is not configured.');
    if (!Array.isArray(files) || !files.length) {
      throw new InstallError('invalid_files', 'At least one install file is required.');
    }
    const entries = [];
    for (const file of files) {
      const relative = safeRelative(file.path);
      entries.push({
        path: relative,
        action: await exists(path.join(this.root, ...relative.split('/'))) ? 'replace' : 'create',
        bytes: Buffer.byteLength(String(file.content || ''), file.encoding === 'base64' ? 'base64' : 'utf8'),
      });
    }
    return {
      target: this.root,
      files: entries,
      requiresOverwrite: entries.some(entry => entry.action === 'replace'),
    };
  }

  async apply(files, options = {}) {
    const plan = await this.plan(files);
    if (plan.requiresOverwrite && !options.overwrite) {
      throw new InstallError('overwrite_required', 'Existing files require explicit overwrite approval.');
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const completed = [];
    try {
      for (const file of files) {
        const relative = safeRelative(file.path);
        const target = path.join(this.root, ...relative.split('/'));
        await mkdir(path.dirname(target), { recursive: true });
        const backup = await exists(target) ? `${target}.bak-${stamp}` : null;
        if (backup) await copyFile(target, backup);
        const temporary = `${target}.${process.pid}.tmp`;
        await writeFile(
          temporary,
          file.encoding === 'base64'
            ? Buffer.from(String(file.content || ''), 'base64')
            : String(file.content || ''),
        );
        await rename(temporary, target);
        completed.push({ target, backup });
      }
      return { ...plan, installed: true, backups: completed.filter(item => item.backup).length };
    } catch (error) {
      for (const item of completed.reverse()) {
        if (item.backup) await copyFile(item.backup, item.target);
        else await rm(item.target, { force: true });
      }
      throw new InstallError('install_failed', `Install rolled back: ${error.message}`);
    }
  }
}
