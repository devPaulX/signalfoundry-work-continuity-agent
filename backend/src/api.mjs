import {validSessionId,isValidUpdate} from './core.mjs';
const WINDOW_MS = 10 * 60_000;
const MAX_GENERATIONS_PER_WINDOW = 6;

function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'no-referrer',
  });
  res.end(JSON.stringify(data));
}
function failure(code, message) {const error=new Error(message);error.statusCode=code;return error;}
async function bodyJSON(req) {
  if (!String(req.headers['content-type'] || '').includes('application/json')) throw failure(415,'Use application/json');
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if (body.length > 4096) throw failure(413,'Request body exceeds 4 KB');
  }
  try {return JSON.parse(body);} catch {throw failure(400,'Invalid JSON body');}
}
export function createHandler({store,synthesize,logger=console}) {
  const rate = new Map();
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health')
        return json(res,200,{status:'ok',service:'signalfoundry-api'});
      if (!url.pathname.startsWith('/api/')) return json(res,404,{error:'Not found'});
      const data = req.method === 'GET' ? Object.fromEntries(url.searchParams) : await bodyJSON(req);
      const sessionId = data.sessionId;
      if (!validSessionId(sessionId)) throw failure(400,'Valid sessionId UUID is required');
      if (req.method === 'GET' && url.pathname === '/api/workspace') {
        return json(res,200,await store.getWorkspace(sessionId));
      }
      if (req.method === 'GET' && url.pathname === '/api/briefs/latest') {
        return json(res,200,{snapshot:await store.latestSnapshot(sessionId)});
      }
      if (req.method === 'POST' && url.pathname === '/api/updates') {
        if (!isValidUpdate(data.content)) throw failure(400,'Update must be 12–1200 characters');
        return json(res,201,await store.addUpdate(sessionId,data.content.trim()));
      }
      if (req.method === 'POST' && url.pathname === '/api/briefs/generate') {
        const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().slice(0,64);
        const key = ip;
        const now = Date.now();
        if (rate.size>2000) rate.clear();
        const recent = (rate.get(key)||[]).filter(t=>now-t<WINDOW_MS);
        if (recent.length >= MAX_GENERATIONS_PER_WINDOW) throw failure(429,'Demo generation limit reached. Retry later.');
        rate.set(key,[...recent,now]);
        const dataSet = await store.getWorkspace(sessionId);
        const generated = await synthesize(dataSet.artifacts);
        const snapshot = {
          workspaceId:dataSet.workspace.id,generatedAt:new Date().toISOString(),
          model:generated.model,brief:generated.brief,verification:generated.verification,
          sourceCount:dataSet.artifacts.length,synthetic:true,
        };
        return json(res,201,{snapshot:await store.saveSnapshot(sessionId,snapshot)});
      }
      return json(res,404,{error:'Unknown API route'});
    } catch (error) {
      const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      if (status >= 500) logger.error('API request failed:', error?.message || 'unknown');
      return json(res,status,{error:status>=500?'Service error. Check Cloud Run logs and configuration.':error.message});
    }
  };
}
