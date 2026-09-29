const DOMAINS = {
  fixture: [
    /\b(light|lamp|fixture|bulb|lumen|shadow|emitter|brightness|bright|dim|warm|cool)\b/i,
    /\b(licht|lampe|leuchte|lumen|schatten|heller|dunkler|warm|kalt)\b/i,
  ],
  geometry: [
    /\b(wall|window|door|opening|room|geometry|floor plan)\b/i,
    /\b(wand|fenster|tür|öffnung|raum|grundriss|geometrie)\b/i,
  ],
  binding: [
    /\b(entity|binding|home assistant|device|area|entity_id)\b/i,
    /\b(entität|zuordnung|gerät|bereich|home assistant)\b/i,
  ],
  appearance: [
    /\b(material|texture|camera|environment|sunlight)\b/i,
    /\b(material|textur|kamera|umgebung|sonnenlicht)\b/i,
  ],
};

const SPECIALISTS = {
  fixture: 'fixture',
  geometry: 'geometry',
  binding: 'binding',
  appearance: 'appearance',
};

function matchedDomains(message) {
  const domains = Object.entries(DOMAINS)
    .filter(([, patterns]) => patterns.some(pattern => pattern.test(message)))
    .map(([domain]) => domain);
  if (domains.includes('binding') && domains.includes('fixture') &&
      !/\b(lumen|shadow|brightness|bright|dim|warm|cool|schatten|heller|dunkler|warm|kalt)\b/i
        .test(message)) {
    return domains.filter(domain => domain !== 'fixture');
  }
  return domains;
}

function contextFor(domain, selection) {
  if (domain === 'fixture') return ['selectedFixture', 'fixtureRoom', 'nearbyLights'];
  if (domain === 'geometry') return ['selectedGeometry', 'connectedGeometry', 'planScale'];
  if (domain === 'binding') return ['selectedBindable', 'availableEntities', 'existingBindings'];
  if (domain === 'appearance') return ['selectedObject', 'materials', 'environment'];
  return selection ? ['selection', 'projectSummary'] : ['projectSummary'];
}

export function routeRequest(input) {
  const message = String(input?.message || '').trim();
  const selection = input?.selection || null;
  if (!message) {
    return {
      route: 'reject',
      reason: 'empty_request',
      domains: [],
      context: [],
      expectedModelCalls: 0,
    };
  }
  const domains = matchedDomains(message);
  if (!domains.length && selection?.domain && SPECIALISTS[selection.domain]) {
    domains.push(selection.domain);
  }
  if (domains.length === 1) {
    const domain = domains[0];
    return {
      route: 'specialist',
      specialist: SPECIALISTS[domain],
      reason: `single_${domain}_domain`,
      domains,
      context: contextFor(domain, selection),
      expectedModelCalls: 1,
    };
  }
  if (domains.length > 1) {
    return {
      route: 'orchestrator',
      reason: 'multiple_domains',
      domains,
      context: ['projectSummary', 'selection'],
      expectedModelCalls: 2 + domains.length,
    };
  }
  return {
    route: 'orchestrator',
    reason: 'ambiguous_intent',
    domains: [],
    context: contextFor(null, selection),
    expectedModelCalls: 2,
  };
}
