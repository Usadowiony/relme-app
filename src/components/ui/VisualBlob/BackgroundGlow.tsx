import type { HTMLAttributes } from 'react'

type BackgroundGlowProps = {
    variant?: 'primary' | 'secondary'
    size?: string
} & HTMLAttributes<HTMLDivElement>

export function BackgroundGlow({
    variant = 'primary',
    size = '600px',
    className = '',
    ...props
}: BackgroundGlowProps) {
    const variantClasses = {
        primary: 'bg-primary-2/11',
        secondary: 'bg-secondary/11',
    }

    return (
        <div
            aria-hidden="true"
            style={{ width: size, height: size }}
            className={`absolute rounded-full blur-[500px] 2xl:blur-[700px] pointer-events-none ${
                variantClasses[variant]
            } ${className}`.trim()}
            {...props}
        />
    )
}

export default BackgroundGlow