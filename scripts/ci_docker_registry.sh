#!/usr/bin/env bash
# ===== Designora CI — Docker registry ishonchliligi =====
#
# Muammo: GitHub runner'laridan `registry-1.docker.io` ga to'g'ridan-to'g'ri
# murojaat vaqti-vaqti bilan uzilib qoladi:
#
#   ERROR: failed to do request: Head
#   "https://registry-1.docker.io/v2/library/python/manifests/3.12-slim":
#   dial tcp <ip>:443: i/o timeout
#   ERROR: failed to solve: DeadlineExceeded
#
# Bu kod xatosi emas, tarmoq/rate-limit muammosi. Lekin `docker build`ni
# bir xil endpointga qayta-qayta urish yordam bermaydi: har urinish
# BuildKit'ning o'z deadline'ini yoqib yuboradi va job baribir yiqiladi.
#
# Yechim ikki qatlamli:
#   1. `mirror.gcr.io` registry mirror sifatida qo'shiladi. Docker Hub'ning
#      rasmiy (library/*) imagelari shu mirror orqali tortiladi. Mirror'da
#      image topilmasa, daemon avtomatik docker.io ga qaytadi.
#   2. Base imagelar build'dan oldin eksponensial backoff bilan tortib
#      olinadi, shunda build lokal kesh ustida ishlaydi.
#
# Ishlatish:
#   bash scripts/ci_docker_registry.sh python:3.12-slim node:22-alpine

set -euo pipefail

MIRROR="${DOCKER_REGISTRY_MIRROR:-https://mirror.gcr.io}"
DAEMON_CONFIG="/etc/docker/daemon.json"
PULL_ATTEMPTS=5

log() {
  printf '[docker-registry] %s\n' "$1"
}

configure_mirror() {
  log "Registry mirror sozlanmoqda: ${MIRROR}"
  sudo mkdir -p /etc/docker

  if [ -f "$DAEMON_CONFIG" ]; then
    # Mavjud konfiguratsiyani yo'qotmaymiz, faqat mirror qo'shamiz.
    sudo cp "$DAEMON_CONFIG" "${DAEMON_CONFIG}.bak"
    sudo jq --arg mirror "$MIRROR" \
      '."registry-mirrors" = ((."registry-mirrors" // []) + [$mirror] | unique)' \
      "${DAEMON_CONFIG}.bak" | sudo tee "$DAEMON_CONFIG" >/dev/null
  else
    printf '{\n  "registry-mirrors": ["%s"]\n}\n' "$MIRROR" \
      | sudo tee "$DAEMON_CONFIG" >/dev/null
  fi

  sudo systemctl restart docker

  for _ in $(seq 1 30); do
    if docker info >/dev/null 2>&1; then
      log "Docker daemon mirror bilan qayta ishga tushdi."
      return 0
    fi
    sleep 2
  done

  echo "::error::Docker daemon mirror sozlamasidan keyin qayta ishga tushmadi." >&2
  return 1
}

pull_with_backoff() {
  local image="$1"
  local delay=5
  local attempt
  local jitter
  local wait_for

  for attempt in $(seq 1 "$PULL_ATTEMPTS"); do
    if docker pull --quiet "$image" >/dev/null 2>&1; then
      log "Tayyor: ${image} (urinish ${attempt}/${PULL_ATTEMPTS})"
      return 0
    fi

    if [ "$attempt" -eq "$PULL_ATTEMPTS" ]; then
      break
    fi

    jitter=$((RANDOM % 5))
    wait_for=$((delay + jitter))
    echo "::warning::${image} tortib olinmadi (urinish ${attempt}/${PULL_ATTEMPTS}), ${wait_for}s dan keyin qayta urinamiz"
    sleep "$wait_for"
    delay=$((delay * 2))
  done

  echo "::error::Base image ${PULL_ATTEMPTS} urinishdan keyin ham tortib olinmadi: ${image}" >&2
  return 1
}

main() {
  configure_mirror

  if [ "$#" -eq 0 ]; then
    log "Oldindan tortiladigan image berilmadi."
    return 0
  fi

  local image
  for image in "$@"; do
    pull_with_backoff "$image"
  done

  log "Barcha base imagelar lokal keshda."
}

main "$@"
