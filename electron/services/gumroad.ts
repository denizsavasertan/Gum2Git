import axios from 'axios';
import { addLog } from './store.ts';

const GUMROAD_API_BASE = 'https://api.gumroad.com/v2';

interface GumroadSale {
    id: string;
    created_at: string;
    product_name: string;
    custom_fields: Record<string, string>;
    [key: string]: any;
}

interface SalesResponse {
    success: boolean;
    sales: GumroadSale[];
}

export const fetchSales = async (accessToken: string, afterDate?: string) => {
    try {
        const params: any = {
            access_token: accessToken,
        };

        // Gumroad API supports 'after' parameter for date filtering (YYYY-MM-DD)
        // However, it might be safer to fetch recent sales and filter manually if the API is strict about day-only.
        // Documentation says 'after' is YYYY-MM-DD.
        // Convert ISO string to YYYY-MM-DD if needed.
        // SAFETY: Subtract 1 day to ensure we don't miss sales from the current day due to timezone differences or API strictness.
        if (afterDate) {
            const date = new Date(afterDate);
            // If date is essentially "beginning of time" (reset), don't filter
            if (date.getFullYear() > 2020) {
                date.setDate(date.getDate() - 1);
                params.after = date.toISOString().split('T')[0];
                addLog(`Filtered Gumroad request: params.after=${params.after}`, 'info');
            } else {
                addLog(`Full Sync requested (afterDate old). Fetching all sales...`, 'warning');
            }
        }

        addLog(`Requesting Gumroad Sales...`, 'info');
        const response = await axios.get<SalesResponse>(`${GUMROAD_API_BASE}/sales`, {
            params,
        });

        if (response.data.success) {
            // Log the first sale to see structure (if any)
            if (response.data.sales.length > 0) {
                addLog(`Found ${response.data.sales.length} sales. First sale product: "${response.data.sales[0].product_name}"`, 'success');
                addLog(`First sale raw custom_fields: ${JSON.stringify(response.data.sales[0].custom_fields)}`, 'info');
            } else {
                addLog(`Gumroad returned SUCCESS but 0 sales. Params used: ${JSON.stringify(params)}`, 'warning');
            }
            return response.data.sales;
        }
        return [];
    } catch (error: any) {
        addLog(`Gumroad API Error: ${error.message}`, 'error');
        if (error.response) {
            addLog(`API Response: ${JSON.stringify(error.response.data)}`, 'error');
        }
        console.error('Error fetching Gumroad sales:', error);
        throw error;
    }
};
