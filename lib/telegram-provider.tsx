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

export const tgHaptic = {
    success: () => (window as any)?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
    warning: () => (window as any)?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'),
    error:   () => (window as any)?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
    tap:     (style: 'light'|'medium'|'heavy'|'rigid'|'soft' = 'light') =>
        (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style),
    tick:    () => (window as any)?.Telegram?.WebApp?.HapticFeedback?.selectionChanged(),
};


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
        const tg = (window as any).Telegram?.WebApp;
        const isTelegram = !!tg?.initDataUnsafe?.user;

        if (isTelegram) {
            // 👇 Добавь сюда
            tg.ready();
            tg.expand();
            if (tg.isVersionAtLeast?.('7.7')) {
                tg.disableVerticalSwipes();
            }

            setAppData({
                isDev: false,
                user: tg.initDataUnsafe.user,
            });
        } else {
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
