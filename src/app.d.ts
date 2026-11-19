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

  }
}

export {};
