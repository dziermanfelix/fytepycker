FROM python:3.13-slim

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg-dev \
    zlib1g-dev \
    libmagic1 \
    curl \
    git \
    unzip \
    libnss3 \
    libgdk-pixbuf2.0-dev \
    libglib2.0-0 \
    libx11-xcb1 \
    libx11-6 \
    libxcomposite1 \
    libxrandr2 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libappindicator3-1 \
    libnspr4 \
    libxss1 \
    libgbm1 \
    libfontconfig1 \
    libnss3-dev \
    libgdk-pixbuf2.0-0 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir virtualenv && \
    virtualenv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

RUN /venv/bin/python -m playwright install chromium

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

ENV PATH="/venv/bin:$PATH"

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
