import { WelcomeHeader } from "@/components/WelcomeHeader";
import { TrafficCard } from "@/components/TrafficCard";
import { ConnectionDrawer } from "@/components/ConnectionDrawer";
import { BackgroundEffects } from "@/components/BackgroundEffects";

export default function Home() {
    return (
        <div className="relative h-[100dvh] w-full bg-black overflow-hidden select-none gpu" data-vaul-drawer-wrapper="">
            <BackgroundEffects />

            <div className="relative z-10 flex h-full flex-col p-4 justify-between">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="pt-12 relative">
                    <WelcomeHeader />

                    <div className="w-full h-[84px] mt-8 rounded-3xl flex gap-3">
                        <div className="relative shadow-2xl shadow-black bg-zinc-800 rounded-2xl w-full h-full p-4 flex flex-col justify-between">
                            <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Статус</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#00eb00]" />
                                <span className="text-white text-lg font-semibold">Активна</span>
                            </div>
                        </div>
                        <div className="relative shadow-2xl shadow-black bg-zinc-800 rounded-2xl w-full h-full p-4 flex flex-col justify-between">
                            <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Истекает</span>
                            <span className="text-white text-lg font-semibold">14 янв 2026</span>
                        </div>
                    </div>

                    <TrafficCard totalGb={500} usedGb={300} incomingGb={187} outgoingGb={113} />
                </div>

                {/* ── Drawer ────────────────────────────────────────── */}
                <div className="relative z-10 will-change-transform [transform:translateZ(0)]">
                    <ConnectionDrawer />
                </div>
            </div>
        </div>
    );
}
