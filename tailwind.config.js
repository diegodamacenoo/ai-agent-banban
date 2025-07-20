/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/clients/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-geist)',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		letterSpacing: {
  			'super-tight': '-0.075em',
  			'super-wide': '0.15em',
  			'ultra-wide': '0.25em'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
			success: {
				DEFAULT: 'hsl(var(--text-success))',
				foreground: 'hsl(var(--success-foreground))'
			},
			warning: {
				DEFAULT: 'hsl(var(--text-warning))',
				foreground: 'hsl(var(--warning-foreground))'
			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			// HextaUI Colors
			hu: {
				background: 'hsl(var(--hu-background))',
				foreground: 'hsl(var(--hu-foreground))',
				card: 'hsl(var(--hu-card))',
				'card-foreground': 'hsl(var(--hu-card-foreground))',
				primary: 'hsl(var(--hu-primary))',
				'primary-foreground': 'hsl(var(--hu-primary-foreground))',
				secondary: 'hsl(var(--hu-secondary))',
				'secondary-foreground': 'hsl(var(--hu-secondary-foreground))',
				muted: 'hsl(var(--hu-muted))',
				'muted-foreground': 'hsl(var(--hu-muted-foreground))',
				accent: 'hsl(var(--hu-accent))',
				'accent-foreground': 'hsl(var(--hu-accent-foreground))',
				destructive: 'hsl(var(--hu-destructive))',
				'destructive-foreground': 'hsl(var(--hu-destructive-foreground))',
				success: 'hsl(var(--hu-success))',
				'success-foreground': 'hsl(var(--hu-success-foreground))',
				border: 'hsl(var(--hu-border))',
				input: 'hsl(var(--hu-input))',
				ring: 'hsl(var(--hu-ring))',
				warning: 'hsl(var(--hu-warning))',
				'warning-foreground': 'hsl(var(--hu-warning-foreground))',
				info: 'hsl(var(--hu-info))',
				'info-foreground': 'hsl(var(--hu-info-foreground))',
				light_success: 'hsl(var(--hu-light_success))',
				'light_success-foreground': 'hsl(var(--hu-light_success-foreground))',
				light_warning: 'hsl(var(--hu-light_warning))',
				'light_warning-foreground': 'hsl(var(--hu-light_warning-foreground))',
				light_destructive: 'hsl(var(--hu-light_destructive))',
				'light_destructive-foreground': 'hsl(var(--hu-light_destructive-foreground))',
				soft_success: 'hsl(var(--hu-soft_success))',
				'soft_success-foreground': 'hsl(var(--hu-soft_success-foreground))',
				soft_warning: 'hsl(var(--hu-soft_warning))',
				'soft_warning-foreground': 'hsl(var(--hu-soft_warning-foreground))',
				soft_destructive: 'hsl(var(--hu-soft_destructive))',
				'soft_destructive-foreground': 'hsl(var(--hu-soft_destructive-foreground))',
			}
  		},
  		borderRadius: {
  			xxl: 'calc(var(--radius) + 2rem)',
  			xl: 'calc(var(--radius) + 0.5rem)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 