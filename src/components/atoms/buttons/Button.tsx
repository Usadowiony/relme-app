import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = {
	children: ReactNode
	fullWidth?: boolean
	variant?: 'primary' | 'social'
	leftIcon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
	children,
	className = '',
	fullWidth = false,
	leftIcon,
	type = 'button',
	variant = 'primary',
	...props
}: ButtonProps) {
	const variantClasses = {
		primary:
			'bg-primary px-8 py-3 2xs:py-4 font-inter text-[14px] 2xs:text-base font-bold text-white hover:bg-primary/90',
		social:
			'border border-gray bg-transparent px-[28px] py-3 2xs:py-4 font-manrope text-[12px] 2xs:text-base font-semibold tracking-[-0.4px] text-dark hover:border-dark hover:bg-gray/40 hover:text-black',
	}

	return (
		<button
			type={type}
			className={`inline-flex items-center justify-center gap-3 rounded-[32px] transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
				variantClasses[variant]
			} ${
				fullWidth ? 'w-full' : 'w-auto'
			} ${className}`.trim()}
			{...props}
		>
			{leftIcon ? (
				<span className="inline-flex size-[18px] items-center justify-center">
					{leftIcon}
				</span>
			) : null}
			{children}
		</button>
	)
}

export default Button
