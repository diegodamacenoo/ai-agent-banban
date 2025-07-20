import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService {
    private static instance;
    private client;
    private constructor();
    static getInstance(): SupabaseService;
    getClient(): SupabaseClient;
    authenticateUser(email: string, password: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        session?: undefined;
    } | {
        success: boolean;
        user: {
            id: string;
            email: string | undefined;
            emailVerified: boolean;
            lastSignIn: string | undefined;
            userMetadata: import("@supabase/supabase-js").UserMetadata;
        };
        session: import("@supabase/supabase-js").AuthSession;
        error?: undefined;
    }>;
    getUserByEmail(email: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("@supabase/supabase-js").AuthUser;
        error?: undefined;
    }>;
    verifyToken(token: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("@supabase/supabase-js").AuthUser;
        error?: undefined;
    }>;
}
export declare const supabaseService: SupabaseService;
//# sourceMappingURL=supabase-service.d.ts.map