import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Ajv from 'ajv';

const schema = JSON.parse(await readFile(
  path.resolve(import.meta.dirname, '../../../schemas/project-1.schema.json'),
  'utf8',
));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export function validateProject(project) {
  if (validate(project)) return [];
  return (validate.errors || []).map(error => ({
    path: error.instancePath || '/',
    message: error.message || 'is invalid',
  }));
}

