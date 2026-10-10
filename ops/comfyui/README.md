# ComfyUI — open image models for Design Studio (owner testing)

Runs open-weight image-edit models on the host GPU so concept pictures cost $0 while testing.
**GTX 1070 / 8 GB / driver 535** → torch 2.5.1+cu121 (last line of wheels that still ships Pascal sm_61),
`--lowvram`, minutes per image. Fine for testing, not for clients.

| Workflow (`api/assets/comfyui/workflows/`) | Weights | License |
|---|---|---|
| `flux-kontext` (default install) | FLUX.1 Kontext [dev] Q4_K_S GGUF + clip_l + t5xxl fp8 + ae | **non-commercial** — testing only |
| `qwen-image-edit` (`WITH_QWEN=1`, ~20 GB more) | Qwen-Image-Edit Q4_K_S GGUF + qwen2.5-vl fp8 + qwen vae | Apache-2.0 |

Workflows are ComfyUI **API-format** JSON with exact-string placeholders `{{INPUT_IMAGE}}`, `{{PROMPT}}`,
`{{SEED}}` — the `comfyui` provider (`api/src/lib/studio/providers.ts`) patches them by value, so a
re-exported workflow ("Save (API)") only needs those three strings put back.

## Install / run

```bash
ops/comfyui/install.sh                       # ~16 GB; WITH_QWEN=1 for Qwen too
cp ops/comfyui/jobsite-comfyui.service ~/.config/systemd/user/
systemctl --user daemon-reload && systemctl --user enable --now jobsite-comfyui
curl -s http://172.17.0.1:8188/system_stats | head -c 300
```

Ollama shares the GPU — 8 GB won't hold both. Stop ComfyUI (`systemctl --user stop jobsite-comfyui`)
before blueprint vision runs, or idle Ollama before rendering.

App side (`.env`):
```
STUDIO_IMAGE_PROVIDER=comfyui
STUDIO_COMFYUI_URL=http://host.docker.internal:8188
STUDIO_COMFYUI_WORKFLOW=flux-kontext
STUDIO_IMAGE_TIMEOUT_MS=900000
```
then `docker compose up -d api`. The render job runs in the worker (never rethrows); pg-boss expires it at 3600s.
