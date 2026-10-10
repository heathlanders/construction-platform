# Design Studio — Testing Providers Plan (next session)
**Created:** 2026-10-06 · **Branch:** `feat/client-visualizer` (continue on it — this is part of PR #69)
**Read first:** `docs/Design_Studio_Session_Wrapup.md` (state of the feature) · skill `design-studio`

## Goal
Test Design Studio with **real AI** at little or no cost, **for the owner's own testing only** (not clients):
1. **Assistant + photo check** (the LLM half) → run on the owner's **Claude subscription** via a host bridge.
2. **Concept pictures** (the image half) → try **open image models** (free on the local GPU, then hosted for speed).
3. Compare everything with the existing spike script and pick a path.

Claude does NOT generate images — it can only be the LLM half. Today: LLM = local Ollama (`qwen2.5vl:7b`),
images = `mock` (echoes the photo).

## Constraints / facts to respect
- Host GPU: **GTX 1070, 8 GB, NVIDIA driver 535** (no CUDA ≥12.3; Ollama uses Vulkan). No tensor cores → open
  image models will be SLOW locally (minutes/image). Fine for testing, not for clients.
- Ollama shares that GPU — stop or idle it while running a local image model (8 GB won't hold both).
- Provider seam already exists: `api/src/lib/studio/providers.ts` (`ImageEditProvider`, `LlmProvider`,
  `IMAGE_PROVIDERS`, `getImageProvider()/getLlmProvider()` chosen by `STUDIO_IMAGE_PROVIDER` / `STUDIO_LLM_PROVIDER`).
  Rules: providers **never throw** (return null / `{status:'failed'|'blocked'}`), callers run them OUTSIDE DB
  transactions, every call is metered to `ai_usage_events`.
- AI output is validated by `validateAiReply()` (schema built from the trade's steps) — a new LLM provider only has
  to return the model's JSON; validation/stripping already happens.
- Containers reach the host via `host.docker.internal` (compose `extra_hosts` already set for the api service).
- Subscription terms: owner's personal testing only. Before real clients use it → API key (`STUDIO_LLM_PROVIDER` swap).

---

## Step 1 — Claude subscription bridge (assistant + photo check)

Model it on **`/home/user/ecommerce-saas/ops/claude-bridge/`** (`bridge.py`, `README.md`, systemd unit) — same
security posture, but a GENERIC endpoint (the FlipStack one is hard-wired to its item prompt + storage folder).

**Create** `ops/claude-bridge/` in this repo:
- `bridge.py` — stdlib HTTP server. `POST /structured` body:
  `{system: str, user: str, schema: object, images?: [{data_b64, content_type}]}` → writes images to a temp dir
  (`photo1.jpg`…, max 4, jpg/png only, size-capped), runs:
  `claude -p "<system + user + 'Photos in current directory: …' + 'Return the JSON object only.'>"`
  `--model sonnet --tools Read --allowedTools Read --strict-mcp-config --setting-sources "" --output-format json --json-schema <schema> --max-turns 6`
  in that temp dir with `ANTHROPIC_API_KEY` removed from env (force the subscription token). Return
  `{data: structured_output, meta:{duration_s, model}}`. Copy FlipStack's error mapping: usage limit → **429**,
  expired login → **503**, timeout → 504, other → 502. `GET /health`.
  No WebSearch needed here (Read only). Bind `172.17.0.1` (docker0 only), port **8789** (8788 is FlipStack's),
  bearer `BRIDGE_TOKEN`, `MAX_CONCURRENCY` 2, `RUN_TIMEOUT` 180.
- `jobsite-claude-bridge.service` (user systemd unit) + `README.md` (install: `claude setup-token` →
  `~/.config/jobsite/claude-bridge.env` with `BRIDGE_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`; `loginctl enable-linger`;
  enable unit; health curl). Include the "personal use only" terms note.

**App side** (`api/src/lib/studio/providers.ts`):
- `claudeBridgeLlmProvider` (`name: 'claude_bridge'`): POST `${CLAUDE_BRIDGE_URL}/structured` with
  `Authorization: Bearer ${CLAUDE_BRIDGE_TOKEN}`, images base64'd (they're already metadata-stripped by the caller),
  `AbortSignal.timeout(STUDIO_LLM_TIMEOUT_MS)`; 200 → `{raw: data, model: 'claude-'+meta.model, costMicroUsd: 0}`;
  anything else / network error → `null` (wizard carries on; 429/503 just mean "no suggestions now").
- Register in `getLlmProvider()`: `case 'claude_bridge'`.
- Env: `STUDIO_LLM_PROVIDER=claude_bridge`, `CLAUDE_BRIDGE_URL=http://host.docker.internal:8789`,
  `CLAUDE_BRIDGE_TOKEN=…` (api service reads `.env`).
- Optional: on a 429 trip the existing circuit breaker (`recordProviderResult`) so we stop hammering.

**Tests** (`api/src/test/studio-providers.test.ts`, fetch mocked): request shape (auth header, schema, base64
images), 200 → raw passthrough, 429/503/500/network → null.
**Verify live:** rebuild api; in the wizard type a request in Spanish on the "Look and finish" step → suggestions
with Spanish reasons; "Check my photos" on the site step → `photo_estimate` suggestions. Compare quality vs Ollama
(same message both ways).

---

## Step 2 — Local open image models via ComfyUI (free, slow)

Candidates (instruction-edit = no mask needed, matches the current wizard):
| Model | License | Note |
|---|---|---|
| **Qwen-Image-Edit** | Apache 2.0 (commercial OK) | Best fit long-term; ~20B → needs a GGUF quant + RAM offload on 8 GB; very slow |
| **FLUX.1 Kontext [dev]** | non-commercial weights | Excellent edits; GGUF Q4/Q5 fits 8 GB-ish; minutes/image |
| SDXL inpainting (+ ControlNet depth) | OpenRAIL++ | Fits 8 GB, 1–3 min; **needs a mask** we don't capture yet (future `mask` field type) |

**Setup (user-space, mirror the Ollama install):** ComfyUI in `~/.local/comfyui` (Python venv; PyTorch build that
still supports Pascal sm_61 + CUDA ≤12.2 for driver 535 — check before installing), ComfyUI-GGUF custom node, model
weights under `models/`. Run `python main.py --listen 0.0.0.0 --port 8188 --lowvram`. Firewall 8188 off the LAN.
Save one working **API-format workflow JSON per model** into `ops/comfyui/workflows/{qwen-image-edit,flux-kontext}.json`
(export via "Save (API)"), with placeholders for the input image + prompt.

**App side:** `comfyUiImageProvider` (`name: 'comfyui'`) in `providers.ts`:
1. `POST /upload/image` (multipart) with the photo → filename.
2. Load workflow `STUDIO_COMFYUI_WORKFLOW` (path under `ops/comfyui/workflows/`, mounted/readable by the api
   container — or embed via env/JSON file in the image), patch the LoadImage node's filename + the prompt node's text.
3. `POST /prompt {prompt: workflow}` → `prompt_id`; poll `GET /history/{prompt_id}` until outputs (timeout
   `STUDIO_IMAGE_TIMEOUT_MS`, raise to ~900000 for local); `GET /view?filename=…` → image bytes.
4. `{status:'ok', model: <workflow name>, costMicroUsd: 0}`; any failure → `{status:'failed'}`.
Env: `STUDIO_IMAGE_PROVIDER=comfyui`, `STUDIO_COMFYUI_URL=http://host.docker.internal:8188`,
`STUDIO_COMFYUI_WORKFLOW=qwen-image-edit`. NOTE the render job's pg-boss expiry (3600s) and the worker's
"never rethrow" — a slow local render is fine.
**Tests:** fetch-mocked upload → prompt → history → view sequence; timeout → failed.

---

## Step 3 — Hosted open models (fast, cents/image) — optional for testing
Same open weights, hosted: **Replicate** or **fal.ai** (both serve Qwen-Image-Edit and FLUX Kontext). One adapter,
`replicateImageProvider` (or `fal`), behind the same interface: create prediction with image (data URI) + prompt →
poll → download output. Env `REPLICATE_API_TOKEN` (or `FAL_KEY`), `STUDIO_REPLICATE_MODEL`. Record real cost per
image in `STUDIO_*_COST_MICRO_USD`. Needs the owner's key — skip if not wanted.

---

## Step 4 — Run the comparison
1. Owner drops ~10 real patio/driveway photos in a folder (any phone photos of yards).
2. `cd api && npx tsx --require dotenv/config src/scripts/studio-provider-spike.ts <dir> --providers comfyui,openai,gemini,replicate --fixture 1`
   (the script picks providers from `IMAGE_PROVIDERS` and skips ones without keys — **extend its key check** for
   `comfyui` (URL instead of key) and `replicate`).
3. Open `<dir>/spike-*/index.html`; judge: realistic? house/yard unchanged? work placed where it belongs?
   latency + cost. Write findings into `docs/Client_Visualizer_v1_0.md` ("P0 results") and pick the provider.

## Definition of done
- Assistant + photo check run on the Claude subscription in the live wizard (with Ollama still selectable).
- At least one open image model renders a real concept picture through the product (worker → client gallery).
- Spike report produced; decision + numbers recorded in the spec; `.env` set to the chosen providers.
- Tests for each new adapter; `scripts/ci-local.sh --report` green; PR #69 description updated.

## Out of scope (still waiting on the owner)
Tier pricing / real caps · tunnel route `files.thejobsite.app` for remote uploads · T-11 User-Agent gap on public
auth routes · locking T-65 · merging PR #69.
