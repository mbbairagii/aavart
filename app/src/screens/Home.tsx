import { useState } from 'react'

interface Props {
    onCreatePool: () => void
    onJoinPool: (address: string) => void
}

// Manga speech bubble
function Bubble({ text, style }: { text: string; style?: React.CSSProperties }) {
    return (
        <div style={{
            position: 'absolute',
            background: 'var(--color-paper)',
            border: '2px solid var(--color-ink)',
            borderRadius: '50%',
            padding: '10px 16px',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            letterSpacing: '0.04em',
            lineHeight: 1.3,
            color: 'var(--color-ink)',
            textAlign: 'center',
            zIndex: 10,
            maxWidth: 140,
            ...style,
        }}>
            {text}
        </div>
    )
}

// Manga rain/speed lines SVG
function RainLines({ color = 'currentColor', opacity = 0.15 }: { color?: string; opacity?: number }) {
    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }} aria-hidden>
            {Array.from({ length: 40 }, (_, i) => (
                <line
                    key={i}
                    x1={`${(i / 40) * 100 + Math.random() * 5}%`} y1="0"
                    x2={`${(i / 40) * 100 - 3 + Math.random() * 5}%`} y2="100%"
                    stroke={color} strokeWidth="0.8"
                />
            ))}
        </svg>
    )
}

