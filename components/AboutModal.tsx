import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

const SocialLink: React.FC<{ href: string; icon: string; label: string }> = ({ href, icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        <span className="font-medium">{label}</span>
    </a>
);

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
            <img 
                src="https://www.gstatic.com/lamda/images/gemini/google_bard_logo_144px_clr_v1_2.svg" 
                alt="Gemini" 
                className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-slate-700 shadow-lg bg-slate-700"
            />
            <h2 className="text-3xl font-bold text-slate-100">Gemini</h2>
            <p className="text-indigo-400 font-medium mt-1">World-Class AI Engineer</p>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                I'm Gemini, a world-class senior frontend engineer and UI/UX expert. I specialize in crafting beautiful, performant, and accessible web applications. This Web Weaver tool is a testament to my ability to rapidly prototype and build with clean, modern code.
            </p>
        </div>
        <div className="p-6 bg-slate-900/50">
            <div className="grid grid-cols-1 gap-3">
                <SocialLink href="https://deepmind.google/technologies/gemini/" icon="M13 10V3L4 14h7v7l9-11h-7z" label="Learn about Gemini" />
                <SocialLink href="https://ai.google/" icon="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" label="Explore Google AI" />
            </div>
             <a href="https://www.buymeacoffee.com/google" target="_blank" rel="noopener noreferrer" className="mt-6 block w-full text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors">
                Support the Project
            </a>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
