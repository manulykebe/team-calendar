/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backgroundImage: {
				"stripes-red":
					"repeating-linear-gradient(45deg, #fee2e255, #fee2e255 5px, #fecaca55 5px, #fecaca55 10px)",
			},
		},
	},
	plugins: [],
};
