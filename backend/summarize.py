import os
from typing import List, Dict, Any
import pandas as pd
from dataclasses import dataclass
import anthropic

# Global variable to store the API key
_anthropic_client = None

def get_anthropic_client():
    """Get or create Anthropic client with API key"""
    global _anthropic_client
    if _anthropic_client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            _anthropic_client = anthropic.Anthropic(api_key=api_key)
    return _anthropic_client

@dataclass
class InterpretationRule:
    """Rule-based interpretation for when AI is not available"""
    condition: callable
    interpretation: str

class MossbauerInterpreter:
    def __init__(self, use_ai: bool = True):
        client = get_anthropic_client()
        self.use_ai = use_ai and client is not None
        self.rules = self._create_interpretation_rules()
    
    def _create_interpretation_rules(self) -> List[InterpretationRule]:
        """Create rule-based interpretations for common Mössbauer patterns"""
        return [
            InterpretationRule(
                condition=lambda site: -0.2 <= site['isomer_shift'] <= 0.5 and site['quadrupole_splitting'] < 0.5,
                interpretation="Low-spin Fe³⁺ in octahedral coordination"
            ),
            InterpretationRule(
                condition=lambda site: -0.2 <= site['isomer_shift'] <= 0.5 and 0.5 <= site['quadrupole_splitting'] <= 2.0,
                interpretation="High-spin Fe³⁺ in octahedral coordination with distortion"
            ),
            InterpretationRule(
                condition=lambda site: 0.6 <= site['isomer_shift'] <= 0.9 and site['quadrupole_splitting'] < 1.0,
                interpretation="Low-spin Fe²⁺ in octahedral coordination"
            ),
            InterpretationRule(
                condition=lambda site: 0.9 <= site['isomer_shift'] <= 1.5 and site['quadrupole_splitting'] > 1.5,
                interpretation="High-spin Fe²⁺ in octahedral coordination"
            ),
            InterpretationRule(
                condition=lambda site: site['isomer_shift'] > 1.5 and site['quadrupole_splitting'] > 2.5,
                interpretation="Fe²⁺ in tetrahedral coordination"
            ),
        ]
    
    def generate_summary(self, fit_results: Dict[str, Any]) -> str:
        """Generate interpretation summary"""
        if self.use_ai:
            try:
                return self._generate_ai_summary(fit_results)
            except Exception as e:
                print(f"AI summary failed: {e}, falling back to rule-based interpretation")
                return self._generate_rule_based_summary(fit_results)
        else:
            return self._generate_rule_based_summary(fit_results)
    
    def _generate_ai_summary(self, fit_results: Dict[str, Any]) -> str:
        """Generate AI-powered interpretation using Claude 4 Sonnet"""
        client = get_anthropic_client()
        if not client:
            raise Exception("Anthropic API key not set")
            
        sites = fit_results.get('sites', [])
        
        # Prepare detailed prompt
        sites_description = []
        for i, site in enumerate(sites, 1):
            sites_description.append(
                f"Site {i}: IS = {site['isomer_shift']:.3f} mm/s, "
                f"QS = {site['quadrupole_splitting']:.3f} mm/s, "
                f"LW = {site['line_width']:.3f} mm/s, "
                f"Area = {site['relative_area']:.1f}%"
            )
        
        prompt = f"""You are an expert in Mössbauer spectroscopy. Analyze the following ⁵⁷Fe Mössbauer spectrum fitting results and provide a detailed interpretation.

Fitting Results:
{chr(10).join(sites_description)}

Chi-squared: {fit_results.get('chi_squared', 0):.4f}
Reduced chi-squared: {fit_results.get('reduced_chi_squared', 0):.4f}

Please provide:
1. Identification of each iron site (oxidation state, spin state, coordination)
2. Possible mineral phases or compounds
3. Quality assessment of the fit
4. Any notable features or concerns

Write your response as a concise paragraph suitable for a research paper."""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            temperature=0.3,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text.strip()
    
    def _generate_rule_based_summary(self, fit_results: Dict[str, Any]) -> str:
        """Generate rule-based interpretation when AI is not available"""
        sites = fit_results.get('sites', [])
        interpretations = []
        
        for i, site in enumerate(sites, 1):
            # Find matching interpretation
            site_interpretation = "Unknown iron environment"
            for rule in self.rules:
                if rule.condition(site):
                    site_interpretation = rule.interpretation
                    break
            
            interpretations.append(
                f"Site {i} ({site['relative_area']:.1f}%): {site_interpretation} "
                f"(IS={site['isomer_shift']:.2f}, QS={site['quadrupole_splitting']:.2f} mm/s)"
            )
        
        # Add fit quality assessment
        chi_squared = fit_results.get('reduced_chi_squared', 0)
        if chi_squared < 1.5:
            quality = "excellent"
        elif chi_squared < 3.0:
            quality = "good"
        else:
            quality = "moderate"
        
        summary = f"The spectrum shows {len(sites)} distinct iron site(s). "
        summary += " ".join(interpretations)
        summary += f" The fit quality is {quality} with a reduced χ² of {chi_squared:.3f}."
        
        return summary

def generate_detailed_report(fit_results: Dict[str, Any], 
                           filename: str,
                           options: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a detailed analysis report"""
    interpreter = MossbauerInterpreter(use_ai=True)
    
    report = {
        "filename": filename,
        "analysis_date": pd.Timestamp.now().isoformat(),
        "fit_parameters": {
            "model": options.get('model_type', 'lorentzian'),
            "n_sites": len(fit_results.get('sites', [])),
            "n_data_points": fit_results.get('n_data_points', 0),
            "n_variables": fit_results.get('n_variables', 0)
        },
        "sites": fit_results.get('sites', []),
        "fit_quality": {
            "chi_squared": fit_results.get('chi_squared', 0),
            "reduced_chi_squared": fit_results.get('reduced_chi_squared', 0)
        },
        "interpretation": interpreter.generate_summary(fit_results),
        "references": [
            "Gütlich, P., Bill, E., & Trautwein, A. X. (2011). Mössbauer spectroscopy and transition metal chemistry.",
            "Dyar, M. D., et al. (2006). Mössbauer spectroscopy of earth and planetary materials."
        ]
    }
    
    return report
