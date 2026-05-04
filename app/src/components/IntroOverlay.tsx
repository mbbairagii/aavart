import { useEffect, useRef, useState } from 'react'

interface Props {
    onComplete: () => void
}

export default function IntroOverlay({ onComplete }: Props) {
    const bgTextRef = useRef<HTMLDivElement>(null)
    const bgWrapRef = useRef<HTMLDivElement>(null)
    const dumpRef = useRef<HTMLDivElement>(null)
    const flashRef = useRef<HTMLDivElement>(null)
    const lastPanelRef = useRef<HTMLImageElement>(null)
    const typingRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        runIntro()
    }, [])

    function startBgText() {
        const container = bgTextRef.current!
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
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

    async function runIntro() {
        const el = typingRef.current!
        const bgWrap = bgWrapRef.current!
        const word = 'AAVART'

        // step 1: type letter by letter
        el.style.opacity = '1'
        for (let i = 0; i <= word.length; i++) {
            el.textContent = word.slice(0, i)
            await new Promise(r => setTimeout(r, 160))
        }

        await new Promise(r => setTimeout(r, 600))

        // step 2: shrink + darken typed word toward bg row size/colour
        // simultaneously fade bg rows in from 0
        bgWrap.style.opacity = '0'
        bgWrap.style.display = 'flex'
        startBgText() // start scrolling immediately, invisible

        await animate(1000, t => {
            const e = easeInOutCubic(t)

            // shrink
            const size = lerp(
                Math.min(window.innerWidth * 0.26, 340),
                Math.min(window.innerWidth * 0.12, 160),
                e
            )
            el.style.fontSize = `${size}px`

            // colour: #C8C4BC → #6B6760
            const ri = Math.round(lerp(0xC8, 0x6B, e)).toString(16).padStart(2, '0')
            const gi = Math.round(lerp(0xC4, 0x67, e)).toString(16).padStart(2, '0')
            const bi = Math.round(lerp(0xBC, 0x60, e)).toString(16).padStart(2, '0')
            el.style.color = `#${ri}${gi}${bi}`
            el.style.letterSpacing = `${lerp(0.1, 0.12, e)}em`

            // bg fades in as typed word shrinks — crossfade
            bgWrap.style.opacity = String(easeOutCubic(t))
        })

        // step 3: now crossfade typed word out — bg is fully visible
        await animate(400, t => {
            el.style.opacity = String(1 - easeOutCubic(t))
        })
        el.style.display = 'none'

        // step 4: let bg breathe, then panels
        await new Promise(r => setTimeout(r, 1200))
        await runPanels()
    }

    async function runPanels() {
        const dump = dumpRef.current!
        const flash = flashRef.current!
        const imgs = dump.querySelectorAll<HTMLImageElement>('.intro-panel')

        dump.style.opacity = '1'

        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i]
            const isLast = i === imgs.length - 1

            img.style.transition = 'none'
            img.style.opacity = '0'
            img.style.transform = isLast ? 'scale(0.88) translateZ(0)' : 'translateY(30px) scale(0.97)'
            img.style.zIndex = String(10 + i)
            img.getBoundingClientRect()

            if (isLast) {
                img.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)'
                img.style.opacity = '1'
                img.style.transform = 'scale(1) translateZ(0)'
                await new Promise(r => setTimeout(r, 900))

                img.style.transition = 'all 1.6s cubic-bezier(0.16,1,0.3,1)'
                img.style.transform = 'scale(1.85) translateZ(0)'
                img.style.border = 'none'
                img.style.borderRadius = '0'
                img.style.boxShadow = 'none'
                await new Promise(r => setTimeout(r, 1700))

            } else {
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

        await animate(400, t => { flash.style.opacity = String(easeOutCubic(t)) })
        onComplete()
        await animate(500, t => { flash.style.opacity = String(1 - easeOutCubic(t)) })
    }

    const word = 'AAVART'
    const repeat = 12
    const row = Array(repeat).fill(word).join('   ')
    const rows = 5

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

            {/* Grid */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
                backgroundSize: '48px 48px',
            }} />

            {/* Typing word */}
            <div
                ref={typingRef}
                style={{
                    position: 'absolute', zIndex: 6,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(120px, 26vw, 340px)',
                    letterSpacing: '0.1em',
                    color: '#C8C4BC',
                    userSelect: 'none',
                    lineHeight: 1,
                    opacity: 0,
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    transition: 'font-size 0s', // JS handles all transitions
                }}
            />

            {/* Scrolling bg — always in DOM, opacity controlled by JS */}
            <div
                ref={bgWrapRef}
                style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    display: 'none', // shown via JS
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    opacity: 0,
                }}
            >
                <div
                    ref={bgTextRef}
                    style={{
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {Array(rows).fill(null).map((_, rowIdx) => (
                        <div key={rowIdx} style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(72px, 12vw, 160px)',
                            letterSpacing: '0.12em',
                            color: rowIdx % 2 === 0 ? '#6B6760' : '#4A4844',
                            lineHeight: 1,
                            userSelect: 'none',
                            marginLeft: rowIdx % 2 !== 0 ? '-80px' : '0px',
                        }}>
                            {row}{'   '}{row}
                        </div>
                    ))}
                </div>
            </div>

            {/* Panels */}
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
                            src={src}
                            alt={`Panel ${i + 1}`}
                            className="intro-panel"
                            style={{
                                position: 'absolute',
                                height: 'clamp(300px, 52vh, 560px)',
                                width: 'auto',
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

            {/* Black flash */}
            <div ref={flashRef} style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: '#000',
                opacity: 0,
                pointerEvents: 'none',
            }} />
        </div>
    )
}