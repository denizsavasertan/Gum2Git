import { Notification } from 'electron';
import store, { addLog } from './store.ts';
import { fetchSales } from './gumroad.ts';
import { inviteCollaborator } from './github.ts';

// Config
const POLLING_INTERVAL_MS = 60 * 1000 * 10; // 10 minutes default, can be overridden by store

let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

export const startBackgroundService = () => {
    if (intervalId) return;

    // Run immediately on start
    runJob();

    // Then schedule
    const interval = store.get('pollingIntervalMinutes') * 60 * 1000 || POLLING_INTERVAL_MS;
    intervalId = setInterval(runJob, interval);

    console.log('Background service started with interval:', interval);
    addLog('Background service started', 'info');
};

export const stopBackgroundService = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
};

export const restartBackgroundService = () => {
    stopBackgroundService();
    startBackgroundService();
};

const runJob = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
        const gumroadToken = store.get('gumroadAccessToken');
        const githubToken = store.get('githubAccessToken');
        const owner = store.get('githubOwner');
        const repo = store.get('githubRepo');
        const processedIds = store.get('processedSaleIds') || [];
        const lastCheck = store.get('lastCheckTime');

        if (!gumroadToken || !githubToken || !owner || !repo) {
            // Missing config
            return;
        }

        addLog('Checking for new sales...', 'info');

        addLog(`Checking for new sales... Last check: ${lastCheck ? new Date(lastCheck).toLocaleString() : 'None'}`, 'info');

        // Fetch sales
        const sales = await fetchSales(gumroadToken, lastCheck);
        addLog(`Gumroad API returned ${sales.length} sales.`, 'info');

        const newSales = sales.filter((sale: any) => !processedIds.includes(sale.id));

        if (newSales.length === 0) {
            addLog('No new unprocessed sales found.', 'info');
            store.set('lastCheckTime', new Date().toISOString());
            return;
        }

        addLog(`Found ${newSales.length} new unprocessed sales. Processing...`, 'info');

        for (const sale of newSales) {
            const productName = sale.product_name;
            addLog(`Processing sale for product: ${productName}`, 'info');

            // Extract Git User
            // Search case-insensitive for "Git", "Github", "User" in custom_fields keys
            const customFields = sale.custom_fields || {};
            let gitUsername = '';

            // Log custom fields for debugging
            addLog(`Custom Fields found: ${JSON.stringify(Object.keys(customFields))}`, 'info');

            // Heuristic search
            for (const key of Object.keys(customFields)) {
                if (key.toLowerCase().includes('git') || key.toLowerCase().includes('user') || key.toLowerCase().includes('kullanıcı')) {
                    gitUsername = customFields[key];
                    break;
                }
            }

            if (!gitUsername) {
                addLog(`Sale ${sale.id}: No Git username found. checked keys: ${Object.keys(customFields).join(', ')}`, 'warning');
                continue;
            }

            // Clean username (remove @ if present)
            gitUsername = gitUsername.replace('@', '').trim();

            if (!gitUsername) {
                addLog(`Sale ${sale.id}: Username was empty after cleanup.`, 'warning');
                continue;
            }

            addLog(`Inviting ${gitUsername} to ${owner}/${repo}...`, 'info');

            const result = await inviteCollaborator(githubToken, owner, repo, gitUsername);

            if (result.success) {
                addLog(`Successfully invited ${gitUsername}.`, 'success');
                new Notification({
                    title: 'New Sale Processed',
                    body: `Added ${gitUsername} to GitHub collaborators.`
                }).show();

                // Mark as processed
                const currentProcessed = store.get('processedSaleIds') || [];
                store.set('processedSaleIds', [...currentProcessed, sale.id]);
            } else {
                addLog(`Failed to invite ${gitUsername}. Status: ${result.status || 'Unknown'}. Error: ${result.error}`, 'error');
                new Notification({
                    title: 'Error Processing Sale',
                    body: `Failed to add ${gitUsername}. Check logs.`
                }).show();
            }
        }

        if (newSales.length > 0) {
            const successCount = store.get('processedSaleIds').length - processedIds.length;
            if (successCount > 0) {
                addLog(`✅ Batch Complete: Added ${successCount} new collaborators to GitHub.`, 'success');
            }
        }

        store.set('lastCheckTime', new Date().toISOString());
        // If the user clicked Reset while this job was running, store.get('lastCheckTime') would be 1970.
        // We shouldn't overwrite it with "now".
        const currentStoredCheck = store.get('lastCheckTime');
        const isReset = new Date(currentStoredCheck).getFullYear() <= 1970;

        if (!isReset) {
            store.set('lastCheckTime', new Date().toISOString());
        } else {
            addLog('Reset detected during execution. Skipping timestamp update.', 'warning');
        }

    } catch (error: any) {
        addLog(`Error in background job: ${error.message}`, 'error');
        if (error.response) {
            addLog(`API Response: ${JSON.stringify(error.response.data)}`, 'error');
        }
    } finally {
        isRunning = false;
    }
};
