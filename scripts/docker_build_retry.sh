#!/usr/bin/env bash
# ===== Designora CI — Docker image build (retry bilan) =====
#
# Ishlatish:
#   bash scripts/docker_build_retry.sh <tag> <context>
#
# Nega retry kerak: base image tortib olish registry tomonidagi vaqtinchalik
# uzilishlarga bog'liq. Lekin qat'iy qisqa interval bilan urinish foyda
# bermaydi, shuning uchun bu yerda eksponensial backoff va jitter ishlatiladi.
#
# Eslatma: eski inline loop oxirgi muvaffaqiyatsiz urinishdan keyin ham 15s
# kutardi. Bu yerda oxirgi urinishdan keyin darrov chiqiladi.

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Ishlatish: $0 <tag> <context>" >&2
  exit 2
fi

TAG="$1"
CONTEXT="$2"
ATTEMPTS="${DOCKER_BUILD_ATTEMPTS:-4}"

delay=10

for attempt in $(seq 1 "$ATTEMPTS"); do
  if docker build -t "$TAG" "$CONTEXT"; then
    printf '[docker-build] %s tayyor (urinish %s/%s)\n' "$TAG" "$attempt" "$ATTEMPTS"
    exit 0
  fi

  if [ "$attempt" -eq "$ATTEMPTS" ]; then
    break
  fi

  jitter=$((RANDOM % 10))
  wait_for=$((delay + jitter))
  echo "::warning::${TAG} build muvaffaqiyatsiz (urinish ${attempt}/${ATTEMPTS}), ${wait_for}s dan keyin qayta urinamiz"
  sleep "$wait_for"
  delay=$((delay * 2))
done

echo "::error::${TAG} image ${ATTEMPTS} urinishdan keyin ham qurilmadi" >&2
exit 1
