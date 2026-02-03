import Store from 'electron-store';

interface Log {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export interface RepoMapping {
    id: string;
    productNameKeyword: string;
    githubOwner: string;
    githubRepo: string;
}

interface AppStore {
    gumroadAccessToken: string;
    githubAccessToken: string;
    githubOwner: string;
    githubRepo: string;
    repoMappings: RepoMapping[];
    pollingIntervalMinutes: number;
    lastCheckTime: string; // ISO date string
    processedSaleIds: string[];
    logs: Log[];
}

const store = new Store<AppStore>({
    defaults: {
        gumroadAccessToken: '',
        githubAccessToken: '',
        githubOwner: '',
        githubRepo: '',
        repoMappings: [],
        pollingIntervalMinutes: 10,
        lastCheckTime: new Date(0).toISOString(),
        processedSaleIds: [],
        logs: [],
    },
});

export const addLog = (message: string, type: Log['type'] = 'info') => {
    const logs = store.get('logs');
    const newLog: Log = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        message,
        type,
    };
    // Keep last 100 logs
    store.set('logs', [newLog, ...logs].slice(0, 100));
};

export const clearLogs = () => {
    store.set('logs', []);
};

export default store;
