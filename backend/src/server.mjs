import http from 'node:http';
import {createHandler} from './api.mjs';
import {firestoreStore} from './store.mjs';
import {synthesize} from './ai.mjs';
const port = Number(process.env.PORT) || 8080;
http.createServer(createHandler({store:firestoreStore,synthesize})).listen(port,'0.0.0.0',()=> {
  console.log(`SignalFoundry API listening on :${port}`);
});
