import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const REF_PATTERN = /^asset:([a-f0-9]{64})\.(jpg|png|webp)$/;
const MAX_ASSET_BYTES = 20 * 1024 * 1024;

export class AssetStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AssetStoreError';
    this.code = code;
  }
}

export class AssetStore {
  constructor(workspace) {
    this.root = path.join(path.resolve(workspace), 'assets');
  }

  async init() {
    await mkdir(this.root, { recursive: true });
    return this;
  }

  async putDataUrl(value) {
    if (typeof value !== 'string' || !value.startsWith('data:')) return value;
    const match = /^data:([^;,]+);base64,([a-z0-9+/=\s]+)$/i.exec(value);
    if (!match || !TYPES[match[1].toLowerCase()]) {
      throw new AssetStoreError('invalid_asset', 'Only base64 PNG, JPEG and WebP images are supported.');
    }
    const mime = match[1].toLowerCase();
    const data = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!data.length || data.length > MAX_ASSET_BYTES) {
      throw new AssetStoreError('invalid_asset_size', 'Image must be between 1 byte and 20 MB.');
    }
    const hash = createHash('sha256').update(data).digest('hex');
    const name = `${hash}.${TYPES[mime]}`;
    await this.init();
    await writeFile(path.join(this.root, name), data, { flag: 'wx' }).catch(error => {
      if (error.code !== 'EEXIST') throw error;
    });
    return `asset:${name}`;
  }

  async externalizeProject(project) {
    const next = structuredClone(project);
    if (next.plan?.image) next.plan.image = await this.putDataUrl(next.plan.image);
    for (const photo of next.photos || []) {
      if (photo.dataUrl) photo.dataUrl = await this.putDataUrl(photo.dataUrl);
    }
    return next;
  }

  async hydrateProject(project) {
    const next = structuredClone(project);
    if (String(next.plan?.image || '').startsWith('asset:')) {
      next.plan.image = await this.dataUrl(next.plan.image);
    }
    for (const photo of next.photos || []) {
      if (String(photo.dataUrl || '').startsWith('asset:')) {
        photo.dataUrl = await this.dataUrl(photo.dataUrl);
      }
    }
    return next;
  }

  async dataUrl(reference) {
    const asset = await this.get(reference);
    return `data:${asset.type};base64,${asset.data.toString('base64')}`;
  }

  async get(reference) {
    const match = REF_PATTERN.exec(String(reference || ''));
    if (!match) throw new AssetStoreError('invalid_asset_ref', 'Invalid asset reference.');
    const extension = match[2];
    try {
      return {
        data: await readFile(path.join(this.root, `${match[1]}.${extension}`)),
        type: extension === 'jpg' ? 'image/jpeg' : `image/${extension}`,
      };
    } catch (error) {
      if (error.code === 'ENOENT') throw new AssetStoreError('asset_not_found', 'Asset does not exist.');
      throw error;
    }
  }
}
