"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseService = exports.SupabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
class SupabaseService {
    constructor() {
        if (!config_1.config.SUPABASE_URL || !config_1.config.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }
        this.client = (0, supabase_js_1.createClient)(config_1.config.SUPABASE_URL, config_1.config.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        logger_1.logger.info('Supabase client initialized successfully');
    }
    static getInstance() {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }
    getClient() {
        return this.client;
    }
    async authenticateUser(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                logger_1.logger.warn('Authentication failed:', { email, error: error.message });
                return { success: false, error: error.message };
            }
            if (!data.user) {
                logger_1.logger.warn('No user data returned from authentication:', { email });
                return { success: false, error: 'Authentication failed' };
            }
            logger_1.logger.info('User authenticated successfully:', {
                userId: data.user.id,
                email: data.user.email
            });
            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    emailVerified: data.user.email_confirmed_at ? true : false,
                    lastSignIn: data.user.last_sign_in_at,
                    userMetadata: data.user.user_metadata
                },
                session: data.session
            };
        }
        catch (error) {
            logger_1.logger.error('Unexpected error during authentication:', error);
            return { success: false, error: 'Internal server error' };
        }
    }
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.client.auth.admin.listUsers();
            if (error) {
                logger_1.logger.warn('Error fetching users:', { error: error.message });
                return { success: false, error: error.message };
            }
            const user = data.users.find((u) => u.email === email);
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            return {
                success: true,
                user: user
            };
        }
        catch (error) {
            logger_1.logger.error('Unexpected error fetching user by email:', error);
            return { success: false, error: 'Internal server error' };
        }
    }
    async verifyToken(token) {
        try {
            const { data, error } = await this.client.auth.getUser(token);
            if (error) {
                logger_1.logger.warn('Token verification failed:', { error: error.message });
                return { success: false, error: error.message };
            }
            return {
                success: true,
                user: data.user
            };
        }
        catch (error) {
            logger_1.logger.error('Unexpected error during token verification:', error);
            return { success: false, error: 'Internal server error' };
        }
    }
}
exports.SupabaseService = SupabaseService;
exports.supabaseService = SupabaseService.getInstance();
//# sourceMappingURL=supabase-service.js.map