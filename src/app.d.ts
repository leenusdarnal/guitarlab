declare global {
  namespace App {
    interface Error {
      message: string;
    }

    interface Platform {
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
