import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">🎵 Ass-DJ</h1>
        <p className="text-xl text-gray-400 mb-8">AI-powered DJ application with MIDI support</p>
        <div className="bg-gray-800 p-8 rounded-lg">
          <p className="text-yellow-500 mb-4">⚠️ Environment Setup Required</p>
          <p className="text-gray-300">
            Please set your Google GenAI API key in <code className="bg-gray-900 px-2 py-1 rounded">.env</code> file
          </p>
          <div className="mt-6 text-left text-sm text-gray-400">
            <p>1. Copy <code className="bg-gray-900 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-900 px-2 py-1 rounded">.env</code></p>
            <p>2. Get API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">aistudio.google.com</a></p>
            <p>3. Add key to <code className="bg-gray-900 px-2 py-1 rounded">.env</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};