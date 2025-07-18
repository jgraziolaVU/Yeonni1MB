import io
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from lmfit.models import LorentzianModel
import plotly.graph_objs as go

def process_file_and_fit(filename, raw_bytes):
    try:
        # Load data
        if filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(raw_bytes))
        elif filename.endswith('.txt'):
            df = pd.read_csv(io.BytesIO(raw_bytes), delim_whitespace=True, header=None)
        else:
            return None

        df = df.dropna().reset_index(drop=True)

        # Auto-detect column format
        if df.shape[1] >= 2:
            velocity = df.iloc[:, 0].values
            absorption = df.iloc[:, 1].values
        else:
            return None

        # Fit using Lorentzian models (2 sites as demo)
        model = LorentzianModel(prefix='site1_') + LorentzianModel(prefix='site2_')
        params = model.make_params()
        params['site1_center'].set(value=np.mean(velocity), min=-5, max=5)
        params['site1_amplitude'].set(value=1)
        params['site1_sigma'].set(value=0.5)

        params['site2_center'].set(value=np.mean(velocity) + 1, min=-5, max=5)
        params['site2_amplitude'].set(value=1)
        params['site2_sigma'].set(value=0.5)

        result = model.fit(absorption, params, x=velocity)

        # Extract results
        fit_y = result.best_fit
        components = result.eval_components()

        # Prepare Plotly plot
        plot_data = [
            go.Scatter(x=velocity, y=absorption, mode='lines', name='Original'),
            go.Scatter(x=velocity, y=fit_y, mode='lines', name='Total Fit'),
        ] + [
            go.Scatter(x=velocity, y=components[k], mode='lines', name=k)
            for k in components
        ]

        layout = {
            "title": "Mössbauer Spectrum Fit",
            "xaxis": {"title": "Velocity (mm/s)"},
            "yaxis": {"title": "Absorption"},
        }

        fit_params = {
            k: float(v.value) for k, v in result.params.items()
            if 'center' in k or 'sigma' in k or 'amplitude' in k
        }

        return {
            "plot_data": [trace.to_plotly_json() for trace in plot_data],
            "plot_layout": layout,
            "fit_params": fit_params
        }

    except Exception as e:
        print("Error during fitting:", e)
        return None
