import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ComponentType } from '../types';
import type { PageComponent, AiProvider } from '../types';

interface AiGenerateModalProps {
  apiKeys: Partial<Record<AiProvider, string>>;
  onSetApiKey: (provider: AiProvider, key: string) => void;
  onClearApiKey: (provider: AiProvider) => void;
  onClose: () => void;
  onGenerate: (layout: PageComponent[]) => void;
}

const deepseekSchemaDescription = `{ "type": "array", "items": { "type": "object", "properties": { "type": { "type": "string", "enum": [${Object.values(ComponentType).map(v => `"${v}"`).join(', ')}] }, "name": { "type": "string" }, "stylesByViewport": { "type": "object", "properties": { "Desktop": { "type": "object", "properties": { "base": { "type": "object", "properties": { "top": { "type": "string" }, "left": { "type": "string" }, "width": { "type": "string" }, "height": { "type": "string" }}}}}}}, "content": {"type": "object", "properties": {"text": { "type": "string" }}}, "children": { "type": "array", "items": { "$ref": "#" }} }, "required": ["type", "name", "stylesByViewport", "children"] }}`;

const baseComponentStyles = { type: Type.OBJECT, properties: { top: { type: Type.STRING }, left: { type: Type.STRING }, width: { type: Type.STRING }, height: { type: Type.STRING }, padding: { type: Type.STRING }, backgroundColor: { type: Type.STRING }, textColor: { type: Type.STRING }, fontSize: { type: Type.STRING }, fontWeight: { type: Type.STRING }, borderRadius: { type: Type.STRING }, boxShadow: { type: Type.STRING }, border: { type: Type.STRING }, } };
const componentContent = { type: Type.OBJECT, properties: { text: { type: Type.STRING }, buttonText: { type: Type.STRING }, imageUrl: { type: Type.STRING, description: "URL for an image. Use picsum.photos." }, placeholder: { type: Type.STRING }, } };
const componentBaseProperties = { type: { type: Type.STRING, enum: Object.values(ComponentType) }, name: { type: Type.STRING }, stylesByViewport: { type: Type.OBJECT, properties: { Desktop: { type: Type.OBJECT, properties: { base: baseComponentStyles } } } }, content: componentContent, };
const childComponentSchema = { type: Type.OBJECT, properties: { ...componentBaseProperties, children: { type: Type.ARRAY, maxItems: 0 } }, required: ["type", "name", "stylesByViewport", "children"] };
const rootComponentSchema = { type: Type.OBJECT, properties: { ...componentBaseProperties, children: { type: Type.ARRAY, items: childComponentSchema } }, required: ["type", "name", "stylesByViewport", "children"] };
const geminiSchema = { type: Type.ARRAY, items: rootComponentSchema };


