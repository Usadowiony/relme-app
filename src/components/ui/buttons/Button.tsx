import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonProps = {
	children: ReactNode
	fullWidth?: boolean
	variant?: 'primary' | 'social' | 'dark' | 'cancel'
	leftIcon?: ReactNode
	isLoading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

export function AsyncButton({
	children,
	className = '',
	fullWidth = false,
	leftIcon,
	type = 'button',
	variant = 'primary',
	isLoading = false,
	...props
}: ButtonProps) {
	const variantClasses = {
		primary:
			'bg-primary px-8 py-4 rounded-[32px] font-inter text-[14px] 2xs:text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60',
		social:
			'border border-gray bg-transparent rounded-[32px] px-[28px] py-4 font-manrope text-[14px] 2xs:text-base font-semibold tracking-[-0.4px] text-dark hover:border-dark hover:bg-gray/40 hover:text-black disabled:opacity-60',
		dark:
			'bg-[#1A1B1E] px-6 py-2.5 rounded-full text-[13px] font-semibold text-white hover:bg-black shadow-sm disabled:bg-dark/10 disabled:text-dark/30 disabled:shadow-none',
		cancel:
			'bg-transparent px-6 py-2.5 rounded-full text-[13px] font-semibold text-dark/70 hover:bg-red-500/5 hover:text-red-500 disabled:opacity-50 disabled:hover:bg-transparent',
	}

	return (
		<button
			type={type}
			disabled={isLoading || props.disabled}
			aria-disabled={isLoading || props.disabled ? 'true' : undefined}
			className={`relative inline-flex items-center justify-center transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed ${
				variantClasses[variant]
			} ${
				fullWidth ? 'w-full' : 'w-auto'
			} ${className}`.trim()}
			{...props}
		>
			<span className={`inline-flex items-center justify-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
				{leftIcon ? (
					<span className="inline-flex size-[18px] items-center justify-center">
						{leftIcon}
					</span>
				) : null}
				{children}
			</span>

			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center gap-1.5">
					<div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce-delay" style={{ animationDelay: '0ms' }} />
					<div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce-delay" style={{ animationDelay: '150ms' }} />
					<div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce-delay" style={{ animationDelay: '300ms' }} />
				</div>
			)}
		</button>
	)
}

export const Button = AsyncButton
export default AsyncButton
