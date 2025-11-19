export class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        // In development, webpack proxy will handle API calls
        // In production, you might need to set the actual API URL
        this.baseUrl = baseUrl;
    }

    /**
     * Make a GET request
     */
    async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    /**
     * Make a POST request
     */
    async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
    }

    /**
     * Make a PUT request
     */
    async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
        return this.request(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
    }

    /**
     * Make a DELETE request
     */
    async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    /**
     * Make a PATCH request
     */
    async patch(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
        return this.request(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
    }

    /**
     * Upload a file
     */
    async upload(endpoint: string, file: File, options: RequestInit = {}): Promise<Response> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            ...options
        });
    }

    /**
     * Download a file
     */
    async download(endpoint: string, filename?: string): Promise<void> {
        try {
            const response = await this.get(endpoint);
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || this.extractFilename(response) || 'download';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    /**
     * Make the actual HTTP request
     */
    private async request(endpoint: string, options: RequestInit): Promise<Response> {
        const url = this.buildUrl(endpoint);
        
        // Add default options
        const defaultOptions: RequestInit = {
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Accept': 'application/json',
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            // Handle specific HTTP status codes
            if (response.status === 401) {
                // Unauthorized - redirect to login or emit auth event
                this.handleUnauthorized();
            } else if (response.status === 403) {
                // Forbidden
                console.warn('Access forbidden:', endpoint);
            } else if (response.status >= 500) {
                // Server error
                console.error('Server error:', response.status, response.statusText);
            }

            return response;
        } catch (error) {
            console.error('Network error:', error);
            throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build the complete URL for the request
     */
    private buildUrl(endpoint: string): string {
        // Remove leading slash if present to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        
        if (this.baseUrl) {
            return `${this.baseUrl}/${cleanEndpoint}`;
        }
        
        // Use relative URL - webpack dev server proxy will handle it
        return `/${cleanEndpoint}`;
    }

    /**
     * Handle unauthorized responses
     */
    private handleUnauthorized(): void {
        // Emit custom event for unauthorized access
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        // Clear any stored auth tokens
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    /**
     * Extract filename from response headers
     */
    private extractFilename(response: Response): string | null {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (!contentDisposition) return null;

        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        return filenameMatch ? filenameMatch[1] : null;
    }

    /**
     * Check if the response is JSON
     */
    static async isJsonResponse(response: Response): Promise<boolean> {
        const contentType = response.headers.get('content-type');
        return contentType?.includes('application/json') || false;
    }

    /**
     * Safely parse JSON response
     */
    static async safeJsonParse(response: Response): Promise<any> {
        try {
            const isJson = await ApiService.isJsonResponse(response);
            if (isJson) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error('Failed to parse response:', error);
            return null;
        }
    }

    /**
     * Helper method to handle common response patterns
     */
    async handleResponse<T = any>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await ApiService.safeJsonParse(response);
            const errorMessage = errorData?.message || errorData?.error || response.statusText;
            throw new Error(errorMessage);
        }

        return await ApiService.safeJsonParse(response);
    }

    /**
     * Set base URL for all requests
     */
    setBaseUrl(baseUrl: string): void {
        this.baseUrl = baseUrl;
    }

    /**
     * Get current base URL
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
}