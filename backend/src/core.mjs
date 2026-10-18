export const SESSION_ID = /^[a-f0-9-]{36}$/i;
const SECTIONS = ['decisions', 'actions', 'blockers', 'dependencies', 'questions'];
const MAX_ITEMS = 12;
const MAX_QUOTE = 500;

function normalized(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
}
function nonempty(value, max=500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
export function validSessionId(id) { return typeof id === 'string' && SESSION_ID.test(id); }
export function isValidUpdate(value) { return typeof value === 'string' && value.trim().length >= 12 && value.length <= 1200; }
export function validateCitations(raw, artifacts) {
  const sources = new Map(artifacts.map(a => [a.id, a]));
  const kept = [];
  for (const candidate of Array.isArray(raw) ? raw.slice(0, 8) : []) {
    if (!candidate || typeof candidate !== 'object') continue;
    const sourceId = nonempty(candidate.sourceId, 40);
    const quote = nonempty(candidate.quote, MAX_QUOTE);
    const source = sources.get(sourceId);
    // Exact substring after whitespace normalization. Never accept nonexistent IDs or invented quotations.
    if (source && quote.length >= 8 && normalized(source.content).includes(normalized(quote)) &&
        !kept.some(x => x.sourceId === sourceId && x.quote === quote)) {
      kept.push({sourceId, quote, sourceTitle: source.title});
    }
  }
  return kept;
}
function safeList(raw, artifacts, field, counters) {
  const out = [];
  for (const entry of (Array.isArray(raw) ? raw : []).slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue;
    const text = nonempty(entry[field], 600);
    const citations = validateCitations(entry.citations, artifacts);
    if (!text || !citations.length) { counters.rejectedClaims++; continue; }
    const item = {text, citations};
    if (field === 'task') {
      const evidenceText = normalized(citations.map(x=>x.quote).join(' '));
      const owner = nonempty(entry.owner, 100);
      const dueDate = nonempty(entry.dueDate, 100);
      item.owner = owner && evidenceText.includes(normalized(owner)) ? owner : null;
      item.dueDate = dueDate && evidenceText.includes(normalized(dueDate)) ? dueDate : null;
    }
    out.push(item);
  }
  return out;
}
export function validateBrief(raw, artifacts) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid AI response: expected JSON object');
  const counters = {rejectedClaims: 0};
  const citations = validateCitations(raw.status?.citations, artifacts);
  const statusText = nonempty(raw.status?.value, 900);
  if (statusText && !citations.length) counters.rejectedClaims++;
  const brief = {
    status: {value: statusText && citations.length ? statusText : 'Unknown — no verifiable source evidence for current status.', citations},
    decisions: safeList(raw.decisions, artifacts, 'text', counters),
    actions: safeList(raw.actions, artifacts, 'task', counters),
    blockers: safeList(raw.blockers, artifacts, 'text', counters),
    dependencies: safeList(raw.dependencies, artifacts, 'text', counters),
    questions: safeList(raw.questions, artifacts, 'text', counters),
  };
  return {
    brief,
    verification: {
      sourcesUsed: [...new Set([brief.status, ...SECTIONS.flatMap(s=>brief[s])]
        .flatMap(item=>item.citations.map(c=>c.sourceId)))],
      rejectedClaims: counters.rejectedClaims,
      method: 'Source ID existence + exact supporting quotation verification; semantic truth is not independently guaranteed.',
    },
  };
}
