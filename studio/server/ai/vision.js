import { ProviderError } from './provider.js';

const TYPES = new Set(['room_label', 'wall', 'opening', 'fixture']);

export class VisionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'VisionError';
    this.code = code;
  }
}

function attachment(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new VisionError('invalid_image', 'Vision image must be PNG, JPEG or WebP.');
  return { mediaType: match[1], data: match[2] };
}

function normalizeAnnotations(value, calibrated) {
  if (!Array.isArray(value)) throw new VisionError('invalid_response', 'Vision annotations are missing.');
  return value.map((item, index) => {
    if (!TYPES.has(item?.type) || !Array.isArray(item.points) ||
        item.points.some(point => !Array.isArray(point) || point.length !== 2 ||
          point.some(number => !Number.isFinite(number)))) {
      throw new VisionError('invalid_response', `Vision annotation ${index} is invalid.`);
    }
    const confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0));
    return {
      type: item.type,
      label: String(item.label || ''),
      points: item.points,
      confidence,
      measurement: calibrated && Number.isFinite(item.measurement) ? item.measurement : null,
      uncertain: confidence < 0.75 || !calibrated || item.uncertain === true,
    };
  });
}

export async function suggestFromImages(input) {
  if (input.confirmTransmission !== true) {
    throw new VisionError('consent_required', 'Image transmission requires explicit confirmation.');
  }
  if (!Array.isArray(input.images) || !input.images.length || input.images.length > 6) {
    throw new VisionError('invalid_images', 'Select between one and six images.');
  }
  if (input.provider.capabilities().vision !== true) {
    throw new ProviderError(input.provider.config?.id || 'provider',
      'unsupported_capability', 'Configured provider does not support vision.');
  }
  const response = await input.provider.complete({
    system: [
      'Inspect selected floor-plan or room images for DomoView.',
      'Return suggestions only through propose_vision_annotations.',
      'Do not invent measurements. Mark uncertain geometry.',
      `Calibration: ${JSON.stringify(input.calibration || null)}`,
    ].join('\n'),
    messages: [{ role: 'user', content: input.instruction || 'Suggest visible labels and geometry.' }],
    attachments: input.images.map(image => attachment(image.dataUrl)),
    tools: [{
      name: 'propose_vision_annotations',
      description: 'Return image-space annotations; never edit the project directly.',
      inputSchema: {
        type: 'object',
        required: ['annotations'],
        properties: { annotations: { type: 'array', items: { type: 'object' } } },
      },
    }],
    maxTokens: 1800,
    signal: input.signal,
  });
  const call = response.toolCalls.find(item => item.name === 'propose_vision_annotations');
  return {
    annotations: normalizeAnnotations(call?.input?.annotations, !!input.calibration),
    transmitted: input.images.map(image => ({
      id: image.id,
      name: image.name,
      mediaType: attachment(image.dataUrl).mediaType,
    })),
    usage: response.usage,
    provider: response.provider,
    model: response.model,
  };
}

