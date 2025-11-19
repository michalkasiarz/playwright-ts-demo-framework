import { AuthManager } from './auth/AuthManager';
import { ComponentRenderer } from './components/ComponentRenderer';
import { Dashboard } from './pages/Dashboard';
import './styles/main.css';

class Application {
    private authManager: AuthManager;
    private componentRenderer: ComponentRenderer;
    private dashboard: Dashboard;

    constructor() {
        this.authManager = new AuthManager();
        this.componentRenderer = new ComponentRenderer();
        this.dashboard = new Dashboard(this.authManager);
        
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            console.log('🚀 Initializing application...');
            
            // Handle client-side routing for OAuth callbacks
            this.handleRouting();
            
            // Optional: Clear auth state only in development or when URL param is present
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('logout') === 'true' || urlParams.get('clear') === 'true') {
                console.log('🧹 Clearing auth state due to URL parameter');
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                // Remove URL parameter
                window.history.replaceState({}, document.title, window.location.pathname);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Check if user is already authenticated
            const isAuthenticated = await this.authManager.checkAuthStatus();
            console.log('🔐 Authentication status:', isAuthenticated);
            
            if (isAuthenticated) {
                console.log('✅ User authenticated, showing dashboard');
                this.showDashboard();
            } else {
                console.log('❌ User not authenticated, showing auth forms');
                this.showAuthForms();
            }

            this.setupEventListeners();
        } catch (error) {
            console.error('❗ Failed to initialize application:', error);
        }
    }

    private showAuthForms(): void {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard');
        
        if (authContainer && dashboardContainer) {
            authContainer.classList.remove('hidden');
            dashboardContainer.classList.add('hidden');
        }

        this.renderAuthTabs();
    }

    private showDashboard(): void {
        console.log('📊 Showing dashboard...');
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard');
        
        console.log('📊 Auth container:', !!authContainer);
        console.log('📊 Dashboard container:', !!dashboardContainer);
        
        if (authContainer && dashboardContainer) {
            authContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
        }

        console.log('📊 Calling dashboard.render()...');
        this.dashboard.render().catch(error => {
            console.error('❗ Dashboard render failed:', error);
            // Show error in UI
            const dashboardContainer = document.getElementById('dashboard');
            if (dashboardContainer) {
                dashboardContainer.innerHTML = this.componentRenderer.renderError('Failed to load dashboard');
            }
        });
    }

    private renderAuthTabs(): void {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        authContainer.innerHTML = `
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="password">Password Login</button>
                <button class="auth-tab" data-tab="google">Google OAuth</button>
            </div>
            <div id="auth-forms">
                ${this.componentRenderer.renderPasswordForm()}
                ${this.componentRenderer.renderGoogleForm()}
            </div>
        `;

        this.setupTabSwitching();
        this.setupFormHandlers();
    }

    private setupTabSwitching(): void {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = (tab as HTMLElement).dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show corresponding form
                forms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tabType}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
    }

    private setupFormHandlers(): void {
        this.setupPasswordForm();
        this.setupRegisterForm();
        this.setupGoogleForm();
        this.setupModeToggle();
    }

    private setupPasswordForm(): void {
        const form = document.getElementById('password-form-element') as HTMLFormElement;
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            try {
                this.showMessage('Logging in...', 'info');
                const result = await this.authManager.loginWithPassword(email, password);
                
                if (result === 'totp-required') {
                    // Show TOTP input modal
                    this.showTotpLoginModal();
                } else if (result === true) {
                    this.showMessage('Login successful!', 'success');
                    setTimeout(() => this.showDashboard(), 1000);
                } else {
                    this.showMessage('Invalid email or password', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showMessage('Login failed. Please try again.', 'error');
            }
        });
    }

    private setupRegisterForm(): void {
        const form = document.getElementById('register-form-element') as HTMLFormElement;
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            const passwordConfirm = formData.get('passwordConfirm') as string;
            const name = formData.get('name') as string;

            if (password !== passwordConfirm) {
                this.showMessage('Passwords do not match', 'error');
                return;
            }

            try {
                this.showMessage('Creating account...', 'info');
                const success = await this.authManager.register(email, password, name);
                
                if (success) {
                    this.showMessage('Account created successfully!', 'success');
                    setTimeout(() => this.showDashboard(), 1000);
                } else {
                    this.showMessage('Registration failed. Email might already exist.', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.showMessage('Registration failed. Please try again.', 'error');
            }
        });
    }

    private setupModeToggle(): void {
        const loginBtn = document.getElementById('login-mode-btn');
        const registerBtn = document.getElementById('register-mode-btn');
        const loginForm = document.getElementById('password-form-element');
        const registerForm = document.getElementById('register-form-element');

        if (!loginBtn || !registerBtn || !loginForm || !registerForm) return;

        loginBtn.addEventListener('click', () => {
            // Active state
            loginBtn.style.background = '#007bff';
            loginBtn.style.color = 'white';
            // Inactive state
            registerBtn.style.background = 'transparent';
            registerBtn.style.color = '#666';
            
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        registerBtn.addEventListener('click', () => {
            // Active state
            registerBtn.style.background = '#007bff';
            registerBtn.style.color = 'white';
            // Inactive state
            loginBtn.style.background = 'transparent';
            loginBtn.style.color = '#666';
            
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }

    private setupGoogleForm(): void {
        const googleBtn = document.getElementById('google-login-btn');
        if (!googleBtn) return;

        googleBtn.addEventListener('click', () => {
            this.authManager.loginWithGoogle();
        });
    }

    private setupTotpForm(): void {
        // Setup TOTP generation
        const generateBtn = document.getElementById('generate-totp-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                try {
                    this.showMessage('Generating TOTP secret...', 'info');
                    const result = await this.authManager.generateTotpSecret();
                    
                    if (result) {
                        this.componentRenderer.displayTotpQR(result.secret, result.qr);
                        this.showMessage('Scan the QR code with your authenticator app', 'info');
                    }
                } catch (error) {
                    console.error('TOTP generation error:', error);
                    this.showMessage('Failed to generate TOTP secret', 'error');
                }
            });
        }

        // Setup TOTP verification
        const verifyForm = document.getElementById('totp-verify-form') as HTMLFormElement;
        if (verifyForm) {
            verifyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(verifyForm);
                const token = formData.get('totp-token') as string;

                try {
                    this.showMessage('Verifying TOTP token...', 'info');
                    const success = await this.authManager.verifyTotpToken(token);
                    
                    if (success) {
                        this.showMessage('TOTP verification successful!', 'success');
                        setTimeout(() => this.showDashboard(), 1000);
                    } else {
                        this.showMessage('Invalid TOTP token', 'error');
                    }
                } catch (error) {
                    console.error('TOTP verification error:', error);
                    this.showMessage('TOTP verification failed', 'error');
                }
            });
        }
    }

    private setupEventListeners(): void {
        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');
        
        if (authSuccess === 'success') {
            this.showMessage('OAuth login successful!', 'success');
            setTimeout(() => this.showDashboard(), 1000);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (authSuccess === 'failed') {
            this.showMessage('OAuth login failed', 'error');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Handle logout
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'logout-btn') {
                this.handleLogout();
            }
        });
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authManager.logout();
            this.showMessage('Logged out successfully', 'info');
            setTimeout(() => this.showAuthForms(), 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout failed', 'error');
        }
    }

    /**
     * Show TOTP verification modal for login
     */
    private showTotpLoginModal(): void {
        const modalHtml = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Two-Factor Authentication</h3>
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        Please enter the 6-digit code from your authenticator app.
                    </p>
                    
                    <form id="totp-login-form">
                        <div class="form-group">
                            <label>Authentication Code:</label>
                            <input type="text" name="totpToken" required maxlength="6" pattern="[0-9]{6}" 
                                   style="text-align: center; font-size: 1.5rem; letter-spacing: 0.25rem;" 
                                   placeholder="000000" autofocus>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary">Verify & Login</button>
                            <button type="button" class="btn" style="background: #6c757d; color: white;" 
                                    onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle form submission
        const form = document.getElementById('totp-login-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const totpToken = formData.get('totpToken') as string;

            if (!totpToken || totpToken.length !== 6) {
                this.showMessage('Please enter a valid 6-digit code', 'error');
                return;
            }

            try {
                const success = await this.authManager.loginWithTotp(totpToken);
                
                if (success) {
                    document.querySelector('.modal-overlay')?.remove();
                    this.showMessage('Login successful with 2FA!', 'success');
                    setTimeout(() => this.showDashboard(), 1000);
                } else {
                    this.showMessage('Invalid authentication code', 'error');
                }
            } catch (error) {
                console.error('TOTP login error:', error);
                this.showMessage('Authentication failed. Please try again.', 'error');
            }
        });
    }

    /**
     * Handle client-side routing for OAuth pages
     */
    private handleRouting(): void {
        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);

        // OAuth Success Page
        if (path === '/login-success.html' || path === '/login-success') {
            const email = urlParams.get('email') || 'Unknown';
            this.showOAuthSuccess(email);
            return;
        }

        // OAuth Failed Page  
        if (path === '/login-failed.html' || path === '/login-failed') {
            this.showOAuthFailed();
            return;
        }

        // Mock Google Auth Page
        if (path === '/mock-google-auth.html' || path === '/mock-google-auth') {
            this.showMockGoogleAuth();
            return;
        }
    }

    /**
     * Show OAuth success page
     */
    private showOAuthSuccess(email: string): void {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard');
        
        if (authContainer && dashboardContainer) {
            authContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
        }

        const content = this.componentRenderer.renderOAuthSuccess(email);
        document.getElementById('dashboard')!.innerHTML = content;
        
        // Auto redirect to dashboard after 3 seconds
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    /**
     * Show OAuth failed page  
     */
    private showOAuthFailed(): void {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard');
        
        if (authContainer && dashboardContainer) {
            authContainer.classList.remove('hidden');
            dashboardContainer.classList.add('hidden');
        }

        const content = this.componentRenderer.renderOAuthError();
        document.getElementById('auth-container')!.innerHTML = content;
    }

    /**
     * Show mock Google auth page
     */
    private showMockGoogleAuth(): void {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard');
        
        if (authContainer && dashboardContainer) {
            authContainer.classList.remove('hidden');
            dashboardContainer.classList.add('hidden');
        }

        const params = new URLSearchParams(window.location.search);
        const content = this.componentRenderer.renderMockOAuth(params.get('state') || '');
        document.getElementById('auth-container')!.innerHTML = content;
        
        this.setupMockOAuthListeners();
    }

    /**
     * Setup event listeners for mock OAuth page
     */
    private setupMockOAuthListeners(): void {
        const continueBtn = document.getElementById('mock-continue-btn');
        const userOptions = document.querySelectorAll('.mock-user-option');
        let selectedUser: any = null;

        userOptions.forEach(option => {
            option.addEventListener('click', () => {
                userOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                selectedUser = {
                    email: option.getAttribute('data-email'),
                    name: option.getAttribute('data-name'),
                    googleId: option.getAttribute('data-google-id')
                };
                
                if (continueBtn) {
                    continueBtn.removeAttribute('disabled');
                }
            });
        });

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                if (selectedUser) {
                    const params = new URLSearchParams(window.location.search);
                    const state = params.get('state') || '';
                    
                    const callbackUrl = `/api/auth/oauth/google/callback/mock?` +
                        `email=${encodeURIComponent(selectedUser.email)}&` +
                        `name=${encodeURIComponent(selectedUser.name)}&` +
                        `googleId=${encodeURIComponent(selectedUser.googleId)}&` +
                        `state=${state}`;
                    
                    window.location.href = callbackUrl;
                }
            });
        }
    }

    private showMessage(text: string, type: 'success' | 'error' | 'info'): void {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        // Insert at the top of auth-container or dashboard
        const container = document.querySelector('#auth-container:not(.hidden), #dashboard:not(.hidden)');
        if (container) {
            container.insertBefore(message, container.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                message.remove();
            }, 5000);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Application();
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});