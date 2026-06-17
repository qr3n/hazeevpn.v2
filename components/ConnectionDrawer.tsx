'use client';

import { AnimatePresence, motion, Transition } from 'framer-motion';
import { Drawer } from 'vaul';
import { memo, useCallback, useReducer, useRef, useState } from 'react';
import { TransformProperties } from "motion-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { QRCodeSVG } from 'qrcode.react';

// ─── Types ──────────────────────────────────────────────────────────────────

type PlatformKey = 'ios' | 'android' | 'other';
interface Step       { title: string; text: string; action: string; }
interface PlatformData { label: string; desc: string; steps: Step[]; }

// ─── Module-level constants ──────────────────────────────────────────────────

const PLATFORMS: Record<PlatformKey, PlatformData> = {
    ios: {
        label: 'iOS', desc: 'iPhone & iPad',
        steps: [
            { title: 'Установите Happ', text: 'Скачайте приложение из App Store — это бесплатно и займёт меньше минуты.', action: 'Открыть App Store' },
            { title: 'Импортируйте профиль',  text: 'Нажмите на кнопку для перехода в приложение — сервера добавятся автоматически.',          action: 'Добавить подписку' },
        ],
    },
    android: {
        label: 'Android', desc: 'Смартфоны',
        steps: [
            { title: 'Установите Happ', text: 'Скачайте приложение из Google Play или RuStore.',                               action: 'Открыть Google Play' },
            { title: 'Импортируйте профиль',  text: 'Нажмите на кнопку для перехода в приложение — сервера добавятся автоматически.',          action: 'Добавить подписку' },
        ],
    },
    other: {
        label: 'Другое', desc: 'PC & macOS',
        steps: [
            { title: 'Скопируйте ссылку',    text: 'Эта ссылка-подписка подходит для Windows, macOS и Linux.',                                  action: 'Скопировать ссылку' },
            { title: 'Импортируйте профиль',  text: 'Используйте скопированную ссылку в вашем VPN-клиенте на ПК или Mac.',          action: 'Я импортировал' },
        ],
    },
};

const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];
const DOTS = [0, 1, 2, 3] as const;

const SLIDE_TRANSITION: Transition = { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 };
const TAP_TRANSITION:   Transition = { type: 'spring', stiffness: 400, damping: 22 };

const slideVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? typeof window !== 'undefined' ? window.innerWidth : 400 : typeof window !== 'undefined' ? -window.innerWidth : -400,
        z: 0
    }),
    exit: (dir: number) => ({
        x: dir > 0 ? typeof window !== 'undefined' ? -window.innerWidth : -400 : typeof window !== 'undefined' ? window.innerWidth : 400,
        z: 0
    }),
    center: {
        x: 0,
        z: 0
    },
};

const forceGPU = (transform: TransformProperties, generatedTransform: string) =>
    `${generatedTransform} translateZ(0)`;

const gpuStyle = {
    willChange: 'transform, opacity',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    transform: 'translateZ(0)',
    perspective: '1000px',
} as const;

// ─── Telegram deep-link redirect fix ────────────────────────────────────────
// WebView в Telegram блокирует любые протоколы, отличные от http и https.
// Чтобы обойти это, используем локальный редиректор cl.html, который
// открывается во внешнем браузере через Telegram.WebApp.openLink.

