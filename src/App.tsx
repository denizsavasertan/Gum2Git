import { useState } from 'react';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

import logoBig from './assets/logo_big.png';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  return (
    <div className="flex h-screen bg-[#01000e] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#01000e] border-r border-[#333] flex flex-col">
        <div className="p-6 border-b border-[#333]">
          <div className="flex justify-center">
            <img src={logoBig} alt="Gum2Git" className="w-full h-auto object-contain" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#252525] hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#252525] hover:text-white'}`}
          >
            <SettingsIcon size={20} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-[#333]">
          <p className="text-xs text-gray-500 text-center">www.savasertan.com</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#01000e]">
        {activeTab === 'dashboard' ? <Dashboard /> : <Settings />}
      </div>
    </div>
  );
}

export default App;
