/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./*.{html,tsx,ts,jsx,js}",
        "./components/**/*.{tsx,ts,jsx,js}",
        "./services/**/*.{tsx,ts,jsx,js}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#6366f1",
                "primary-dark": "#4338ca",
                "background-light": "#f8fafc",
                "background-dark": "#02040a",
                "surface-dark": "#0f1623",
                "surface-card": "#161e2e",
                "surface-hover": "#1e293b",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                lg: "0.5rem",
                xl: "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                full: "9999px",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
    ],
};
