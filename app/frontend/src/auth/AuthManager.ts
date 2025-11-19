import { ApiService } from '../utils/ApiService';

export interface User {
    id: string;
    email: string;
    name?: string;
    authMethods: string[];
    totpEnabled?: boolean;
    googleLinked?: boolean;
}

export interface TotpSetupResult {
    secret: string;
    qr: string;
}

export class AuthManager {
    private apiService: ApiService;
    private currentUser: User | null = null;
    private totpSecret: string | null = null;
    private tempUserId: string | null = null; // For TOTP login flow

    constructor() {
        this.apiService = new ApiService();
    }

    /**
     * Check if user is currently authenticated
     */
    async checkAuthStatus(): Promise<boolean> {
        try {
            const response = await this.apiService.get('/api/auth/me');
            if (response.ok) {
                this.currentUser = await response.json();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth status check failed:', error);
            return false;
        }
    }

    /**
     * Login with email and password
     */
    async loginWithPassword(email: string, password: string): Promise<boolean | 'totp-required'> {
        try {
            const response = await this.apiService.post('/api/auth/login', {
                email,
                password
            });

            if (response.ok) {
                const data = await response.json();
                
                // Check if TOTP is required
                if (data.requiresTotp) {
                    // Store temp data for TOTP verification
                    this.tempUserId = data.userId;
                    return 'totp-required';
                }
                
                this.currentUser = data.user;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Password login failed:', error);
            throw error;
        }
    }

    /**
     * Complete login with TOTP token after password verification
     */
    async loginWithTotp(totpToken: string): Promise<boolean> {
        if (!this.tempUserId) {
            throw new Error('No pending TOTP login. Please login with password first.');
        }

        try {
            const response = await this.apiService.post('/api/auth/totp/verify-login', {
                userId: this.tempUserId,
                totpToken
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.tempUserId = null; // Clear temp data
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('TOTP login failed:', error);
            throw error;
        }
    }

    /**
     * Initiate Google OAuth login
     */
    loginWithGoogle(): void {
        // Redirect to Google OAuth endpoint
        window.location.href = '/api/auth/oauth/google';
    }

    /**
     * Generate TOTP secret and QR code
     */
    async generateTotpSecret(): Promise<TotpSetupResult | null> {
        try {
            const response = await this.apiService.post('/api/auth/totp/setup', {});
            
            if (response.ok) {
                const data = await response.json();
                this.totpSecret = data.secret;
                return {
                    secret: data.secret,
                    qr: data.qrCode // Backend returns 'qrCode', not 'qr'
                };
            }
            
            return null;
        } catch (error) {
            console.error('TOTP setup failed:', error);
            throw error;
        }
    }

    /**
     * Verify TOTP token and complete setup/login
     */
    async verifyTotpToken(token: string): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/totp/verify', {
                token,
                secret: this.totpSecret
            });

            if (response.ok) {
                // Update current user TOTP status locally
                if (this.currentUser) {
                    this.currentUser.totpEnabled = true;
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('TOTP verification failed:', error);
            throw error;
        }
    }

    /**
     * Register new user with email and password
     */
    async register(email: string, password: string, name?: string): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/register', {
                email,
                password,
                name
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        try {
            await this.apiService.post('/api/auth/logout', {});
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            // Clear local state regardless of API call result
            this.currentUser = null;
            this.totpSecret = null;
            
            // Clear any stored tokens/sessions
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Get available authentication methods for current user
     */
    getAuthMethods(): string[] {
        return this.currentUser?.authMethods || [];
    }

    /**
     * Check if TOTP is enabled for current user
     */
    isTotpEnabled(): boolean {
        return this.currentUser?.totpEnabled || false;
    }

    /**
     * Enable TOTP for current user
     */
    async enableTotp(): Promise<TotpSetupResult | null> {
        if (!this.isAuthenticated()) {
            throw new Error('User must be authenticated to enable TOTP');
        }

        return this.generateTotpSecret();
    }

    /**
     * Disable TOTP for current user
     */
    async disableTotp(): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/totp/disable', {});
            
            if (response.ok && this.currentUser) {
                this.currentUser.totpEnabled = false;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('TOTP disable failed:', error);
            throw error;
        }
    }

    /**
     * Change password for current user
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            });

            return response.ok;
        } catch (error) {
            console.error('Password change failed:', error);
            throw error;
        }
    }

    /**
     * Link Google account to current user
     */
    linkGoogleAccount(): void {
        if (!this.isAuthenticated()) {
            throw new Error('User must be authenticated to link Google account');
        }
        
        // Redirect to Google OAuth linking endpoint
        window.location.href = '/api/auth/oauth/google/link';
    }

    /**
     * Unlink Google account from current user
     */
    async unlinkGoogleAccount(): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/oauth/google/unlink', {});
            
            if (response.ok && this.currentUser) {
                this.currentUser.googleLinked = false;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Google account unlink failed:', error);
            throw error;
        }
    }

    /**
     * Get user profile information
     */
    async getUserProfile(): Promise<User | null> {
        try {
            const response = await this.apiService.get('/api/auth/me');
            
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                return user;
            }
            
            return null;
        } catch (error) {
            console.error('Profile fetch failed:', error);
            throw error;
        }
    }

    /**
     * Update user profile information
     */
    async updateProfile(updates: Partial<Pick<User, 'name' | 'email'>>): Promise<boolean> {
        try {
            const response = await this.apiService.post('/api/auth/profile', updates);
            
            if (response.ok && this.currentUser) {
                Object.assign(this.currentUser, updates);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    }
}