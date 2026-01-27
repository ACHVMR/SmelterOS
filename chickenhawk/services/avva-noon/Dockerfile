FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY . .

# Create directories for logs and reports
RUN mkdir -p logs reports

# Expose port
EXPOSE 8080

# Run the Interactions API
CMD ["uvicorn", "interactions_api:app", "--host", "0.0.0.0", "--port", "8080"]
