FROM python:3.12-slim
WORKDIR /app
COPY fastapi_app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY fastapi_app /app/fastapi_app
EXPOSE 8080
CMD ["uvicorn", "fastapi_app.main:app", "--host", "0.0.0.0", "--port", "8080"]
