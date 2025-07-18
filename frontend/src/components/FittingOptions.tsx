import React from 'react';
import { Settings, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { AnalysisOptions } from '../utils/api';
import clsx from 'clsx';

interface FittingOptionsProps {
  options: AnalysisOptions;
  onChange: (options: AnalysisOptions) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FittingOptions: React.FC<FittingOptionsProps> = ({
  options,
  onChange,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-xl transition-colors"
      >
        <span className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
          <Settings className="w-5 h-5 mr-2" />
          Fitting Options
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Model Type */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fitting Model
            </label>
            <select
              value={options.model_type}
              onChange={(e) =>
                onChange({
                  ...options,
                  model_type: e.target.value as AnalysisOptions['model_type'],
                })
              }
              className={clsx(
                'w-full rounded-lg border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-colors'
              )}
            >
              <option value="lorentzian">Lorentzian</option>
              <option value="voigt">Voigt</option>
              <option value="pseudo_voigt">Pseudo-Voigt</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lorentzian is suitable for most Mössbauer spectra
            </p>
          </div>

          {/* Number of Sites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Iron Sites
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={options.n_sites || ''}
              onChange={(e) =>
                onChange({
                  ...options,
                  n_sites: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Auto-detect"
              className={clsx(
                'w-full rounded-lg border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-colors placeholder-gray-400'
              )}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for automatic detection
            </p>
          </div>

          {/* Baseline Correction */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.baseline_correction}
                onChange={(e) =>
                  onChange({
                    ...options,
                    baseline_correction: e.target.checked,
                  })
                }
                className={clsx(
                  'w-4 h-4 rounded text-blue-600',
                  'focus:ring-2 focus:ring-blue-500',
                  'dark:bg-gray-700 dark:border-gray-600'
                )}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apply baseline correction
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Normalizes spectrum to improve fitting
                </p>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="ml-2 text-xs text-blue-700 dark:text-blue-300">
                Advanced users can customize individual peak parameters after initial fitting
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
