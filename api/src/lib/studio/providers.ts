// studio/providers.ts — AI providers behind interfaces (Design Studio, invariant 4).
//
// Two seams, both env-selected so a provider swap is config, not code (mirrors the virus-scanner
// interface, T-26/T-30):
//   ImageEditProvider — photo + prompt → concept image(s)      STUDIO_IMAGE_PROVIDER = none | mock | openai | gemini | comfyui | replicate
//   LlmProvider       — structured JSON for the intake guide    STUDIO_LLM_PROVIDER   = none | mock | ollama | claude_bridge
// Real cloud image providers land after the P0 spike. `none` = feature unavailable (routes answer 503
// and the deterministic wizard carries on). Providers NEVER throw to callers: null / {status:'failed'}.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ImageEditInput { photo: Buffer; contentType: string; prompt: string }
export type ImageEditResult =
  | { status: 'ok'; image: Buffer; contentType: string; model: string; costMicroUsd: number }
  | { status: 'blocked'; reason: string; model: string }
  | { status: 'failed'; error: string; model: string };

export interface ImageEditProvider { name: string; edit(input: ImageEditInput): Promise<ImageEditResult> }

export interface LlmInput {
  system: string;
  user: string;
  images?: { data: Buffer; contentType: string }[];
  schema: Record<string, unknown>;
}
export interface LlmResult { raw: unknown; model: string; costMicroUsd: number }
export interface LlmProvider { name: string; structured(input: LlmInput): Promise<LlmResult | null> }

// 1×1 transparent PNG — the mock render.
const MOCK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/** Deterministic test provider. A prompt containing "BLOCKME"/"FAILME" exercises the error paths. */
export const mockImageProvider: ImageEditProvider = {
  name: 'mock',
  async edit({ photo, contentType, prompt }) {
    if (prompt.includes('BLOCKME')) return { status: 'blocked', reason: 'moderation', model: 'mock-echo' };
    if (prompt.includes('FAILME')) return { status: 'failed', error: 'mock failure', model: 'mock-echo' };
    return { status: 'ok', image: photo, contentType: contentType === 'image/png' ? 'image/png' : 'image/jpeg', model: 'mock-echo', costMicroUsd: 0 };
  },
};

/** Mock LLM: echoes a canned reply set via setMockLlmReply (tests). */
let mockReply: unknown = { suggestions: [], next_field: null };
export function setMockLlmReply(reply: unknown): void { mockReply = reply; }
export const mockLlmProvider: LlmProvider = {
  name: 'mock',
  async structured() { return { raw: mockReply, model: 'mock-1', costMicroUsd: 1_000 }; },
};

/** Local Ollama (same host GPU as blueprint vision — $0, no data egress). */
export const ollamaLlmProvider: LlmProvider = {
  name: 'ollama',
  async structured({ system, user, images, schema }) {
    const base = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
    const model = process.env.STUDIO_OLLAMA_MODEL ?? process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5vl:7b';
    try {
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(Number(process.env.STUDIO_LLM_TIMEOUT_MS ?? 120_000)),
        body: JSON.stringify({
          model, stream: false, format: schema, options: { temperature: 0 },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user, ...(images?.length ? { images: images.map((i) => i.data.toString('base64')) } : {}) },
          ],
        }),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { message?: { content?: string } };
      const content = body.message?.content;
      if (!content) return null;
      return { raw: JSON.parse(content), model, costMicroUsd: 0 };
    } catch {
      return null;
    }
  },
};

const intEnv = (k: string, d: number) => {
  const n = Number(process.env[k]);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

/**
 * Claude via the host bridge (`ops/claude-bridge/`) on the owner's Claude subscription — OWNER TESTING
 * ONLY (subscription terms). Any non-200 (429 usage limit, 503 expired login, 5xx) → null: the wizard
 * carries on and repeated failures trip the studio circuit breaker. Images are already metadata-stripped.
 */
export const claudeBridgeLlmProvider: LlmProvider = {
  name: 'claude_bridge',
  async structured({ system, user, images, schema }) {
    const base = process.env.CLAUDE_BRIDGE_URL;
    const token = process.env.CLAUDE_BRIDGE_TOKEN;
    if (!base || !token) return null;
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/structured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(intEnv('STUDIO_LLM_TIMEOUT_MS', 180_000)),
        body: JSON.stringify({
          system, user, schema,
          images: (images ?? []).map((i) => ({ data_b64: i.data.toString('base64'), content_type: i.contentType })),
        }),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { data?: unknown; meta?: { model?: string } };
      if (!body.data || typeof body.data !== 'object') return null;
      return { raw: body.data, model: `claude-${body.meta?.model ?? 'sonnet'}`, costMicroUsd: 0 };
    } catch {
      return null;
    }
  },
};

