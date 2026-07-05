# ===== Designora Backend (FastAPI) =====
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Tizim bog'liqliklari (psycopg2, cryptography build uchun)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Bog'liqliklarni alohida qatlamda o'rnatamiz (kesh uchun)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Ilova kodi
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
