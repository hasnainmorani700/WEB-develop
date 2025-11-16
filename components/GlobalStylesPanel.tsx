
import React from 'react';
import type { ThemeStyles } from '../types';
import { FONT_OPTIONS, STYLE_OPTIONS } from '../constants';

interface GlobalStylesPanelProps {
  theme: ThemeStyles;
  onUpdateTheme: (newTheme: ThemeStyles) => void;
}

const GlobalStylesPanel: React.FC<GlobalStylesPanelProps> = ({ theme, onUpdateTheme }) => {
  const handleThemeChange = (key: keyof ThemeStyles, value: string) => {
    onUpdateTheme({ ...theme, [key]: value });
  };

  const renderSelect = (label: string, key: keyof ThemeStyles, options: {name: string, value: string}[] | string[], valueProp?: 'value', nameProp?: 'name') => {
      const isObjectArray = typeof options[0] === 'object';
      return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <select
                value={theme[key] || ''}
                onChange={(e) => handleThemeChange(key, e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm"
            >
                {options.map((opt: any) => (
                    <option key={isObjectArray ? opt.value : opt} value={isObjectArray ? opt.value : opt}>
                        {isObjectArray ? opt.name : opt}
                    </option>
                ))}
            </select>
        </div>
    );
  };

  return (
    <div className="p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Global Styles</h3>
      <div className="space-y-4">
        {renderSelect('Font Family', 'fontFamily', FONT_OPTIONS)}
        {renderSelect('Background Color', 'bodyBackground', STYLE_OPTIONS.backgroundColor)}
        {renderSelect('Text Color', 'bodyColor', STYLE_OPTIONS.textColor)}
      </div>
    </div>
  );
};

export default GlobalStylesPanel;