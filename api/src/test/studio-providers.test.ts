// studio-providers.test.ts — cloud image-edit adapters (fetch mocked): request shape, parse, blocked,
// failure, missing key. Providers must NEVER throw (invariant 4).

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  geminiImageProvider, openAiImageProvider, getImageProvider, getLlmProvider, claudeBridgeLlmProvider,
  comfyUiImageProvider, replicateImageProvider, loadComfyWorkflow, patchComfyWorkflow,
} from '../lib/studio/providers.js';

const PNG_B64 = Buffer.from('fake-png').toString('base64');
const input = { photo: Buffer.from([0xff, 0xd8, 0xff, 0xd9]), contentType: 'image/jpeg', prompt: 'A new concrete patio' };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  process.env.OPENAI_API_KEY = 'sk-test';
  process.env.GEMINI_API_KEY = 'g-test';
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.STUDIO_IMAGE_PROVIDER;
});
const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });

describe('openai image edit', () => {
  it('sends multipart model/prompt/image and decodes b64_json', async () => {
    fetchMock.mockResolvedValue(json(200, { data: [{ b64_json: PNG_B64 }] }));
    const r = await openAiImageProvider.edit(input);
    expect(r).toMatchObject({ status: 'ok', contentType: 'image/png', model: 'gpt-image-1' });
    expect(r.status === 'ok' && r.image.toString()).toBe('fake-png');
    expect(r.status === 'ok' && r.costMicroUsd).toBeGreaterThan(0);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.openai.com/v1/images/edits');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const form = init.body as FormData;
    expect(form.get('model')).toBe('gpt-image-1');
    expect(form.get('prompt')).toBe('A new concrete patio');
    expect(form.get('image')).toBeInstanceOf(Blob);
  });

  it('maps moderation to blocked and other errors to failed', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: { code: 'moderation_blocked', message: 'no' } }));
    expect((await openAiImageProvider.edit(input)).status).toBe('blocked');
    fetchMock.mockResolvedValueOnce(json(500, { error: { message: 'boom' } }));
    expect(await openAiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: expect.stringContaining('500') });
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    expect(await openAiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'network down' });
  });

  it('fails cleanly without a key', async () => {
    delete process.env.OPENAI_API_KEY;
    expect(await openAiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'OPENAI_API_KEY not set' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('gemini image', () => {
  it('sends the prompt + inline photo and decodes the inline image part', async () => {
    fetchMock.mockResolvedValue(json(200, { candidates: [{ content: { parts: [{ text: 'ok' }, { inlineData: { mimeType: 'image/png', data: PNG_B64 } }] } }] }));
    const r = await geminiImageProvider.edit(input);
    expect(r).toMatchObject({ status: 'ok', contentType: 'image/png' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain(':generateContent');
    expect(init.headers['x-goog-api-key']).toBe('g-test');
    const body = JSON.parse(init.body);
    expect(body.contents[0].parts[0].text).toBe('A new concrete patio');
    expect(body.contents[0].parts[1].inline_data.mime_type).toBe('image/jpeg');
  });

  it('maps safety blocks to blocked; empty to failed', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { promptFeedback: { blockReason: 'SAFETY' } }));
    expect((await geminiImageProvider.edit(input)).status).toBe('blocked');
    fetchMock.mockResolvedValueOnce(json(200, { candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [] } }] }));
    expect((await geminiImageProvider.edit(input)).status).toBe('blocked');
    fetchMock.mockResolvedValueOnce(json(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'sorry' }] } }] }));
    expect((await geminiImageProvider.edit(input)).status).toBe('failed');
  });
});

describe('selection', () => {
  it('picks by env; unknown/none = unavailable', () => {
    process.env.STUDIO_IMAGE_PROVIDER = 'gemini';
    expect(getImageProvider()?.name).toBe('gemini');
    process.env.STUDIO_IMAGE_PROVIDER = 'comfyui';
    expect(getImageProvider()?.name).toBe('comfyui');
    process.env.STUDIO_IMAGE_PROVIDER = 'nope';
    expect(getImageProvider()).toBeNull();
    process.env.STUDIO_LLM_PROVIDER = 'claude_bridge';
    expect(getLlmProvider()?.name).toBe('claude_bridge');
    delete process.env.STUDIO_LLM_PROVIDER;
  });
});

