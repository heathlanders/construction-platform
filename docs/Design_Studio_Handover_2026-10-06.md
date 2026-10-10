# Design Studio — Handover (paused 2026-10-06)

> Read this first when resuming Design Studio work. Branch **`feat/client-visualizer`** (draft PR #69).
> Earlier context: `docs/Design_Studio_Session_Wrapup.md` (P1–P4 build) and
> `docs/Design_Studio_Testing_Providers_Plan.md` (the plan this session executed — Steps 1–2 done).

## Where it stands

| Area | State |
|---|---|
| P1a–P4 (framework, `concrete_flatwork`, API, web, proposal + convert) | Built, tested, on the branch (migrations 0045–0047) |
| **Assistant via Claude subscription** (`STUDIO_LLM_PROVIDER=claude_bridge`) | **LIVE** — host bridge `ops/claude-bridge/`, systemd user unit `jobsite-claude-bridge` (auto-starts on boot). Verified in the product: guide ~3 s, photo assess ~4 s, bilingual reasons |
| **Local open image model** (ComfyUI + FLUX Kontext Q4) | **WORKS, but PAUSED** — installed at `~/.local/comfyui`, unit `jobsite-comfyui` **disabled** to free RAM/VRAM |
| Replicate adapter (`STUDIO_IMAGE_PROVIDER=replicate`) | Code + tests only — needs the owner's `REPLICATE_API_TOKEN` |
| `.env` image provider | still **`mock`** (nothing real renders in the product yet) |
| Local CI | green at `a52fca2` (722 API tests + api/web tsc). Not re-run on the docs/ops-only commits after it |

Commits this session: `a52fca2` (providers + bridge + ComfyUI ops), `dbb5748` (ComfyUI install fixes), this doc.
Branch is **ahead of origin** — push when ready (`git push`).

## The render test (proof it works)

- Photo: CC BY-SA backyard (Wikimedia "Backyard of historic Bovaird House") in `~/studio-spike-photos/`.
- Prompt = the product's compiled `concrete_flatwork` prompt (broom patio, gray).
- Result `~/.local/comfyui/output/studio-kontext_00001_.png`: patio added **with control joints**, building /
  plow / flowers / trees unchanged, shadows consistent. **Owner liked it.** Miss: surface looks smooth, not broom.
- **Speed: ~38 min/image** on the GTX 1070 — Pascal has no fast bf16/fp16 (ComfyUI casts to fp32) and the
  model only partly fits (3.4 GB on GPU, 3.1 GB offloaded and re-streamed every step). Fine for an occasional demo,
  not for interactive use.

## Gotchas learned (already fixed in `ops/comfyui/install.sh`)

- Current ComfyUI needs **torch ≥ 2.6** (`comfy_kitchen`). Use **torch 2.7.1 `cu126`** — `cu128`+ builds drop
  Pascal; driver 535 runs cu126 via minor-version compatibility. `sm_61` runs the `sm_60` build.
- **Uninstall `triton`** — needs sm_70+ and `Python.h` (python3-dev, no sudo here). comfy_kitchen falls back to eager.
- A hard reset mid-install corrupted the venv (torch import → `Bus error`). Fix: `rm -rf ~/.local/comfyui/venv`
  and rerun the script. The script skips an existing venv, so it will NOT repair a corrupt one by itself.
- The spike's `STUDIO_IMAGE_TIMEOUT_MS=1800000` (30 min) was too short — the job kept running in ComfyUI and
  finished ~8 min later. Use ≥ 2700000 for full-quality local renders, or speed the workflow up (below).

## ⚠️ Machine limits (read before starting anything heavy)

The box (i5-4670K, 16 GB RAM, 4 GB swap, GTX 1070 8 GB) **froze and was hard-reset** this session: four Claude
sessions were running heavy jobs at once (pip torch install, ~16 GB of downloads, Docker CI, a Flutter test suite).
A staged load test afterwards (CPU + disk + 6 GB RAM) was stable at ≤ 69 °C with no throttling, so the hardware
is fine — **the cause was memory exhaustion from stacked workloads.**

- Run **one heavy job at a time** across ALL sessions (installs, `ci-local.sh`, Flutter tests, builds, renders).
- ComfyUI alone pushes ~3 GB into swap during a render — stop other heavy work while it runs, and stop
  ComfyUI (`systemctl --user stop jobsite-comfyui`) when done. It shares the GPU with Ollama; 8 GB won't hold both.
- Black-box logger: `~/crashdiag/logger.py` → `~/crashdiag/sensors.log` (1 line/s, fsync'd; user unit
  `crashdiag-logger`). If the box freezes again, the tail shows temps / mem / swap / GPU right before it.
  Stop with `systemctl --user stop crashdiag-logger` if you no longer want it.

## Update 21:26 — resume step 1 DONE (commit `8005add`)

8 steps + 0.5 MP downscale (`STUDIO_COMFYUI_STEPS` / `STUDIO_COMFYUI_MEGAPIXELS`, defaults 8 / 0.5):
**420 s render (7 min) vs ~38 min**, output 832×624. Building/trees/flowers intact, slab reads as concrete with a
fine broom texture (stippled more than parallel lines). Miss: the slab fills the whole lawn — the prompt carries no
size, so a 12×16 patio looks like a parking lot. Next prompt idea: derive a size phrase ("a small patio about the
size of a one-car garage") from `area_sf`. Report: `~/studio-spike-photos/spike-2026-10-06T21-19-15-432Z/`.

**Watchdog lesson:** guard on *available RAM*, not swap. Model load pushes swap to ~3.5 GB while ~10 GB RAM stays
available (cold pages from reading 12 GB of weights) — a 3.5 GB swap cap aborted two healthy runs. Safe guard:
abort if MemAvailable < 2 GB, swap > 4 GB, or GPU > 85 °C. Peak this run: GPU 80 °C, available RAM ≥ 7.5 GB.

## Update 2026-10-07 00:41 — size/placement prompt + resume step 2 DONE

- **Size + placement wording** (`63f09ca`): `intake/scale.ts` turns area/linear answers into dimensions + an
  everyday yardstick; `concrete_flatwork` v2 adds an optional "Where does it go in your photo?" question,
  existing-surface wording, and a "only that area changes" suffix. Same photo now renders a patio-sized slab
  beside the shed instead of paving the whole lawn.
- **Rendered through the real product**: `api/src/scripts/smoke-studio.ts <photo>` drives contractor invite →
  magic link → client answers → upload + scan → `studio.render` job on the api container → client gallery +
  contractor request page + `ai_usage_events` row. Passed in 395 s with `STUDIO_IMAGE_PROVIDER=comfyui`
  (`STUDIO_COMFYUI_URL=http://host.docker.internal:8188`, image rebuilt first — the api image has no source mount).
  `.env` switched back to `mock` afterwards; the ComfyUI vars stay in `.env` for next time.
- Seen in that render: the slab sits on the grass with a thick exposed edge (a real patio is near grade) —
  candidate prompt fix: "flush with the surrounding ground". **Fixed in `bf4eb3f`** — re-render (428 s,
  `~/studio-spike-photos/spike-2026-10-07T02-07-11-291Z/`) shows the slab at grade, grass meeting the edge.

## Update 2026-10-07 17:20 — local render quality: stopped here (owner decision)

- **Fast vs quality settings.** Fast (0.5 MP / 8 steps, ~7 min) shows a grid artifact over the whole image and a
  near-white slab — fine for checking size/placement, not for looks. Quality (`STUDIO_COMFYUI_STEPS=20
  STUDIO_COMFYUI_MEGAPIXELS=1.0`, ~37 min) is clean: real gray, sharp grass/brick, shadows across the slab.
- **Remaining miss: the slab sits ON the grass** with a visible side edge (5–6" → ~2–3" after `b2ab7ec`'s "level with
  the grass, no raised or exposed slab edge"). Broom texture never shows; joints come and go between seeds.
  Negative wording likely backfires on diffusion models — untried idea: positive phrasing ("the lawn grows right up
  to the concrete and the grass overlaps its edge") + "saw-cut control joints".
- **Owner decision: accept the local model's limits and stop tuning.** Local renders stay owner-testing only; real
  client quality is expected from a hosted model (Replicate / OpenAI / Gemini — needs a key).
- ⚠️ Before a 1 MP render, clear swap (`sudo swapoff -a && sudo swapon -a`) — model load adds ~2.5 GB of swap and a
  run that started at 1.6 GB tripped the 4 GB guard. Check no other heavy job (e.g. a Gradle build) is running.
- Reports: `~/studio-spike-photos/spike-2026-10-07T05-50-01-411Z/` (quality, nearly-flush wording) and
  `…T16-42-00-766Z/` (quality, level-with-grass wording).

## Resume plan (next session)

**0. Start clean** — confirm nothing else heavy is running, then:
```bash
cd ~/construction-platform && git checkout feat/client-visualizer && git pull
systemctl --user enable --now jobsite-comfyui     # only when you're about to render
curl -s http://172.17.0.1:8188/system_stats | head -c 200
```

**1. Faster local renders (target 8–12 min).** In `api/assets/comfyui/workflows/flux-kontext.json`:
KSampler `steps` 20 → 8, and drop resolution (insert an `ImageScale`/`ImageScaleToTotalPixels` at ~0.5 MP
before `VAEEncode`, or downscale in the provider before upload). Ideally make steps / megapixels env-driven
(`STUDIO_COMFYUI_STEPS`, `STUDIO_COMFYUI_MEGAPIXELS`) with placeholders like `{{STEPS}}` — the guard test in
`studio-providers.test.ts` checks the placeholder set, so update it. Try "visible broom texture lines" in the
`concrete_flatwork` broom option's prompt fragment for the smooth-finish miss. Re-run the spike:
```bash
cd api && STUDIO_COMFYUI_URL=http://172.17.0.1:8188 STUDIO_COMFYUI_WORKFLOW=flux-kontext \
  STUDIO_IMAGE_TIMEOUT_MS=2700000 npx tsx --require dotenv/config \
  src/scripts/studio-provider-spike.ts ~/studio-spike-photos --providers comfyui --fixture 0
```

**2. Render through the real product** (the Definition-of-Done item still open):
set `.env` `STUDIO_IMAGE_PROVIDER=comfyui`, `STUDIO_COMFYUI_URL=http://172.17.0.1:8188`,
`STUDIO_IMAGE_TIMEOUT_MS=2700000` → `docker compose up -d api` → client wizard → add photo → Render → confirm the
`studio.render` job completes, the image shows in the client gallery and on the contractor request page, and an
`ai_usage_events` row is written. ⚠️ the pg-boss job expiry must exceed the render time — check `lib/queue.ts`
for `studio.render`.

**3. Hosted option** — if the owner provides `REPLICATE_API_TOKEN`, run the spike with `--providers comfyui,replicate`
and compare quality / seconds / real cost; record results in `docs/Client_Visualizer_v1_0.md` ("P0 results").

**4. Close out** — `scripts/ci-local.sh --report` on the final commit, update PR #69's description.

## Still waiting on the owner (unchanged)

Image provider choice for clients (local is owner-testing only — FLUX Kontext [dev] weights are non-commercial;
the Claude bridge uses the owner's subscription) · tier pricing / real caps · tunnel route `files.thejobsite.app`
for remote uploads · locking T-65 · merging PR #69.
