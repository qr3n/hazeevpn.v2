'use client';

import { useTelegram } from '@/lib/telegram-provider';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface WelcomeHeaderProps {
    username?: string | null;
}

export function WelcomeHeader({ username }: WelcomeHeaderProps) {
    const { user } = useTelegram();

    // Prioritize the server-provided username to avoid flickering.
    // Only fall back to Telegram SDK data if username is not provided.
    const displayName = (username || user?.first_name || user?.username || 'владимир').toLowerCase();

    return (
        <h1 className="text-white text-5xl xss:text-4xl font-semibold leading-[0.85] tracking-tighter">
            Добро пожаловать, <br />
            <span className="inline-flex items-center gap-3">
                {displayName}!

                <DotLottieReact
                    src="/animations/hand.json"
                    loop
                    autoplay
                    className="w-12 h-12 rotate-12 -ml-2 pointer-events-none"
                />
            </span>
        </h1>
    );
}
