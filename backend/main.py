from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
import os
import json
import uuid
from datetime import datetime
import tempfile

from fit_spectrum import process_spectrum
from summarize import MossbauerInterpreter, generate_detailed_report, get_anthropic_client

app = FastAPI(title="Mössbauer Spectrum Analyzer API", version="2.0.0")

# Configure CORS with security in mind
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Request/Response models
class AnalysisOptions(BaseModel):
    model_type: str = "lorentzian"
    n_sites: Optional[int] = None
    baseline_correction: bool = True
    custom_params: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    plot_data: Optional[List[Dict[str, Any]]] = None
    residuals_plot: Optional[List[Dict[str, Any]]] = None
    plot_layout: Optional[Dict[str, Any]] = None
    residuals_layout: Optional[Dict[str, Any]] = None
    fit_results: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    report_id: Optional[str] = None

# In-memory storage for reports (use Redis in production)
reports_storage = {}

@app.get("/")
async def root():
    return {
        "message": "Mössbauer Spectrum Analyzer API",
        "version": "2.0.0",
        "endpoints": {
            "POST /analyze": "Analyze a Mössbauer spectrum",
            "GET /report/{report_id}": "Get analysis report",
            "GET /health": "Health check"
        }
    }

@app.post("/set-api-key")
async def set_api_key(api_key: str = Form(...)):
    """Set the Anthropic API key for the session"""
    if not api_key or not api_key.startswith('sk-'):
        raise HTTPException(400, "Invalid API key format")
    
    # Set the API key as environment variable for this session
    os.environ["ANTHROPIC_API_KEY"] = api_key
    
    # Test the API key
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        # Test with a simple message
        client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=10,
            messages=[{"role": "user", "content": "Test"}]
        )
        return {"success": True, "message": "API key set successfully"}
    except Exception as e:
        os.environ.pop("ANTHROPIC_API_KEY", None)
        raise HTTPException(400, f"Invalid API key: {str(e)}")

@app.get("/check-api-key")
async def check_api_key():
    """Check if API key is set"""
    has_key = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {"has_api_key": has_key}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    options: str = '{"model_type": "lorentzian"}'
):
    # Validate file
    if not file.filename.endswith(('.txt', '.csv', '.xlsx')):
        raise HTTPException(400, "Invalid file format. Supported: .txt, .csv, .xlsx")
    
    # Check file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum size: 10MB")
    
    # Parse options
    try:
        analysis_options = json.loads(options)
    except:
        analysis_options = {"model_type": "lorentzian"}
    
    # Process spectrum
    result = process_spectrum(file.filename, contents, analysis_options)
    
    if not result.get("success"):
        return AnalysisResponse(
            success=False,
            error=result.get("error", "Unknown error occurred")
        )
    
    # Generate interpretation
    interpreter = MossbauerInterpreter(use_ai=True)
    summary = interpreter.generate_summary(result["fit_results"])
    
    # Generate and store report
    report_id = str(uuid.uuid4())
    report = generate_detailed_report(
        result["fit_results"], 
        file.filename, 
        analysis_options
    )
    reports_storage[report_id] = report
    
    # Clean up old reports in background
    background_tasks.add_task(cleanup_old_reports)
    
    return AnalysisResponse(
        success=True,
        plot_data=result["plot_data"],
        residuals_plot=result["residuals_plot"],
        plot_layout=result["plot_layout"],
        residuals_layout=result["residuals_layout"],
        fit_results=result["fit_results"],
        summary=summary,
        report_id=report_id
    )

@app.get("/report/{report_id}")
async def get_report(report_id: str):
    if report_id not in reports_storage:
        raise HTTPException(404, "Report not found")
    
    report = reports_storage[report_id]
    
    # Create temporary file for download
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(report, f, indent=2)
        temp_path = f.name
    
    return FileResponse(
        temp_path,
        media_type='application/json',
        filename=f'mossbauer_report_{report_id[:8]}.json'
    )

def cleanup_old_reports():
    """Remove reports older than 1 hour"""
    # In production, use proper caching with TTL
    if len(reports_storage) > 100:
        # Keep only the 50 most recent reports
        sorted_keys = sorted(reports_storage.keys())
        for key in sorted_keys[:-50]:
            del reports_storage[key]

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "production") == "development"
    )
