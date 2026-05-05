import { useState, useEffect, useRef } from 'react'

interface Props {
    onCreatePool: () => void
    onJoinPool: (address: string) => void
}

const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS  = "'Syne', sans-serif"

const TRS = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const DUR = '0.6s'
const T_ALL = `background ${DUR} ${TRS}, color ${DUR} ${TRS}, border-color ${DUR} ${TRS}, opacity ${DUR} ${TRS}`

const DARK = {
    BG: '#0a0a0a',
    FG: '#ddd9d0',
    BORDER: 'rgba(221,217,208,0.08)',
    MUTED: 'rgba(221,217,208,0.30)',
    NAV_BG_IDLE: 'rgba(10,10,10,0.6)',
    NAV_BG_SCROLLED: 'rgba(10,10,10,0.97)',
    DROPDOWN_BG: 'rgba(13,13,12,0.98)',
    HERO_GRADIENT: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.0) 35%, rgba(10,10,10,0.85) 78%, #0a0a0a 100%)',
    DOCS_BG: '#0f0f0e',
    DOCS_BACKDROP: 'rgba(6,6,5,0.92)',
    STROKE: '#ddd9d0',
    FOOTER_CREDIT: 'rgba(221,217,208,0.45)',
    STEP_NUM: 'rgba(221,217,208,0.22)',
    STEP_DESC: 'rgba(221,217,208,0.38)',
    TAGLINE: 'rgba(221,217,208,0.25)',
    DOC_LABEL: 'rgba(221,217,208,0.2)',
    DOC_SECTION_LABEL: 'rgba(221,217,208,0.28)',
    DOC_BODY: 'rgba(221,217,208,0.62)',
    ABOUT_MUTED: 'rgba(221,217,208,0.35)',
    ABOUT_LABEL: 'rgba(221,217,208,0.2)',
}

const LIGHT = {
    BG: '#f5f2eb',
    FG: '#111111',
    BORDER: 'rgba(17,17,17,0.12)',
    MUTED: 'rgba(17,17,17,0.45)',
    NAV_BG_IDLE: 'rgba(245,242,235,0.75)',
    NAV_BG_SCROLLED: 'rgba(245,242,235,0.97)',
    DROPDOWN_BG: 'rgba(250,248,244,0.99)',
    HERO_GRADIENT: 'linear-gradient(to bottom, rgba(245,242,235,0.05) 0%, rgba(245,242,235,0.0) 35%, rgba(245,242,235,0.82) 72%, #f5f2eb 100%)',
    DOCS_BG: '#faf9f6',
    DOCS_BACKDROP: 'rgba(230,227,219,0.88)',
    STROKE: '#111111',
    FOOTER_CREDIT: 'rgba(17,17,17,0.38)',
    STEP_NUM: 'rgba(17,17,17,0.28)',
    STEP_DESC: 'rgba(17,17,17,0.52)',
    TAGLINE: 'rgba(17,17,17,0.32)',
    DOC_LABEL: 'rgba(17,17,17,0.25)',
    DOC_SECTION_LABEL: 'rgba(17,17,17,0.38)',
    DOC_BODY: 'rgba(17,17,17,0.68)',
    ABOUT_MUTED: 'rgba(17,17,17,0.45)',
    ABOUT_LABEL: 'rgba(17,17,17,0.28)',
}

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

const COMIC_PAGES = [
    '/manga/1.png', '/manga/2.png', '/manga/3.png', '/manga/4.png',
    '/manga/5.png', '/manga/6.png', '/manga/7.png',
]

function useTheme() {
    const [isLight, setIsLight] = useState(
        () => document.documentElement.getAttribute('data-theme') === 'light'
    )
    useEffect(() => {
        const obs = new MutationObserver(() => {
            setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
        })
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => obs.disconnect()
    }, [])
    return isLight
}