describe('claude bridge llm', () => {
  const llmInput = {
    system: 'You help pick a patio finish.', user: 'quiero algo moderno',
    schema: { type: 'object', properties: { suggestions: { type: 'array' } } },
    images: [{ data: Buffer.from([0xff, 0xd8, 0xff, 0x00]), contentType: 'image/jpeg' }],
  };
  beforeEach(() => {
    process.env.CLAUDE_BRIDGE_URL = 'http://host.docker.internal:8789/';
    process.env.CLAUDE_BRIDGE_TOKEN = 'bridge-secret';
  });
  afterEach(() => { delete process.env.CLAUDE_BRIDGE_URL; delete process.env.CLAUDE_BRIDGE_TOKEN; });

  it('posts system/user/schema + base64 images with the bearer token; 200 → raw passthrough at $0', async () => {
    const data = { suggestions: [{ field: 'finish', value: 'broom' }], next_field: null };
    fetchMock.mockResolvedValue(json(200, { data, meta: { model: 'sonnet', duration_s: 9 } }));
    const r = await claudeBridgeLlmProvider.structured(llmInput);
    expect(r).toEqual({ raw: data, model: 'claude-sonnet', costMicroUsd: 0 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://host.docker.internal:8789/structured');
    expect(init.headers.Authorization).toBe('Bearer bridge-secret');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ system: llmInput.system, user: llmInput.user, schema: llmInput.schema });
    expect(body.images).toEqual([{ data_b64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'), content_type: 'image/jpeg' }]);
  });

  it('429 / 503 / 500 / network error / missing config → null (never throws)', async () => {
    for (const status of [429, 503, 500]) {
      fetchMock.mockResolvedValueOnce(json(status, { error: 'x' }));
      expect(await claudeBridgeLlmProvider.structured(llmInput)).toBeNull();
    }
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await claudeBridgeLlmProvider.structured(llmInput)).toBeNull();
    fetchMock.mockResolvedValueOnce(json(200, { meta: {} }));
    expect(await claudeBridgeLlmProvider.structured(llmInput)).toBeNull();
    delete process.env.CLAUDE_BRIDGE_TOKEN;
    const calls = fetchMock.mock.calls.length;
    expect(await claudeBridgeLlmProvider.structured(llmInput)).toBeNull();
    expect(fetchMock.mock.calls.length).toBe(calls);
  });
});

describe('comfyui image', () => {
  beforeEach(() => {
    process.env.STUDIO_COMFYUI_URL = 'http://comfy:8188';
    process.env.STUDIO_COMFYUI_WORKFLOW = 'flux-kontext';
    process.env.STUDIO_COMFYUI_POLL_MS = '1';
  });
  afterEach(() => {
    for (const k of ['STUDIO_COMFYUI_URL', 'STUDIO_COMFYUI_WORKFLOW', 'STUDIO_COMFYUI_POLL_MS', 'STUDIO_IMAGE_TIMEOUT_MS']) delete process.env[k];
  });
  const view = { ok: true, status: 200, headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => new TextEncoder().encode('rendered').buffer };

  it('every shipped workflow carries the image + prompt placeholders', () => {
    for (const name of ['flux-kontext', 'qwen-image-edit']) {
      const wf = loadComfyWorkflow(name);
      expect(wf, name).not.toBeNull();
      const { patched } = patchComfyWorkflow(wf!, { image: 'x.jpg', prompt: 'p', seed: 1 });
      expect(patched, name).toEqual({ image: true, prompt: true });
      const { workflow } = patchComfyWorkflow(wf!, { image: 'x.jpg', prompt: 'p', seed: 1 });
      expect(JSON.stringify(workflow), `${name} has an unpatched placeholder`).not.toMatch(/\{\{[A-Z_]+\}\}/);
    }
    expect(loadComfyWorkflow('../../etc/passwd')).toBeNull();
  });

  it('flux-kontext steps + megapixels come from env (defaults 8 / 0.5, clamped)', () => {
    const find = (wf: Record<string, unknown>, cls: string) =>
      (Object.values(wf) as { class_type: string; inputs: Record<string, unknown> }[]).find((n) => n.class_type === cls)!.inputs;
    const wf = loadComfyWorkflow('flux-kontext')!;
    let { workflow } = patchComfyWorkflow(wf, { image: 'x.jpg', prompt: 'p', seed: 1 });
    expect(find(workflow, 'KSampler').steps).toBe(8);
    expect(find(workflow, 'ImageScaleToTotalPixels').megapixels).toBe(0.5);
    process.env.STUDIO_COMFYUI_STEPS = '12';
    process.env.STUDIO_COMFYUI_MEGAPIXELS = '9';
    ({ workflow } = patchComfyWorkflow(wf, { image: 'x.jpg', prompt: 'p', seed: 1 }));
    expect(find(workflow, 'KSampler').steps).toBe(12);
    expect(find(workflow, 'ImageScaleToTotalPixels').megapixels).toBe(2);
    delete process.env.STUDIO_COMFYUI_STEPS;
    delete process.env.STUDIO_COMFYUI_MEGAPIXELS;
  });

  it('upload → prompt (patched) → history → view', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { name: 'studio-1.jpg', subfolder: '' }))
      .mockResolvedValueOnce(json(200, { prompt_id: 'p1' }))
      .mockResolvedValueOnce(json(200, {}))                                    // not queued into history yet
      .mockResolvedValueOnce(json(200, { p1: { status: { completed: false }, outputs: {} } }))
      .mockResolvedValueOnce(json(200, { p1: { status: { status_str: 'success', completed: true }, outputs: { 13: { images: [{ filename: 'out.png', subfolder: '', type: 'output' }] } } } }))
      .mockResolvedValueOnce(view);
    const r = await comfyUiImageProvider.edit(input);
    expect(r).toMatchObject({ status: 'ok', contentType: 'image/png', model: 'comfyui/flux-kontext', costMicroUsd: 0 });
    expect(r.status === 'ok' && r.image.toString()).toBe('rendered');
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls[0]).toBe('http://comfy:8188/upload/image');
    expect((fetchMock.mock.calls[0]![1].body as FormData).get('image')).toBeInstanceOf(Blob);
    expect(urls[1]).toBe('http://comfy:8188/prompt');
    const queued = JSON.parse(fetchMock.mock.calls[1]![1].body).prompt;
    expect(queued['4'].inputs.image).toBe('studio-1.jpg');
    expect(queued['7'].inputs.text).toBe('A new concrete patio');
    expect(typeof queued['11'].inputs.seed).toBe('number');
    expect(urls[2]).toBe('http://comfy:8188/history/p1');
    expect(urls.at(-1)).toContain('/view?filename=out.png');
  });

  it('execution error / timeout / unreachable / unknown workflow → failed', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { name: 'a.jpg' }))
      .mockResolvedValueOnce(json(200, { prompt_id: 'p2' }))
      .mockResolvedValueOnce(json(200, { p2: { status: { status_str: 'error', completed: true }, outputs: {} } }));
    expect(await comfyUiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'comfyui execution error' });

    process.env.STUDIO_IMAGE_TIMEOUT_MS = '30';
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(json(200, { name: 'a.jpg' }))
      .mockResolvedValueOnce(json(200, { prompt_id: 'p3' }))
      .mockResolvedValue(json(200, {}));
    expect(await comfyUiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'timed out' });

    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await comfyUiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'ECONNREFUSED' });

    process.env.STUDIO_COMFYUI_WORKFLOW = 'missing';
    expect(await comfyUiImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'workflow missing not found' });
  });
});

