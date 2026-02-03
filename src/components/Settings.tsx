import { useEffect, useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
    const [config, setConfig] = useState({
        gumroadAccessToken: '',
        githubAccessToken: '',
        githubOwner: '',
        githubRepo: '',
        repoMappings: [] as any[],
        pollingIntervalMinutes: 10,
    });
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await window.api.getAllSettings();
        setConfig(prev => ({
            ...prev,
            gumroadAccessToken: settings.gumroadAccessToken || '',
            githubAccessToken: settings.githubAccessToken || '',
            githubOwner: settings.githubOwner || '',
            githubRepo: settings.githubRepo || '',
            repoMappings: settings.repoMappings || [],
            pollingIntervalMinutes: settings.pollingIntervalMinutes || 10,
        }));

        const isAutoLaunch = await window.api.getAutoLaunch();
        setAutoLaunch(isAutoLaunch);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus('');
        try {
            await window.api.setStoreValue('gumroadAccessToken', config.gumroadAccessToken.trim());
            await window.api.setStoreValue('githubAccessToken', config.githubAccessToken.trim());
            await window.api.setStoreValue('githubOwner', config.githubOwner.trim());
            await window.api.setStoreValue('githubRepo', config.githubRepo.trim());
            await window.api.setStoreValue('repoMappings', config.repoMappings);
            await window.api.setStoreValue('pollingIntervalMinutes', Number(config.pollingIntervalMinutes));

            await window.api.setAutoLaunch(autoLaunch);

            setStatus('Settings saved successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error(error);
            setStatus('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    const addMapping = () => {
        const newMapping = { id: Date.now().toString(), productNameKeyword: '', githubOwner: config.githubOwner, githubRepo: '' };
        setConfig(prev => ({ ...prev, repoMappings: [...prev.repoMappings, newMapping] }));
    };

    const removeMapping = (id: string) => {
        setConfig(prev => ({ ...prev, repoMappings: prev.repoMappings.filter(m => m.id !== id) }));
    };

    const updateMapping = (id: string, field: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            repoMappings: prev.repoMappings.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    };

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Settings
            </h2>

            <div className="space-y-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                    <h3 className="text-lg font-semibold mb-4 text-purple-400 flex justify-between items-center">
                        Gumroad Configuration
                        <button
                            onClick={async () => {
                                setStatus('Testing Gumroad...');
                                const res = await window.api.testGumroadConnection(config.gumroadAccessToken.trim());
                                if (res.success) {
                                    setStatus(`Success: Gumroad connected as ${res.user} (${res.email})`);
                                } else {
                                    setStatus(`Error: ${res.error}`);
                                }
                            }}
                            className="text-xs bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-3 py-1 rounded border border-purple-800 transition"
                        >
                            Test Token
                        </button>
                    </h3>
                    <div>
                        <label className="block text-sm font-medium mb-1">Access Token</label>
                        <input
                            type="password"
                            name="gumroadAccessToken"
                            value={config.gumroadAccessToken}
                            onChange={handleChange}
                            className="w-full bg-[#242424] border border-[#444] rounded p-2 focus:border-purple-500 outline-none transition"
                            placeholder="Gumroad Application Access Token"
                        />
                        <p className="text-xs text-gray-400 mt-1">Get this from Gumroad Settings {'>'} Advanced.</p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                    <h3 className="text-lg font-semibold mb-4 text-blue-400 flex justify-between items-center">
                        GitHub Configuration
                        <button
                            onClick={async () => {
                                setStatus('Testing connection...');
                                const res = await window.api.testGitHubConnection({
                                    token: config.githubAccessToken.trim(),
                                    owner: config.githubOwner.trim(),
                                    repo: config.githubRepo.trim()
                                });
                                if (res.success) {
                                    setStatus(`Success: Connected as ${res.user} to ${res.repo}`);
                                } else {
                                    setStatus(`Error: ${res.error}`);
                                }
                            }}
                            className="text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-800 transition"
                        >
                            Test Connection
                        </button>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Personal Access Token</label>
                            <input
                                type="password"
                                name="githubAccessToken"
                                value={config.githubAccessToken}
                                onChange={handleChange}
                                className="w-full bg-[#242424] border border-[#444] rounded p-2 focus:border-blue-500 outline-none transition"
                                placeholder="ghp_..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Requires 'repo' scope.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Repository Owner</label>
                            <input
                                type="text"
                                name="githubOwner"
                                value={config.githubOwner}
                                onChange={handleChange}
                                className="w-full bg-[#242424] border border-[#444] rounded p-2 focus:border-blue-500 outline-none transition"
                                placeholder="e.g. facebook"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Repository Name</label>
                            <input
                                type="text"
                                name="githubRepo"
                                value={config.githubRepo}
                                onChange={handleChange}
                                className="w-full bg-[#242424] border border-[#444] rounded p-2 focus:border-blue-500 outline-none transition"
                                placeholder="e.g. react"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                    <h3 className="text-lg font-semibold mb-4 text-orange-400 flex justify-between items-center">
                        Repository Overrides (Multi-Repo)
                        <button
                            onClick={addMapping}
                            className="text-xs bg-orange-900/50 hover:bg-orange-800 text-orange-200 px-3 py-1 rounded border border-orange-800 transition"
                        >
                            + Add Mapping
                        </button>
                    </h3>
                    <div className="space-y-3">
                        {config.repoMappings.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No overrides. All sales go to the default repo above.</p>
                        )}
                        {config.repoMappings.map((mapping) => (
                            <div key={mapping.id} className="grid grid-cols-7 gap-2 items-center bg-[#252525] p-2 rounded border border-[#333]">
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Product Name Keyword"
                                        value={mapping.productNameKeyword}
                                        onChange={(e) => updateMapping(mapping.id, 'productNameKeyword', e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#444] rounded p-1 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Repo Owner"
                                        value={mapping.githubOwner}
                                        onChange={(e) => updateMapping(mapping.id, 'githubOwner', e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#444] rounded p-1 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Repo Name"
                                        value={mapping.githubRepo}
                                        onChange={(e) => updateMapping(mapping.id, 'githubRepo', e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#444] rounded p-1 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="col-span-1 text-right">
                                    <button
                                        onClick={() => removeMapping(mapping.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 rounded"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">App Settings</h3>
                    <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoLaunch}
                                onChange={(e) => setAutoLaunch(e.target.checked)}
                                className="w-4 h-4 accent-green-500"
                            />
                            <span>Start with Windows</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Polling Interval (Minutes)</label>
                        <input
                            type="number"
                            name="pollingIntervalMinutes"
                            value={config.pollingIntervalMinutes}
                            onChange={handleChange}
                            min="1"
                            className="w-full bg-[#242424] border border-[#444] rounded p-2 focus:border-green-500 outline-none transition"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Configuration
                    </button>
                    {status && (
                        <div className={`mt-3 text-center ${status.includes('Error') ? 'text-red-400' : 'text-green-400'} flex items-center justify-center gap-2`}>
                            {status.includes('Error') && <AlertCircle size={16} />}
                            {status}
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-[#333]">
                    <h3 className="text-sm font-semibold mb-2 text-red-400">Danger Zone</h3>
                    <button
                        onClick={async () => {
                            if (confirm('This will clear "Processed Sales" history and fetch EVERYTHING again. Are you sure?')) {
                                await window.api.resetData();
                                setStatus('Data reset. Service will check everything on next loop.');
                            }
                        }}
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 font-medium py-2 px-4 rounded-lg border border-red-900/50 transition flex items-center justify-center gap-2"
                    >
                        <AlertCircle size={16} />
                        Force Full Re-Sync (Clear History)
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">Use this if a sale was missed during a downtime or test.</p>
                </div>
            </div>
        </div>
    );
};