export default function Home({ onCreatePool, onJoinPool }: Props) {
    const [inviteInput, setInviteInput] = useState('')

    function handleJoin() {
        const trimmed = inviteInput.trim()
        if (!trimmed) return
        try {
            const url = new URL(trimmed)
            const addr = url.searchParams.get('pool')
            if (addr) { onJoinPool(addr); return }
        } catch { }
        onJoinPool(trimmed)
    }

    // panel border style
    const panel: React.CSSProperties = {
        border: '3px solid var(--color-ink)',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
    }
    const panelDark: React.CSSProperties = {
        ...panel,
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
    }

    return (
        <div style={{ background: 'var(--color-bg)' }}>

            {/* ── HERO ── */}
            <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '3px solid var(--color-ink)' }}>
                {/* sunburst SVG behind everything */}
                <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
                    className="sunburst-light">
                    {Array.from({ length: 36 }, (_, i) => {
                        const a1 = (i / 36) * 360, a2 = ((i + 0.5) / 36) * 360, r = 1200
                        const cx = 400, cy = 300
                        return <polygon key={i} points={`${cx},${cy} ${cx + r * Math.cos(a1 * Math.PI / 180)},${cy + r * Math.sin(a1 * Math.PI / 180)} ${cx + r * Math.cos(a2 * Math.PI / 180)},${cy + r * Math.sin(a2 * Math.PI / 180)}`}
                            fill={i % 2 === 0 ? '#c8c4bb' : 'transparent'} opacity="0.35" />
                    })}
                </svg>
                <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
                    className="sunburst-dark">
                    {Array.from({ length: 36 }, (_, i) => {
                        const a1 = (i / 36) * 360, a2 = ((i + 0.5) / 36) * 360, r = 1200
                        const cx = 400, cy = 300
                        return <polygon key={i} points={`${cx},${cy} ${cx + r * Math.cos(a1 * Math.PI / 180)},${cy + r * Math.sin(a1 * Math.PI / 180)} ${cx + r * Math.cos(a2 * Math.PI / 180)},${cy + r * Math.sin(a2 * Math.PI / 180)}`}
                            fill={i % 2 === 0 ? '#2a2a2a' : 'transparent'} opacity="0.65" />
                    })}
                </svg>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '56px 28px 64px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', alignItems: 'center', gap: 48 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                            <div style={{
                                display: 'inline-flex', width: 'fit-content',
                                background: 'var(--color-panel-bg)', border: '2px solid var(--color-border)',
                                boxShadow: '3px 3px 0 var(--color-border)',
                                padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-ui)',
                                letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--color-text)',
                            }}>● LIVE ON SOLANA DEVNET</div>

                            <h1 style={{
                                fontFamily: 'var(--font-display)', fontSize: 'clamp(64px, 9vw, 118px)',
                                lineHeight: 0.88, letterSpacing: '0.03em', color: 'var(--color-text)',
                            }}>
                                SAVE<br />TOGETHER,<br />
                                <span style={{ WebkitTextStroke: '3px var(--color-text)', color: 'transparent' }}>WIN<br />TOGETHER.</span>
                            </h1>

                            <p style={{
                                fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-muted)',
                                maxWidth: 400, lineHeight: 1.7,
                                borderLeft: '3px solid var(--color-border)', paddingLeft: 16,
                            }}>
                                Trustless on-chain chit fund on Solana. Pool funds with your circle, rotate payouts every round — no bank, no middleman.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
                                <button onClick={onCreatePool} className="btn-comic" style={{ textAlign: 'center', fontSize: 20, width: '100%' }}>
                                    CREATE A POOL →
                                </button>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="text" value={inviteInput}
                                        onChange={e => setInviteInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                        placeholder="paste invite link or address..."
                                        style={{
                                            flex: 1, padding: '11px 14px',
                                            background: 'var(--color-panel-bg)', border: '2px solid var(--color-border)',
                                            boxShadow: '3px 3px 0 var(--color-border)',
                                            fontSize: 13, outline: 'none', fontFamily: 'var(--font-ui)', color: 'var(--color-text)',
                                        }} />
                                    <button onClick={handleJoin} disabled={!inviteInput.trim()}
                                        className="btn-comic btn-comic-outline"
                                        style={{ fontSize: 14, padding: '11px 16px', whiteSpace: 'nowrap' as const }}>JOIN</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 32, paddingTop: 8, borderTop: '2px solid var(--color-border)' }}>
                                {[['TRUSTLESS', 'smart contract'], ['NON-CUSTODIAL', 'on-chain funds'], ['INSTANT', 'no waiting']].map(([l, s]) => (
                                    <div key={l}>
                                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.05em', color: 'var(--color-text)' }}>{l}</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* stat panels right side */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '3px solid var(--color-ink)', boxShadow: '5px 5px 0 var(--color-border)' }}>
                            <div style={{ ...panel, padding: '28px 24px', borderBottom: '3px solid var(--color-ink)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, color: 'var(--color-ink)' }}>₹50B</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontFamily: 'var(--font-ui)' }}>chit funds per year in India alone</div>
                            </div>
                            <div style={{ ...panelDark, padding: '28px 24px', borderBottom: '3px solid var(--color-ink)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, color: 'var(--color-paper)' }}>0%</div>
                                <div style={{ fontSize: 12, color: 'var(--color-paper)', opacity: 0.6, marginTop: 6, fontFamily: 'var(--font-ui)' }}>interest. zero. none. zilch.</div>
                            </div>
                            <div style={{ ...panel, padding: '28px 24px', border: 'none' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, color: 'var(--color-ink)' }}>100%</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontFamily: 'var(--font-ui)' }}>on-chain. non-custodial. yours.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── HOW IT WORKS — REAL MANGA PANEL LAYOUT ── */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 28px 96px' }}>

                <div style={{ marginBottom: 40 }}>
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, marginBottom: 6 }}>— HOW IT WORKS</p>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 5vw, 64px)', letterSpacing: '0.04em', lineHeight: 0.9, color: 'var(--color-text)' }}>
                        FOUR STEPS.<br />ZERO TRUST.
                    </h2>
                </div>

                {/* MANGA PAGE LAYOUT — asymmetric like the reference */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--color-ink)', padding: 6, boxShadow: '6px 6px 0 var(--color-border)' }}>

                    {/* ROW 1: two small panels left + one tall right */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 6, alignItems: 'stretch' }}>
                        {/* left col: two stacked small panels */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                            {/* panel 1 — CREATE (small, intense) */}
                            <div style={{ ...panelDark, minHeight: 160, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                <RainLines color="var(--color-paper)" opacity={0.07} />
                                {/* bubble */}
                                <div style={{
                                    alignSelf: 'flex-end', marginBottom: 12,
                                    background: 'var(--color-paper)', border: '2px solid var(--color-paper)',
                                    borderRadius: '50%', padding: '8px 12px',
                                    fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-ink)',
                                    letterSpacing: '0.04em', lineHeight: 1.3, textAlign: 'center',
                                    position: 'relative', zIndex: 2, maxWidth: 120,
                                }}>
                                    SET YOUR<br />TERMS.
                                    <div style={{
                                        position: 'absolute', bottom: -7, left: '30%',
                                        width: 0, height: 0,
                                        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                                        borderTop: '7px solid var(--color-paper)',
                                    }} />
                                </div>
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-paper)', opacity: 0.5, marginBottom: 4 }}>STEP 01</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.04em', color: 'var(--color-paper)', lineHeight: 0.9 }}>CREATE</div>
                                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-paper)', opacity: 0.65, marginTop: 6 }}>
                                        Set contribution, members & duration.
                                    </div>
                                </div>
                            </div>

                            {/* panel 2 — INVITE (small) */}
                            <div style={{ ...panel, minHeight: 160, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                <RainLines color="var(--color-ink)" opacity={0.07} />
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-ink)', opacity: 0.4, marginBottom: 4 }}>STEP 02</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.04em', color: 'var(--color-ink)', lineHeight: 0.9 }}>INVITE</div>
                                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                                        Share your link. Circle joins & locks funds.
                                    </div>
                                </div>
                                {/* bubble top right */}
                                <div style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'var(--color-ink)', border: '2px solid var(--color-ink)',
                                    borderRadius: '50%', padding: '8px 10px',
                                    fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--color-paper)',
                                    letterSpacing: '0.04em', lineHeight: 1.3, textAlign: 'center', maxWidth: 100,
                                    zIndex: 2,
                                }}>
                                    SHARE<br />IT!!
                                    <div style={{
                                        position: 'absolute', bottom: -7, right: '25%',
                                        width: 0, height: 0,
                                        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                                        borderTop: '7px solid var(--color-ink)',
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* panel 3 — ROTATE (tall, dramatic, dark) */}
                        <div style={{ ...panelDark, minHeight: 326, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <RainLines color="var(--color-paper)" opacity={0.06} />
                            {/* big speech bubble top */}
                            <div style={{
                                alignSelf: 'flex-end',
                                background: 'var(--color-paper)', border: '2px solid var(--color-paper)',
                                borderRadius: '50%', padding: '14px 18px',
                                fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--color-ink)',
                                letterSpacing: '0.04em', lineHeight: 1.3, textAlign: 'center',
                                position: 'relative', zIndex: 2, maxWidth: 160,
                            }}>
                                EVERY ROUND,<br />ONE WINS.
                                <div style={{
                                    position: 'absolute', bottom: -8, left: '35%',
                                    width: 0, height: 0,
                                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                                    borderTop: '9px solid var(--color-paper)',
                                }} />
                            </div>

                            {/* giant step number watermark */}
                            <div style={{
                                position: 'absolute', bottom: -10, right: 10,
                                fontFamily: 'var(--font-display)', fontSize: 140,
                                color: 'var(--color-paper)', opacity: 0.05,
                                lineHeight: 1, zIndex: 1, userSelect: 'none',
                            }}>03</div>

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-paper)', opacity: 0.5, marginBottom: 6 }}>STEP 03</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, letterSpacing: '0.03em', color: 'var(--color-paper)', lineHeight: 0.88 }}>ROTATE</div>
                                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-paper)', opacity: 0.65, marginTop: 10, maxWidth: 280, lineHeight: 1.6 }}>
                                    Each round, all members contribute. One designated recipient claims the full pot. Transparent. On-chain.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: one wide panel spanning full width */}
                    <div style={{ ...panel, minHeight: 200, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, position: 'relative' }}>
                        <RainLines color="var(--color-ink)" opacity={0.05} />

                        {/* giant watermark */}
                        <div style={{
                            position: 'absolute', bottom: -20, left: 20,
                            fontFamily: 'var(--font-display)', fontSize: 200,
                            color: 'var(--color-ink)', opacity: 0.04,
                            lineHeight: 1, zIndex: 0, userSelect: 'none',
                        }}>04</div>

                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 6 }}>STEP 04</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: '0.03em', color: 'var(--color-ink)', lineHeight: 0.88 }}>
                                REPEAT.<br />
                                <span style={{ WebkitTextStroke: '2px var(--color-ink)', color: 'transparent' }}>TILL ALL WIN.</span>
                            </div>
                        </div>

                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 340 }}>
                            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                Until every member has received their lump sum. No losers. No middlemen. The contract handles it all.
                            </div>
                            {/* speech bubble */}
                            <div style={{
                                display: 'inline-flex', alignSelf: 'flex-start',
                                background: 'var(--color-ink)', color: 'var(--color-paper)',
                                border: '2px solid var(--color-ink)',
                                padding: '10px 18px',
                                fontFamily: 'var(--font-display)', fontSize: 14,
                                letterSpacing: '0.06em',
                                boxShadow: '3px 3px 0 var(--color-border)',
                                position: 'relative',
                            }}>
                                EVERYONE WINS!!
                                <div style={{
                                    position: 'absolute', bottom: -8, left: 24,
                                    width: 0, height: 0,
                                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                                    borderTop: '8px solid var(--color-ink)',
                                }} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
        .sunburst-light { display: block; }
        .sunburst-dark  { display: none; }
        [data-theme="dark"] .sunburst-light { display: none; }
        [data-theme="dark"] .sunburst-dark  { display: block; }
      `}</style>
        </div>
    )
}