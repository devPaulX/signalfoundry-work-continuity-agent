import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTIFACTS} from '../src/demo-data.mjs';
import {validateBrief,validateCitations,isValidUpdate,validSessionId} from '../src/core.mjs';

const quote='SSO regression retest has not yet been recorded.';
const cite={sourceId:'SRC-05',quote};

test('retains exact citations from existing sources only',()=>{
  const actual=validateCitations([cite,{sourceId:'SRC-XX',quote},{sourceId:'SRC-05',quote:'invented evidence'}],ARTIFACTS);
  assert.equal(actual.length,1);
  assert.equal(actual[0].sourceTitle,'SSO remediation · 18 Oct');
});

test('drops unverifiable facts and marks missing status unknown',()=>{
  const answer={
    status:{value:'All launch gates passed',citations:[{sourceId:'SRC-05',quote:'A nonexistent confirmation'}]},
    decisions:[{text:'Send pilot invites now',citations:[{sourceId:'MISSING',quote}]}],
    actions:[{task:'Retest SSO',owner:'Someone Else',dueDate:'tomorrow',citations:[cite]}],
    blockers:[{text:'SSO retest still needed',citations:[cite]}],
    dependencies:[],questions:[],
  };
  const validated=validateBrief(answer,ARTIFACTS);
  assert.match(validated.brief.status.value,/Unknown/);
  assert.equal(validated.brief.decisions.length,0);
  assert.equal(validated.brief.actions[0].owner,null);
  assert.equal(validated.brief.actions[0].dueDate,null);
  assert.equal(validated.brief.blockers.length,1);
  assert.equal(validated.verification.rejectedClaims,2);
});

test('requires valid session IDs and short synthetic updates',()=>{
  assert.equal(validSessionId('1dd00c48-968f-4a77-aa72-c5f55b397995'),true);
  assert.equal(validSessionId('../../secrets'),false);
  assert.equal(isValidUpdate('Patch has been validated and approved.'),true);
  assert.equal(isValidUpdate('short'),false);
  assert.equal(isValidUpdate('X'.repeat(1201)),false);
});
