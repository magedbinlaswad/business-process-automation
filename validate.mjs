import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const text = readFileSync(new URL('./business-process-automation.json', import.meta.url), 'utf8');
const w = JSON.parse(text);
const nodes = new Map(w.nodes.map(n => [n.name, n]));
let checks = 0;
function test(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
function run(name, items, sources = {}) {
  const input = { first: () => items[0], all: () => items };
  const source = name => {
    if (!(name in sources)) throw new Error(`Missing mock: ${name}`);
    return { first: () => sources[name][0], itemMatching: i => sources[name][i] };
  };
  return new Function('$input', '$', nodes.get(name).parameters.jsCode)(input, source);
}
const request = `Link: https://example.com/records/REQ-001\nRecord: REQ-001 | Department: Operations | Reference: CASE-001\nEmail: demo@example.com`;
function parse(action = request, template_key = 'template_a') {
  return run('Validate Document Batch', [{ json: { template_key } }], {
    'Normalize Request': [{ json: { action, chat_id: '1001' } }],
    'Project Configuration': [{ json: { config: { allowedLinkHosts: ['example.com'] } } }],
  });
}
test('Inactive export with no embedded credentials, cached resources or execution data', () => {
  assert.equal(w.active, false); assert.deepEqual(w.pinData, {});
  for (const key of ['credentials', 'webhookId', 'cachedResultName', 'cachedResultUrl', 'staticData', 'instanceId']) assert.ok(!text.includes(`"${key}"`));
  assert.equal(w.settings.saveDataSuccessExecution, 'none');
  assert.equal(w.settings.saveDataErrorExecution, 'none');
  assert.ok(!/\b\d{8,}:\w{25,}\b|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY/.test(text));
});
test('All edges and expressions resolve to existing nodes', () => {
  assert.equal(nodes.size, w.nodes.length);
  for (const [from, outputs] of Object.entries(w.connections)) {
    assert.ok(nodes.has(from));
    for (const branches of Object.values(outputs)) for (const branch of branches) for (const edge of branch) assert.ok(nodes.has(edge.node), edge.node);
  }
  for (const [,name] of text.matchAll(/\$\('([^']+)'\)/g)) assert.ok(nodes.has(name), name);
});
test('Configuration placeholders block an unconfigured deployment', () => {
  assert.throws(() => run('Project Configuration', [{json:{}}]), /Complete Project Configuration/);
});
test('Private-chat normalization accepts messages and rejects group input', () => {
  const update = { message: { from: {id:1001,first_name:'Demo'}, chat:{id:1001,type:'private'}, text:'/start' } };
  assert.equal(run('Normalize Request', [{json:update}])[0].json.user_id, '1001');
  update.message.chat = {id:-1001,type:'group'};
  assert.throws(() => run('Normalize Request', [{json:update}]), /Only direct/);
});
test('Valid record preserves pairing, contact and output filename', () => {
  const [item] = parse();
  assert.equal(item.json.fileName, 'REQ-001 - CASE-001');
  assert.equal(item.json.email, 'demo@example.com');
  assert.deepEqual(item.pairedItem,{item:0});
});
test('Batch accepts 20 unique records and rejects 21 before producing output', () => {
  const batch = count => Array.from({length:count},(_,i)=>`Link: https://example.com/records/R-${i}\nRecord: R-${i} | Department: Operations | Reference: C-${i}`).join('\n')+'\nEmail: demo@example.com';
  assert.equal(parse(batch(20)).length,20);
  assert.throws(() => parse(batch(21)), /1 and 20/);
});
test('Malformed data, duplicate IDs and missing template fail', () => {
  for (const bad of [request.replace('Email:','Contact:'),request.replace('Department:','Team:'), request.replace('REQ-001 |','../bad |'),request.replace('Email: demo@example.com','Email: bad')]) assert.throws(()=>parse(bad));
  assert.throws(()=>parse(request.replace('\nEmail:', '\n'+request.split('\n').slice(0,2).join('\n')+'\nEmail:')),/duplicate/);
  assert.throws(()=>parse(request,'unknown'),/Select a template/);
});
test('Link validation rejects unsafe schemes, credentials and lookalike domains', () => {
  for (const url of ['http://example.com/x','javascript:alert(1)','https://example.com.evil.invalid/x','https://user:pass@example.com/x','https://example.com\\@evil.invalid/x','https://example.com:443/x']) assert.throws(()=>parse(request.replace('https://example.com/records/REQ-001',url)));
});
function ranges(contents) {
  return run('Locate Link Ranges',[{json:{documentId:'synthetic-doc',title:'Demo',body:{content:contents}}}],{'Validate Document Batch':[{json:{email:'demo@example.com'}}]})[0].json;
}
test('Document ranges support split runs and UTF-16 indices', () => {
  const prefix='😀 Contact: '; const email='demo@example.com';
  const body = [{paragraph:{elements:[
    {startIndex:1,textRun:{content:prefix+'demo@'}},
    {startIndex:1+prefix.length+5,textRun:{content:'example.com\nOpen record\n'}},
  ]}}];
  const result = ranges(body);
  assert.equal(result.emailRange.startIndex,1+prefix.length);
  assert.equal(result.emailRange.endIndex,1+prefix.length+email.length);
  assert.equal(result.recordRange.endIndex-result.recordRange.startIndex,11);
});
test('Document ranges reject missing, duplicate and discontinuous targets', () => {
  const doc = content => [{paragraph:{elements:[{startIndex:1,textRun:{content}}]}}];
  assert.throws(()=>ranges(doc('demo@example.com\n')),/exactly once/);
  assert.throws(()=>ranges(doc('demo@example.com\nOpen record\nOpen record')),/exactly once/);
  assert.throws(()=>ranges([{paragraph:{elements:[{startIndex:1,textRun:{content:'demo@'}},{startIndex:20,textRun:{content:'example.com\nOpen record'}}]}}]),/separate/);
});
test('Owner authorization and target guards require all conditions', () => {
  const owner=nodes.get('Check Owner Action').parameters.conditions;
  assert.equal(owner.combinator,'and');
  assert.match(owner.conditions[0].rightValue,/config.ownerUserId/);
  const regex=new RegExp(owner.conditions[1].rightValue);
  assert.ok(regex.test('access_approve:1001'));
  assert.ok(!regex.test('access_approve:1001:other'));
  for (const name of ['Approve Access','Reject Access']) {
    const p=nodes.get(name).parameters;
    assert.equal(p.matchType,'allConditions');
    assert.ok(p.filters.conditions.some(c=>c.keyName==='status'&&c.keyValue==='pending'));
    assert.ok(p.filters.conditions.some(c=>c.keyName==='role'&&c.condition==='neq'&&c.keyValue==='owner'));
    assert.ok(p.filters.conditions.some(c=>c.keyName==='user_id'&&c.condition==='neq'&&c.keyValue.includes('config.ownerUserId')));
  }
});
test('Owner approval notification follows the update, not the pending list', () => {
  assert.ok(w.connections['Approve Access'].main[0].some(e=>e.node==='Notify Owner of Approval'));
  assert.ok(!w.connections['Pending Request Card']);
});
console.log(`\n${checks} offline checks passed. Live credentials and provider integrations were not exercised.`);
