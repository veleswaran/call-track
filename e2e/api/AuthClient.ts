import { APIRequestContext, expect } from '@playwright/test';

export class AuthClient {
    constructor(private readonly request: APIRequestContext) { }

    async loginViaApi(email: string, password: string): Promise<any> {
        const response = await this.request.post('/api/v1/login', {
            data: {
                email,
                password,
            },
            headers: {
                'Accept': 'application/json',
            }
        });

        expect(response.status()).toBe(200);
        return await response.json();
    }
}