// ── Cloud image-edit providers (P0 spike candidates) ─────────────────────────────────────────────
// Costs are ESTIMATES recorded in ai_usage_events (override per env once real invoices are known).
const timeoutMs = () => intEnv('STUDIO_IMAGE_TIMEOUT_MS', 120_000);
const extFor = (ct: string) => (ct === 'image/png' ? 'png' : 'jpg');

/** OpenAI Images edit (gpt-image-1): multipart photo + prompt → base64 image. */
export const openAiImageProvider: ImageEditProvider = {
  name: 'openai',
  async edit({ photo, contentType, prompt }) {
    const model = process.env.STUDIO_OPENAI_MODEL ?? 'gpt-image-1';
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { status: 'failed', error: 'OPENAI_API_KEY not set', model };
    try {
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', prompt);
      form.append('size', process.env.STUDIO_OPENAI_SIZE ?? '1536x1024');
      form.append('quality', process.env.STUDIO_OPENAI_QUALITY ?? 'medium');
      form.append('n', '1');
      form.append('image', new Blob([new Uint8Array(photo)], { type: contentType }), `photo.${extFor(contentType)}`);
      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(timeoutMs()),
      });
      const body = (await res.json().catch(() => ({}))) as {
        data?: { b64_json?: string }[]; error?: { code?: string; message?: string };
      };
      if (!res.ok) {
        const code = body.error?.code ?? '';
        if (code.includes('moderation') || code === 'content_policy_violation') return { status: 'blocked', reason: code, model };
        return { status: 'failed', error: `${res.status} ${body.error?.message ?? ''}`.trim().slice(0, 300), model };
      }
      const b64 = body.data?.[0]?.b64_json;
      if (!b64) return { status: 'failed', error: 'no image in response', model };
      return { status: 'ok', image: Buffer.from(b64, 'base64'), contentType: 'image/png', model, costMicroUsd: intEnv('STUDIO_OPENAI_COST_MICRO_USD', 63_000) };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message.slice(0, 300), model };
    }
  },
};

/** Google Gemini image model (generateContent with an inline photo) → inline image part. */
export const geminiImageProvider: ImageEditProvider = {
  name: 'gemini',
  async edit({ photo, contentType, prompt }) {
    const model = process.env.STUDIO_GEMINI_MODEL ?? 'gemini-2.5-flash-image';
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { status: 'failed', error: 'GEMINI_API_KEY not set', model };
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(timeoutMs()),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: contentType, data: photo.toString('base64') } }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        candidates?: { finishReason?: string; content?: { parts?: { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }[] } }[];
        promptFeedback?: { blockReason?: string };
        error?: { message?: string };
      };
      if (!res.ok) return { status: 'failed', error: `${res.status} ${body.error?.message ?? ''}`.trim().slice(0, 300), model };
      if (body.promptFeedback?.blockReason) return { status: 'blocked', reason: body.promptFeedback.blockReason, model };
      const cand = body.candidates?.[0];
      const part = cand?.content?.parts?.find((p) => p.inlineData?.data || p.inline_data?.data);
      const data = part?.inlineData?.data ?? part?.inline_data?.data;
      if (!data) {
        const reason = cand?.finishReason ?? '';
        if (/SAFETY|PROHIBITED|BLOCK/.test(reason)) return { status: 'blocked', reason, model };
        return { status: 'failed', error: `no image in response${reason ? ` (${reason})` : ''}`, model };
      }
      const mime = part?.inlineData?.mimeType ?? part?.inline_data?.mime_type ?? 'image/png';
      return { status: 'ok', image: Buffer.from(data, 'base64'), contentType: mime === 'image/jpeg' ? 'image/jpeg' : 'image/png', model, costMicroUsd: intEnv('STUDIO_GEMINI_COST_MICRO_USD', 39_000) };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message.slice(0, 300), model };
    }
  },
};

// ── Open image models ────────────────────────────────────────────────────────────────────────────

/**
 * Load a ComfyUI API-format workflow from api/assets/comfyui/workflows/<name>.json. Workflows mark
 * the inputs with exact-string placeholders `{{INPUT_IMAGE}}`, `{{PROMPT}}` and `{{SEED}}` (any node),
 * plus optional `{{STEPS}}` / `{{MEGAPIXELS}}` (env `STUDIO_COMFYUI_STEPS` default 8, `STUDIO_COMFYUI_MEGAPIXELS` default 0.5)
 * — patched by value so node ids can change freely when a workflow is re-exported.
 */
export function loadComfyWorkflow(name: string): Record<string, unknown> | null {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) return null;
  const dir = process.env.STUDIO_COMFYUI_WORKFLOW_DIR ?? (() => {
    try { return resolve(dirname(fileURLToPath(import.meta.url)), '../../../assets/comfyui/workflows'); }
    catch { return resolve(process.cwd(), 'assets/comfyui/workflows'); }
  })();
  try { return JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as Record<string, unknown>; }
  catch { return null; }
}

