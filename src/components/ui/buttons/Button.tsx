import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonProps = {
	children: ReactNode
	fullWidth?: boolean
	variant?: 'primary' | 'social' | 'dark' | 'cancel' | 'link' | 'outline' | 'quiz' | 'quizOutline'
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
			'md:cursor-pointer bg-primary px-8 py-4 rounded-[32px] font-inter text-[14px] 2xs:text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60',
		social:
			'md:cursor-pointer border border-gray bg-transparent rounded-[32px] px-[28px] py-4 font-manrope text-[14px] 2xs:text-base font-semibold tracking-[-0.4px] text-dark hover:border-dark hover:bg-gray/40 hover:text-black disabled:opacity-60',
		dark:
			'md:cursor-pointer bg-[#1A1B1E] px-6 py-2.5 rounded-full text-[13px] font-semibold text-white hover:bg-black shadow-sm disabled:bg-dark/10 disabled:text-dark/30 disabled:shadow-none',
		cancel:
			'md:cursor-pointer bg-transparent px-6 py-2.5 rounded-full text-[13px] font-semibold text-dark/70 hover:bg-red-500/5 hover:text-red-500 disabled:opacity-50 disabled:hover:bg-transparent',
		link:
			'md:cursor-pointer bg-transparent p-0 text-sm text-dark/85 hover:text-dark underline-offset-4 hover:underline disabled:opacity-50',
		outline:
			'md:cursor-pointer bg-transparent text-black outline outline-2 outline-offset-[-2px] px-12 md:px-20 py-3.5 2xs:py-4 rounded-full font-bold text-[15px] hover:bg-black/5 disabled:opacity-50',
		quiz:
			'md:cursor-pointer bg-dark/95 text-white px-12  py-3.5 2xs:py-4 2sm:py-[18px] md:py-3.5 md:px-20 rounded-full font-bold text-[13px] xs:text-[14px] 2sm:text-[15px] sm:text-[16px] hover:bg-dark/90 transition-all md:border-2 md:border-dark/95 disabled:bg-[#EBEDEE] disabled:text-[#A0AAB2] disabled:border-[#EBEDEE] disabled:cursor-not-allowed',
		quizOutline:
			'md:cursor-pointer bg-transparent text-black border-2 border-dark/20 px-12 md:px-20 py-3.5 2xs:py-4 2sm:py-[18px] rounded-full font-bold text-[13px] xs:text-[14px] 2sm:text-[15px] sm:text-[16px] hover:bg-black/5 hover:border-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed',
	}

	return (
		<button
			type={type}
			disabled={isLoading || props.disabled}
			aria-disabled={isLoading || props.disabled ? 'true' : undefined}
			className={`relative inline-flex items-center justify-center transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]
				} ${fullWidth ? 'w-full' : 'w-auto'
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
