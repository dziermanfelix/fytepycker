FROM python:3.11.12-slim

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y \
    libx11-xcb1 \
    libfontconfig1 \
    libx11-6 \
    libgbm1 \
    libasound2 \
    libnss3 \
    libxcomposite1 \
    libxrandr2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libappindicator3-1 \
    libnspr4 \
    libxss1 \
    libnss3-dev \
    libgdk-pixbuf2.0-0 \
    libgdk-pixbuf2.0-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir virtualenv && \
    virtualenv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

RUN /venv/bin/python -m playwright install chromium

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

ENV PATH="/venv/bin:$PATH"
