// Конфигурация сборки Vite и подключение поддержки React.
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: './',
    plugins: [react()],
});

