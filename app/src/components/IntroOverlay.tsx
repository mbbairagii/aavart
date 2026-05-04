import { useEffect, useRef } from 'react'

interface Props {
    onComplete: () => void
}

export default function IntroOverlay({ onComplete }: Props) {
    const bgScrollRef = useRef<HTMLDivElement>(null)
    const bgWrapRef = useRef<HTMLDivElement>(null)
    const dumpRef = useRef<HTMLDivElement>(null)
    const flashRef = useRef<HTMLDivElement>(null)
    const lastPanelRef = useRef<HTMLImageElement>(null)
    const typingRef = useRef<HTMLDivElement>(null)
    const blackCoverRef = useRef<HTMLDivElement>(null)
    const loadBarRef = useRef<HTMLDivElement>(null)
    const loadDotRef = useRef<HTMLDivElement>(null)
    const loadNumRef = useRef<HTMLSpanElement>(null)
    const loadProgressRef = useRef(0)

    useEffect(() => {
        runIntro()
        animateLoadBar()
    }, [])

    function animate(duration: number, fn: (t: number) => void): Promise<void> {
        return new Promise(resolve => {
            const start = performance.now()
            function tick(now: number) {
                const t = Math.min((now - start) / duration, 1)
                fn(t)
                if (t < 1) requestAnimationFrame(tick)
                else resolve()
            }
            requestAnimationFrame(tick)
        })
    }

    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

    function animateLoadBar() {
        const bar = loadBarRef.current!
        const dot = loadDotRef.current!
        const num = loadNumRef.current!
        let displayed = 0

        function tick() {
            const target = loadProgressRef.current
            displayed += (target - displayed) * 0.06
            if (Math.abs(target - displayed) < 0.001) displayed = target

            const pct = Math.floor(displayed * 100)
            bar.style.width = `${displayed * 100}%`
            dot.style.left = `${displayed * 100}%`
            num.textContent = `${pct}`

            if (displayed < 1) requestAnimationFrame(tick)
            else {
                bar.style.width = '100%'
                dot.style.left = '100%'
                num.textContent = '100'
            }
        }
        requestAnimationFrame(tick)
    }

    function startBgScroll() {
        const container = bgScrollRef.current!
        let offset = 0
        let last = performance.now()
        function tick(now: number) {
            const delta = now - last
            last = now
            offset -= delta * 0.055
            const rowWidth = container.scrollWidth / 2
            if (Math.abs(offset) >= rowWidth) offset = 0
            container.style.transform = `translateX(${offset}px)`
            requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }

    async function runIntro() {
        const el = typingRef.current!
        const bgWrap = bgWrapRef.current!
        const blackCover = blackCoverRef.current!
        const word = 'AAVART'

        bgWrap.style.display = 'flex'
        startBgScroll()

        el.style.opacity = '1'
        for (let i = 0; i <= word.length; i++) {
            el.textContent = word.slice(0, i)
            loadProgressRef.current = (i / word.length) * 0.08
            await new Promise(r => setTimeout(r, 180))
        }

        loadProgressRef.current = 0.10
        await new Promise(r => setTimeout(r, 400))

        el.style.transition = 'opacity 0.4s ease'
        el.style.opacity = '0'

        animate(500, t => {
            blackCover.style.opacity = String(1 - easeOutCubic(t))
        })

        await runPanels()
    }

    async function runPanels() {
        const dump = dumpRef.current!
        const flash = flashRef.current!
        const imgs = dump.querySelectorAll<HTMLImageElement>('.intro-panel')

        dump.style.opacity = '1'

        const panelShare = 0.75 / (imgs.length - 1)

        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i]
            const isLast = i === imgs.length - 1

            img.style.transition = 'none'
            img.style.opacity = '0'
            img.style.transform = isLast ? 'scale(0.88) translateZ(0)' : 'translateY(30px) scale(0.97)'
            img.style.zIndex = String(10 + i)
            img.getBoundingClientRect()

            if (isLast) {
                loadProgressRef.current = 0.88
                img.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)'
                img.style.opacity = '1'
                img.style.transform = 'scale(1) translateZ(0)'
                await new Promise(r => setTimeout(r, 900))
                loadProgressRef.current = 0.95
                img.style.transition = 'all 1.6s cubic-bezier(0.16,1,0.3,1)'
                img.style.transform = 'scale(1.85) translateZ(0)'
                img.style.border = 'none'
                img.style.borderRadius = '0'
                img.style.boxShadow = 'none'
                await new Promise(r => setTimeout(r, 1700))
            } else {
                loadProgressRef.current = 0.10 + i * panelShare
                img.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)'
                img.style.opacity = '1'
                img.style.transform = 'translateY(0) scale(1)'
                await new Promise(r => setTimeout(r, 750))
                img.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
                img.style.opacity = '0'
                img.style.transform = 'translateY(-25px) scale(1.01)'
                await new Promise(r => setTimeout(r, 400))
            }
        }

        loadProgressRef.current = 1.0
        await animate(400, t => { flash.style.opacity = String(easeOutCubic(t)) })
        onComplete()
        await animate(500, t => { flash.style.opacity = String(1 - easeOutCubic(t)) })
    }

    const word = 'AAVART'
    const repeat = 12
    const rowText = `${Array(repeat).fill(word).join('   ')}   ${Array(repeat).fill(word).join('   ')}`
    const rowConfigs = [
        { color: '#4A4844', ml: '-80px' },
        { color: '#6B6760', ml: '0px' },
        { color: '#4A4844', ml: '-80px' },
        { color: '#6B6760', ml: '0px' },
        { color: '#4A4844', ml: '-80px' },
    ]

    const panels = [
        '/manga/1.png', '/manga/2.png', '/manga/3.png',
        '/manga/4.png', '/manga/5.png', '/manga/6.png', '/manga/7.png'
    ]

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
        }}>

            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
                backgroundSize: '48px 48px',
            }} />

            <div ref={bgWrapRef} style={{
                position: 'absolute', inset: 0, zIndex: 1,
                display: 'none', flexDirection: 'column',
                justifyContent: 'center', overflow: 'hidden',
                pointerEvents: 'none',
            }}>
                <div ref={bgScrollRef} style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    whiteSpace: 'nowrap',
                }}>
                    {rowConfigs.map((cfg, i) => (
                        <div key={i} style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(72px, 12vw, 160px)',
                            letterSpacing: '0.12em',
                            color: cfg.color, lineHeight: 1,
                            userSelect: 'none', marginLeft: cfg.ml,
                        }}>
                            {rowText}
                        </div>
                    ))}
                </div>
            </div>

            <div ref={blackCoverRef} style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: '#000', opacity: 1, pointerEvents: 'none',
            }} />

            <div ref={typingRef} style={{
                position: 'absolute', zIndex: 4,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(120px, 26vw, 340px)',
                letterSpacing: '0.1em', color: '#C8C4BC',
                userSelect: 'none', lineHeight: 1,
                opacity: 0, whiteSpace: 'nowrap', pointerEvents: 'none',
            }} />

            <div ref={dumpRef} style={{
                position: 'absolute', inset: 0, zIndex: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0,
            }}>
                {panels.map((src, i) => {
                    const isLast = i === panels.length - 1
                    return (
                        <img
                            key={i}
                            ref={isLast ? lastPanelRef : undefined}
                            src={src} alt={`Panel ${i + 1}`}
                            className="intro-panel"
                            style={{
                                position: 'absolute',
                                height: 'clamp(300px, 52vh, 560px)', width: 'auto',
                                objectFit: 'contain',
                                border: '2px solid rgba(255,255,255,0.85)',
                                borderRadius: '3px',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.85)',
                                opacity: 0,
                                transform: isLast ? 'scale(0.88)' : 'translateY(30px) scale(0.97)',
                                transformOrigin: 'center center',
                            }}
                        />
                    )
                })}
            </div>

            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 15, padding: '0 32px 36px',
                display: 'flex', flexDirection: 'column', gap: 10,
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                }}>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 13, letterSpacing: '0.22em',
                        color: 'rgba(255,255,255,0.4)',
                    }}>
                        LOADING AAVART
                    </span>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 28, letterSpacing: '0.04em',
                        color: '#fff', lineHeight: 1,
                    }}>
                        <span ref={loadNumRef}>0</span>%
                    </span>
                </div>

                <div style={{
                    width: '100%', height: 3,
                    background: 'rgba(255,255,255,0.1)',
                    position: 'relative',
                }}>
                    <div ref={loadBarRef} style={{
                        position: 'absolute', top: 0, left: 0,
                        height: '100%', width: '0%',
                        background: '#fff',
                        boxShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.15)',
                    }} />
                    <div ref={loadDotRef} style={{
                        position: 'absolute', top: '50%', left: '0%',
                        transform: 'translate(-50%, -50%)',
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 0 8px 4px rgba(255,255,255,0.65)',
                    }} />
                </div>
            </div>

            <div ref={flashRef} style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: '#000', opacity: 0, pointerEvents: 'none',
            }} />
        </div>
    )
}