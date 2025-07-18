# Mössbauer Spectrum Analyzer

A modern web application for analyzing ⁵⁷Fe Mössbauer spectroscopy data with AI-powered interpretation.

## Features

- **Automated Spectrum Fitting**: Intelligent peak detection and fitting using Lorentzian, Voigt, or Pseudo-Voigt models
- **AI-Powered Analysis**: GPT-4 powered interpretation of iron sites, oxidation states, and coordination environments
- **Interactive Visualization**: Real-time plotting with Plotly for spectrum and residuals
- **Multiple File Formats**: Support for .txt, .csv, and .xlsx files
- **Advanced Options**: Customizable fitting parameters and baseline correction
- **Export Capabilities**: Download detailed analysis reports in JSON format
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **lmfit**: Non-linear least-squares fitting
- **NumPy/Pandas**: Data processing
- **Plotly**: Interactive visualization
- **OpenAI API**: AI-powered interpretation

### Frontend
- **Next.js 14**: React framework with TypeScript
- **Tailwind CSS**: Utility-first styling
- **Plotly.js**: Interactive plotting
- **Lucide Icons**: Modern icon set

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key (for AI features)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the backend
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cp .env.local.example .env.local

# Run the frontend
npm run dev
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Usage

1. **Upload Data**: Drag and drop or click to upload your Mössbauer spectrum file
2. **Configure Options** (Optional): Adjust fitting model, number of sites, or baseline correction
3. **Analyze**: The system automatically fits the spectrum and generates AI interpretation
4. **Review Results**: 
   - Interactive plot showing experimental data and fitted curves
   - Residuals plot for fit quality assessment
   - Parameter table with isomer shifts, quadrupole splittings, and site assignments
   - AI-generated interpretation of the iron sites
5. **Export**: Download the complete analysis report as JSON

## File Format

Input files should contain two columns:
- Column 1: Velocity (mm/s)
- Column 2: Absorption or transmission (normalized or percentage)

Supported delimiters: space, tab, comma, semicolon

## API Documentation

The backend API is documented at `http://localhost:8000/docs` when running locally.

### Main Endpoints

- `POST /analyze`: Analyze a spectrum file
- `GET /report/{report_id}`: Download analysis report
- `GET /health`: API health check

## Development

### Backend Development

```bash
cd backend
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

### Backend (Render/Railway)

1. Set environment variables:
   - `OPENAI_API_KEY`
   - `ALLOWED_ORIGINS`
   - `PORT`

2. Deploy using Dockerfile

### Frontend (Vercel)

1. Connect GitHub repository
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL`
3. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- Mössbauer spectroscopy community for domain knowledge
- OpenAI for GPT-4 API
- All open-source libraries used in this project

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API logs for debugging
