import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { suggestFromImages, VisionError } from '../studio/server/ai/vision.js';

const image = {
  id: 'plan',
  name: 'floor-plan.png',
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
};

function provider(annotations) {
  return {
    config: { id: 'openai' },
    capabilities: () => ({ vision: true }),
    async complete(request) {
      assert.equal(request.attachments.length, 1);
      assert.equal(request.attachments[0].mediaType, 'image/png');
      return {
        provider: 'openai',
        model: 'vision-model',
        usage: { inputTokens: 100, outputTokens: 20 },
        toolCalls: [{
          name: 'propose_vision_annotations',
          input: { annotations },
        }],
      };
    },
  };
}

describe('bounded vision suggestions', () => {
  test('requires explicit transmission consent', async () => {
    await assert.rejects(suggestFromImages({
      images: [image],
      provider: provider([]),
      confirmTransmission: false,
    }), error => error instanceof VisionError && error.code === 'consent_required');
  });

  test('returns calibrated annotations and marks uncertainty', async () => {
    const result = await suggestFromImages({
      images: [image],
      confirmTransmission: true,
      calibration: { metresPerPixel: 0.01 },
      provider: provider([
        {
          type: 'opening',
          label: 'Window',
          points: [[10, 20], [50, 20]],
          confidence: 0.9,
          measurement: 0.4,
        },
        {
          type: 'wall',
          label: '',
          points: [[0, 0], [100, 0]],
          confidence: 0.5,
          measurement: 1,
        },
      ]),
    });
    assert.equal(result.annotations[0].uncertain, false);
    assert.equal(result.annotations[0].measurement, 0.4);
    assert.equal(result.annotations[1].uncertain, true);
    assert.deepEqual(result.transmitted, [{
      id: 'plan', name: 'floor-plan.png', mediaType: 'image/png',
    }]);
  });

  test('does not expose measurements without calibration', async () => {
    const result = await suggestFromImages({
      images: [image],
      confirmTransmission: true,
      provider: provider([{
        type: 'wall', label: '', points: [[0, 0], [10, 0]],
        confidence: 0.99, measurement: 12,
      }]),
    });
    assert.equal(result.annotations[0].measurement, null);
    assert.equal(result.annotations[0].uncertain, true);
  });
});

