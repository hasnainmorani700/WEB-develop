import React, { useState, useEffect } from 'react';
import type { ProjectSettings, Page } from '../types';

declare const js_beautify: any;
declare const html_beautify: any;

interface SettingsPanelProps {
  projectSettings: ProjectSettings;
  onUpdateProjectSettings: (newSettings: ProjectSettings) => void;
  activePage: Page | null | undefined;
  onUpdatePage: (pageId: string, newProps: Partial<Page>) => void;
}

const CodeEditor: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  language?: 'javascript' | 'html';
  height?: string;
}> = ({ label, value, onChange, language = 'javascript', height = 'h-32' }) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    try {
      const beautifier = language === 'html' ? html_beautify : js_beautify;
      if (typeof beautifier !== 'undefined') {
        const formatted = beautifier(currentValue, { indent_size: 2, space_in_empty_paren: true });
        if (formatted !== currentValue) {
          setCurrentValue(formatted);
          onChange(formatted);
        } else {
           onChange(currentValue);
        }
      } else {
        onChange(currentValue);
      }
    } catch (e) {
      console.error("Code formatting failed:", e);
      onChange(currentValue);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <textarea
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        className={`w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm resize-y font-mono ${height}`}
        spellCheck="false"
      />
    </div>
  );
};


const SettingsPanel: React.FC<SettingsPanelProps> = ({
  projectSettings,
  onUpdateProjectSettings,
  activePage,
  onUpdatePage,
}) => {
  const handleGlobalChange = (key: keyof ProjectSettings, value: string) => {
    onUpdateProjectSettings({ ...projectSettings, [key]: value });
  };

  const handlePageChange = (key: keyof Page, value: string) => {
    if (activePage) {
      onUpdatePage(activePage.id, { [key]: value });
    }
  };

  return (
    <div className="p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Project & Page Settings</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mb-2">Global Settings</h4>
          <div className="space-y-4">
            <CodeEditor
              label="Global Custom JavaScript"
              value={projectSettings.globalJs || ''}
              onChange={(val) => handleGlobalChange('globalJs', val)}
            />
            <CodeEditor
              label="Global Custom <head> Content"
              value={projectSettings.globalHeadContent || ''}
              onChange={(val) => handleGlobalChange('globalHeadContent', val)}
              language="html"
            />
          </div>
        </div>

        {activePage && (
          <div>
            <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mb-2">
              Settings for "{activePage.name}" page
            </h4>
            <div className="space-y-4">
               <CodeEditor
                label="Page-Specific JavaScript"
                value={activePage.customJs || ''}
                onChange={(val) => handlePageChange('customJs', val)}
              />
              <CodeEditor
                label="Page-Specific <head> Content"
                value={activePage.customHeadContent || ''}
                onChange={(val) => handlePageChange('customHeadContent', val)}
                language="html"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;