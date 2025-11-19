import { AuthManager, User } from '../auth/AuthManager';
import { ComponentRenderer } from '../components/ComponentRenderer';

export class Dashboard {
    private authManager: AuthManager;
    private componentRenderer: ComponentRenderer;
    private currentUser: User | null = null;

    constructor(authManager: AuthManager) {
        this.authManager = authManager;
        this.componentRenderer = new ComponentRenderer();
    }

    /**
     * Render the dashboard
     */
    async render(): Promise<void> {
        const dashboardContainer = document.getElementById('dashboard');
        if (!dashboardContainer) return;

        try {
            // Get current user data
            this.currentUser = await this.authManager.getUserProfile();
            
            if (!this.currentUser) {
                throw new Error('Unable to load user profile');
            }

            // Render dashboard content
            dashboardContainer.innerHTML = this.componentRenderer.renderDashboard(this.currentUser);
            
            // Setup dashboard event handlers
            this.setupDashboardHandlers();

        } catch (error) {
            console.error('Failed to render dashboard:', error);
            dashboardContainer.innerHTML = this.componentRenderer.renderError('Failed to load dashboard');
        }
    }

    /**
     * Setup event handlers for dashboard actions
     */
    private setupDashboardHandlers(): void {
        // Make functions available globally for onclick handlers
        (window as any).changePassword = () => this.showChangePasswordModal();
        (window as any).setupPassword = () => this.showSetupPasswordModal();
        (window as any).linkGoogle = () => this.linkGoogleAccount();
        (window as any).unlinkGoogle = () => this.unlinkGoogleAccount();
        (window as any).enableTotp = () => this.enableTotp();
        (window as any).disableTotp = () => this.disableTotp();
        (window as any).editProfile = () => this.showEditProfileModal();
    }

