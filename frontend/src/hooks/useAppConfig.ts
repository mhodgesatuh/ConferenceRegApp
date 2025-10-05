// frontend/src/hooks/useAppConfig.ts

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type AppConfig = {
    presenterMaxBytes: number;
};

async function fetchAppConfig(): Promise<AppConfig> {
    const data = await apiFetch('/api/config');
    const presenterMaxBytes = Number((data as any)?.presenterMaxBytes);
    if (!Number.isFinite(presenterMaxBytes) || presenterMaxBytes <= 0) {
        throw new Error('Invalid presenterMaxBytes received from config endpoint');
    }
    return { presenterMaxBytes };
}

export function useAppConfig() {
    return useQuery<AppConfig, Error, AppConfig, ['appConfig']>({
        queryKey: ['appConfig'],
        queryFn: fetchAppConfig,
        staleTime: Infinity,
        gcTime: Infinity,
    });
}

