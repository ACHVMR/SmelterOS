from fastapi import FastAPI
import os

app = FastAPI(title="SmelterOS Core Agent", version="0.1.0")

@app.get("/")
def read_root():
    return {"status": "online", "service": "core-agent", "version": "v2"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
