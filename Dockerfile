# Use the latest official Playwright image with Python & browsers built in
FROM mcr.microsoft.com/playwright/python:latest

# Set working directory inside container
WORKDIR /app

# Copy your application code
COPY . /app

# Install app dependencies
RUN pip install -r requirements.txt

# Install additional browsers
RUN python -m playwright install
