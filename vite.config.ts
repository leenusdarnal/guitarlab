import adapter from '@sveltejs/adapter-cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
      csp: {
        // Use nonces for dynamic responses and hashes for prerendered output.
        // SvelteKit augments script/style directives for its generated markup.
        mode: 'auto',
        directives: {
          'default-src': ['self'],
          'base-uri': ['self'],
          'connect-src': ['self'],
          'font-src': ['self', 'data:'],
          'form-action': ['self'],
          'frame-ancestors': ['none'],
          'img-src': [
            'self',
            'data:',
            'blob:',
            'https://avatars.githubusercontent.com',
            'https://lh3.googleusercontent.com',
            'https://lh4.googleusercontent.com',
            'https://lh5.googleusercontent.com',
            'https://lh6.googleusercontent.com'
          ],
          'media-src': ['self', 'blob:'],
          'object-src': ['none'],
          'script-src': ['self'],
          // Svelte transitions and component style attributes use inline CSS.
          // Inline JavaScript remains disallowed.
          'style-src': ['self', 'unsafe-inline'],
          'worker-src': ['self', 'blob:']
        }
      }
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
