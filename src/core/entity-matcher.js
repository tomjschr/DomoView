const TOKEN_ALIASES = {
  badezimmer: 'bad',
  bathroom: 'bad',
  buro: 'buero',
  bureau: 'buero',
  couch: 'sofa',
  dining: 'essen',
  flur: 'flur',
  hallway: 'flur',
  kitchen: 'kueche',
  kuche: 'kueche',
  living: 'wohnen',
  schlafzimmer: 'schlafen',
  stehleuchte: 'stehlampe',
  toilette: 'wc',
  wohnzimmer: 'wohnen',
};

const NOISE_TOKENS = new Set([
  'entity', 'geraet', 'gerat', 'home', 'light', 'licht', 'switch',
  'smart', 'outlet', 'output', 'channel', 'kanal', 'we3',
]);

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  const result = new Set();
  for (const raw of normalise(value).split(/\s+/)) {
    if (!raw || raw.length < 2 || /^\d+$/.test(raw) || NOISE_TOKENS.has(raw)) continue;
    result.add(TOKEN_ALIASES[raw] || raw);
  }
  return result;
}

function unionTokens(...values) {
  const result = new Set();
  for (const value of values) for (const token of tokens(value)) result.add(token);
  return result;
}

function overlap(left, right) {
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return 2 * common / (left.size + right.size);
}

function domainOf(entityId) {
  return String(entityId || '').split('.')[0];
}

function entityName(entity) {
  return [
    entity.entityId?.split('.').slice(1).join(' '),
    entity.friendlyName,
    entity.registryName,
    entity.originalName,
  ].filter(Boolean).join(' ');
}

function scoreCandidate(fixture, entity) {
  if (fixture.domains?.length && !fixture.domains.includes(domainOf(entity.entityId))) return null;

  const fixtureName = unionTokens(fixture.id, fixture.name);
  const fixtureRoom = unionTokens(fixture.roomName, fixture.room);
  const candidateName = unionTokens(entityName(entity));
  const candidateArea = unionTokens(entity.areaName, entity.areaId);
  const nameScore = overlap(fixtureName, candidateName);
  const roomScore = Math.max(overlap(fixtureRoom, candidateArea), overlap(fixtureRoom, candidateName));

  const plainFixture = normalise(fixture.name);
  const plainEntity = normalise(entityName(entity));
  const phraseBonus = plainFixture.length >= 5 &&
    (plainEntity.includes(plainFixture) || plainFixture.includes(plainEntity)) ? 0.16 : 0;
  const exactIdBonus = normalise(fixture.id).endsWith(normalise(entity.entityId).replace(/^[a-z]+ /, ''))
    ? 0.12 : 0;
  const areaPenalty = fixtureRoom.size && candidateArea.size && roomScore === 0 ? 0.12 : 0;
  const score = Math.max(0, Math.min(1,
    nameScore * 0.72 + roomScore * 0.28 + phraseBonus + exactIdBonus - areaPenalty,
  ));

  return {
    entityId: entity.entityId,
    friendlyName: entity.friendlyName || entity.registryName || entity.originalName || '',
    areaName: entity.areaName || '',
    score,
    reasons: [
      nameScore >= 0.5 ? 'name' : null,
      roomScore >= 0.5 ? 'room' : null,
      phraseBonus ? 'phrase' : null,
    ].filter(Boolean),
  };
}

/**
 * Turn Home Assistant states plus optional registry data into matcher input.
 * Registry arrays are the direct responses of config/*_registry/list.
 */
export function buildEntityCatalog(states = {}, registries = {}) {
  const entityRegistry = new Map((registries.entities || []).map(entity => [entity.entity_id, entity]));
  const devices = new Map((registries.devices || []).map(device => [device.id, device]));
  const areas = new Map((registries.areas || []).map(area => [area.area_id, area.name]));

  return Object.entries(states).map(([entityId, state]) => {
    const registry = entityRegistry.get(entityId);
    const device = registry?.device_id ? devices.get(registry.device_id) : null;
    const areaId = registry?.area_id || device?.area_id || '';
    return {
      entityId,
      friendlyName: state?.attributes?.friendly_name || '',
      registryName: registry?.name || '',
      originalName: registry?.original_name || '',
      areaId,
      areaName: areas.get(areaId) || '',
    };
  });
}

/**
 * Deterministically propose one unused entity per unbound fixture.
 * Only high-confidence suggestions are accepted automatically; every result
 * still carries its score and runner-up margin for a review UI.
 */
export function proposeEntityBindings(fixtures, entities, current = {}) {
  const used = new Set(Object.values(current).filter(Boolean));
  const ranked = [];

  for (const fixture of fixtures) {
    if (current[fixture.id]) continue;
    const candidates = entities
      .filter(entity => !used.has(entity.entityId))
      .map(entity => scoreCandidate(fixture, entity))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.entityId.localeCompare(b.entityId));
    if (!candidates.length || candidates[0].score < 0.35) continue;
    const best = candidates[0];
    const margin = best.score - (candidates[1]?.score || 0);
    ranked.push({
      fixtureId: fixture.id,
      fixtureName: fixture.name,
      roomName: fixture.roomName || '',
      ...best,
      margin,
      confidence: best.score >= 0.62 && margin >= 0.10 ? 'high'
        : best.score >= 0.45 && margin >= 0.06 ? 'medium'
        : 'low',
    });
  }

  const suggestions = [];
  for (const suggestion of ranked.sort((a, b) => b.score - a.score || b.margin - a.margin)) {
    if (used.has(suggestion.entityId)) continue;
    if (suggestion.confidence === 'high') used.add(suggestion.entityId);
    suggestions.push(suggestion);
  }
  return suggestions.sort((a, b) => a.fixtureId.localeCompare(b.fixtureId));
}