/** Speed knobs for the GTX 1070 (optional placeholders): fewer steps + a smaller latent cut render time. */
export function comfyTuning(): { steps: number; megapixels: number } {
  const steps = Math.round(Number(process.env.STUDIO_COMFYUI_STEPS ?? 8));
  const mp = Number(process.env.STUDIO_COMFYUI_MEGAPIXELS ?? 0.5);
  return {
    steps: Number.isFinite(steps) ? Math.min(50, Math.max(1, steps)) : 8,
    megapixels: Number.isFinite(mp) ? Math.min(2, Math.max(0.1, mp)) : 0.5,
  };
}

export function patchComfyWorkflow(
  wf: Record<string, unknown>,
  vals: { image: string; prompt: string; seed: number; steps?: number; megapixels?: number },
): {
  workflow: Record<string, unknown>; patched: { image: boolean; prompt: boolean };
} {
  const patched = { image: false, prompt: false };
  const tune = comfyTuning();
  const walk = (v: unknown): unknown => {
    if (v === '{{INPUT_IMAGE}}') { patched.image = true; return vals.image; }
    if (v === '{{PROMPT}}') { patched.prompt = true; return vals.prompt; }
    if (v === '{{SEED}}') return vals.seed;
    if (v === '{{STEPS}}') return vals.steps ?? tune.steps;
    if (v === '{{MEGAPIXELS}}') return vals.megapixels ?? tune.megapixels;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return { workflow: walk(wf) as Record<string, unknown>, patched };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Local ComfyUI (open weights on the host GPU — $0, slow on the GTX 1070). Upload photo → queue the
 * workflow → poll /history → fetch the first output image. Deadline = STUDIO_IMAGE_TIMEOUT_MS
 * (raise to ~900000 for local; the render job expires at 3600s).
 */
export const comfyUiImageProvider: ImageEditProvider = {
  name: 'comfyui',
  async edit({ photo, contentType, prompt }) {
    const wfName = process.env.STUDIO_COMFYUI_WORKFLOW ?? 'qwen-image-edit';
    const model = `comfyui/${wfName}`;
    const base = (process.env.STUDIO_COMFYUI_URL ?? 'http://127.0.0.1:8188').replace(/\/$/, '');
    const deadline = Date.now() + timeoutMs();
    const left = () => Math.max(1_000, deadline - Date.now());
    try {
      const wf = loadComfyWorkflow(wfName);
      if (!wf) return { status: 'failed', error: `workflow ${wfName} not found`, model };

      const form = new FormData();
      form.append('image', new Blob([new Uint8Array(photo)], { type: contentType }), `studio-${Date.now()}.${extFor(contentType)}`);
      form.append('overwrite', 'true');
      const up = await fetch(`${base}/upload/image`, { method: 'POST', body: form, signal: AbortSignal.timeout(left()) });
      if (!up.ok) return { status: 'failed', error: `upload ${up.status}`, model };
      const upBody = (await up.json()) as { name?: string; subfolder?: string };
      if (!upBody.name) return { status: 'failed', error: 'upload returned no name', model };
      const image = upBody.subfolder ? `${upBody.subfolder}/${upBody.name}` : upBody.name;

      const { workflow, patched } = patchComfyWorkflow(wf, { image, prompt, seed: Math.floor(Math.random() * 2 ** 31) });
      if (!patched.image || !patched.prompt) return { status: 'failed', error: 'workflow missing {{INPUT_IMAGE}}/{{PROMPT}}', model };

      const q = await fetch(`${base}/prompt`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow, client_id: 'jobsite-studio' }), signal: AbortSignal.timeout(left()),
      });
      const qBody = (await q.json().catch(() => ({}))) as { prompt_id?: string; error?: { message?: string } };
      if (!q.ok || !qBody.prompt_id) return { status: 'failed', error: `prompt ${q.status} ${qBody.error?.message ?? ''}`.trim().slice(0, 300), model };

      const pollMs = intEnv('STUDIO_COMFYUI_POLL_MS', 2_000);
      while (Date.now() < deadline) {
        await sleep(pollMs);
        const h = await fetch(`${base}/history/${qBody.prompt_id}`, { signal: AbortSignal.timeout(left()) });
        if (!h.ok) continue;
        const hist = (await h.json()) as Record<string, {
          status?: { status_str?: string; completed?: boolean };
          outputs?: Record<string, { images?: { filename: string; subfolder?: string; type?: string }[] }>;
        }>;
        const entry = hist[qBody.prompt_id];
        if (!entry) continue;
        if (entry.status?.status_str === 'error') return { status: 'failed', error: 'comfyui execution error', model };
        const img = Object.values(entry.outputs ?? {}).flatMap((o) => o.images ?? []).find((i) => (i.type ?? 'output') === 'output');
        if (!img) { if (entry.status?.completed) return { status: 'failed', error: 'no output image', model }; continue; }
        const qs = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? '', type: img.type ?? 'output' });
        const v = await fetch(`${base}/view?${qs}`, { signal: AbortSignal.timeout(left()) });
        if (!v.ok) return { status: 'failed', error: `view ${v.status}`, model };
        const ct = v.headers.get('content-type') ?? '';
        return { status: 'ok', image: Buffer.from(await v.arrayBuffer()), contentType: ct.includes('jpeg') ? 'image/jpeg' : 'image/png', model, costMicroUsd: 0 };
      }
      return { status: 'failed', error: 'timed out', model };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message.slice(0, 300), model };
    }
  },
};

