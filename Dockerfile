FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    API_HOST=0.0.0.0 \
    API_PORT=8100 \
    WS_HOST=0.0.0.0 \
    WS_PORT=9222 \
    FLOW_AGENT_DIR=/app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY agent ./agent
COPY skills ./skills

RUN mkdir -p /app/output /app/output/_shared/tts_templates /app/output/_shared/music

EXPOSE 8100 9222

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8100/health || exit 1

CMD ["python", "-m", "agent.main"]
