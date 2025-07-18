from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fit_spectrum import process_file_and_fit
from summarize import generate_summary
import uvicorn

app = FastAPI()

# Allow frontend requests from Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    result = process_file_and_fit(file.filename, contents)

    if not result:
        return {"error": "Failed to process the spectrum."}

    summary = generate_summary(result["fit_params"])
    return {
        "plot_data": result["plot_data"],
        "plot_layout": result["plot_layout"],
        "summary": summary
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
