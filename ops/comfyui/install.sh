#!/usr/bin/env bash
# User-space ComfyUI for Design Studio open-model testing (GTX 1070 / driver 535 → torch 2.7.1 cu126 (cu128+ drops Pascal; ComfyUI needs torch ≥2.6), Pascal sm_61).
# Installs to ~/.local/comfyui + FLUX.1 Kontext [dev] Q4_K_S GGUF (non-commercial weights — owner testing only).
# Optional: WITH_QWEN=1 also pulls Qwen-Image-Edit Q4 (Apache-2.0, ~20 GB more — check disk first).
set -euo pipefail
ROOT="${COMFY_ROOT:-$HOME/.local/comfyui}"
HF=https://huggingface.co
[ -d "$ROOT/.git" ] || git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git "$ROOT"
cd "$ROOT"
[ -d venv ] || python3 -m venv venv
. venv/bin/activate
pip install --no-cache-dir -q --upgrade pip
pip install --no-cache-dir -q torch==2.7.1 torchvision==0.22.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cu126
pip install --no-cache-dir -q -r requirements.txt
[ -d custom_nodes/ComfyUI-GGUF ] || git clone --depth 1 https://github.com/city96/ComfyUI-GGUF.git custom_nodes/ComfyUI-GGUF
pip install --no-cache-dir -q -r custom_nodes/ComfyUI-GGUF/requirements.txt
# Triton kernels need sm_70+ and Python.h (python3-dev) to build — useless on Pascal; comfy_kitchen falls back to eager.
pip uninstall -y -q triton || true
python -c "import torch; print('torch', torch.__version__, 'cuda', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else '-')"

get() { # url dest
  [ -s "$2" ] && { echo "have $(basename "$2")"; return; }
  mkdir -p "$(dirname "$2")"; echo "fetch $(basename "$2")"
  curl -fL --retry 3 -C - -o "$2.part" "$1" && mv "$2.part" "$2"
}
get "$HF/QuantStack/FLUX.1-Kontext-dev-GGUF/resolve/main/flux1-kontext-dev-Q4_K_S.gguf" models/unet/flux1-kontext-dev-Q4_K_S.gguf
get "$HF/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" models/text_encoders/clip_l.safetensors
get "$HF/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors" models/text_encoders/t5xxl_fp8_e4m3fn_scaled.safetensors
get "$HF/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors" models/vae/ae.safetensors
if [ "${WITH_QWEN:-0}" = 1 ]; then
  get "$HF/QuantStack/Qwen-Image-Edit-GGUF/resolve/main/Qwen_Image_Edit-Q4_K_S.gguf" models/unet/Qwen_Image_Edit-Q4_K_S.gguf
  get "$HF/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors" models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors
  get "$HF/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors" models/vae/qwen_image_vae.safetensors
fi
echo INSTALL_DONE
