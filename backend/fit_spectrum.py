import io
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from lmfit.models import LorentzianModel, VoigtModel, PseudoVoigtModel
from lmfit import Parameters
import plotly.graph_objs as go
from dataclasses import dataclass, asdict
from enum import Enum
import json

class FitModel(Enum):
    LORENTZIAN = "lorentzian"
    VOIGT = "voigt"
    PSEUDO_VOIGT = "pseudo_voigt"

@dataclass
class MossbauerSite:
    """Represents a single Mössbauer site with all relevant parameters"""
    isomer_shift: float
    quadrupole_splitting: float
    line_width: float
    relative_area: float
    site_type: str = ""
    hyperfine_field: Optional[float] = None
    
    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}

class MossbauerFitter:
    def __init__(self, model_type: FitModel = FitModel.LORENTZIAN):
        self.model_type = model_type
        self.velocity = None
        self.absorption = None
        self.result = None
        
    def load_data(self, filename: str, raw_bytes: bytes) -> Tuple[bool, str]:
        """Load and validate data from file"""
        try:
            if filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(raw_bytes))
            elif filename.endswith('.txt') or filename.endswith('.csv'):
                # Try multiple delimiters
                for sep in ['\t', ' ', ',', ';']:
                    try:
                        df = pd.read_csv(io.BytesIO(raw_bytes), sep=sep, header=None)
                        if df.shape[1] >= 2:
                            break
                    except:
                        continue
            else:
                return False, "Unsupported file format. Please use .xlsx, .txt, or .csv"
            
            # Validate data
            df = df.dropna().reset_index(drop=True)
            if df.shape[1] < 2:
                return False, "File must contain at least 2 columns (velocity and absorption)"
            
            if df.shape[0] < 10:
                return False, "Insufficient data points (minimum 10 required)"
            
            self.velocity = df.iloc[:, 0].values.astype(float)
            self.absorption = df.iloc[:, 1].values.astype(float)
            
            # Normalize absorption to percentage if needed
            if self.absorption.max() > 10:
                self.absorption = self.absorption / 100.0
            
            # Apply baseline correction if needed
            if self.absorption.min() < 0.9:
                baseline = np.percentile(self.absorption, 95)
                self.absorption = self.absorption / baseline
            
            return True, "Data loaded successfully"
            
        except Exception as e:
            return False, f"Error loading data: {str(e)}"
    
    def detect_number_of_sites(self) -> int:
        """Auto-detect the likely number of sites using peak finding"""
        from scipy.signal import find_peaks
        
        # Invert for peak finding (absorption dips are peaks when inverted)
        inverted = -self.absorption
        peaks, properties = find_peaks(inverted, 
                                     height=np.std(inverted) * 0.5,
                                     distance=len(self.velocity) // 20)
        
        # Mössbauer sites often appear as doublets due to quadrupole splitting
        # So actual number of sites is roughly half the number of peaks
        estimated_sites = max(1, len(peaks) // 2)
        return min(estimated_sites, 4)  # Cap at 4 for practical reasons
    
    def create_model(self, n_sites: Optional[int] = None) -> Tuple[Any, Parameters]:
        """Create the fitting model with appropriate number of sites"""
        if n_sites is None:
            n_sites = self.detect_number_of_sites()
        
        # Select model class based on type
        model_class = {
            FitModel.LORENTZIAN: LorentzianModel,
            FitModel.VOIGT: VoigtModel,
            FitModel.PSEUDO_VOIGT: PseudoVoigtModel
        }[self.model_type]
        
        # Build composite model
        model = None
        for i in range(n_sites * 2):  # Double for doublets
            prefix = f'peak{i+1}_'
            if model is None:
                model = model_class(prefix=prefix)
            else:
                model += model_class(prefix=prefix)
        
        # Create parameters with intelligent initial guesses
        params = model.make_params()
        
        # Find approximate peak positions
        from scipy.signal import find_peaks
        inverted = -self.absorption
        peaks, _ = find_peaks(inverted, height=np.std(inverted) * 0.3)
        peak_velocities = self.velocity[peaks] if len(peaks) > 0 else []
        
        for i in range(n_sites * 2):
            prefix = f'peak{i+1}_'
            
            # Initial center positions
            if i < len(peak_velocities):
                center = peak_velocities[i]
            else:
                # Distribute evenly if no peaks found
                v_min, v_max = self.velocity.min(), self.velocity.max()
                center = v_min + (i + 0.5) * (v_max - v_min) / (n_sites * 2)
            
            params[f'{prefix}center'].set(value=center, 
                                        min=self.velocity.min(), 
                                        max=self.velocity.max())
            
            # Amplitude based on absorption depth
            amplitude = np.ptp(self.absorption) / (n_sites * 2)
            params[f'{prefix}amplitude'].set(value=amplitude, min=0)
            
            # Reasonable line width
            params[f'{prefix}sigma'].set(value=0.15, min=0.05, max=1.0)
            
            # For Voigt model, set gamma
            if self.model_type == FitModel.VOIGT:
                params[f'{prefix}gamma'].set(value=0.15, min=0.05, max=1.0)
        
        return model, params
    
    def fit(self, n_sites: Optional[int] = None, 
            custom_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Perform the fitting"""
        model, params = self.create_model(n_sites)
        
        # Apply any custom parameter values
        if custom_params:
            for key, value in custom_params.items():
                if key in params:
                    params[key].set(**value)
        
        # Perform the fit with weights
        weights = 1.0 / np.sqrt(self.absorption + 0.001)  # Poisson-like weights
        self.result = model.fit(self.absorption, params, x=self.velocity, weights=weights)
        
        # Extract Mössbauer parameters
        sites = self._extract_mossbauer_parameters(n_sites)
        
        return {
            "success": True,
            "sites": sites,
            "chi_squared": float(self.result.chisqr),
            "reduced_chi_squared": float(self.result.redchi),
            "n_data_points": len(self.velocity),
            "n_variables": self.result.nvarys,
            "fit_report": self.result.fit_report()
        }
    
    def _extract_mossbauer_parameters(self, n_sites: Optional[int] = None) -> List[MossbauerSite]:
        """Extract parameters in Mössbauer-relevant format"""
        if n_sites is None:
            n_sites = self.detect_number_of_sites()
        
        sites = []
        components = self.result.eval_components()
        
        # Group peaks into sites (pairs for doublets)
        for site_idx in range(n_sites):
            peak1_name = f'peak{site_idx*2 + 1}_'
            peak2_name = f'peak{site_idx*2 + 2}_'
            
            if peak1_name in components and peak2_name in components:
                # Extract parameters for doublet
                center1 = self.result.params[f'{peak1_name}center'].value
                center2 = self.result.params[f'{peak2_name}center'].value
                
                # Mössbauer parameters
                isomer_shift = (center1 + center2) / 2
                quadrupole_splitting = abs(center2 - center1)
                
                # Average line width
                sigma1 = self.result.params[f'{peak1_name}sigma'].value
                sigma2 = self.result.params[f'{peak2_name}sigma'].value
                line_width = 2 * (sigma1 + sigma2) / 2  # Convert to FWHM
                
                # Calculate relative area
                area1 = np.trapz(components[peak1_name], self.velocity)
                area2 = np.trapz(components[peak2_name], self.velocity)
                total_area = sum(np.trapz(comp, self.velocity) for comp in components.values())
                relative_area = ((area1 + area2) / total_area) * 100 if total_area > 0 else 0
                
                # Determine site type based on parameters
                site_type = self._identify_site_type(isomer_shift, quadrupole_splitting)
                
                site = MossbauerSite(
                    isomer_shift=float(isomer_shift),
                    quadrupole_splitting=float(quadrupole_splitting),
                    line_width=float(line_width),
                    relative_area=float(relative_area),
                    site_type=site_type
                )
                sites.append(site)
        
        return sites
    
    def _identify_site_type(self, isomer_shift: float, quadrupole_splitting: float) -> str:
        """Identify iron site type based on Mössbauer parameters"""
        # Simplified identification based on common ranges
        if -0.2 <= isomer_shift <= 0.5:
            if quadrupole_splitting < 0.5:
                return "Fe³⁺ (low-spin)"
            else:
                return "Fe³⁺ (high-spin)"
        elif 0.6 <= isomer_shift <= 1.5:
            if quadrupole_splitting < 1.0:
                return "Fe²⁺ (low-spin)"
            else:
                return "Fe²⁺ (high-spin)"
        else:
            return "Unknown"
    
    def get_plot_data(self) -> Dict[str, Any]:
        """Generate Plotly plot data"""
        if not self.result:
            return {}
        
        components = self.result.eval_components()
        
        # Create traces
        traces = [
            go.Scatter(
                x=self.velocity.tolist(), 
                y=self.absorption.tolist(), 
                mode='markers',
                name='Experimental',
                marker=dict(size=4, color='black'),
                showlegend=True
            ),
            go.Scatter(
                x=self.velocity.tolist(), 
                y=self.result.best_fit.tolist(), 
                mode='lines',
                name='Total Fit',
                line=dict(color='red', width=2),
                showlegend=True
            )
        ]
        
        # Add component traces
        colors = ['blue', 'green', 'orange', 'purple', 'brown', 'pink']
        for i, (name, component) in enumerate(components.items()):
            traces.append(go.Scatter(
                x=self.velocity.tolist(),
                y=component.tolist(),
                mode='lines',
                name=name.replace('_', ' ').title(),
                line=dict(color=colors[i % len(colors)], width=1.5, dash='dash'),
                showlegend=True
            ))
        
        # Create residuals
        residuals = self.absorption - self.result.best_fit
        
        layout = {
            "title": "Mössbauer Spectrum Analysis",
            "xaxis": {"title": "Velocity (mm/s)", "zeroline": True},
            "yaxis": {"title": "Relative Transmission", "zeroline": False},
            "template": "plotly_white",
            "height": 500,
            "showlegend": True,
            "legend": {"x": 1.02, "y": 1, "xanchor": "left", "yanchor": "top"},
            "hovermode": "x unified"
        }
        
        residuals_layout = {
            "title": "Fit Residuals",
            "xaxis": {"title": "Velocity (mm/s)", "zeroline": True},
            "yaxis": {"title": "Residuals", "zeroline": True},
            "template": "plotly_white",
            "height": 200,
            "showlegend": False
        }
        
        return {
            "main_plot": traces,
            "residuals_plot": [
                go.Scatter(
                    x=self.velocity.tolist(),
                    y=residuals.tolist(),
                    mode='markers',
                    marker=dict(size=3, color='gray'),
                    name='Residuals',
                    showlegend=False
                )
            ],
            "layout": layout,
            "residuals_layout": residuals_layout
        }

def process_spectrum(filename: str, raw_bytes: bytes, 
                    options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Main processing function"""
    if options is None:
        options = {}
    
    fitter = MossbauerFitter(
        model_type=FitModel(options.get('model_type', 'lorentzian'))
    )
    
    # Load data
    success, message = fitter.load_data(filename, raw_bytes)
    if not success:
        return {"error": message, "success": False}
    
    # Perform fitting
    n_sites = options.get('n_sites')
    custom_params = options.get('custom_params')
    
    try:
        fit_results = fitter.fit(n_sites, custom_params)
        plot_data = fitter.get_plot_data()
        
        # Convert sites to dictionaries for JSON serialization
        fit_results['sites'] = [site.to_dict() for site in fit_results['sites']]
        
        return {
            "success": True,
            "fit_results": fit_results,
            "plot_data": plot_data['main_plot'],
            "residuals_plot": plot_data['residuals_plot'],
            "plot_layout": plot_data['layout'],
            "residuals_layout": plot_data['residuals_layout']
        }
    except Exception as e:
        return {"error": f"Fitting failed: {str(e)}", "success": False}
