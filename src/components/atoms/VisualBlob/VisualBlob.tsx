import type { SVGProps } from 'react'

type VisualBlobProps = {
    variant?: 'teal' | 'lavender'
} & SVGProps<SVGSVGElement>

export function VisualBlob({
    variant = 'teal',
    className = '',
    ...props
}: VisualBlobProps) {
    const variantConfig = {
        teal: {
            fill: '#95C1BF',
            d: 'M40.2,-52C50.9,-39,57.6,-25.1,61.9,-9.6C66.3,6,68.3,23.3,60.5,33C52.6,42.6,34.8,44.6,17.5,53C0.3,61.3,-16.4,76,-32.3,75.8C-48.2,75.6,-63.3,60.4,-69.7,43.2C-76,26,-73.5,6.8,-67.1,-8.7C-60.6,-24.2,-50.3,-35.9,-38.4,-48.7C-26.6,-61.6,-13.3,-75.6,0.7,-76.5C14.8,-77.4,29.5,-65.1,40.2,-52Z',
        },
        lavender: {
            fill: '#8E9EC2',
            d: 'M41.4,-49.9C51.8,-40.6,57.2,-25.8,61.2,-9.8C65.1,6.2,67.6,23.3,62.5,39.8C57.4,56.2,44.6,71.8,29,75.8C13.4,79.8,-5,72.2,-23.7,65.3C-42.4,58.5,-61.3,52.4,-68.8,39.6C-76.3,26.9,-72.2,7.4,-63.3,-5.6C-54.4,-18.6,-40.5,-25.2,-29.1,-34.3C-17.8,-43.4,-8.9,-55.1,3.3,-59C15.5,-63,31,-59.2,41.4,-49.9Z',
        },
    }

    const selected = variantConfig[variant]

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className={`absolute size-[500px] ${className}`.trim()}
            {...props}
        >
            <path fill={selected.fill} d={selected.d} transform="translate(100 100)" />
        </svg>
    )
}

export default VisualBlob