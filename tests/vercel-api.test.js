import test from 'node:test';
import assert from 'node:assert/strict';
import health from '../api/health.js';
import generate from '../api/generate.js';
import { bobbinSettings, requestBobbinImage } from '../worker/bobbin-brief.js';

test('Vercel API validates requests and sends the story plan to image generation', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only';
  const calls = [];
  const plan = { sourceCue: 'River crossings', motif: 'Paired river arcs', connections: 'Bridge spans', ground: 'Water channels', rhythm: 'Alternating crossings', meaning: 'Encounters along a river' };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, payload: JSON.parse(options.body) });
    return Response.json(url.endsWith('/responses')
      ? { output: [{ content: [{ type: 'output_text', text: JSON.stringify(plan) }] }] }
      : { data: [{ b64_json: 'dGVzdA==' }] });
  };
  const req = (body, origin = 'https://lace-lab.example') => new Request('https://lace-lab.example/api/generate', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body) });
  try {
    assert.equal((await health.fetch(new Request('https://lace-lab.example/api/health')).json()).configured, true);
    assert.equal((await generate.fetch(new Request('https://lace-lab.example/api/generate'))).status, 405);
    assert.equal((await generate.fetch(req({}, 'https://unrelated.example'))).status, 403);
    assert.equal((await generate.fetch(req({}))).status, 400);
    assert.equal(calls.length, 0);
    const response = await generate.fetch(req({
      settings: { motif: 'rosette', repeat: 'halfdrop', ground: 'diamond', density: 55, weight: 3, detail: 'balanced', edge: 'repeat', surface: 'ink', quality: 'low' },
      story: { enabled: true, context: 'Cambridge', narrative: 'Crossing the river to meet other makers.', symbols: 'river and bridge', focus: 'routes', abstraction: 'balanced' }
    }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.translation, plan);
    assert.equal(result.mimeType, 'image/webp');
    assert.equal(result.process, 'bobbin');
    assert.equal(result.settings.process, 'bobbin');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].payload.output_format, 'webp');
    assert.match(calls[1].payload.prompt, /Paired river arcs/);
    assert.match(calls[1].payload.prompt, /Bridge spans/);
    assert.match(calls[1].payload.prompt, /MAKING PROCESS IS FIXED/);
    assert.match(calls[1].payload.prompt, /Do not combine crochet/);
    assert.match(calls[0].payload.input, /handmade bobbin lace only/);
    assert.equal(JSON.stringify(result).includes('test-only'), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test('the focused study rejects other making processes and unknown reference inputs', () => {
  assert.throws(()=>bobbinSettings({ process:'crochet', surface:'thread' }), /bobbin lace only/);
  assert.throws(()=>bobbinSettings({ process:'bobbin', surface:'cutwork' }), /different making process/);
  assert.throws(()=>bobbinSettings({ reference:'https://untrusted.example/image.jpg' }), /verified bobbin/);
});

test('selected bobbin reference is attached as image input, not only prompt text', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('clevelandart.org')) return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}});
    return Response.json({ data:[{b64_json:'test'}] });
  };
  try {
    await requestBobbinImage({model:'gpt-image-2',prompt:'Bobbin study',n:1,output_format:'webp'}, {reference:'genoese'}, {OPENAI_API_KEY:'test-only'}, new AbortController().signal);
    assert.match(calls[0].url,/1920.985/);
    assert.equal(calls[1].url,'https://api.openai.com/v1/images/edits');
    assert.ok(calls[1].options.body instanceof FormData);
    assert.equal(calls[1].options.body.get('image').size,3);
    assert.equal(calls[1].options.body.get('prompt'),'Bobbin study');
    assert.equal(calls[1].options.headers['content-type'],undefined);
  } finally { globalThis.fetch=originalFetch; }
});
