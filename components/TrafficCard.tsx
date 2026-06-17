'use client';

import { memo, useEffect, useRef } from 'react';
import { animate, motion } from 'framer-motion';

interface TrafficCardProps { totalGb: number; usedGb: number; incomingGb: number; outgoingGb: number; isUnlimited?: boolean; }

const CIRCLE_R = 40;

export const TrafficCard = memo(({ totalGb, usedGb, incomingGb, outgoingGb, isUnlimited }: TrafficCardProps) => {
    const percent    = isUnlimited ? 0 : Math.round((usedGb / totalGb) * 100);
    const counterRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!counterRef.current) return;
        if (isUnlimited) {
            counterRef.current.textContent = '∞';
            return;
        }
        counterRef.current.textContent = '0%';
        const ctrl = animate(0, percent, {
            duration: 0.8,
            onUpdate: (v) => {
                if (counterRef.current) counterRef.current.textContent = `${Math.round(v)}%`;
            },
        });
        return ctrl.stop;
    }, [percent, isUnlimited]);

    return (
        <div className="relative w-full shadow-2xl shadow-black bg-zinc-900 mt-4 rounded-3xl p-5 xss:pl-3 will-change-transform [transform:translateZ(0)]">
            <div className="relative flex items-center gap-5">
                <div className="relative flex-shrink-0 w-[84px] h-[84px]">
                    <svg width="84" height="84" viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            <linearGradient id="trafficGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%"   stopColor="#5227FF" />
                                <stop offset="100%" stopColor="#00eb00" />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r={CIRCLE_R} fill="none" stroke="#27272a" strokeWidth="9" />
                        <motion.circle
                            cx="50" cy="50" r={CIRCLE_R}
                            fill="none" stroke="url(#trafficGrad)" strokeWidth="9"
                            strokeLinecap="round" transform="rotate(-90 50 50)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: percent / 100 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span ref={counterRef} className="text-white text-sm font-bold" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-white text-[26px] leading-none font-bold">{usedGb}</span>
                        <span className="text-zinc-400 text-sm font-medium">/ {isUnlimited ? '∞' : `${totalGb} ГБ`}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-500 text-[11px] font-semibold">Входящий ↓</span>
                            <span className="text-zinc-200 text-sm font-semibold">{incomingGb} ГБ</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-500 text-[11px] font-semibold">Исходящий ↑</span>
                            <span className="text-zinc-200 text-sm font-semibold">{outgoingGb} ГБ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
TrafficCard.displayName = 'TrafficCard';
