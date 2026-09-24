import test from 'node:test';
import assert from 'node:assert/strict';
import health from '../api/health.js';
import generate from '../api/generate.js';

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
    assert.equal(calls.length, 2);
    assert.equal(calls[1].payload.output_format, 'webp');
    assert.match(calls[1].payload.prompt, /Paired river arcs/);
    assert.match(calls[1].payload.prompt, /Bridge spans/);
    assert.equal(JSON.stringify(result).includes('test-only'), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
