import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Ajv from 'ajv';

const [projectSchema, operationSchema] = await Promise.all([
  'project-1.schema.json',
  'ai-operation-1.schema.json',
].map(async file => JSON.parse(await readFile(
  path.resolve(import.meta.dirname, `../../../schemas/${file}`),
  'utf8',
))));
const ajv = new Ajv({ allErrors: true, strict: false });
const validateProjectSchema = ajv.compile(projectSchema);
const validateOperationSchema = ajv.compile(operationSchema);

export function validateProject(project) {
  if (validateProjectSchema(project)) return [];
  return (validateProjectSchema.errors || []).map(error => ({
    path: error.instancePath || '/',
    message: error.message || 'is invalid',
  }));
}

export function validateOperation(operation) {
  if (validateOperationSchema(operation)) return [];
  return (validateOperationSchema.errors || []).map(error => ({
    path: error.instancePath || '/',
    message: error.message || 'is invalid',
  }));
}
