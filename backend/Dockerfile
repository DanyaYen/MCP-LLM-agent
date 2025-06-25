FROM python:3.11-slim as builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv venv && uv pip install --no-cache-dir .

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/.venv ./.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY main.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
