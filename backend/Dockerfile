FROM python:3.12-slim

# Install system dependencies for WeasyPrint and Postgres
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies via uv
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Start the application (create_all in lifespan handles table creation)
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
