export interface Log {
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

export interface AppSettings {
    gumroadAccessToken: string;
    githubAccessToken: string;
    githubOwner: string;
    githubRepo: string;
    repoMappings: RepoMapping[];
    pollingIntervalMinutes: number;
    lastCheckTime: string;
    processedSaleIds: string[];
    logs: Log[];
}

export interface Api {
    getStoreValue: (key: keyof AppSettings) => Promise<any>;
    setStoreValue: (key: keyof AppSettings, value: any) => Promise<boolean>;
    getAllSettings: () => Promise<AppSettings>;
    resetData: () => Promise<boolean>;
    getLogs: () => Promise<Log[]>;
    clearLogs: () => Promise<boolean>;
    clearLogs: () => Promise<boolean>;
    setAutoLaunch: (enable: boolean) => Promise<boolean>;
    getAutoLaunch: () => Promise<boolean>;
    testGitHubConnection: (config: { token: string, owner: string, repo: string }) => Promise<{ success: boolean; user?: string; repo?: string; error?: string }>;
    testGumroadConnection: (token: string) => Promise<{ success: boolean; user?: string; email?: string; error?: string }>;
}

declare global {
    interface Window {
        api: Api;
    }
}
