import {initializeApp, getApps} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {ARTIFACTS, WORKSPACE} from './demo-data.mjs';
function db() { if (!getApps().length) initializeApp(); return getFirestore(); }
const workspaceRef = () => db().collection('workspaces').doc(WORKSPACE.id);
const sessionRef = (sid) => db().collection('demo_sessions').doc(sid);

async function seed() {
  const ref = workspaceRef();
  if ((await ref.get()).exists) return;
  const batch = db().batch();
  batch.set(ref,WORKSPACE);
  for (const artifact of ARTIFACTS) batch.set(ref.collection('artifacts').doc(artifact.id),artifact);
  await batch.commit();
}
export const firestoreStore = {
  async getWorkspace(sessionId) {
    await seed();
    const artifactSnap = await workspaceRef().collection('artifacts').get();
    const updatesSnap = await sessionRef(sessionId).collection('updates').orderBy('createdAt','asc').limit(3).get();
    const artifacts = artifactSnap.docs.map(x=>x.data()).sort((a,b)=>a.id.localeCompare(b.id));
    const updates = updatesSnap.docs.map((x, idx)=>({
      id:`UPD-${String(idx+1).padStart(2,'0')}`,kind:'Team update',title:`Added update ${idx+1}`,
      date:x.data().date,content:x.data().content,
    }));
    return {workspace:WORKSPACE,artifacts:[...artifacts,...updates],updatesRemaining:3-updates.length};
  },
  async addUpdate(sessionId, content) {
    const ref = sessionRef(sessionId).collection('updates');
    const existing = await ref.limit(3).get();
    if (existing.size >= 3) {const err=new Error('A demo session supports at most three updates.');err.statusCode=409;throw err;}
    const date = new Date().toISOString();
    await ref.add({content,date,createdAt:date});
    return {createdAt:date};
  },
  async saveSnapshot(sessionId, snapshot) {
    const ref = await sessionRef(sessionId).collection('snapshots').add(snapshot);
    return {id:ref.id,...snapshot};
  },
  async latestSnapshot(sessionId) {
    const result = await sessionRef(sessionId).collection('snapshots').orderBy('generatedAt','desc').limit(1).get();
    return result.empty ? null : {id:result.docs[0].id,...result.docs[0].data()};
  },
};