    /**
     * Show change password modal
     */
    private showChangePasswordModal(): void {
        const modalHtml = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Change Password</h3>
                    <form id="change-password-form">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" name="currentPassword" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" name="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" name="confirmPassword" required>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary">Change Password</button>
                            <button type="button" class="btn" style="background: #6c757d; color: white;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle form submission
        const form = document.getElementById('change-password-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const currentPassword = formData.get('currentPassword') as string;
            const newPassword = formData.get('newPassword') as string;
            const confirmPassword = formData.get('confirmPassword') as string;

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }

            try {
                const success = await this.authManager.changePassword(currentPassword, newPassword);
                if (success) {
                    alert('Password changed successfully');
                    document.querySelector('.modal-overlay')?.remove();
                } else {
                    alert('Failed to change password. Please check your current password.');
                }
            } catch (error) {
                console.error('Password change error:', error);
                alert('Failed to change password');
            }
        });
    }

    /**
     * Show setup password modal (for OAuth users)
     */
    private showSetupPasswordModal(): void {
        const modalHtml = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Setup Password</h3>
                    <p style="color: #666; margin-bottom: 1.5rem;">Add password authentication to your account for additional login options.</p>
                    <form id="setup-password-form">
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" required>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary">Setup Password</button>
                            <button type="button" class="btn" style="background: #6c757d; color: white;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle form submission
        const form = document.getElementById('setup-password-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const password = formData.get('password') as string;
            const confirmPassword = formData.get('confirmPassword') as string;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                // This would need a backend endpoint to add password to existing account
                alert('Password setup functionality would be implemented with backend API');
                document.querySelector('.modal-overlay')?.remove();
                this.render(); // Refresh dashboard
            } catch (error) {
                console.error('Password setup error:', error);
                alert('Failed to setup password');
            }
        });
    }

    /**
     * Link Google account
     */
    private linkGoogleAccount(): void {
        try {
            this.authManager.linkGoogleAccount();
        } catch (error) {
            console.error('Google link error:', error);
            alert('Failed to link Google account');
        }
    }

    /**
     * Unlink Google account
     */
    private async unlinkGoogleAccount(): Promise<void> {
        if (!confirm('Are you sure you want to unlink your Google account? Make sure you have another way to access your account.')) {
            return;
        }

        try {
            const success = await this.authManager.unlinkGoogleAccount();
            if (success) {
                alert('Google account unlinked successfully');
                this.render(); // Refresh dashboard
            } else {
                alert('Failed to unlink Google account');
            }
        } catch (error) {
            console.error('Google unlink error:', error);
            alert('Failed to unlink Google account');
        }
    }

    /**
     * Enable TOTP
     */
    private async enableTotp(): Promise<void> {
        const modalHtml = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem;">Enable Two-Factor Authentication</h3>
                    <div id="totp-setup-content">
                        ${this.componentRenderer.renderLoading('Generating TOTP secret...')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        try {
            const totpData = await this.authManager.enableTotp();
            console.log('TOTP Data received:', totpData);
            
            if (totpData) {
                const setupContent = document.getElementById('totp-setup-content');
                if (setupContent) {
                    setupContent.innerHTML = `
                        <p style="color: #666; margin-bottom: 1.5rem;">
                            Scan this QR code with your authenticator app, then enter the verification code.
                        </p>
                        
                        <div class="qr-container">
                            <img src="${totpData.qr}" alt="TOTP QR Code" style="max-width: 200px;">
                        </div>
                        
                        <p style="margin: 1rem 0;"><strong>Secret Key:</strong></p>
                        <code style="word-break: break-all; background: #f1f1f1; padding: 0.5rem; border-radius: 4px; display: block;">${totpData.secret}</code>
                        
                        <form id="verify-totp-form" style="margin-top: 1.5rem;">
                            <div class="form-group">
                                <label>Enter 6-digit code from your authenticator app:</label>
                                <input type="text" name="token" required maxlength="6" pattern="[0-9]{6}" 
                                       style="text-align: center; font-size: 1.5rem; letter-spacing: 0.25rem;">
                            </div>
                            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                                <button type="submit" class="btn btn-success">Verify & Enable</button>
                                <button type="button" class="btn" style="background: #6c757d; color: white;" 
                                        onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            </div>
                        </form>
                    `;

                    // Handle verification form
                    const verifyForm = document.getElementById('verify-totp-form') as HTMLFormElement;
                    verifyForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const formData = new FormData(verifyForm);
                        const token = formData.get('token') as string;

                        try {
                            const success = await this.authManager.verifyTotpToken(token);
                            if (success) {
                                alert('Two-factor authentication enabled successfully!');
                                document.querySelector('.modal-overlay')?.remove();
                                this.render(); // Refresh dashboard
                            } else {
                                alert('Invalid verification code. Please try again.');
                            }
                        } catch (error) {
                            console.error('TOTP verification error:', error);
                            alert('Failed to verify TOTP code');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('TOTP enable error:', error);
            const setupContent = document.getElementById('totp-setup-content');
            if (setupContent) {
                setupContent.innerHTML = this.componentRenderer.renderError('Failed to generate TOTP secret');
            }
        }
    }

    /**
     * Disable TOTP
     */
    private async disableTotp(): Promise<void> {
        if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
            return;
        }

        try {
            const success = await this.authManager.disableTotp();
            if (success) {
                alert('Two-factor authentication disabled');
                this.render(); // Refresh dashboard
            } else {
                alert('Failed to disable two-factor authentication');
            }
        } catch (error) {
            console.error('TOTP disable error:', error);
            alert('Failed to disable two-factor authentication');
        }
    }

    /**
     * Show edit profile modal
     */
    private showEditProfileModal(): void {
        if (!this.currentUser) return;

        const modalHtml = `
            <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Edit Profile</h3>
                    <form id="edit-profile-form">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" value="${this.currentUser.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value="${this.currentUser.email}" required>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" class="btn" style="background: #6c757d; color: white;" 
                                    onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle form submission
        const form = document.getElementById('edit-profile-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const updates = {
                name: formData.get('name') as string,
                email: formData.get('email') as string
            };

            try {
                const success = await this.authManager.updateProfile(updates);
                if (success) {
                    alert('Profile updated successfully');
                    document.querySelector('.modal-overlay')?.remove();
                    this.render(); // Refresh dashboard
                } else {
                    alert('Failed to update profile');
                }
            } catch (error) {
                console.error('Profile update error:', error);
                alert('Failed to update profile');
            }
        });
    }
}