import { useEffect, useRef } from 'react'

interface Props {
    onComplete: () => void
}

export default function IntroOverlay({ onComplete }: Props) {
    const typingRef = useRef<HTMLDivElement>(null)
    const flashRef = useRef<HTMLDivElement>(null)
    const loadBarRef = useRef<HTMLDivElement>(null)
    const loadDotRef = useRef<HTMLDivElement>(null)
    const loadNumRef = useRef<HTMLSpanElement>(null)
    const loadProgressRef = useRef(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoWrapRef = useRef<HTMLDivElement>(null)

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
    function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

    function animateLoadBar() {
        const bar = loadBarRef.current!
        const dot = loadDotRef.current!
        const num = loadNumRef.current!
        let displayed = 0

        function tick() {
            const target = loadProgressRef.current
            // faster catch-up: 0.09 instead of 0.04
            displayed += (target - displayed) * 0.09
            if (Math.abs(target - displayed) < 0.001) displayed = target

            const pct = Math.floor(displayed * 100)
            bar.style.width = `${displayed * 100}%`
            dot.style.left = `${displayed * 100}%`
            num.textContent = `${pct}`

            // bar color shifts: white -> teal -> white as it fills
            const r = Math.round(180 + (255 - 180) * displayed)
            const g = Math.round(180 + (255 - 180) * (1 - Math.abs(displayed - 0.5) * 2))
            const b = Math.round(200 + (255 - 200) * displayed)
            bar.style.background = `linear-gradient(to right, rgba(${r},${g},${b},0.55), rgb(${r},${g},${b}))`
            dot.style.background = `rgb(${r},${g},${b})`
            dot.style.boxShadow = `0 0 10px 4px rgba(${r},${g},${b},0.7)`

            if (displayed < 1) requestAnimationFrame(tick)
            else {
                bar.style.width = '100%'
                dot.style.left = '100%'
                num.textContent = '100'
            }
        }
        requestAnimationFrame(tick)
    }

    async function runIntro() {
        const el = typingRef.current!
        const word = 'AAVART'

        // Phase 1 — type AAVART
        el.style.display = 'block'
        el.style.zIndex = '4'
        el.style.opacity = '1'

        for (let i = 0; i <= word.length; i++) {
            el.textContent = word.slice(0, i)
            loadProgressRef.current = (i / word.length) * 0.12
            await new Promise(r => setTimeout(r, 190))
        }

        await new Promise(r => setTimeout(r, 520))

        // fade out
        await animate(420, t => {
            el.style.opacity = String(1 - easeInOutCubic(t))
        })

        // triple-kill
        el.textContent = ''
        el.style.display = 'none'
        el.style.zIndex = '-1'

        // Phase 2 — video
        await showVideo()

        // Phase 3 — snap to landing
        loadProgressRef.current = 1.0
        await animate(220, t => {
            flashRef.current!.style.opacity = String(easeOutCubic(t))
        })
        onComplete()
        animate(400, t => {
            flashRef.current!.style.opacity = String(1 - easeOutCubic(t))
        })
    }

    async function showVideo(): Promise<void> {
        const wrap = videoWrapRef.current!
        const vid = videoRef.current!

        wrap.style.display = 'flex'
        wrap.style.opacity = '0'
        vid.play().catch(() => { })

        await animate(700, t => {
            wrap.style.opacity = String(easeOutCubic(t))
        })

        // drive bar 12% -> 95% over 3200ms (faster than before)
        await new Promise<void>(resolve => {
            const duration = 3200
            const start = performance.now()
            function tick(now: number) {
                const t = Math.min((now - start) / duration, 1)
                loadProgressRef.current = 0.12 + easeInOutCubic(t) * 0.83
                if (t < 1) requestAnimationFrame(tick)
                else resolve()
            }
            requestAnimationFrame(tick)
        })

        // fast fade out
        await animate(250, t => {
            wrap.style.opacity = String(1 - easeOutCubic(t))
        })
        wrap.style.display = 'none'
        vid.pause()
    }

    const stars = {
        left: [
            { top: '8%', left: '2%', size: 2, delay: '0.0s', dur: '2.8s' },
            { top: '18%', left: '7%', size: 1, delay: '0.6s', dur: '3.4s' },
            { top: '31%', left: '3%', size: 2, delay: '1.3s', dur: '2.5s' },
            { top: '44%', left: '11%', size: 1, delay: '0.9s', dur: '3.1s' },
            { top: '55%', left: '5%', size: 3, delay: '1.8s', dur: '3.6s' },
            { top: '67%', left: '9%', size: 1, delay: '0.3s', dur: '2.9s' },
            { top: '78%', left: '2%', size: 2, delay: '1.1s', dur: '3.2s' },
            { top: '89%', left: '13%', size: 1, delay: '1.5s', dur: '2.7s' },
            { top: '23%', left: '15%', size: 1, delay: '0.7s', dur: '3.8s' },
            { top: '62%', left: '14%', size: 2, delay: '2.0s', dur: '2.4s' },
            { top: '12%', left: '11%', size: 1, delay: '2.3s', dur: '3.0s' },
            { top: '73%', left: '6%', size: 2, delay: '0.4s', dur: '2.6s' },
        ],
        right: [
            { top: '11%', right: '3%', size: 2, delay: '0.8s', dur: '3.0s' },
            { top: '22%', right: '9%', size: 1, delay: '1.4s', dur: '2.8s' },
            { top: '36%', right: '4%', size: 2, delay: '0.2s', dur: '3.5s' },
            { top: '48%', right: '12%', size: 1, delay: '1.9s', dur: '2.6s' },
            { top: '57%', right: '6%', size: 3, delay: '1.0s', dur: '3.2s' },
            { top: '69%', right: '10%', size: 1, delay: '1.6s', dur: '2.9s' },
            { top: '80%', right: '3%', size: 2, delay: '0.5s', dur: '3.4s' },
            { top: '91%', right: '14%', size: 1, delay: '1.2s', dur: '2.5s' },
            { top: '16%', right: '14%', size: 1, delay: '2.2s', dur: '3.7s' },
            { top: '64%', right: '7%', size: 2, delay: '0.6s', dur: '2.3s' },
            { top: '8%', right: '11%', size: 1, delay: '1.7s', dur: '3.1s' },
            { top: '76%', right: '5%', size: 2, delay: '0.9s', dur: '2.7s' },
        ]
    }

    const words = {
        left: [
            { top: '14%', left: '1%', word: 'SOLANA', delay: '0.0s', dur: '5.0s' },
            { top: '33%', left: '3%', word: 'TRUSTLESS', delay: '1.4s', dur: '6.0s' },
            { top: '52%', left: '1%', word: 'ROTATE', delay: '2.8s', dur: '5.4s' },
            { top: '70%', left: '2%', word: 'POOL', delay: '0.7s', dur: '4.8s' },
            { top: '84%', left: '5%', word: 'आवर्त', delay: '2.0s', dur: '5.6s' },
            { top: '24%', left: '7%', word: 'CIRCLE', delay: '3.4s', dur: '5.2s' },
        ],
        right: [
            { top: '11%', right: '1%', word: 'ON-CHAIN', delay: '0.6s', dur: '5.2s' },
            { top: '29%', right: '2%', word: 'SAVINGS', delay: '2.1s', dur: '6.2s' },
            { top: '65%', right: '3%', word: 'SOL', delay: '3.0s', dur: '5.0s' },
            { top: '80%', right: '2%', word: 'WIN', delay: '1.2s', dur: '4.6s' },
            { top: '40%', right: '6%', word: 'CYCLE', delay: '3.8s', dur: '5.8s' },
        ]
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
        }}>
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.12; transform: scale(1); }
                    50%       { opacity: 1.00; transform: scale(1.5); }
                }
                @keyframes floatWord {
                    0%   { opacity: 0;    transform: translateY(14px); }
                    18%  { opacity: 0.28; }
                    82%  { opacity: 0.28; }
                    100% { opacity: 0;    transform: translateY(-14px); }
                }
            `}</style>

            {/* Subtle grid */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
                `,
                backgroundSize: '56px 56px',
                pointerEvents: 'none',
            }} />

            {/* AAVART typing */}
            <div ref={typingRef} style={{
                position: 'absolute', zIndex: 4,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(100px, 22vw, 300px)',
                letterSpacing: '0.12em', color: '#C8C4BC',
                userSelect: 'none', lineHeight: 1,
                opacity: 0, display: 'none',
                whiteSpace: 'nowrap', pointerEvents: 'none',
                textShadow: '0 0 80px rgba(200,196,188,0.18)',
            }} />

            {/* Video + decorations */}
            <div ref={videoWrapRef} style={{
                position: 'absolute', inset: 0, zIndex: 3,
                display: 'none', alignItems: 'center', justifyContent: 'center',
                background: '#000', opacity: 0,
            }}>
                <video
                    ref={videoRef}
                    src="/intro-loop.mp4"
                    muted loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div style={{
                    position: 'absolute', inset: 0, zIndex: 4,
                    pointerEvents: 'none', overflow: 'hidden',
                }}>
                    {/* Edge fade bands */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, width: '20%',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0, width: '20%',
                        background: 'linear-gradient(to left, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '14%',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    }} />

                    {/* Stars left */}
                    {stars.left.map((s, i) => (
                        <div key={`sl-${i}`} style={{
                            position: 'absolute', top: s.top, left: s.left,
                            width: s.size, height: s.size, borderRadius: '50%',
                            background: '#fff',
                            animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite`,
                            boxShadow: `0 0 ${s.size * 3}px ${s.size + 1}px rgba(255,255,255,0.55)`,
                        }} />
                    ))}

                    {/* Stars right */}
                    {stars.right.map((s, i) => (
                        <div key={`sr-${i}`} style={{
                            position: 'absolute', top: s.top, right: s.right,
                            width: s.size, height: s.size, borderRadius: '50%',
                            background: '#fff',
                            animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite`,
                            boxShadow: `0 0 ${s.size * 3}px ${s.size + 1}px rgba(255,255,255,0.55)`,
                        }} />
                    ))}

                    {/* Words left */}
                    {words.left.map((w, i) => (
                        <div key={`wl-${i}`} style={{
                            position: 'absolute', top: w.top, left: w.left,
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 10, letterSpacing: '0.24em',
                            color: 'rgba(200,196,188,1)',
                            animation: `floatWord ${w.dur} ${w.delay} ease-in-out infinite`,
                            whiteSpace: 'nowrap',
                        }}>{w.word}</div>
                    ))}

                    {/* Words right */}
                    {words.right.map((w, i) => (
                        <div key={`wr-${i}`} style={{
                            position: 'absolute', top: w.top, right: w.right,
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 10, letterSpacing: '0.24em',
                            color: 'rgba(200,196,188,1)',
                            animation: `floatWord ${w.dur} ${w.delay} ease-in-out infinite`,
                            whiteSpace: 'nowrap',
                        }}>{w.word}</div>
                    ))}
                </div>
            </div>

            {/* Loading bar */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 15, padding: '0 36px 40px',
                display: 'flex', flexDirection: 'column', gap: 12,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 12, letterSpacing: '0.26em',
                        color: 'rgba(255,255,255,0.35)',
                    }}>LOADING AAVART</span>
                    <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 26, letterSpacing: '0.04em',
                        color: 'rgba(255,255,255,0.85)', lineHeight: 1,
                    }}>
                        <span ref={loadNumRef}>0</span>%
                    </span>
                </div>

                <div style={{
                    width: '100%', height: 2,
                    background: 'rgba(255,255,255,0.08)',
                    position: 'relative', borderRadius: 999,
                }}>
                    <div ref={loadBarRef} style={{
                        position: 'absolute', top: 0, left: 0,
                        height: '100%', width: '0%',
                        background: 'linear-gradient(to right, rgba(255,255,255,0.5), #fff)',
                        borderRadius: 999,
                        boxShadow: '0 0 12px rgba(255,255,255,0.45), 0 0 24px rgba(255,255,255,0.12)',
                    }} />
                    <div ref={loadDotRef} style={{
                        position: 'absolute', top: '50%', left: '0%',
                        transform: 'translate(-50%, -50%)',
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 0 10px 4px rgba(255,255,255,0.7)',
                    }} />
                </div>
            </div>

            {/* Flash */}
            <div ref={flashRef} style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: '#000', opacity: 0, pointerEvents: 'none',
            }} />
        </div>
    )
}