export default function Home({ onCreatePool, onJoinPool }: Props) {
    const isLight = useTheme()
    const T = isLight ? LIGHT : DARK

    const [inviteInput, setInviteInput] = useState('')
    const [joinOpen, setJoinOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [howOpen, setHowOpen] = useState(false)
    const [whatOpen, setWhatOpen] = useState(false)
    const [docsOpen, setDocsOpen] = useState(false)
    const [comicOpen, setComicOpen] = useState(false)
    const [comicPage, setComicPage] = useState(0)
    const [footerVisible, setFooterVisible] = useState(false)
    const footerRef = useRef<HTMLDivElement>(null)
    const comicOverlayRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        document.body.style.overflow = (docsOpen || comicOpen) ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [docsOpen, comicOpen])

    // focus comic overlay for keyboard nav
    useEffect(() => {
        if (comicOpen) comicOverlayRef.current?.focus()
    }, [comicOpen])

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

    function openComic() {
        setComicPage(0)
        setComicOpen(true)
    }

    const imgBase: React.CSSProperties = {
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
        objectPosition: '60% center',
        zIndex: 0,
        userSelect: 'none',
        pointerEvents: 'none',
        willChange: 'opacity',
        transform: 'translateZ(0)',
        transition: `opacity ${DUR} ${TRS}`,
    }

    const navBtnBase: React.CSSProperties = {
        fontFamily: SANS, fontSize: 11,
        letterSpacing: '0.07em',
        background: 'none', border: 'none',
        padding: '10px 16px', cursor: 'pointer',
        transition: `color 0.15s ease`,
        color: T.MUTED,
    }

    return (
        <div style={{ background: T.BG, color: T.FG, minHeight: '100vh', transition: T_ALL }}>

            {/* ── NAV ── */}
            <nav
                data-nav-area
                style={{
                    position: 'fixed', top: 20, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 600,
                    display: 'flex', alignItems: 'center',
                    background: scrolled ? T.NAV_BG_SCROLLED : T.NAV_BG_IDLE,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${T.BORDER}`,
                    borderRadius: 999,
                    padding: '0 6px',
                    transition: `background ${DUR} ${TRS}, border-color ${DUR} ${TRS}, box-shadow ${DUR} ${TRS}`,
                    whiteSpace: 'nowrap' as const,
                    gap: 2,
                    boxShadow: isLight ? '0 2px 24px rgba(0,0,0,0.08)' : 'none',
                }}>

                <span style={{
                    fontFamily: SERIF, fontStyle: 'italic',
                    fontSize: 14, color: T.FG,
                    padding: '10px 18px',
                    borderRight: `1px solid ${T.BORDER}`,
                    letterSpacing: '0.01em',
                    transition: T_ALL,
                }}>Aavart</span>

                <button
                    style={{ ...navBtnBase, color: howOpen ? T.FG : T.MUTED }}
                    onClick={() => { setHowOpen(v => !v); setWhatOpen(false); setJoinOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = howOpen ? T.FG : T.MUTED)}
                >How it works</button>

                <div style={{ width: 1, height: 14, background: T.BORDER, transition: `background ${DUR} ${TRS}` }} />

                <button
                    onClick={onCreatePool}
                    style={{
                        fontFamily: SANS, fontSize: 11,
                        background: T.FG, color: T.BG,
                        border: 'none', borderRadius: 999,
                        padding: '8px 18px', margin: '4px 2px',
                        cursor: 'pointer',
                        transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
                        letterSpacing: '0.04em',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >Create pool</button>

                <button
                    onClick={() => { setJoinOpen(v => !v); setHowOpen(false); setWhatOpen(false) }}
                    style={{
                        fontFamily: SANS, fontSize: 11,
                        background: 'transparent', color: joinOpen ? T.FG : T.MUTED,
                        border: `1px solid ${joinOpen ? T.BORDER.replace('0.08', '0.25') : T.BORDER}`,
                        borderRadius: 999,
                        padding: '7px 16px', margin: '4px 2px 4px 0',
                        cursor: 'pointer', transition: `all 0.15s ease`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.MUTED; e.currentTarget.style.color = T.FG }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.BORDER; e.currentTarget.style.color = joinOpen ? T.FG : T.MUTED }}
                >Join</button>

                <div style={{ width: 1, height: 14, background: T.BORDER, transition: `background ${DUR} ${TRS}` }} />

                <button
                    style={{ ...navBtnBase, color: whatOpen ? T.FG : T.MUTED, paddingLeft: 14 }}
                    onClick={() => { setWhatOpen(v => !v); setHowOpen(false); setJoinOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = whatOpen ? T.FG : T.MUTED)}
                >What is Aavart</button>

                <div style={{ width: 1, height: 14, background: T.BORDER, transition: `background ${DUR} ${TRS}` }} />

                {/* Read comic button */}
                <button
                    onClick={openComic}
                    style={{
                        ...navBtnBase,
                        fontFamily: SERIF,
                        fontStyle: 'italic' as const,
                        fontSize: 13,
                        paddingLeft: 14,
                        paddingRight: 18,
                        color: T.MUTED,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.MUTED)}
                >Read comic ↗</button>
            </nav>

            {/* ── HOW IT WORKS DROPDOWN ── */}
            <div
                data-nav-area
                style={{
                    position: 'fixed', top: howOpen ? 68 : 62, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 598,
                    background: T.DROPDOWN_BG,
                    border: `1px solid ${T.BORDER}`,
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    boxShadow: isLight ? '0 24px 56px rgba(0,0,0,0.12)' : '0 24px 56px rgba(0,0,0,0.7)',
                    width: 560,
                    overflow: 'hidden',
                    maxHeight: howOpen ? 340 : 0,
                    opacity: howOpen ? 1 : 0,
                    transition: `max-height 0.32s ${TRS}, opacity 0.22s ease, top 0.22s ease, background ${DUR} ${TRS}, border-color ${DUR} ${TRS}`,
                    pointerEvents: howOpen ? 'auto' : 'none',
                }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: `1px solid ${T.BORDER}` }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{
                            padding: '24px 22px',
                            borderRight: i < 3 ? `1px solid ${T.BORDER}` : 'none',
                            transition: `border-color ${DUR} ${TRS}`,
                        }}>
                            <div style={{
                                fontFamily: SANS, fontSize: 9,
                                letterSpacing: '0.18em', color: T.STEP_NUM,
                                marginBottom: 12, transition: `color ${DUR} ${TRS}`,
                            }}>{s.n}</div>
                            <div style={{
                                fontFamily: SERIF, fontSize: 22,
                                color: T.FG, marginBottom: 10,
                                lineHeight: 1, letterSpacing: '-0.01em',
                                transition: `color ${DUR} ${TRS}`,
                            }}>{s.t}</div>
                            <div style={{
                                fontFamily: SANS, fontSize: 11,
                                color: T.STEP_DESC, lineHeight: 1.75,
                                transition: `color ${DUR} ${TRS}`,
                            }}>{s.d}</div>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                        fontFamily: SERIF, fontStyle: 'italic',
                        fontSize: 12, color: T.TAGLINE,
                        transition: `color ${DUR} ${TRS}`,
                    }}>On-chain chit fund on Solana</span>
                    <button onClick={onCreatePool} style={{
                        fontFamily: SANS, fontSize: 11,
                        background: T.FG, color: T.BG,
                        border: 'none', borderRadius: 6,
                        padding: '9px 18px', cursor: 'pointer',
                        transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
                        letterSpacing: '0.04em',
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
                    background: T.DROPDOWN_BG,
                    border: `1px solid ${T.BORDER}`,
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    boxShadow: isLight ? '0 24px 56px rgba(0,0,0,0.12)' : '0 24px 56px rgba(0,0,0,0.7)',
                    width: 420,
                    overflow: 'hidden',
                    maxHeight: whatOpen ? 360 : 0,
                    opacity: whatOpen ? 1 : 0,
                    transition: `max-height 0.32s ${TRS}, opacity 0.22s ease, top 0.22s ease, background ${DUR} ${TRS}, border-color ${DUR} ${TRS}`,
                    pointerEvents: whatOpen ? 'auto' : 'none',
                }}>
                <div style={{ padding: '28px 28px 28px' }}>
                    <div style={{
                        fontFamily: SANS, fontSize: 9,
                        letterSpacing: '0.22em', color: T.ABOUT_LABEL,
                        textTransform: 'uppercase' as const, marginBottom: 20,
                        transition: `color ${DUR} ${TRS}`,
                    }}>About</div>
                    <p style={{
                        fontFamily: SERIF, fontStyle: 'italic',
                        fontSize: 17, color: T.FG,
                        lineHeight: 1.85, marginBottom: 16,
                        transition: `color ${DUR} ${TRS}`,
                    }}>
                        Aavart is a trustless chit fund on Solana — a rotating savings circle where members pool funds and take turns receiving the full pot.
                    </p>
                    <p style={{
                        fontFamily: SANS, fontSize: 12,
                        color: T.ABOUT_MUTED, lineHeight: 1.8,
                        marginBottom: 28, transition: `color ${DUR} ${TRS}`,
                    }}>
                        No bank. No middleman. Smart contracts handle contributions, payouts, and enforcement — so your circle runs on code, not trust.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onCreatePool} style={{
                            fontFamily: SANS, fontSize: 11,
                            background: T.FG, color: T.BG,
                            border: 'none', borderRadius: 6,
                            padding: '10px 20px', cursor: 'pointer',
                            transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
                            letterSpacing: '0.04em',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >Get started →</button>
                        <button
                            onClick={() => { setDocsOpen(true); setWhatOpen(false) }}
                            style={{
                                fontFamily: SANS, fontSize: 11,
                                background: 'transparent', color: T.MUTED,
                                border: `1px solid ${T.BORDER}`, borderRadius: 6,
                                padding: '10px 18px', cursor: 'pointer',
                                transition: `all 0.15s ease`, letterSpacing: '0.04em',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.MUTED; e.currentTarget.style.color = T.FG }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.BORDER; e.currentTarget.style.color = T.MUTED }}
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
                        background: T.DROPDOWN_BG,
                        border: `1px solid ${T.BORDER}`,
                        borderRadius: 12, padding: '12px',
                        display: 'flex', gap: 8,
                        backdropFilter: 'blur(24px)',
                        minWidth: 380,
                        boxShadow: isLight ? '0 24px 56px rgba(0,0,0,0.12)' : '0 24px 56px rgba(0,0,0,0.7)',
                        transition: `background ${DUR} ${TRS}, border-color ${DUR} ${TRS}`,
                    }}>
                    <input
                        autoFocus
                        type="text" value={inviteInput}
                        onChange={e => setInviteInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleJoin(); if (e.key === 'Escape') setJoinOpen(false) }}
                        placeholder="Paste invite link or pool address"
                        style={{
                            flex: 1, padding: '10px 14px',
                            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${T.BORDER}`,
                            borderRadius: 8, fontSize: 13, outline: 'none',
                            fontFamily: SANS, color: T.FG,
                            transition: T_ALL,
                        }}
                    />
                    <button onClick={handleJoin} disabled={!inviteInput.trim()} style={{
                        fontFamily: SANS, fontSize: 12,
                        background: T.FG, color: T.BG,
                        border: 'none', borderRadius: 8,
                        padding: '10px 20px', cursor: 'pointer',
                        opacity: inviteInput.trim() ? 1 : 0.3,
                        transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
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
                    borderBottom: `1px solid ${T.BORDER}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: `border-color ${DUR} ${TRS}`,
                }}>
                    <img src="/hero-bg.png" alt="" style={{ ...imgBase, opacity: isLight ? 0 : 0.55 }} />
                    <img src="/hero-bg-white.png" alt="" style={{ ...imgBase, opacity: isLight ? 0.9 : 0 }} />

                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1,
                        background: T.HERO_GRADIENT,
                        pointerEvents: 'none',
                        transition: `background ${DUR} ${TRS}`,
                    }} />

                    <p style={{
                        position: 'absolute', top: 50, left: 0, right: 0,
                        textAlign: 'center',
                        fontFamily: SANS, fontSize: 14,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase' as const,
                        color: T.MUTED, zIndex: 2, margin: 0,
                        transition: `color ${DUR} ${TRS}`,
                        pointerEvents: 'none',
                    }}>Decentralized circle savings</p>

                    <div style={{ position: 'relative', zIndex: 2, marginBottom: 60 }}>
                        <h1 style={{
                            fontFamily: SERIF,
                            fontSize: 'clamp(40px, 7vw, 120px)',
                            lineHeight: 0.84, letterSpacing: '-0.01em',
                            color: T.FG, margin: '0 0 48px',
                            fontWeight: 400,
                            transition: `color ${DUR} ${TRS}`,
                        }}>
                            Contribute together,<br />
                            <span style={{ WebkitTextStroke: `1.5px ${T.STROKE}`, color: 'transparent' }}>
                                win in turns.
                            </span>
                        </h1>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-end', flexWrap: 'wrap' as const, gap: 24,
                            paddingTop: 28, borderTop: `1px solid ${T.BORDER}`,
                            transition: `border-color ${DUR} ${TRS}`,
                        }}>
                            <p style={{
                                fontFamily: SANS, fontSize: 13,
                                color: T.MUTED, lineHeight: 1.9,
                                margin: 0, maxWidth: 280,
                                transition: `color ${DUR} ${TRS}`,
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
                                        background: 'transparent', color: T.MUTED,
                                        border: `1px solid ${T.BORDER}`, borderRadius: 4,
                                        padding: '13px 24px', cursor: 'pointer',
                                        transition: `all 0.15s ease`, letterSpacing: '0.03em',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = T.FG; e.currentTarget.style.borderColor = T.MUTED }}
                                    onMouseLeave={e => { e.currentTarget.style.color = T.MUTED; e.currentTarget.style.borderColor = T.BORDER }}
                                >How it works</button>
                                <button onClick={onCreatePool} style={{
                                    fontFamily: SANS, fontSize: 13,
                                    background: T.FG, color: T.BG,
                                    border: 'none', borderRadius: 4,
                                    padding: '13px 28px', cursor: 'pointer',
                                    transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
                                    letterSpacing: '0.03em',
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
                        transition: 'opacity 0.55s ease, transform 0.55s ease',
                    }}>
                    <div style={{
                        paddingTop: 32, borderTop: `1px solid ${T.BORDER}`,
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap' as const, gap: 12,
                        transition: `border-color ${DUR} ${TRS}`,
                    }}>
                        <span style={{
                            fontFamily: SERIF, fontStyle: 'italic',
                            fontSize: 22, color: T.FG,
                            letterSpacing: '0.01em',
                            transition: `color ${DUR} ${TRS}`,
                        }}>Aavart</span>
                        <span style={{
                            fontFamily: SANS, fontSize: 13,
                            color: T.FOOTER_CREDIT, letterSpacing: '0.02em',
                            transition: `color ${DUR} ${TRS}`,
                        }}>Made with love · 2026</span>
                    </div>
                </div>
            </main>

            {/* ── DOCS MODAL ── */}
            {docsOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 800,
                        background: T.DOCS_BACKDROP,
                        backdropFilter: 'blur(12px)',
                        display: 'flex', justifyContent: 'center',
                        overflowY: 'auto',
                        padding: '60px 24px',
                        transition: `background ${DUR} ${TRS}`,
                    }}
                    onClick={e => { if (e.target === e.currentTarget) setDocsOpen(false) }}
                >
                    <div style={{
                        width: '100%', maxWidth: 720,
                        background: T.DOCS_BG,
                        border: `1px solid ${T.BORDER}`,
                        borderRadius: 16,
                        padding: '56px 64px 72px',
                        position: 'relative',
                        height: 'fit-content',
                        boxShadow: isLight ? '0 32px 80px rgba(0,0,0,0.12)' : 'none',
                        transition: `background ${DUR} ${TRS}, border-color ${DUR} ${TRS}`,
                    }}>
                        <button
                            onClick={() => setDocsOpen(false)}
                            style={{
                                position: 'absolute', top: 24, right: 24,
                                fontFamily: SANS, fontSize: 11,
                                color: T.MUTED, background: 'none',
                                border: `1px solid ${T.BORDER}`,
                                borderRadius: 6, padding: '6px 14px',
                                cursor: 'pointer', letterSpacing: '0.06em',
                                transition: `all 0.15s ease`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = T.FG; e.currentTarget.style.borderColor = T.MUTED }}
                            onMouseLeave={e => { e.currentTarget.style.color = T.MUTED; e.currentTarget.style.borderColor = T.BORDER }}
                        >✕ Close</button>

                        <div style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: T.DOC_LABEL,
                            textTransform: 'uppercase' as const, marginBottom: 20,
                            transition: `color ${DUR} ${TRS}`,
                        }}>Documentation</div>
                        <h2 style={{
                            fontFamily: SERIF, fontSize: 42,
                            color: T.FG, fontWeight: 400,
                            lineHeight: 1.05, letterSpacing: '-0.01em',
                            marginBottom: 56, transition: `color ${DUR} ${TRS}`,
                        }}>Everything about<br />Aavart.</h2>

                        {docsSections.map((section, i) => (
                            <div key={i} style={{
                                marginBottom: 48, paddingBottom: 48,
                                borderBottom: i < docsSections.length - 1 ? `1px solid ${T.BORDER}` : 'none',
                                transition: `border-color ${DUR} ${TRS}`,
                            }}>
                                <div style={{
                                    fontFamily: SANS, fontSize: 10,
                                    letterSpacing: '0.16em', color: T.DOC_SECTION_LABEL,
                                    marginBottom: 16, transition: `color ${DUR} ${TRS}`,
                                }}>{section.label}</div>
                                {section.body.split('\n\n').map((para, j, arr) => (
                                    <p key={j} style={{
                                        fontFamily: SANS, fontSize: 14,
                                        color: T.DOC_BODY, lineHeight: 1.9,
                                        marginBottom: j < arr.length - 1 ? 16 : 0,
                                        transition: `color ${DUR} ${TRS}`,
                                    }}>{para}</p>
                                ))}
                            </div>
                        ))}

                        <button
                            onClick={() => { setDocsOpen(false); onCreatePool() }}
                            style={{
                                fontFamily: SANS, fontSize: 13,
                                background: T.FG, color: T.BG,
                                border: 'none', borderRadius: 6,
                                padding: '14px 32px', cursor: 'pointer',
                                transition: `opacity 0.12s ease, background ${DUR} ${TRS}, color ${DUR} ${TRS}`,
                                letterSpacing: '0.04em', marginTop: 8,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >Ready — Create a pool →</button>
                    </div>
                </div>
            )}

            {/* ── COMIC OVERLAY ── */}
            {comicOpen && (
                <div
                    ref={comicOverlayRef}
                    tabIndex={0}
                    onKeyDown={e => {
                        if (e.key === 'ArrowRight') setComicPage(p => Math.min(COMIC_PAGES.length - 1, p + 1))
                        if (e.key === 'ArrowLeft') setComicPage(p => Math.max(0, p - 1))
                        if (e.key === 'Escape') setComicOpen(false)
                    }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 900,
                        background: 'rgba(4,4,4,0.97)',
                        backdropFilter: 'blur(16px)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        outline: 'none',
                    }}
                >
                    {/* Top bar */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        padding: '20px 32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(221,217,208,0.07)',
                        zIndex: 2,
                    }}>
                        <span style={{
                            fontFamily: SERIF, fontStyle: 'italic',
                            fontSize: 15, color: 'rgba(221,217,208,0.5)',
                        }}>Aavart — The Comic</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <span style={{
                                fontFamily: SANS, fontSize: 11,
                                letterSpacing: '0.12em',
                                color: 'rgba(221,217,208,0.25)',
                            }}>{comicPage + 1} / {COMIC_PAGES.length}</span>
                            <button
                                onClick={() => setComicOpen(false)}
                                style={{
                                    fontFamily: SANS, fontSize: 11,
                                    color: 'rgba(221,217,208,0.4)',
                                    background: 'none',
                                    border: '1px solid rgba(221,217,208,0.1)',
                                    borderRadius: 6, padding: '6px 14px',
                                    cursor: 'pointer', letterSpacing: '0.06em',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#ddd9d0'; e.currentTarget.style.borderColor = 'rgba(221,217,208,0.3)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(221,217,208,0.4)'; e.currentTarget.style.borderColor = 'rgba(221,217,208,0.1)' }}
                            >✕ Close</button>
                        </div>
                    </div>

                    {/* Comic page */}
                    <img
                        key={comicPage}
                        src={COMIC_PAGES[comicPage]}
                        alt={`Comic page ${comicPage + 1}`}
                        style={{
                            maxHeight: 'calc(100vh - 120px)',
                            maxWidth: '90vw',
                            objectFit: 'contain',
                            userSelect: 'none',
                            animation: 'comicFadeIn 0.18s ease',
                        }}
                    />

                    {/* Prev */}
                    <button
                        onClick={() => setComicPage(p => Math.max(0, p - 1))}
                        disabled={comicPage === 0}
                        style={{
                            position: 'absolute', left: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(221,217,208,0.06)',
                            border: '1px solid rgba(221,217,208,0.1)',
                            borderRadius: 8,
                            color: comicPage === 0 ? 'rgba(221,217,208,0.15)' : 'rgba(221,217,208,0.7)',
                            width: 44, height: 44,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: comicPage === 0 ? 'default' : 'pointer',
                            fontSize: 18,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { if (comicPage > 0) e.currentTarget.style.background = 'rgba(221,217,208,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(221,217,208,0.06)' }}
                    >←</button>

                    {/* Next */}
                    <button
                        onClick={() => setComicPage(p => Math.min(COMIC_PAGES.length - 1, p + 1))}
                        disabled={comicPage === COMIC_PAGES.length - 1}
                        style={{
                            position: 'absolute', right: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(221,217,208,0.06)',
                            border: '1px solid rgba(221,217,208,0.1)',
                            borderRadius: 8,
                            color: comicPage === COMIC_PAGES.length - 1 ? 'rgba(221,217,208,0.15)' : 'rgba(221,217,208,0.7)',
                            width: 44, height: 44,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: comicPage === COMIC_PAGES.length - 1 ? 'default' : 'pointer',
                            fontSize: 18,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { if (comicPage < COMIC_PAGES.length - 1) e.currentTarget.style.background = 'rgba(221,217,208,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(221,217,208,0.06)' }}
                    >→</button>

                    {/* Dot indicators */}
                    <div style={{
                        position: 'absolute', bottom: 24,
                        display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                        {COMIC_PAGES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setComicPage(i)}
                                style={{
                                    width: i === comicPage ? 20 : 6,
                                    height: 6, borderRadius: 999,
                                    background: i === comicPage ? 'rgba(221,217,208,0.8)' : 'rgba(221,217,208,0.2)',
                                    border: 'none', cursor: 'pointer', padding: 0,
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        ))}
                    </div>

                    <style>{`@keyframes comicFadeIn { from { opacity:0; transform:scale(0.98) } to { opacity:1; transform:scale(1) } }`}</style>
                </div>
            )}
        </div>
    )
}