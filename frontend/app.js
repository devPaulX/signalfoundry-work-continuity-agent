const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storageKey = 'signalfoundry-demo-session-v1';
let sessionId = localStorage.getItem(storageKey);
if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
  sessionId = crypto.randomUUID(); localStorage.setItem(storageKey,sessionId);
}
let sources = [];
let isBusy = false;
async function request(path, options = {}) {
  const response = await fetch(path,{cache:'no-store',headers:{'Content-Type':'application/json'},...options});
  let payload;
  try {payload=await response.json();} catch {throw Error('The API response was not JSON. Check the Hosting rewrite.');}
  if (!response.ok) throw Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}
function notice(message, error=false) {
  const node = $('#notice');node.textContent=message;node.classList.toggle('error',error);
}
function busy(value) {
  isBusy = value;
  $('#generate').disabled=value;
  $('#generate').textContent=value?'Analyzing sources…':'Generate work brief ↗';
  $('#add-update').disabled=value;
}
function renderSources() {
  $('#source-count').textContent=`${sources.length} RECORDS · ${sources.filter(x=>x.kind==='Team update').length} ADDED UPDATES`;
  $('#source-list').innerHTML = sources.map((source,i)=>`
    <div class="source-item" id="source-${escapeHtml(source.id)}">
      <button class="source-summary" type="button" data-expand="${escapeHtml(source.id)}" aria-expanded="false">
        <span class="source-icon">${String(i+1).padStart(2,'0')}</span>
        <span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.kind)} &nbsp;·&nbsp; ${escapeHtml(source.date.slice(0,10))} &nbsp;·&nbsp; ${escapeHtml(source.id)}</small></span>
        <span class="source-chevron" aria-hidden="true">+</span>
      </button>
      <div class="source-content" hidden>${escapeHtml(source.content)}</div>
    </div>`).join('');
}
function showSource(id) {
  const item = document.getElementById(`source-${id}`);
  if (!item) return;
  const content = item.querySelector('.source-content');
  const expand = item.querySelector('.source-summary');
  content.hidden=false;item.classList.add('active');expand.setAttribute('aria-expanded','true');
  item.querySelector('.source-chevron').textContent='−';
  item.scrollIntoView({behavior:'smooth',block:'center'});
}
function citations(refs) {
  return `<div class="evidence-row">${(refs||[]).map(ref=>`<button type="button" class="evidence-chip" data-source="${escapeHtml(ref.sourceId)}" title="${escapeHtml(ref.quote)}">↗ ${escapeHtml(ref.sourceId)} · view evidence</button>`).join('')}</div>`;
}
function section(title, entries, isActions=false) {
  return `<section class="brief-section"><div class="brief-section-heading"><h3>${escapeHtml(title)}</h3><span>${entries.length} FOUND</span></div>
  ${entries.length ? entries.map(item=>`<div class="brief-item"><p>${escapeHtml(item.text)}</p>${isActions?`<div class="action-meta">OWNER: ${escapeHtml(item.owner||'Unknown')} &nbsp;·&nbsp; DUE: ${escapeHtml(item.dueDate||'Unknown')}</div>`:''}${citations(item.citations)}</div>`).join('') : '<p class="unknown">Unknown — no verifiable evidence in the provided records.</p>'}</section>`;
}
function renderBrief(snapshot, recovered=false) {
  if (!snapshot) return;
  const b=snapshot.brief;
  const generated = new Date(snapshot.generatedAt);
  $('#result').innerHTML=`<div class="brief-header"><span class="verified-label">✓ ${recovered?'RESTORED FROM FIRESTORE':'GENERATED & SAVED'}</span><small>${escapeHtml(Number.isNaN(generated.valueOf())?snapshot.generatedAt:generated.toLocaleString())}</small></div>
  <div class="status-card"><span class="section-label">CURRENT WORK STATE</span><p>${escapeHtml(b.status.value)}</p>${citations(b.status.citations)}</div>
  ${section('Decisions',b.decisions)}
  ${section('Action items',b.actions,true)}
  ${section('Blockers & risks',b.blockers)}
  ${section('Dependencies',b.dependencies)}
  ${section('Unresolved questions',b.questions)}
  <div class="audit-trail"><strong>Evidence validation</strong> · ${escapeHtml(snapshot.verification.sourcesUsed.length)} cited source(s); ${escapeHtml(snapshot.verification.rejectedClaims)} unsupported claim(s) excluded.<br>Model: ${escapeHtml(snapshot.model)} · ${escapeHtml(snapshot.sourceCount)} source records · Snapshot stored in Firestore.<br>Verification checks source IDs and quotations; it does not guarantee semantic accuracy.</div>`;
}
async function refreshWorkspace() {
  const response=await request(`/api/workspace?sessionId=${encodeURIComponent(sessionId)}`);
  sources=response.artifacts;renderSources();
  $('#update-limit').textContent=`${response.updatesRemaining} update slots remaining`;
  $('#add-update').disabled=response.updatesRemaining<=0;
}
async function boot() {
  try {
    await refreshWorkspace();
    const latest=await request(`/api/briefs/latest?sessionId=${encodeURIComponent(sessionId)}`);
    if (latest.snapshot) renderBrief(latest.snapshot,true);
  } catch(e) {notice(e.message,true);$('#source-list').innerHTML='<div class="loading">Workspace unavailable. Check Firestore and Cloud Run deployment.</div>';}
}
$('#source-list').addEventListener('click', event=>{
  const target=event.target.closest('[data-expand]');if (!target) return;
  const item=target.closest('.source-item');const content=item.querySelector('.source-content');
  const opened=content.hidden;content.hidden=!opened;item.classList.toggle('active',opened);
  target.setAttribute('aria-expanded',String(opened));item.querySelector('.source-chevron').textContent=opened?'−':'+';
});
$('#result').addEventListener('click',event=>{const target=event.target.closest('[data-source]');if(target)showSource(target.dataset.source);});
$('#generate').addEventListener('click',async()=>{
  if(isBusy)return;busy(true);notice('Analyzing your source records with Gemini…');
  try {const result=await request('/api/briefs/generate',{method:'POST',body:JSON.stringify({sessionId})});renderBrief(result.snapshot);notice('Brief generated by Gemini, evidence-checked, and saved to Firestore.');}
  catch(e){notice(e.message,true);}finally{busy(false);}
});
$('#add-update').addEventListener('click',async()=>{
  if(isBusy)return;
  const content=$('#update-input').value.trim();
  if(content.length<12 || content.length>1200){notice('Update must be 12–1200 characters.',true);return;}
  busy(true);notice('Saving update to Firestore…');
  try {await request('/api/updates',{method:'POST',body:JSON.stringify({sessionId,content})});$('#update-input').value='';await refreshWorkspace();notice('Update saved. Select “Generate work brief” to produce a new snapshot.');}
  catch(e){notice(e.message,true);}finally{busy(false);}
});
boot();
