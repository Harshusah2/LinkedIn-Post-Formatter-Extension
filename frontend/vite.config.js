import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                popup: 'index.html',
                content: 'src/content/content.ts',
                background: 'src/background.ts'
            },
            output: { entryFileNames: '[name].js' }
        }
    }
});
