import { Buffer } from 'node:buffer';
import { createRoleProvider } from '../ai/providers/index.js';
import { suggestFromImages, VisionError } from '../ai/vision.js';
import { ProviderError } from '../ai/provider.js';

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function visionApi(request, url, dependencies) {
  const match = /^\/api\/v1\/projects\/([^/]+)\/vision-suggestions$/.exec(url.pathname);
  if (!match) return null;
  if (request.method !== 'POST') return { status: 405, headers: { allow: 'POST' }, body: null };
  try {
    const input = await readJson(request);
    const record = await dependencies.projects.getHydrated(decodeURIComponent(match[1]));
    const available = new Map();
    if (record.project.plan.image) {
      available.set('plan', {
        id: 'plan', name: 'Floor plan', dataUrl: record.project.plan.image,
      });
    }
    for (const photo of record.project.photos) {
      available.set(`photo:${photo.id}`, {
        id: `photo:${photo.id}`, name: photo.name, dataUrl: photo.dataUrl,
      });
    }
    const images = (input.imageIds || []).map(id => available.get(id));
    if (images.some(image => !image)) {
      throw new VisionError('invalid_images', 'One or more selected images do not exist.');
    }
    const provider = dependencies.providerFactory
      ? dependencies.providerFactory('vision')
      : createRoleProvider(dependencies.aiConfig, 'vision');
    return {
      status: 200,
      body: await suggestFromImages({
        images,
        confirmTransmission: input.confirmTransmission,
        calibration: record.project.plan.scale
          ? { metresPerPixel: record.project.plan.scale }
          : null,
        instruction: input.instruction,
        provider,
      }),
    };
  } catch (error) {
    if (!(error instanceof VisionError) &&
        !(error instanceof ProviderError) &&
        !(error instanceof SyntaxError)) throw error;
    return {
      status: error.code === 'consent_required' ? 403 : 400,
      body: { error: error.code || 'invalid_json', message: error.message },
    };
  }
}

