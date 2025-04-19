FROM python:3.11.12-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir virtualenv && \
    virtualenv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

RUN /venv/bin/python -m playwright install chromium

ENV PATH="/venv/bin:$PATH"
