import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import YAML from 'yaml';

describe('Home Assistant app packaging', () => {
  test('repository and app metadata coexist with HACS metadata', async () => {
    const [repository, addon, hacs] = await Promise.all([
      readFile(new URL('../repository.yaml', import.meta.url), 'utf8').then(YAML.parse),
      readFile(new URL('../addon/domoview-studio/config.yaml', import.meta.url), 'utf8').then(YAML.parse),
      readFile(new URL('../hacs.json', import.meta.url), 'utf8').then(JSON.parse),
    ]);
    assert.equal(repository.url, 'https://github.com/tomjschr/DomoView');
    assert.equal(addon.ingress, true);
    assert.equal(addon.homeassistant_api, true);
    assert.ok(addon.map.includes('config:rw'));
    assert.equal(hacs.filename, 'domoview.js');
  });

  test('container starts the shared server in Supervisor ingress mode', async () => {
    const [dockerfile, run] = await Promise.all([
      readFile(new URL('../addon/domoview-studio/Dockerfile', import.meta.url), 'utf8'),
      readFile(new URL('../addon/domoview-studio/run.sh', import.meta.url), 'utf8'),
    ]);
    assert.match(dockerfile, /git clone/);
    assert.match(dockerfile, /npm run build/);
    assert.match(dockerfile, /COPY run\.sh/);
    assert.match(run, /SUPERVISOR_TOKEN/);
    assert.match(run, /DOMOVIEW_INGRESS="true"/);
    assert.match(run, /node \/app\/studio\/server\/index\.js/);
  });
});
