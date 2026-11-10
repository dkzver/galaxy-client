// Пути исходных файлов, в которых Tailwind ищет используемые CSS-классы.
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {extend: {}},
    plugins: [],
};
