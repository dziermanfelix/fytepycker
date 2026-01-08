# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files for dependency installation
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Python runtime
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
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
    git \
    unzip \
    libnss3 \
    libgdk-pixbuf2.0 \
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
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY backend/requirements.txt ./

# Create virtual environment and install Python dependencies
RUN pip install --no-cache-dir virtualenv && \
    virtualenv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Copy built frontend from builder stage (overwrites any existing frontend/static)
COPY --from=frontend-builder /app/frontend/static /app/frontend/static

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright
ENV PATH="/venv/bin:$PATH"

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["web"]