const assignUniqueIds = (components: PageComponent[]): PageComponent[] => {
    return components.map(comp => ({
        ...comp,
        id: `${comp.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        children: comp.children ? assignUniqueIds(comp.children) : []
    }));
};

const AiGenerateModal: React.FC<AiGenerateModalProps> = ({ apiKeys, onSetApiKey, onClearApiKey, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'single' | 'dual'>('single');
  const [singleProvider, setSingleProvider] = useState<AiProvider>('gemini');
  const [userPersonaProvider, setUserPersonaProvider] = useState<AiProvider>('gemini');
  const [helperProvider, setHelperProvider] = useState<AiProvider>('deepseek');
  
  const [providerForApiKeyInput, setProviderForApiKeyInput] = useState<AiProvider | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [intermediateBrief, setIntermediateBrief] = useState<string | null>(null);

  useEffect(() => {
    // When switching provider, if the key is missing, immediately prompt for it.
    if (mode === 'single' && !apiKeys[singleProvider]) {
      setProviderForApiKeyInput(singleProvider);
    } else {
      setProviderForApiKeyInput(null);
    }
  }, [mode, singleProvider, apiKeys]);

  const handleSaveKey = () => {
    if (keyInput.trim() && providerForApiKeyInput) {
      onSetApiKey(providerForApiKeyInput, keyInput.trim());
      setKeyInput('');
      setProviderForApiKeyInput(null);
    }
  };

  const callApi = async (provider: AiProvider, apiKey: string, userPrompt: string, systemPrompt: string) => {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        }
      });
      return response.text;
    } else { // deepseek or chatgpt
        let url = '';
        let model = '';
        if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/chat/completions';
            model = 'deepseek-chat';
        } else if (provider === 'chatgpt') {
            url = 'https://api.openai.com/v1/chat/completions';
            model = 'gpt-4o-mini';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                response_format: { "type": "json_object" },
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    setIntermediateBrief(null);

    try {
      let finalLayoutJson: string;

      if (mode === 'single') {
        const apiKey = apiKeys[singleProvider];
        if (!apiKey) { setProviderForApiKeyInput(singleProvider); throw new Error(`API Key for ${singleProvider} is missing.`); }
        
        setLoadingMessage(`Generating layout with ${singleProvider}...`);
        const systemPrompt = `You are an expert web designer. Your task is to generate a JSON object representing a webpage layout based on the user's request. You MUST respond with ONLY a valid JSON object that adheres to the provided structure. Do not include any other text, explanations, or markdown formatting. The structure should be an array of component objects. For DeepSeek and ChatGPT, the schema is: ${deepseekSchemaDescription}. For Gemini, the schema is provided in the tool config. Ensure the layout is visually appealing. Use placeholder content and images (from picsum.photos). Only define styles for the 'Desktop' viewport. Root components must have top/left positions within a 1280x720 canvas. Child components top/left are relative to their parent.`;
        finalLayoutJson = await callApi(singleProvider, apiKey, prompt, systemPrompt);

      } else { // Dual mode
        const userPersonaApiKey = apiKeys[userPersonaProvider];
        const helperApiKey = apiKeys[helperProvider];

        if (!userPersonaApiKey) { setProviderForApiKeyInput(userPersonaProvider); throw new Error(`API Key for ${userPersonaProvider} is missing.`); }
        if (!helperApiKey) { setProviderForApiKeyInput(helperProvider); throw new Error(`API Key for ${helperProvider} is missing.`); }

        setLoadingMessage(`Generating creative brief with ${userPersonaProvider}...`);
        const briefSystemPrompt = `You are a creative client. Take the user's simple idea and expand it into a detailed creative brief for a web designer. Describe the desired sections, content, style, and mood. Respond with only the creative brief text.`;
        const brief = await callApi(userPersonaProvider, userPersonaApiKey, prompt, briefSystemPrompt);
        setIntermediateBrief(brief);

        setLoadingMessage(`Designing layout from brief with ${helperProvider}...`);
        const layoutSystemPrompt = `You are an expert web designer. Your task is to generate a JSON object representing a webpage layout based on the detailed creative brief you are given. You MUST respond with ONLY a valid JSON object that adheres to the provided structure. Do not include any other text, explanations, or markdown formatting. The structure should be an array of component objects. For DeepSeek and ChatGPT, the schema is: ${deepseekSchemaDescription}. For Gemini, the schema is provided in the tool config. Ensure the layout is visually appealing. Use placeholder content and images (from picsum.photos). Only define styles for the 'Desktop' viewport. Root components must have top/left positions within a 1280x720 canvas. Child components top/left are relative to their parent.`;
        finalLayoutJson = await callApi(helperProvider, helperApiKey, brief, layoutSystemPrompt);
      }

      const cleanedContent = finalLayoutJson.replace(/^```json\n/, '').replace(/\n```$/, '');
      const generatedLayout = JSON.parse(cleanedContent);

      if (Array.isArray(generatedLayout)) {
          const layoutWithIds = assignUniqueIds(generatedLayout);
          onGenerate(layoutWithIds);
      } else {
          throw new Error("AI did not return a valid array of components.");
      }
    } catch (e) {
      console.error(e);
      let errorMessage = 'Failed to generate page. ';
      if (e instanceof Error) {
        if (e.message.toLowerCase().includes('insufficient balance')) {
            errorMessage += 'Your API provider account has insufficient balance. Please check your account on their platform.';
        } else {
            errorMessage += e.message;
        }
      } else { errorMessage += 'An unknown error occurred.'; }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const renderApiKeyForm = () => (
    <>
      <main className="p-6 space-y-4">
        <p className="text-sm text-slate-400">Please enter your {providerForApiKeyInput} API key. Your key will be stored locally in your browser.</p>
        <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder={`Enter your ${providerForApiKeyInput} API Key`} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm" />
      </main>
      <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
        <button onClick={() => setProviderForApiKeyInput(null)} className="text-xs text-slate-400 hover:text-white underline">Back</button>
        <button onClick={handleSaveKey} disabled={!keyInput.trim()} className="px-4 py-2 bg-indigo-600 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">Save Key</button>
      </footer>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Generate Page with AI</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </header>
        {providerForApiKeyInput ? renderApiKeyForm() : (
          <>
            <main className="p-6 space-y-4">
                <div className="flex p-1 bg-slate-900 rounded-md">
                    <button onClick={() => setMode('single')} className={`px-3 py-1 text-sm rounded flex-1 ${mode === 'single' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>Single AI</button>
                    <button onClick={() => setMode('dual')} className={`px-3 py-1 text-sm rounded flex-1 ${mode === 'dual' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>Dual AI Agents</button>
                </div>
                
                {mode === 'single' && <div className="flex items-center gap-2">
                    <label className="text-sm">Provider:</label>
                    <select value={singleProvider} onChange={e => setSingleProvider(e.target.value as AiProvider)} className="bg-slate-700 p-1 rounded-md text-sm border border-slate-600">
                        <option value="gemini">Google Gemini</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="chatgpt">OpenAI ChatGPT</option>
                    </select>
                    {!apiKeys[singleProvider] && <button onClick={() => setProviderForApiKeyInput(singleProvider)} className="text-xs text-indigo-400 underline">Set API Key</button>}
                </div>}
                
                {mode === 'dual' && <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-slate-900 rounded-md">
                    <div><label className="block font-medium mb-1">User Persona AI</label><p className="text-xs text-slate-400 mb-2">Expands your idea into a brief.</p><select value={userPersonaProvider} onChange={e => setUserPersonaProvider(e.target.value as AiProvider)} className="w-full bg-slate-700 p-1 rounded-md border border-slate-600"><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option><option value="chatgpt">ChatGPT</option></select>{!apiKeys[userPersonaProvider] && <button onClick={() => setProviderForApiKeyInput(userPersonaProvider)} className="text-xs text-indigo-400 underline mt-1">Set API Key</button>}</div>
                    <div><label className="block font-medium mb-1">Helper AI</label><p className="text-xs text-slate-400 mb-2">Builds the layout from the brief.</p><select value={helperProvider} onChange={e => setHelperProvider(e.target.value as AiProvider)} className="w-full bg-slate-700 p-1 rounded-md border border-slate-600"><option value="deepseek">DeepSeek</option><option value="gemini">Gemini</option><option value="chatgpt">ChatGPT</option></select>{!apiKeys[helperProvider] && <button onClick={() => setProviderForApiKeyInput(helperProvider)} className="text-xs text-indigo-400 underline mt-1">Set API Key</button>}</div>
                </div>}
                
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'single' ? "e.g., A modern portfolio for a photographer..." : "e.g., A landing page for a new coffee shop."} className="w-full h-32 bg-slate-900 border border-slate-600 rounded-md p-2 text-sm resize-y" disabled={isLoading} />
                {intermediateBrief && <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded-md max-h-24 overflow-y-auto"><p className="font-bold text-slate-300 mb-1">Generated Creative Brief:</p>{intermediateBrief}</div>}
                {error && <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md">{error}</p>}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <div>
                   {Object.keys(apiKeys).length > 0 && <div className="flex gap-2 items-center">
                        {Object.entries(apiKeys).map(([provider, key]) => key && <button key={provider} onClick={() => { onClearApiKey(provider as AiProvider); setProviderForApiKeyInput(provider as AiProvider); }} className="text-xs text-slate-500 hover:text-red-400 underline">Clear {provider} Key</button>)}
                    </div>}
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-slate-600 rounded-md text-sm hover:bg-slate-700 disabled:opacity-50">Cancel</button>
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="px-4 py-2 bg-indigo-600 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center">
                        {isLoading && <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{loadingMessage || 'Generating...'}</span></>}
                        {!isLoading && 'Generate'}
                    </button>
                </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default AiGenerateModal;