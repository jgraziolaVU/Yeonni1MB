import React from 'react';
import Plot from 'react-plotly.js';

const PlotViewer = ({ data, layout }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4">
      <Plot
        data={data}
        layout={{
          ...layout,
          autosize: true,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
};

export default PlotViewer;
