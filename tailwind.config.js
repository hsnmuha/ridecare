/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563eb", // Blue-600
                secondary: "#475569", // Slate-600
                success: "#22c55e", // Green-500
                warning: "#eab308", // Yellow-500
                danger: "#ef4444", // Red-500
            }
        },
    },
    plugins: [],
}
