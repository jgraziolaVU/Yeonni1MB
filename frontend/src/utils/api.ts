import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AnalysisOptions {
  model_type: 'lorentzian' | 'voigt' | 'pseudo_voigt';
  n_sites?: number | null;
  baseline_correction: boolean;
  custom_params?: Record<string, any>;
}

export interface MossbauerSite {
  isomer_shift: number;
  quadrupole_splitting: number;
  line_width: number;
  relative_area: number;
  site_type: string;
  hyperfine_field?: number;
}

export interface FitResults {
  sites: MossbauerSite[];
  chi_squared: number;
  reduced_chi_squared: number;
  n_data_points: number;
  n_variables: number;
}

export interface AnalysisResponse {
  success: boolean;
  error?: string;
  plot_data?: any[];
  residuals_plot?: any[];
  plot_layout?: any;
  residuals_layout?: any;
  fit_results?: FitResults;
  summary?: string;
  report_id?: string;
}

class API {
  private client = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
  });

  async analyzeSpectrum(file: File, options: AnalysisOptions): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await this.client.post<AnalysisResponse>('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.detail || error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  async downloadReport(reportId: string): Promise<void> {
    try {
      const response = await this.client.get(`/report/${reportId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mossbauer_report_${reportId.slice(0, 8)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download report');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const api = new API();
