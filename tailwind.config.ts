import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
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
			spacing: {
				'safe': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
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
				'status-available': {
					DEFAULT: 'hsl(var(--status-available))',
					foreground: 'hsl(var(--status-available-foreground))'
				},
				'status-booked': {
					DEFAULT: 'hsl(var(--status-booked))',
					foreground: 'hsl(var(--status-booked-foreground))'
				},
				'status-blocked': {
					DEFAULT: 'hsl(var(--status-blocked))',
					foreground: 'hsl(var(--status-blocked-foreground))'
				},
				'trendy-pink': 'hsl(var(--trendy-pink))',
				'trendy-navy': 'hsl(var(--trendy-navy))',
				'trendy-cyan': 'hsl(var(--trendy-cyan))',
				'trendy-light-green': 'hsl(var(--trendy-light-green))',
				'trendy-green': 'hsl(var(--trendy-green))',
				'action-created': {
					DEFAULT: 'hsl(var(--action-created))',
					foreground: 'hsl(var(--action-created-foreground))',
					bg: 'hsl(var(--action-created-bg))'
				},
				'action-updated': {
					DEFAULT: 'hsl(var(--action-updated))', 
					foreground: 'hsl(var(--action-updated-foreground))',
					bg: 'hsl(var(--action-updated-bg))'
				},
				'action-deleted': {
					DEFAULT: 'hsl(var(--action-deleted))',
					foreground: 'hsl(var(--action-deleted-foreground))',
					bg: 'hsl(var(--action-deleted-bg))'
				},
				'action-booked': {
					DEFAULT: 'hsl(var(--action-booked))',
					foreground: 'hsl(var(--action-booked-foreground))',
					bg: 'hsl(var(--action-booked-bg))'
				},
				'action-cancelled': {
					DEFAULT: 'hsl(var(--action-cancelled))',
					foreground: 'hsl(var(--action-cancelled-foreground))',
					bg: 'hsl(var(--action-cancelled-bg))'
				},
				'status-slot-block': {
					DEFAULT: 'hsl(var(--status-slot-block))',
					foreground: 'hsl(var(--status-slot-block-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
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
				}
			},
			backgroundImage: {
				'gradient-ocean': 'var(--gradient-ocean)',
				'gradient-wave': 'var(--gradient-wave)',
				'gradient-deep': 'var(--gradient-deep)',
				'gradient-maritime-sunset': 'var(--gradient-maritime-sunset)',
				'gradient-ocean-breeze': 'var(--gradient-ocean-breeze)',
				'gradient-harbor-mist': 'var(--gradient-harbor-mist)'
			},
			boxShadow: {
				'card-maritime': 'var(--shadow-card)',
				'button-maritime': 'var(--shadow-button)',
				'elevated-maritime': 'var(--shadow-elevated)'
			},
			transitionTimingFunction: {
				'wave': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
			},
			borderRadius: {
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
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'page-enter': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.2s ease-out',
				'fade-out': 'fade-out 0.2s ease-out forwards',
				'page-enter': 'page-enter 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
