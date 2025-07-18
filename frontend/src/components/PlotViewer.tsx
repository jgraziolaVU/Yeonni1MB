import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  ),
});

interface PlotViewerProps {
  data: any[];
  layout: any;
  className?: string;
  config?: any;
}

export const PlotViewer: React.FC<PlotViewerProps> = ({
  data,
  layout,
  className = '',
  config = {},
}) => {
  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'mossbauer_spectrum',
      height: 600,
      width: 800,
      scale: 2,
    },
    ...config,
  };

  const enhancedLayout = {
    ...layout,
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 14,
    },
    margin: {
      l: 60,
      r: 40,
      t: 40,
      b: 60,
    },
    xaxis: {
      ...layout.xaxis,
      gridcolor: 'rgba(0,0,0,0.1)',
      zerolinecolor: 'rgba(0,0,0,0.3)',
    },
    yaxis: {
      ...layout.yaxis,
      gridcolor: 'rgba(0,0,0,0.1)',
      zerolinecolor: 'rgba(0,0,0,0.3)',
    },
  };

  return (
    <div className={`w-full ${className}`}>
      <Plot
        data={data}
        layout={enhancedLayout}
        config={defaultConfig}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
};
