import { useState } from 'react';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { LayoutDashboard, Settings as SettingsIcon, GitBranch } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  return (
    <div className="flex h-screen bg-[#242424] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col">
        <div className="p-6 border-b border-[#333]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <GitBranch className="text-orange-400" />
            Gum2Git
          </h1>
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
      <div className="flex-1 overflow-auto bg-[#121212]">
        {activeTab === 'dashboard' ? <Dashboard /> : <Settings />}
      </div>
    </div>
  );
}

export default App;
