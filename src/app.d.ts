declare global {
  namespace App {
    interface Error {
      message: string;
    }

    interface Locals {
      authUser: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
      } | null;
      authSession: {
        id: string;
        userId: string;
        expiresAt: Date;
      } | null;
    }

    interface Platform {
      env: {
        DB: D1Database;
        AUTH_DB?: D1Database;
        BETTER_AUTH_SECRET?: string;
        BETTER_AUTH_URL?: string;
        RESEND_API_KEY?: string;
        AUTH_FROM_EMAIL?: string;
      };
      context?: {
        waitUntil(promise: Promise<unknown>): void;
      };
    }
  }
}

export {};