/**
 * Hosted open models via Replicate (Qwen-Image-Edit / FLUX Kontext) — same weights as ComfyUI, seconds
 * not minutes, cents/image. `Prefer: wait` returns inline when fast; otherwise poll the prediction.
 * Input field names differ per model → STUDIO_REPLICATE_IMAGE_FIELD (default `image`; Kontext = `input_image`).
 */
export const replicateImageProvider: ImageEditProvider = {
  name: 'replicate',
  async edit({ photo, contentType, prompt }) {
    const model = process.env.STUDIO_REPLICATE_MODEL ?? 'qwen/qwen-image-edit';
    const key = process.env.REPLICATE_API_TOKEN;
    if (!key) return { status: 'failed', error: 'REPLICATE_API_TOKEN not set', model };
    const deadline = Date.now() + timeoutMs();
    const left = () => Math.max(1_000, deadline - Date.now());
    const auth = { Authorization: `Bearer ${key}` };
    try {
      const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'wait=60' },
        signal: AbortSignal.timeout(left()),
        body: JSON.stringify({ input: {
          prompt,
          [process.env.STUDIO_REPLICATE_IMAGE_FIELD ?? 'image']: `data:${contentType};base64,${photo.toString('base64')}`,
          output_format: 'png',
        } }),
      });
      type Pred = { id?: string; status?: string; output?: string | string[]; error?: string; urls?: { get?: string }; detail?: string };
      let pred = (await res.json().catch(() => ({}))) as Pred;
      if (!res.ok) return { status: 'failed', error: `${res.status} ${pred.detail ?? pred.error ?? ''}`.trim().slice(0, 300), model };
      while (pred.status && !['succeeded', 'failed', 'canceled'].includes(pred.status)) {
        if (Date.now() >= deadline || !pred.urls?.get) return { status: 'failed', error: 'timed out', model };
        await sleep(intEnv('STUDIO_REPLICATE_POLL_MS', 2_000));
        const p = await fetch(pred.urls.get, { headers: auth, signal: AbortSignal.timeout(left()) });
        if (p.ok) pred = (await p.json()) as Pred;
      }
      if (pred.status !== 'succeeded') {
        const err = pred.error ?? pred.status ?? 'unknown';
        if (/nsfw|safety|sensitive/i.test(err)) return { status: 'blocked', reason: err.slice(0, 200), model };
        return { status: 'failed', error: err.slice(0, 300), model };
      }
      const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (!url) return { status: 'failed', error: 'no output', model };
      const img = await fetch(url, { signal: AbortSignal.timeout(left()) });
      if (!img.ok) return { status: 'failed', error: `download ${img.status}`, model };
      const ct = img.headers.get('content-type') ?? '';
      return { status: 'ok', image: Buffer.from(await img.arrayBuffer()), contentType: ct.includes('jpeg') ? 'image/jpeg' : 'image/png', model, costMicroUsd: intEnv('STUDIO_REPLICATE_COST_MICRO_USD', 30_000) };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message.slice(0, 300), model };
    }
  },
};

export const IMAGE_PROVIDERS: Record<string, ImageEditProvider> = {
  mock: mockImageProvider, openai: openAiImageProvider, gemini: geminiImageProvider,
  comfyui: comfyUiImageProvider, replicate: replicateImageProvider,
};

export function getImageProvider(): ImageEditProvider | null {
  return IMAGE_PROVIDERS[process.env.STUDIO_IMAGE_PROVIDER ?? 'none'] ?? null;
}

export function getLlmProvider(): LlmProvider | null {
  switch (process.env.STUDIO_LLM_PROVIDER ?? 'none') {
    case 'mock': return mockLlmProvider;
    case 'ollama': return ollamaLlmProvider;
    case 'claude_bridge': return claudeBridgeLlmProvider;
    default: return null;
  }
}