describe('replicate image', () => {
  beforeEach(() => { process.env.REPLICATE_API_TOKEN = 'r8-test'; process.env.STUDIO_REPLICATE_POLL_MS = '1'; });
  afterEach(() => { delete process.env.REPLICATE_API_TOKEN; delete process.env.STUDIO_REPLICATE_POLL_MS; });
  const png = { ok: true, status: 200, headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => new TextEncoder().encode('r8').buffer };

  it('creates a prediction with a data-URI photo, polls, downloads the output', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { id: 'x', status: 'processing', urls: { get: 'https://api.replicate.com/v1/predictions/x' } }))
      .mockResolvedValueOnce(json(200, { id: 'x', status: 'succeeded', output: ['https://replicate.delivery/out.png'] }))
      .mockResolvedValueOnce(png);
    const r = await replicateImageProvider.edit(input);
    expect(r).toMatchObject({ status: 'ok', model: 'qwen/qwen-image-edit' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.replicate.com/v1/models/qwen/qwen-image-edit/predictions');
    expect(init.headers.Authorization).toBe('Bearer r8-test');
    const body = JSON.parse(init.body);
    expect(body.input.prompt).toBe('A new concrete patio');
    expect(body.input.image).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('nsfw → blocked; failure → failed; no key → failed without calling', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { status: 'failed', error: 'NSFW content detected' }));
    expect((await replicateImageProvider.edit(input)).status).toBe('blocked');
    fetchMock.mockResolvedValueOnce(json(422, { detail: 'bad input' }));
    expect(await replicateImageProvider.edit(input)).toMatchObject({ status: 'failed', error: expect.stringContaining('422') });
    delete process.env.REPLICATE_API_TOKEN;
    const n = fetchMock.mock.calls.length;
    expect(await replicateImageProvider.edit(input)).toMatchObject({ status: 'failed', error: 'REPLICATE_API_TOKEN not set' });
    expect(fetchMock.mock.calls.length).toBe(n);
  });
});
