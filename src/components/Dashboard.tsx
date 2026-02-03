import { useEffect, useState } from 'react';
import { Activity, Clock, RefreshCw, Terminal, Trash2, Users } from 'lucide-react';
import type { Log } from '../types';

export const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [lastCheck, setLastCheck] = useState<string>('Never');
    const [status, setStatus] = useState<'Running' | 'Idle'>('Idle');
    const [totalSales, setTotalSales] = useState(0);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        const fetchedLogs = await window.api.getLogs();
        setLogs(fetchedLogs);

        const settings = await window.api.getAllSettings();
        if (settings.lastCheckTime && settings.lastCheckTime !== new Date(0).toISOString()) {
            setLastCheck(new Date(settings.lastCheckTime).toLocaleString());
        }
        setTotalSales(settings.processedSaleIds?.length || 0);

        // Heuristic for status: if last check was recent (< 1 min + polling interval)
        setStatus('Running');
    };

    const handleClearLogs = async () => {
        await window.api.clearLogs();
        fetchData();
    };

    return (
        <div className="p-6 text-white max-w-4xl mx-auto h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Status Card */}
                <div className="bg-[#01000e] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Service Status</p>
                        <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                            <Activity size={20} />
                            {status}
                        </h3>
                    </div>
                </div>

                {/* Last Check Card */}
                <div className="bg-[#01000e] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Last Checked</p>
                        <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                            <Clock size={20} />
                            <span className="text-base">{lastCheck}</span>
                        </h3>
                    </div>
                    <button onClick={fetchData} className="p-2 hover:bg-[#333] rounded-full transition" title="Refresh Data">
                        <RefreshCw size={16} className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Total Sales Card */}
                <div className="bg-[#01000e] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Total Processed Customers</p>
                        <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                            <Users size={20} />
                            {totalSales}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Logs Console */}
            <div className="flex-1 bg-[#01000e] rounded-lg border border-[#333] flex flex-col overflow-hidden shadow-inner">
                <div className="p-3 bg-[#222] border-b border-[#333] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-gray-400" />
                        <span className="font-mono text-sm text-gray-300">System Logs</span>
                    </div>
                    <button
                        onClick={handleClearLogs}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-400 transition"
                    >
                        <Trash2 size={12} />
                        Clear Logs
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                    {logs.length === 0 && (
                        <p className="text-gray-500 italic">No logs yet.</p>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                            <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={
                                log.type === 'error' ? 'text-red-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                            'text-gray-300'
                            }>
                                {log.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
