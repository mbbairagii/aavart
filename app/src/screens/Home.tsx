import { useState, useEffect, useRef } from 'react'

interface Props {
    onCreatePool: () => void
    onJoinPool: (address: string) => void
}

const SERIF = "'Instrument Serif', Georgia, serif"
const SANS = "'DM Sans', sans-serif"
const BG = '#0a0a0a'
const FG = '#ddd9d0'
const BORDER = 'rgba(221,217,208,0.08)'
const MUTED = 'rgba(221,217,208,0.30)'

const steps = [
    { n: '01', t: 'Create', d: 'Set your contribution amount, number of members, and round duration. Deploy in one click.' },
    { n: '02', t: 'Invite', d: 'Share your pool link. Members join and lock their SOL. The contract enforces everything.' },
    { n: '03', t: 'Rotate', d: 'Every round, all members contribute. One recipient claims the full pot. Transparent. On-chain.' },
    { n: '04', t: 'Repeat', d: 'Until every member has received their lump sum. No losers. No middlemen. Done.' },
]

const docsSections = [
    {
        label: '01 — What is Aavart?',
        body: `Aavart is a decentralised chit fund built on the Solana blockchain. A chit fund — called "aavart" (आवर्त) in Hindi, meaning "cycle" or "rotation" — is one of the oldest savings instruments in South Asia. A group of people pool a fixed amount every period, and each member takes turns receiving the entire pot. Everyone saves, everyone wins, in rotation.

Aavart brings this centuries-old practice on-chain, making it trustless, transparent, and global. No rotating trust. No handshakes. The contract is the guarantee.`
    },
    {
        label: '02 — Why was it built?',
        body: `Traditional chit funds rely entirely on a fund manager — someone you trust to collect money, hold it, and pay it out fairly. That trust creates risk: managers can disappear, delay payouts, or mismanage funds. Informal circles among friends suffer the same problem — one person stops contributing and the whole circle breaks.

Aavart eliminates the manager entirely. A Solana smart contract enforces every rule: contribution deadlines, payout order, and fund release. Nobody can cheat. Nobody can disappear with the pot. The contract doesn't sleep, doesn't have a bad month, and can't be bribed.`
    },
    {
        label: '03 — How does it work?',
        body: `A pool creator sets three parameters: the contribution amount (in SOL), the number of members, and the round duration (e.g. weekly, monthly). The contract is deployed with these parameters locked in.

Members join by connecting their Solana wallet and locking their participation. Once all slots are filled, the pool activates. Each round, members send their contribution to the contract. At round close, the contract automatically releases the full pot to the designated recipient for that round — determined by the order set at creation. The cycle repeats until every member has received their turn. No manual intervention. No exceptions.`
    },
    {
        label: '04 — How was it built?',
        body: `Aavart is built with Anchor, the Rust framework for Solana programs. The on-chain program manages pool state, tracks contributions per round, validates wallet addresses, and handles atomic SOL transfers directly between participants — no custodial wallet, no intermediary account.

The frontend is React + TypeScript, using the Solana Wallet Adapter for wallet connection and @solana/web3.js for program interaction. Transactions are simulated client-side before submission so users can preview exactly what will happen. The UI intentionally strips away web3 complexity — pool creation feels as simple as filling a form.`
    },
    {
        label: '05 — Is it safe?',
        body: `The program logic is open-source and auditable. Because every rule is enforced at the contract level, there is no human in the loop who can misuse funds. Members can verify the pool parameters on-chain before joining — contribution amount, member count, and round schedule are all public.

That said, Aavart is an early-stage project. Smart contracts can have bugs, and Solana programs are immutable once deployed. Use it with amounts you are comfortable putting on-chain, and always verify the program ID before interacting with any pool.`
    },
]

