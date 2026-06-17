import { WelcomeHeader } from "@/components/WelcomeHeader";
import { TrafficCard } from "@/components/TrafficCard";
import { ConnectionDrawer } from "@/components/ConnectionDrawer";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { getUserByShortUuid } from "@/lib/api";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ shortUuid: string }>;
    searchParams: Promise<{ name?: string }>;
}

export default async function UserPage({ params, searchParams }: PageProps) {
    const { shortUuid } = await params;
    const { name: urlName } = await searchParams;
    const user = await getUserByShortUuid(shortUuid);

    if (!user) {
        notFound();
    }

    const displayName = urlName || user.username;

    const totalGb = user.trafficLimitBytes > 0 
        ? Math.round(user.trafficLimitBytes / (1024 * 1024 * 1024)) 
        : 1000; // Default or unlimited
    
    const usedGb = Math.round(user.userTraffic.usedTrafficBytes / (1024 * 1024 * 1024));
    
    const statusColor = user.status === 'ACTIVE' ? '#00eb00' : user.status === 'EXPIRED' ? '#ff0000' : '#71717a';
    const statusText = user.status === 'ACTIVE' ? 'Активна' : user.status === 'EXPIRED' ? 'Истекла' : 'Отключена';

    const expireDate = user.expireAt
        ? new Date(user.expireAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Безлимит';

    return (
        <div className="relative h-[100dvh] w-full bg-black overflow-hidden select-none will-change-transform [transform:translateZ(0)]" data-vaul-drawer-wrapper="">
            <BackgroundEffects />

            <div className="relative z-10 flex h-full flex-col p-4 justify-between">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="pt-12 relative">
                    <WelcomeHeader username={displayName} />

                    <div className="w-full h-[84px] mt-8 rounded-3xl flex gap-3">
                        <div className="relative shadow-2xl shadow-black bg-zinc-800 rounded-2xl w-full h-full p-4 flex flex-col justify-between">
                            <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Статус</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                                <span className="text-white text-lg font-semibold">{statusText}</span>
                            </div>
                        </div>
                        <div className="relative shadow-2xl shadow-black bg-zinc-800 rounded-2xl w-full h-full p-4 flex flex-col justify-between">
                            <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Истекает</span>
                            <span className="text-white text-lg font-semibold">{expireDate}</span>
                        </div>
                    </div>

                    <TrafficCard 
                        totalGb={totalGb} 
                        usedGb={usedGb} 
                        incomingGb={usedGb} // Simplified since API doesn't provide split
                        outgoingGb={0} 
                        isUnlimited={user.trafficLimitBytes === 0}
                    />
                </div>

                {/* ── Drawer ────────────────────────────────────────── */}
                <div className="relative z-10 will-change-transform [transform:translateZ(0)]">
                    <ConnectionDrawer subscriptionUrl={user.subscriptionUrl} />
                </div>
            </div>
        </div>
    );
}
