import React from 'react';
import { Download, TrendingUp, Brain, BarChart3 } from 'lucide-react';
import { PlotViewer } from './PlotViewer';
import { AnalysisResponse } from '../utils/api';
import clsx from 'clsx';

interface ResultsViewProps {
  results: AnalysisResponse;
  onDownload: () => void;
  darkMode: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  onDownload,
  darkMode,
}) => {
  if (!results.success || !results.fit_results) {
    return null;
  }

  const { fit_results, plot_data, residuals_plot, plot_layout, residuals_layout, summary } = results;

  return (
    <div className="space-y-6">
      {/* Main Plot */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Spectrum & Fit
          </h2>
          <button
            onClick={onDownload}
            className={clsx(
              'flex items-center px-4 py-2 rounded-lg',
              'bg-blue-600 text-white hover:bg-blue-700',
              'transition-colors text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
        
        <PlotViewer
          data={plot_data || []}
          layout={{
            ...plot_layout,
            paper_bgcolor: 'transparent',
            plot_bgcolor: darkMode ? '#1f2937' : '#f9fafb',
            font: { color: darkMode ? '#f3f4f6' : '#111827' },
          }}
          className="h-[400px]"
        />
      </div>

      {/* Residuals Plot */}
      {residuals_plot && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
            Fit Residuals
          </h3>
          <PlotViewer
            data={residuals_plot}
            layout={{
              ...residuals_layout,
              paper_bgcolor: 'transparent',
              plot_bgcolor: darkMode ? '#1f2937' : '#f9fafb',
              font: { color: darkMode ? '#f3f4f6' : '#111827' },
            }}
            className="h-[200px]"
          />
        </div>
      )}

      {/* Fit Parameters Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fitted Parameters
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  Site
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  IS (mm/s)
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  QS (mm/s)
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  LW (mm/s)
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  Area (%)
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">
                  Assignment
                </th>
              </tr>
            </thead>
            <tbody>
              {fit_results.sites.map((site, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-700/50"
                >
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {site.isomer_shift.toFixed(3)}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {site.quadrupole_splitting.toFixed(3)}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {site.line_width.toFixed(3)}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {site.relative_area.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {site.site_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">χ²:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {fit_results.chi_squared.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Reduced χ²:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {fit_results.reduced_chi_squared.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Data points:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {fit_results.n_data_points}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Variables:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {fit_results.n_variables}
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-purple-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            AI Interpretation
            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
};