export default function Home({ onCreatePool, onJoinPool }: Props) {
    const [inviteInput, setInviteInput] = useState('')
    const [joinOpen, setJoinOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [howOpen, setHowOpen] = useState(false)
    const [whatOpen, setWhatOpen] = useState(false)
    const [docsOpen, setDocsOpen] = useState(false)
    const [footerVisible, setFooterVisible] = useState(false)
    const footerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => setFooterVisible(entry.isIntersecting),
            { threshold: 0.15 }
        )
        if (footerRef.current) obs.observe(footerRef.current)
        return () => obs.disconnect()
    }, [])

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            const t = e.target as HTMLElement
            if (!t.closest('[data-nav-area]')) {
                setHowOpen(false)
                setWhatOpen(false)
                setJoinOpen(false)
            }
        }
        document.addEventListener('mousedown', fn)
        return () => document.removeEventListener('mousedown', fn)
    }, [])

    // lock body scroll when docs open
    useEffect(() => {
        document.body.style.overflow = docsOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [docsOpen])

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

    const navBtnBase: React.CSSProperties = {
        fontFamily: SANS, fontSize: 11,
        letterSpacing: '0.07em',
        background: 'none', border: 'none',
        padding: '10px 16px', cursor: 'pointer',
        transition: 'color 0.12s',
        color: MUTED,
    }

    return (
        <div style={{ background: BG, color: FG, minHeight: '100vh' }}>

            {/* ── NAV ── */}
            <nav
                data-nav-area
                style={{
                    position: 'fixed', top: 20, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 600,
                    display: 'flex', alignItems: 'center',
                    background: scrolled ? 'rgba(10,10,10,0.97)' : 'rgba(10,10,10,0.6)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 999,
                    padding: '0 6px',
                    transition: 'background 0.25s',
                    whiteSpace: 'nowrap' as const,
                    gap: 2,
                }}>

                <span style={{
                    fontFamily: SERIF, fontStyle: 'italic',
                    fontSize: 14, color: FG,
                    padding: '10px 18px',
                    borderRight: `1px solid ${BORDER}`,
                    letterSpacing: '0.01em',
                }}>Aavart</span>

                <button
                    style={{ ...navBtnBase, color: howOpen ? FG : MUTED }}
                    onClick={() => { setHowOpen(v => !v); setWhatOpen(false); setJoinOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.color = FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = howOpen ? FG : MUTED)}
                >How it works</button>

                <div style={{ width: 1, height: 14, background: BORDER }} />

                <button
                    onClick={onCreatePool}
                    style={{
                        fontFamily: SANS, fontSize: 11,
                        background: FG, color: BG,
                        border: 'none', borderRadius: 999,
                        padding: '8px 18px', margin: '4px 2px',
                        cursor: 'pointer', transition: 'opacity 0.12s',
                        letterSpacing: '0.04em',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >Create pool</button>

                <button
                    onClick={() => { setJoinOpen(v => !v); setHowOpen(false); setWhatOpen(false) }}
                    style={{
                        fontFamily: SANS, fontSize: 11,
                        background: 'transparent', color: joinOpen ? FG : MUTED,
                        border: `1px solid ${joinOpen ? 'rgba(221,217,208,0.25)' : 'rgba(221,217,208,0.1)'}`,
                        borderRadius: 999,
                        padding: '7px 16px', margin: '4px 2px 4px 0',
                        cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(221,217,208,0.3)'; e.currentTarget.style.color = FG }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = joinOpen ? 'rgba(221,217,208,0.25)' : 'rgba(221,217,208,0.1)'; e.currentTarget.style.color = joinOpen ? FG : MUTED }}
                >Join</button>

                <div style={{ width: 1, height: 14, background: BORDER }} />

                <button
                    style={{ ...navBtnBase, color: whatOpen ? FG : MUTED, paddingLeft: 14 }}
                    onClick={() => { setWhatOpen(v => !v); setHowOpen(false); setJoinOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.color = FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = whatOpen ? FG : MUTED)}
                >What is Aavart</button>
            </nav>

            {/* ── HOW IT WORKS DROPDOWN ── */}
            <div
                data-nav-area
                style={{
                    position: 'fixed', top: howOpen ? 68 : 62, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 598,
                    background: 'rgba(13,13,12,0.98)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 24px 56px rgba(0,0,0,0.7)',
                    width: 560,
                    overflow: 'hidden',
                    maxHeight: howOpen ? 340 : 0,
                    opacity: howOpen ? 1 : 0,
                    transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease, top 0.18s ease',
                    pointerEvents: howOpen ? 'auto' : 'none',
                }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: `1px solid ${BORDER}` }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{
                            padding: '24px 22px',
                            borderRight: i < 3 ? `1px solid ${BORDER}` : 'none',
                        }}>
                            <div style={{
                                fontFamily: SANS, fontSize: 9,
                                letterSpacing: '0.18em', color: 'rgba(221,217,208,0.22)',
                                marginBottom: 12,
                            }}>{s.n}</div>
                            <div style={{
                                fontFamily: SERIF, fontSize: 22,
                                color: FG, marginBottom: 10,
                                lineHeight: 1, letterSpacing: '-0.01em',
                            }}>{s.t}</div>
                            <div style={{
                                fontFamily: SANS, fontSize: 11,
                                color: 'rgba(221,217,208,0.38)', lineHeight: 1.75,
                            }}>{s.d}</div>
                        </div>
                    ))}
                </div>
                <div style={{
                    padding: '16px 22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span style={{
                        fontFamily: SERIF, fontStyle: 'italic',
                        fontSize: 12, color: 'rgba(221,217,208,0.25)',
                    }}>On-chain chit fund on Solana</span>
                    <button onClick={onCreatePool} style={{
                        fontFamily: SANS, fontSize: 11,
                        background: FG, color: BG,
                        border: 'none', borderRadius: 6,
                        padding: '9px 18px', cursor: 'pointer',
                        transition: 'opacity 0.12s', letterSpacing: '0.04em',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >Create a pool →</button>
                </div>
            </div>

            {/* ── WHAT IS AAVART DROPDOWN ── */}
            <div
                data-nav-area
                style={{
                    position: 'fixed', top: whatOpen ? 68 : 62, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 598,
                    background: 'rgba(13,13,12,0.98)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 24px 56px rgba(0,0,0,0.7)',
                    width: 420,
                    overflow: 'hidden',
                    maxHeight: whatOpen ? 360 : 0,
                    opacity: whatOpen ? 1 : 0,
                    transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease, top 0.18s ease',
                    pointerEvents: whatOpen ? 'auto' : 'none',
                }}>
                <div style={{ padding: '28px 28px 28px' }}>
                    <div style={{
                        fontFamily: SANS, fontSize: 9,
                        letterSpacing: '0.22em', color: 'rgba(221,217,208,0.2)',
                        textTransform: 'uppercase' as const, marginBottom: 20,
                    }}>About</div>
                    <p style={{
                        fontFamily: SERIF, fontStyle: 'italic',
                        fontSize: 17, color: FG,
                        lineHeight: 1.85, marginBottom: 16,
                    }}>
                        Aavart is a trustless chit fund on Solana — a rotating savings circle where members pool funds and take turns receiving the full pot.
                    </p>
                    <p style={{
                        fontFamily: SANS, fontSize: 12,
                        color: 'rgba(221,217,208,0.35)', lineHeight: 1.8,
                        marginBottom: 28,
                    }}>
                        No bank. No middleman. Smart contracts handle contributions, payouts, and enforcement — so your circle runs on code, not trust.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onCreatePool} style={{
                            fontFamily: SANS, fontSize: 11,
                            background: FG, color: BG,
                            border: 'none', borderRadius: 6,
                            padding: '10px 20px', cursor: 'pointer',
                            transition: 'opacity 0.12s', letterSpacing: '0.04em',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >Get started →</button>
                        <button
                            onClick={() => { setDocsOpen(true); setWhatOpen(false) }}
                            style={{
                                fontFamily: SANS, fontSize: 11,
                                background: 'transparent', color: MUTED,
                                border: `1px solid ${BORDER}`, borderRadius: 6,
                                padding: '10px 18px', cursor: 'pointer',
                                transition: 'all 0.12s', letterSpacing: '0.04em',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(221,217,208,0.25)'; e.currentTarget.style.color = FG }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
                        >Read the docs</button>
                    </div>
                </div>
            </div>

            {/* ── JOIN INPUT DROPDOWN ── */}
            {joinOpen && (
                <div
                    data-nav-area
                    style={{
                        position: 'fixed', top: 68, left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 597,
                        background: 'rgba(13,13,12,0.98)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 12, padding: '12px',
                        display: 'flex', gap: 8,
                        backdropFilter: 'blur(24px)',
                        minWidth: 380,
                        boxShadow: '0 24px 56px rgba(0,0,0,0.7)',
                    }}>
                    <input
                        autoFocus
                        type="text" value={inviteInput}
                        onChange={e => setInviteInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleJoin(); if (e.key === 'Escape') setJoinOpen(false) }}
                        placeholder="Paste invite link or pool address"
                        style={{
                            flex: 1, padding: '10px 14px',
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${BORDER}`,
                            borderRadius: 8, fontSize: 13, outline: 'none',
                            fontFamily: SANS, color: FG,
                        }}
                    />
                    <button onClick={handleJoin} disabled={!inviteInput.trim()} style={{
                        fontFamily: SANS, fontSize: 12,
                        background: FG, color: BG,
                        border: 'none', borderRadius: 8,
                        padding: '10px 20px', cursor: 'pointer',
                        opacity: inviteInput.trim() ? 1 : 0.3,
                        transition: 'opacity 0.12s',
                    }}>Join →</button>
                </div>
            )}

            {/* ── HERO ── */}
            <main>
                <div style={{
                    height: '100vh',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '0 56px 72px',
                    borderBottom: `1px solid ${BORDER}`,
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <img
                        src="/hero-bg.png"
                        alt=""
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center top',
                            opacity: 0.55,
                            zIndex: 0,
                            userSelect: 'none',
                            pointerEvents: 'none',
                        }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1,
                        background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.0) 35%, rgba(10,10,10,0.85) 78%, #0a0a0a 100%)',
                        pointerEvents: 'none',
                    }} />

                    {/* content */}
                    <div style={{ position: 'relative', zIndex: 2, marginBottom: 60 }}>
                        <h1 style={{
                            fontFamily: SERIF,
                            fontSize: 'clamp(72px, 14vw, 220px)',
                            lineHeight: 0.84, letterSpacing: '-0.01em',
                            color: FG, margin: '0 0 48px',
                            fontWeight: 400,
                        }}>
                            Save<br />
                            <span style={{ WebkitTextStroke: `1.5px ${FG}`, color: 'transparent' }}>
                                together.
                            </span>
                        </h1>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-end', flexWrap: 'wrap' as const, gap: 24,
                            paddingTop: 28, borderTop: `1px solid ${BORDER}`,
                        }}>
                            <p style={{
                                fontFamily: SANS, fontSize: 13,
                                color: MUTED, lineHeight: 1.9,
                                margin: 0, maxWidth: 280,
                            }}>
                                Trustless on-chain chit fund on Solana.<br />
                                Pool funds, rotate payouts.<br />
                                No bank. No middleman.
                            </p>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button
                                    onClick={() => { setHowOpen(v => !v); setWhatOpen(false); setJoinOpen(false) }}
                                    style={{
                                        fontFamily: SANS, fontSize: 13,
                                        background: 'transparent', color: MUTED,
                                        border: `1px solid ${BORDER}`, borderRadius: 4,
                                        padding: '13px 24px', cursor: 'pointer',
                                        transition: 'all 0.12s', letterSpacing: '0.03em',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = FG; e.currentTarget.style.borderColor = 'rgba(221,217,208,0.28)' }}
                                    onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER }}
                                >How it works</button>
                                <button onClick={onCreatePool} style={{
                                    fontFamily: SANS, fontSize: 13,
                                    background: FG, color: BG,
                                    border: 'none', borderRadius: 4,
                                    padding: '13px 28px', cursor: 'pointer',
                                    transition: 'opacity 0.12s', letterSpacing: '0.03em',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >Create a pool →</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div
                    ref={footerRef}
                    style={{
                        padding: '56px 56px 52px',
                        opacity: footerVisible ? 1 : 0,
                        transform: footerVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease',
                    }}>
                    <div style={{
                        paddingTop: 32, borderTop: `1px solid ${BORDER}`,
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap' as const, gap: 12,
                    }}>
                        <span style={{
                            fontFamily: SERIF, fontStyle: 'italic',
                            fontSize: 22, color: FG,
                            letterSpacing: '0.01em',
                        }}>Aavart</span>
                        <span style={{
                            fontFamily: SANS, fontSize: 13,
                            color: 'rgba(221,217,208,0.45)',
                            letterSpacing: '0.02em',
                        }}>
                            Made with love · 2026
                        </span>
                    </div>
                </div>
            </main>

            {/* ── DOCS MODAL ── */}
            {docsOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 800,
                        background: 'rgba(6,6,5,0.92)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', justifyContent: 'center',
                        overflowY: 'auto',
                        padding: '60px 24px',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) setDocsOpen(false) }}
                >
                    <div style={{
                        width: '100%', maxWidth: 720,
                        background: '#0f0f0e',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 16,
                        padding: '56px 64px 72px',
                        position: 'relative',
                        height: 'fit-content',
                    }}>
                        {/* close */}
                        <button
                            onClick={() => setDocsOpen(false)}
                            style={{
                                position: 'absolute', top: 24, right: 24,
                                fontFamily: SANS, fontSize: 11,
                                color: MUTED, background: 'none',
                                border: `1px solid ${BORDER}`,
                                borderRadius: 6, padding: '6px 14px',
                                cursor: 'pointer', letterSpacing: '0.06em',
                                transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = FG; e.currentTarget.style.borderColor = 'rgba(221,217,208,0.25)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER }}
                        >✕ Close</button>

                        {/* header */}
                        <div style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: 'rgba(221,217,208,0.2)',
                            textTransform: 'uppercase' as const, marginBottom: 20,
                        }}>Documentation</div>
                        <h2 style={{
                            fontFamily: SERIF, fontSize: 42,
                            color: FG, fontWeight: 400,
                            lineHeight: 1.05, letterSpacing: '-0.01em',
                            marginBottom: 56,
                        }}>Everything about<br />Aavart.</h2>

                        {/* sections */}
                        {docsSections.map((section, i) => (
                            <div key={i} style={{
                                marginBottom: 48,
                                paddingBottom: 48,
                                borderBottom: i < docsSections.length - 1 ? `1px solid ${BORDER}` : 'none',
                            }}>
                                <div style={{
                                    fontFamily: SANS, fontSize: 10,
                                    letterSpacing: '0.16em', color: 'rgba(221,217,208,0.28)',
                                    marginBottom: 16,
                                }}>{section.label}</div>
                                {section.body.split('\n\n').map((para, j, arr) => (
                                    <p key={j} style={{
                                        fontFamily: SANS, fontSize: 14,
                                        color: 'rgba(221,217,208,0.62)', lineHeight: 1.9,
                                        marginBottom: j < arr.length - 1 ? 16 : 0,
                                    }}>{para}</p>
                                ))}
                            </div>
                        ))}

                        {/* bottom CTA */}
                        <button
                            onClick={() => { setDocsOpen(false); onCreatePool() }}
                            style={{
                                fontFamily: SANS, fontSize: 13,
                                background: FG, color: BG,
                                border: 'none', borderRadius: 6,
                                padding: '14px 32px', cursor: 'pointer',
                                transition: 'opacity 0.12s', letterSpacing: '0.04em',
                                marginTop: 8,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >Ready — Create a pool →</button>
                    </div>
                </div>
            )}
        </div>
    )
}