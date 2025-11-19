export class ComponentRenderer {
    
    /**
     * Render password login/register form
     */
    renderPasswordForm(): string {
        return `
            <div id="password-form" class="auth-form active">
                <h3>Email & Password Authentication</h3>
                
                <div class="auth-mode-toggle" style="margin-bottom: 1.5rem; display: flex; background: #f1f3f5; border-radius: 8px; padding: 4px;">
                    <button type="button" id="login-mode-btn" 
                            style="flex: 1; padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #007bff; color: white; font-weight: 500; cursor: pointer;">
                        Login
                    </button>
                    <button type="button" id="register-mode-btn" 
                            style="flex: 1; padding: 0.5rem 1rem; border: none; border-radius: 4px; background: transparent; color: #666; font-weight: 500; cursor: pointer;">
                        Register
                    </button>
                </div>

                <!-- Login Form -->
                <form id="password-form-element" class="password-mode active">
                    <div class="form-group">
                        <label for="login-email">Email Address</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            name="email" 
                            required 
                            placeholder="Enter your email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            name="password" 
                            required 
                            placeholder="Enter your password"
                        >
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Sign In
                    </button>
                </form>

                <!-- Register Form -->
                <form id="register-form-element" class="password-mode" style="display: none;">
                    <div class="form-group">
                        <label for="register-name">Full Name</label>
                        <input 
                            type="text" 
                            id="register-name" 
                            name="name" 
                            placeholder="Enter your full name"
                        >
                    </div>

                    <div class="form-group">
                        <label for="register-email">Email Address</label>
                        <input 
                            type="email" 
                            id="register-email" 
                            name="email" 
                            required 
                            placeholder="Enter your email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input 
                            type="password" 
                            id="register-password" 
                            name="password" 
                            required 
                            placeholder="Create a password"
                            minlength="6"
                        >
                    </div>

                    <div class="form-group">
                        <label for="register-password-confirm">Confirm Password</label>
                        <input 
                            type="password" 
                            id="register-password-confirm" 
                            name="passwordConfirm" 
                            required 
                            placeholder="Confirm your password"
                        >
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Create Account
                    </button>
                </form>

                <div style="text-align: center; margin-top: 1rem; color: #666;">
                    <small>Demo credentials: admin@example.com / password123</small>
                </div>
            </div>
        `;
    }

    /**
     * Render Google OAuth form
     */
    renderGoogleForm(): string {
        return `
            <div id="google-form" class="auth-form">
                <h3>Google OAuth Authentication</h3>
                
                <p style="color: #666; margin-bottom: 2rem;">
                    Sign in securely with your Google account. You'll be redirected to Google's authentication service.
                </p>
                
                <button id="google-login-btn" class="btn btn-google" style="width: 100%; padding: 1rem;">
                    <svg style="width: 20px; height: 20px; margin-right: 10px; vertical-align: middle;" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9ff; border-radius: 6px;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">How Google OAuth Works:</h4>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #666;">
                        <li>Click the button above to redirect to Google</li>
                        <li>Sign in with your Google credentials</li>
                        <li>Grant permission to access your basic profile</li>
                        <li>You'll be redirected back here, authenticated</li>
                    </ol>
                </div>
            </div>
        `;
    }

    /**
     * Render TOTP 2FA form
     */
    renderTotpForm(): string {
        return `
            <div id="totp-form" class="auth-form">
                <h3>TOTP Two-Factor Authentication</h3>
                
                <div class="totp-setup" id="totp-setup-section">
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        Set up two-factor authentication using an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
                    </p>
                    
                    <button id="generate-totp-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 1.5rem;">
                        Generate TOTP Secret
                    </button>
                    
                    <div id="qr-display" class="qr-container" style="display: none;">
                        <p><strong>Step 1:</strong> Scan this QR code with your authenticator app</p>
                        <div id="qr-code"></div>
                        <p style="margin-top: 1rem;"><strong>Secret Key:</strong></p>
                        <code id="totp-secret-display" style="word-break: break-all; background: #f1f1f1; padding: 0.5rem; border-radius: 4px; display: block;"></code>
                    </div>
                </div>
                
                <div class="totp-verify" id="totp-verify-section">
                    <form id="totp-verify-form">
                        <div class="form-group">
                            <label for="totp-token"><strong>Step 2:</strong> Enter the 6-digit code from your authenticator app</label>
                            <input 
                                type="text" 
                                id="totp-token" 
                                name="totp-token" 
                                required 
                                placeholder="123456"
                                maxlength="6"
                                pattern="[0-9]{6}"
                                style="text-align: center; font-size: 1.5rem; letter-spacing: 0.25rem;"
                            >
                        </div>
                        
                        <button type="submit" class="btn btn-success" style="width: 100%;">
                            Verify TOTP Code
                        </button>
                    </form>
                </div>
                
                <div style="margin-top: 2rem; padding: 1rem; background: #f8f9ff; border-radius: 6px;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">TOTP Authentication Process:</h4>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #666;">
                        <li>Install an authenticator app on your mobile device</li>
                        <li>Click "Generate TOTP Secret" to create a unique key</li>
                        <li>Scan the QR code or manually enter the secret key</li>
                        <li>Enter the 6-digit code from your authenticator app</li>
                        <li>Successfully complete the TOTP setup</li>
                    </ol>
                </div>
            </div>
        `;
    }

    /**
     * Display TOTP QR code and secret
     */
    displayTotpQR(secret: string, qrDataUrl: string): void {
        const qrDisplay = document.getElementById('qr-display');
        const qrCode = document.getElementById('qr-code');
        const secretDisplay = document.getElementById('totp-secret-display');
        
        if (qrDisplay && qrCode && secretDisplay) {
            // Show the QR section
            qrDisplay.style.display = 'block';
            
            // Display QR code
            qrCode.innerHTML = `<img src="${qrDataUrl}" alt="TOTP QR Code" style="max-width: 200px;">`;
            
            // Display secret key
            secretDisplay.textContent = secret;
        }
    }

    /**
     * Render user dashboard
     */
    renderDashboard(user: any): string {
        const authMethods = user.authMethods || [];
        const hasPassword = authMethods.includes('password');
        const hasGoogle = user.googleLinked || false; // Check googleLinked field instead
        const hasTOTP = user.totpEnabled;

        return `
            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h2>Welcome, ${user.name || user.email}!</h2>
                <p style="color: #666;">Manage your authentication methods and account settings.</p>
            </div>

            <div class="auth-methods-status" style="margin-bottom: 2rem;">
                <h3>Active Authentication Methods</h3>
                <div class="auth-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    
                    <!-- Password Status -->
                    <div class="auth-status-card" style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${hasPassword ? '#28a745' : '#dc3545'}; margin-right: 0.5rem;"></span>
                            Password Login
                        </h4>
                        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
                            ${hasPassword ? 'Email and password authentication is active.' : 'Email and password authentication is not set up.'}
                        </p>
                        ${hasPassword ? 
                            '<button class="btn" style="background: #ffc107; color: #000;" onclick="window.changePassword()">Change Password</button>' :
                            '<button class="btn btn-primary" onclick="window.setupPassword()">Setup Password</button>'
                        }
                    </div>

                    <!-- Google OAuth Status -->
                    <div class="auth-status-card" style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${hasGoogle ? '#28a745' : '#dc3545'}; margin-right: 0.5rem;"></span>
                            Google OAuth
                        </h4>
                        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
                            ${hasGoogle ? 'Google account is linked to your profile.' : 'Google account is not linked.'}
                        </p>
                        ${hasGoogle ? 
                            '<button class="btn" style="background: #dc3545; color: white;" onclick="window.unlinkGoogle()">Unlink Google</button>' :
                            '<button class="btn btn-google" onclick="window.linkGoogle()">Link Google Account</button>'
                        }
                    </div>

                    <!-- TOTP Status -->
                    <div class="auth-status-card" style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${hasTOTP ? '#28a745' : '#dc3545'}; margin-right: 0.5rem;"></span>
                            TOTP 2FA
                        </h4>
                        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
                            ${hasTOTP ? 'Two-factor authentication is enabled.' : 'Two-factor authentication is disabled.'}
                        </p>
                        ${hasTOTP ? 
                            '<button class="btn" style="background: #dc3545; color: white;" onclick="window.disableTotp()">Disable 2FA</button>' :
                            '<button class="btn btn-success" onclick="window.enableTotp()">Enable 2FA</button>'
                        }
                    </div>
                </div>
            </div>

            <div class="user-profile" style="margin-bottom: 2rem;">
                <h3>Profile Information</h3>
                <div style="background: #f8f9ff; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <strong>Email:</strong><br>
                            <span style="color: #666;">${user.email}</span>
                        </div>
                        <div>
                            <strong>Name:</strong><br>
                            <span style="color: #666;">${user.name || 'Not provided'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-actions">
                <button id="logout-btn" class="btn" style="background: #6c757d; color: white;">
                    Logout
                </button>
                <button class="btn" style="background: #17a2b8; color: white; margin-left: 1rem;" onclick="window.editProfile()">
                    Edit Profile
                </button>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    renderLoading(message: string = 'Loading...'): string {
        return `
            <div class="loading-container" style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: #666;">${message}</p>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * Render error state
     */
    renderError(message: string): string {
        return `
            <div class="error-container" style="text-align: center; padding: 2rem; color: #dc3545;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h3>Something went wrong</h3>
                <p style="color: #666; margin: 1rem 0;">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Render OAuth success message
     */
    renderOAuthSuccess(email: string): string {
        return `
            <div class="auth-container" style="max-width: 400px; margin: 2rem auto; text-align: center;">
                <div style="color: #28a745; font-size: 48px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #28a745; margin-bottom: 15px;">OAuth Login Successful!</h2>
                <p style="color: #666; margin-bottom: 20px;">You have been successfully logged in with Google OAuth.</p>
                
                <div class="info-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <strong>Logged in as:</strong><br>
                    <span style="color: #666;">${email}</span>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
                    Redirecting to dashboard in a few seconds...
                </p>
                
                <div class="form-actions">
                    <button onclick="window.location.href = '/'" class="btn btn-primary">
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render OAuth error message
     */
    renderOAuthError(): string {
        return `
            <div class="auth-container" style="max-width: 400px; margin: 2rem auto; text-align: center;">
                <div style="color: #dc3545; font-size: 48px; margin-bottom: 20px;">❌</div>
                <h2 style="color: #dc3545; margin-bottom: 15px;">OAuth Login Failed</h2>
                <p style="color: #666; margin-bottom: 25px;">There was an error during the OAuth login process.</p>
                
                <div class="form-actions">
                    <a href="/" class="btn btn-primary">Try Again</a>
                </div>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If this problem persists, please check your Google OAuth configuration.
                </p>
            </div>
        `;
    }

    /**
     * Render mock Google OAuth page
     */
    renderMockOAuth(state: string): string {
        return `
            <div class="auth-container" style="max-width: 400px; margin: 2rem auto; text-align: center;">
                <div style="width: 48px; height: 48px; margin: 0 auto 20px; background: #4285f4; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">G</div>
                
                <h2 style="margin-bottom: 10px;">Sign in with Google</h2>
                <p style="color: #666; margin-bottom: 30px;">Choose an account to continue</p>
                
                <div class="notice" style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px; color: #856404; font-size: 13px;">
                    🧪 <strong>Mock OAuth:</strong> This is a development simulation of Google OAuth.
                </div>

                <div class="user-selection" style="margin-bottom: 25px;">
                    <div class="mock-user-option" data-email="demo@example.com" data-name="Demo User" data-google-id="google_demo_123" 
                         style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; text-align: left;">
                        <div style="font-weight: 500; margin-bottom: 5px;">demo@example.com</div>
                        <div style="font-size: 13px; color: #666;">Demo User</div>
                    </div>
                    
                    <div class="mock-user-option" data-email="test@gmail.com" data-name="Test User" data-google-id="google_test_456"
                         style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; text-align: left;">
                        <div style="font-weight: 500; margin-bottom: 5px;">test@gmail.com</div>
                        <div style="font-size: 13px; color: #666;">Test User</div>
                    </div>
                    
                    <div class="mock-user-option" data-email="john.doe@gmail.com" data-name="John Doe" data-google-id="google_john_789"
                         style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; text-align: left;">
                        <div style="font-weight: 500; margin-bottom: 5px;">john.doe@gmail.com</div>
                        <div style="font-size: 13px; color: #666;">John Doe</div>
                    </div>
                </div>

                <div class="form-actions">
                    <button id="mock-continue-btn" disabled class="btn btn-google">Continue</button>
                    <a href="/" class="btn" style="margin-left: 10px;">Cancel</a>
                </div>
            </div>
        `;
    }
}