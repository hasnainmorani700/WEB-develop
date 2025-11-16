import React from 'react';

const tailwindColorClassToHex: Record<string, string> = { 'bg-transparent': 'transparent', 'bg-white': '#ffffff', 'bg-black': '#000000', 'bg-gray-100': '#f3f4f6', 'bg-gray-200': '#e5e7eb', 'bg-gray-300': '#d1d5db', 'bg-gray-400': '#9ca3af', 'bg-gray-500': '#6b7280', 'bg-gray-600': '#4b5563', 'bg-gray-700': '#374151', 'bg-gray-800': '#1f2937', 'bg-gray-900': '#111827', 'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-yellow-500': '#eab308', 'bg-green-500': '#22c55e', 'bg-teal-500': '#14b8a6', 'bg-blue-500': '#3b82f6', 'bg-indigo-500': '#6366f1', 'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899', 'bg-red-600': '#dc2626', 'bg-orange-600': '#ea580c', 'bg-yellow-600': '#ca8a04', 'bg-green-600': '#16a34a', 'bg-teal-600': '#0d9488', 'bg-blue-600': '#2563eb', 'bg-indigo-600': '#4f46e5', 'bg-purple-600': '#7c3aed', 'bg-pink-600': '#db2777', 'text-inherit': 'inherit', 'text-white': '#ffffff', 'text-black': '#000000', 'text-gray-100': '#f3f4f6', 'text-gray-200': '#e5e7eb', 'text-gray-300': '#d1d5db', 'text-gray-400': '#9ca3af', 'text-gray-500': '#6b7280', 'text-gray-600': '#4b5563', 'text-gray-700': '#374151', 'text-gray-800': '#1f2937', 'text-gray-900': '#111827', 'text-red-500': '#ef4444', 'text-orange-500': '#f97316', 'text-yellow-500': '#eab308', 'text-green-500': '#22c55e', 'text-teal-500': '#14b8a6', 'text-blue-500': '#3b82f6', 'text-indigo-500': '#6366f1', 'text-purple-500': '#8b5cf6', 'text-pink-500': '#ec4899', 'text-red-400': '#f87171', 'text-orange-400': '#fb923c', 'text-yellow-400': '#facc15', 'text-green-400': '#4ade80', 'text-teal-400': '#2dd4bf', 'text-blue-400': '#60a5fa', 'text-indigo-400': '#818cf8', 'text-purple-400': '#a78bfa', 'text-pink-400': '#f472b6' };

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colorOptions: string[];
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, colorOptions }) => {
    const isHex = value && value.startsWith('#');
  
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-900 rounded-md">
                {colorOptions.map(colorClass => (
                    <button
                        key={colorClass}
                        onClick={() => onChange(colorClass)}
                        className={`w-6 h-6 rounded-full border-2 ${value === colorClass ? 'border-blue-400 ring-2 ring-blue-400' : 'border-gray-600'}`}
                        style={{ backgroundColor: tailwindColorClassToHex[colorClass] || 'transparent' }}
                        title={colorClass}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-md overflow-hidden">
                   <input
                        type="color"
                        value={isHex ? value : (tailwindColorClassToHex[value] || '#000000')}
                        onChange={e => onChange(e.target.value)}
                        className="absolute -top-1 -left-1 w-10 h-10 border-none cursor-pointer"
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm"
                    placeholder="#RRGGBB or tailwind class"
                />
            </div>
        </div>
    );
};

export default ColorInput;