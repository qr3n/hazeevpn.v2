'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserData {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
}

interface AppData {
    user?: UserData;
    isDev: boolean;
}

const TelegramContext = createContext<AppData | null>(null);

// MOCK DATA for DEV mode
const MOCK_USER: UserData = {
    id: 12345678,
    username: 'vladimir_mock',
    first_name: 'владимир',
    last_name: 'тестовый',
};

export function TelegramProvider({ children }: { children: ReactNode }) {
    const [appData, setAppData] = useState<AppData>({
        isDev: process.env.NODE_ENV === 'development',
        user: undefined,
    });

    useEffect(() => {
        // In reality, here we would initialize @telegram-apps/sdk
        // and fetch real data if available.
        // For now, we always provide mock data or try to detect environment.
        
        const isTelegram = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData !== '';
        
        if (isTelegram && process.env.NODE_ENV === 'production') {
            // Placeholder for real logic
            const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
            setAppData({
                isDev: false,
                user: tgUser,
            });
        } else {
            // Default to mock for dev or non-tg env
            setAppData({
                isDev: true,
                user: MOCK_USER,
            });
        }
    }, []);

    return (
        <TelegramContext.Provider value={appData}>
            {children}
        </TelegramContext.Provider>
    );
}

export const useTelegram = () => {
    const context = useContext(TelegramContext);
    if (!context) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
};
