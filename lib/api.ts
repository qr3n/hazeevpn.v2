export interface UserResponse {
    response: UserData;
}

export interface UserData {
    uuid: string;
    id: number;
    shortUuid: string;
    username: string | null;
    status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
    trafficLimitBytes: number;
    trafficLimitStrategy: string;
    expireAt: string | null;
    telegramId: number | null;
    email: string | null;
    description: string;
    tag: string | null;
    hwidDeviceLimit: number;
    externalSquadUuid: string | null;
    trojanPassword: string;
    vlessUuid: string;
    ssPassword: string;
    lastTriggeredThreshold: number;
    subRevokedAt: string | null;
    lastTrafficResetAt: string | null;
    createdAt: string;
    updatedAt: string;
    subscriptionUrl: string;
    activeInternalSquads: Array<{
        uuid: string;
        name: string;
    }>;
    userTraffic: {
        usedTrafficBytes: number;
        lifetimeUsedTrafficBytes: number;
        onlineAt: string | null;
        lastConnectedNodeUuid: string | null;
        firstConnectedAt: string | null;
    };
}

const API_TOKEN = process.env.HAZEE_API_TOKEN;

export async function getUserByShortUuid(shortUuid: string): Promise<UserData | null> {
    if (!API_TOKEN) {
        console.error('HAZEE_API_TOKEN is not defined');
        // Fallback for development if .env.local is not loaded yet in some environments
        // return null; 
    }

    try {
        const res = await fetch(`https://panel.hazeevpn.com/api/users/by-short-uuid/${shortUuid}`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            next: { revalidate: 60 }, // Cache for 1 minute
        });

        if (!res.ok) {
            console.error(`Failed to fetch user: ${res.status} ${res.statusText}`);
            return null;
        }

        const data: UserResponse = await res.json();
        return data.response;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}