function withRedirectPage(deepLink: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/cl.html?url=${encodeURIComponent(deepLink)}`;
}

type TelegramWebApp = { openLink?: (url: string, options?: { try_browser?: boolean }) => void };

function getTelegramWebApp(): TelegramWebApp | undefined {
    return (window as any).Telegram?.WebApp;
}

// ─── Navigation reducer ──────────────────────────────────────────────────────

type NavState  = { platform: PlatformKey | null; stepIndex: number; direction: number; showQr: boolean; qrOriginIndex: number | null; };
type NavAction =
    | { type: 'SELECT'; platform: PlatformKey }
    | { type: 'NEXT' }
    | { type: 'BACK' }
    | { type: 'SET_STEP'; index: number }
    | { type: 'SHOW_QR'; originIndex: number }
    | { type: 'HIDE_QR'; toSuccess?: boolean }
    | { type: 'RESET' };

const NAV_INITIAL: NavState = { platform: null, stepIndex: 0, direction: 1, showQr: false, qrOriginIndex: null };

function navReducer(s: NavState, a: NavAction): NavState {
    switch (a.type) {
        case 'SELECT': return { ...s, platform: a.platform, stepIndex: 0, direction: 1, showQr: false };
        case 'NEXT':   return { ...s, stepIndex: s.stepIndex + 1, direction: 1, showQr: false };
        case 'BACK':
            if (s.showQr) {
                return { ...s, showQr: false, direction: -1, qrOriginIndex: null };
            }
            if (s.qrOriginIndex !== null && s.stepIndex === (PLATFORMS[s.platform!]?.steps.length ?? 0)) {
                // Return to QR from success if we came from QR
                return { ...s, showQr: true, direction: -1, stepIndex: s.qrOriginIndex };
            }
            return s.stepIndex === 0
                ? { ...s, platform: null, stepIndex: 0, direction: -1 }
                : { ...s, stepIndex: s.stepIndex - 1, direction: -1 };
        case 'SET_STEP':
            return { ...s, stepIndex: a.index, direction: a.index > s.stepIndex ? 1 : -1, showQr: false };
        case 'SHOW_QR':
            return { ...s, showQr: true, direction: 1, qrOriginIndex: a.originIndex };
        case 'HIDE_QR':
            return { 
                ...s, 
                showQr: false, 
                direction: a.toSuccess ? 1 : -1,
                stepIndex: a.toSuccess ? (PLATFORMS[s.platform!]?.steps.length ?? 0) : s.stepIndex 
            };
        case 'RESET':  return NAV_INITIAL;
    }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IosIcon = memo(() => (
    <svg viewBox="0 0 814 1000" className="w-6 h-6 fill-white opacity-90">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
));
IosIcon.displayName = 'IosIcon';

const AndroidIcon = memo(() => (
    <svg viewBox="0 0 553 553" className="w-6 h-6 fill-white opacity-80">
        <path d="M76.774,179.141c-9.529,0-17.614,3.323-24.26,9.969c-6.646,6.646-9.97,14.621-9.97,23.929v142.914c0,9.541,3.323,17.619,9.97,24.266c6.646,6.646,14.731,9.97,24.26,9.97c9.522,0,17.558-3.323,24.101-9.97c6.53-6.646,9.804-14.725,9.804-24.266V213.039c0-9.309-3.323-17.283-9.97-23.929C94.062,182.464,86.082,179.141,76.774,179.141z"/>
        <path d="M351.972,50.847L375.57,7.315c1.549-2.882,0.998-5.092-1.658-6.646c-2.883-1.34-5.098-0.661-6.646,1.989l-23.928,43.88c-21.055-9.309-43.324-13.972-66.807-13.972c-23.488,0-45.759,4.664-66.806,13.972l-23.929-43.88c-1.555-2.65-3.77-3.323-6.646-1.989c-2.662,1.561-3.213,3.764-1.658,6.646l23.599,43.532c-23.929,12.203-42.987,29.198-57.167,51.022c-14.18,21.836-21.273,45.698-21.273,71.628h307.426c0-25.924-7.094-49.787-21.273-71.628C394.623,80.045,375.675,63.05,351.972,50.847z M215.539,114.165c-2.552,2.558-5.6,3.831-9.143,3.831c-3.55,0-6.536-1.273-8.972-3.831c-2.436-2.546-3.654-5.582-3.654-9.137c0-3.543,1.218-6.585,3.654-9.137c2.436-2.546,5.429-3.819,8.972-3.819s6.591,1.273,9.143,3.819c2.546,2.558,3.825,5.594,3.825,9.137C219.357,108.577,218.079,111.619,215.539,114.165z M355.625,114.165c-2.441,2.558-5.434,3.831-8.971,3.831c-3.551,0-6.598-1.273-9.145-3.831c-2.551-2.546-3.824-5.582-3.824-9.137c0-3.543,1.218-6.585,3.824-9.137c2.547-2.546,5.594-3.819,9.145-3.819c3.543,0,6.529,1.273,8.971,3.819c2.438,2.558,3.654,5.594,3.654,9.137C359.279,108.577,358.062,111.619,355.625,114.165z"/>
        <path d="M123.971,406.804c0,10.202,3.543,18.838,10.63,25.925c7.093,7.087,15.729,10.63,25.924,10.63h24.596l0.337,75.454c0,9.528,3.323,17.619,9.969,24.266s14.627,9.97,23.929,9.97c9.523,0,17.613-3.323,24.26-9.97s9.97-14.737,9.97-24.266v-75.447h45.864v75.447c0,9.528,3.322,17.619,9.969,24.266s14.73,9.97,24.26,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.737,9.969-24.266v-75.447h24.928c9.969,0,18.494-3.544,25.594-10.631c7.086-7.087,10.631-15.723,10.631-25.924V185.45H123.971V406.804z"/>
        <path d="M476.275,179.141c-9.309,0-17.283,3.274-23.93,9.804c-6.646,6.542-9.969,14.578-9.969,24.094v142.914c0,9.541,3.322,17.619,9.969,24.266s14.627,9.97,23.93,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.725,9.969-24.266V213.039c0-9.517-3.322-17.552-9.969-24.094C493.888,182.415,485.798,179.141,476.275,179.141z"/>
    </svg>
));
AndroidIcon.displayName = 'AndroidIcon';

const GlobeIcon = memo(() => (
    <svg viewBox="0 0 16 16" className="w-6 h-6 fill-zinc-400 opacity-80">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a40 40 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" />
    </svg>
));
GlobeIcon.displayName = 'GlobeIcon';

const PLATFORM_ICONS: Record<PlatformKey, React.ComponentType> = {
    ios: IosIcon, android: AndroidIcon, other: GlobeIcon,
};

const Chevron = memo(({ dir = 'right', className = '' }: { dir?: 'left' | 'right'; className?: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
));
Chevron.displayName = 'Chevron';

// ─── PlatformButton ──────────────────────────────────────────────────────────

interface PlatformButtonProps { platformKey: PlatformKey; onSelect: (k: PlatformKey) => void; }

const PlatformButton = memo(({ platformKey, onSelect }: PlatformButtonProps) => {
    const { label, desc } = PLATFORMS[platformKey];
    const Icon = PLATFORM_ICONS[platformKey];
    const handleClick = useCallback(() => onSelect(platformKey), [platformKey, onSelect]);

    return (
        <motion.button
            onClick={handleClick}
            whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }}
            transition={TAP_TRANSITION}
            style={gpuStyle}
            className={`relative overflow-hidden bg-zinc-800/50 rounded-3xl p-5 flex flex-col items-start justify-between min-h-[160px] ${platformKey === 'other' ? 'col-span-2' : ''}`}
        >
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                <Icon />
            </div>
            <div className="flex flex-col items-start gap-1">
                <span className="text-2xl font-bold text-white leading-none">{label}</span>
                <span className="text-zinc-500 text-sm font-medium leading-none">{desc}</span>
            </div>
            <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <Chevron className="text-zinc-400 w-4 h-4" />
            </div>
        </motion.button>
    );
});
PlatformButton.displayName = 'PlatformButton';

// ─── PlatformSelect ──────────────────────────────────────────────────────────

const PlatformSelect = memo(({ onSelect }: { onSelect: (k: PlatformKey) => void }) => (
    <div className="h-full flex flex-col px-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
            {PLATFORM_KEYS.map((key) => (
                <PlatformButton key={key} platformKey={key} onSelect={onSelect} />
            ))}
        </div>
    </div>
));
PlatformSelect.displayName = 'PlatformSelect';

// ─── QrScreen ──────────────────────────────────────────────────────────────

const QrScreen = memo(({ url, onNext }: { url: string; onNext: () => void }) => (
    <div className="h-full flex flex-col px-4 pt-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-10">
            <div className="bg-white p-6 rounded-4xl shadow-2xl shadow-white/5 gpu">
                <QRCodeSVG
                    value={url}
                    size={220}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                        src: "/favicon.ico",
                        x: undefined,
                        y: undefined,
                        height: 44,
                        width: 44,
                        excavate: true,
                    }}
                />
            </div>
            <p className="text-zinc-500 text-lg font-medium leading-tight max-w-[280px]">
                Отсканируйте этот код в приложении для импорта профиля.
            </p>
        </div>
        <div className="h-[140px] flex flex-col justify-end pb-4">
            <motion.button
                onClick={onNext} whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }}
                transition={TAP_TRANSITION} style={gpuStyle}
                className="w-full rounded-3xl py-4 bg-white text-xl text-black font-semibold"
            >
                Далее
            </motion.button>
        </div>
    </div>
));
QrScreen.displayName = 'QrScreen';

// ─── SuccessScreen ───────────────────────────────────────────────────────────

const SuccessScreen = memo(() => (
    <div className="h-full flex flex-col px-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <DotLottieReact
                src="/animations/heart.json"
                loop
                autoplay
                className="w-32 h-32 pointer-events-none gpu"
            />
            <div className="flex flex-col gap-4">
                <h2 className="text-4xl font-semibold text-white leading-none">Готово!</h2>
                <p className="text-zinc-500 text-lg font-medium leading-none">
                    Подписка успешно добавлена.<br />Теперь вы можете включить VPN.
                </p>
            </div>
        </div>
        <div className="h-[140px] flex flex-col justify-end pb-4">
            <Drawer.Close asChild>
                <motion.button
                    whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }} transition={TAP_TRANSITION} style={gpuStyle}
                    className="w-full relative rounded-3xl py-4 bg-white text-xl text-black font-semibold"
                >
                    Закрыть
                </motion.button>
            </Drawer.Close>
        </div>
    </div>
));
SuccessScreen.displayName = 'SuccessScreen';

// ─── StepScreen ──────────────────────────────────────────────────────────────

interface StepScreenProps {
    currentStep: Step;
    stepIndex: number;
    platform: PlatformKey;
    isCopied: boolean;
    onAction: () => void;
    onSkip: () => void;
    onShowQr?: () => void;
}

const StepScreen = memo(({ currentStep, stepIndex, platform, isCopied, onAction, onSkip, onShowQr }: StepScreenProps) => (
    <div className="h-full flex flex-col px-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <h2 className="text-4xl font-semibold text-white leading-none">{currentStep.title}</h2>
            <p className="text-zinc-500 text-lg font-medium leading-none max-w-[280px]">{currentStep.text}</p>
        </div>
        <div className="h-[140px] flex flex-col justify-end gap-2 pb-4">
            <motion.button
                onClick={onAction}
                whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }}
                animate={{ backgroundColor: isCopied ? '#d1d5db' : '#ffffff', color: '#000000' }}
                transition={{ duration: 0.1 }}
                style={gpuStyle}
                className="w-full rounded-3xl py-4 text-xl font-semibold flex items-center justify-center gap-2 overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {isCopied ? (
                        <motion.div
                            key="check"
                            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -15, opacity: 0 }} transition={{ duration: 0.1 }}
                            className="flex items-center gap-2"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Скопировано
                        </motion.div>
                    ) : (
                        <motion.span
                            key="text"
                            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -15, opacity: 0 }} transition={{ duration: 0.1 }}
                        >
                            {currentStep.action}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {platform === 'other' && onShowQr && (
                <motion.button
                    onClick={onShowQr} whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }}
                    transition={TAP_TRANSITION} style={gpuStyle}
                    className="w-full rounded-3xl py-4 bg-zinc-800 text-xl text-white font-semibold flex items-center justify-center gap-2"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="5" height="5" x="3" y="3" rx="1" />
                        <rect width="5" height="5" x="16" y="3" rx="1" />
                        <rect width="5" height="5" x="3" y="16" rx="1" />
                        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                        <path d="M21 21v.01" />
                        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                        <path d="M3 12h.01" />
                        <path d="M12 3h.01" />
                        <path d="M12 16v.01" />
                        <path d="M16 12h1" />
                        <path d="M21 12v.01" />
                        <path d="M12 21v-1" />
                    </svg>
                    Открыть QR
                </motion.button>
            )}

            {stepIndex === 0 && (platform === 'ios' || platform === 'android') && (
                <motion.button
                    onClick={onSkip} whileTap={{ scale: 0.97, filter: 'brightness(0.85)' }}
                    transition={TAP_TRANSITION} style={gpuStyle}
                    className="w-full rounded-3xl py-4 bg-zinc-800 text-xl text-white font-semibold"
                >
                    Уже установлен
                </motion.button>
            )}
        </div>
    </div>
));
StepScreen.displayName = 'StepScreen';


interface ConnectionDrawerProps {
    subscriptionUrl?: string;
}

export function ConnectionDrawer({ subscriptionUrl = 'vless://hazeevpn-v2-subscription-link' }: ConnectionDrawerProps) {
    const [nav, dispatch] = useReducer(navReducer, NAV_INITIAL);
    const [isCopied, setIsCopied] = useState(false);
    const isBusyRef = useRef(false);

    const steps       = nav.platform ? PLATFORMS[nav.platform].steps : null;
    const isSuccess   = steps !== null && nav.stepIndex === steps.length;
    const currentStep = steps?.[nav.stepIndex] ?? null;
    const activeDot   = nav.platform === null ? 0 : nav.stepIndex + 1;
    const pageKey     = nav.showQr 
        ? 'qr' 
        : (nav.platform === null
            ? 'select'
            : (isSuccess ? 'success' : `${nav.platform}-${nav.stepIndex}`));

    const withGuard = useCallback((fn: () => void) => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;
        fn();
        setTimeout(() => { isBusyRef.current = false; }, 400);
    }, []);

    const selectPlatform = useCallback(
        (key: PlatformKey) => withGuard(() => dispatch({ type: 'SELECT', platform: key })),
        [withGuard]
    );
    const goNext = useCallback(
        () => withGuard(() => dispatch({ type: 'NEXT' })),
        [withGuard]
    );
    const goBack = useCallback(
        () => withGuard(() => dispatch({ type: 'BACK' })),
        [withGuard]
    );

    const handleAction = useCallback(() => {
        if (isBusyRef.current) return;
        const action = currentStep?.action;

        if (action === 'Скопировать ссылку') {
            isBusyRef.current = true;
            navigator.clipboard.writeText(subscriptionUrl);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
                isBusyRef.current = false;
                dispatch({ type: 'NEXT' });
            }, 400);
            return;
        }

        if (action === 'Открыть App Store') {
            window.open('https://apps.apple.com/app/v2raytun/id6476628951', '_blank');
        } else if (action === 'Открыть Google Play') {
            window.open('https://play.google.com/store/apps/details?id=com.happproxy', '_blank');
        } else if (action === 'Добавить подписку' || action === 'Я импортировал') {
            // Используем протоколы приложений (happ://)
            const deepLink = `happ://add/${subscriptionUrl}`;
            
            const finalLink = nav.platform === 'other' ? subscriptionUrl : deepLink;
            const redirectUrl = withRedirectPage(finalLink);

            const tg = getTelegramWebApp();
            
            // Если это действие 'Я импортировал', просто идем дальше
            if (action === 'Я импортировал') {
                withGuard(() => dispatch({ type: 'NEXT' }));
                return;
            }

            // Иначе открываем ссылку
            if (tg?.openLink && !finalLink.startsWith('http')) {
                tg.openLink(redirectUrl, { try_browser: true });
            } else if (tg?.openLink && finalLink.startsWith('http')) {
                tg.openLink(finalLink, { try_browser: true });
            } else {
                window.location.href = finalLink;
            }
            
            withGuard(() => dispatch({ type: 'NEXT' }));
        } else {
            withGuard(() => dispatch({ type: 'NEXT' }));
        }
    }, [currentStep?.action, subscriptionUrl, nav.platform, withGuard]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) setTimeout(() => {
            dispatch({ type: 'RESET' });
            setIsCopied(false);
            isBusyRef.current = false;
        }, 300);
    }, []);

    return (
        <Drawer.Root shouldScaleBackground onOpenChange={handleOpenChange}>
            <Drawer.Trigger asChild>
                <motion.button
                    whileTap={{ scale: 0.95, filter: 'brightness(0.85)' }}
                    transition={TAP_TRANSITION}
                    style={gpuStyle}
                    className="flex items-center justify-center relative w-full gap-3 rounded-3xl py-3.5 bg-white text-2xl text-black font-semibold overflow-hidden group"
                >
                    Подключиться
                    <DotLottieReact src={"/animations/rocket.json"} loop autoplay className="w-8 h-8 pointer-events-none gpu" />

                </motion.button>
            </Drawer.Trigger>

            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/80 z-[4000] gpu" />
                <Drawer.Content className="z-[5000] rounded-t-4xl flex flex-col gap-4 p-4 bg-zinc-950 h-[80dvh] fixed bottom-0 left-0 right-0 outline-none overflow-hidden gpu">
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-600 flex-shrink-0 mt-1" />
                    <Drawer.Title className="sr-only">
                        {nav.platform ? PLATFORMS[nav.platform].label : 'Подключение'}
                    </Drawer.Title>

                    {/* Progress */}
                    <div className="relative flex items-center justify-center flex-shrink-0 pt-2">
                        <motion.button
                            onClick={goBack} aria-label="Назад"
                            whileTap={{ scale: 0.9, filter: 'brightness(0.85)'  }} transition={TAP_TRANSITION} style={gpuStyle}
                            className={`absolute left-0 p-2 rounded-full bg-zinc-800 text-white transition-opacity duration-200 ${nav.platform === null ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <Chevron dir="left" />
                        </motion.button>
                        <div className="flex gap-2">
                            {DOTS.map((i) => (
                                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeDot ? 'w-6 bg-white' : 'w-1.5 bg-zinc-700'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Slide container */}
                    <div className="relative flex-1 overflow-hidden" style={{ perspective: 1000, transformStyle: 'preserve-3d' }}>
                        <AnimatePresence initial={false} custom={nav.direction}>
                            <motion.div
                                key={pageKey}
                                custom={nav.direction}
                                variants={slideVariants}
                                transformTemplate={forceGPU}
                                initial="enter" animate="center" exit="exit"
                                transition={SLIDE_TRANSITION}
                                className="absolute inset-0"
                                style={gpuStyle}
                            >
                                {nav.showQr ? (
                                    <QrScreen 
                                        url={subscriptionUrl} 
                                        onNext={() => withGuard(() => dispatch({ type: 'HIDE_QR', toSuccess: true }))} 
                                    />
                                ) : nav.platform === null ? (
                                    <PlatformSelect onSelect={selectPlatform} />
                                ) : isSuccess ? (
                                    <SuccessScreen />
                                ) : (
                                    <StepScreen
                                        currentStep={currentStep!}
                                        stepIndex={nav.stepIndex}
                                        platform={nav.platform}
                                        isCopied={isCopied}
                                        onAction={handleAction}
                                        onSkip={goNext}
                                        onShowQr={() => withGuard(() => dispatch({ type: 'SHOW_QR', originIndex: nav.stepIndex }))}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}