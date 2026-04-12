import type { ReactNode } from 'react'
import BackgroundGlow from '../atoms/VisualBlob/BackgroundGlow'
import VisualBlob from '../atoms/VisualBlob/VisualBlob'

type BackgroundBlobsLayoutProps = {
    children: ReactNode
}

export function BackgroundBlobs({ children }: BackgroundBlobsLayoutProps) {
    return (
        <div className="relative min-h-svh w-full overflow-hidden bg-neutral flex flex-col items-center justify-center">
            
            <div className="pointer-events-none absolute inset-0 z-0">
                <BackgroundGlow
                    variant="secondary"
                    size="1060px"
                    className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <VisualBlob 
                    variant="teal" 
                    className="
                    sm:-left-[220px] sm:-top-[220px] sm:size-[720px]
                    md:-left-[280px] md:-top-[320px] md:size-[900px]
                    lg:-left-[280px] lg:-top-[400px] lg:size-[1000px]
                    xl:-left-[360px] xl:-top-[450px] xl:size-[1200px]
                    2xl:size-[1300px]
                    3xl:size-[1550px] 3xl:-top-[650px]
                    4xl:-top-[950px] 4xl:size-[1800px]
                    opacity-50" 
                />
                <VisualBlob 
                    variant="lavender" 
                    className="
                    sm:-right-[70px] sm:-bottom-[140px] sm:size-[620px]
                    md:-bottom-[180px] md:-right-[90px] md:size-[800px]
                    lg:-bottom-[280px] lg:-right-[110px] lg:size-[900px]
                    xl:-right-[110px] xl:-bottom-[380px] xl:size-[1080px]
                    2xl:size-[1200px]
                    3xl:size-[1350px] 3xl:-bottom-[480px]
                    4xl:-bottom-[580px] 4xl:size-[1500px]
                    opacity-65" 
                />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-50 bg-gradient-to-b from-neutral to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-50 bg-gradient-to-t from-neutral to-transparent" />

            <main className="relative z-10 w-full">
                {children}
            </main>
            
        </div>
    )
}

export default BackgroundBlobs