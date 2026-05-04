import { useEffect, useRef, useState } from 'react'

interface Props {
    onJoinPool: () => void
    onCreatePool: () => void
}

export default function SideCard({ onJoinPool }: Props) {
    const [collapsed, setCollapsed] = useState(false)
    const [hovered, setHovered] = useState(false)
    const lastScroll = useRef(0)

    useEffect(() => {
        function onScroll() {
            const y = window.scrollY
            setCollapsed(y > 80)
            lastScroll.current = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isOpen = hovered || !collapsed

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'fixed',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                width: isOpen ? 200 : 18,
                transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                overflow: 'hidden',
                background: 'var(--color-panel-bg)',
                borderLeft: '3px solid var(--color-border)',
                borderTop: '3px solid var(--color-border)',
                borderBottom: '3px solid var(--color-border)',
                borderRadius: '8px 0 0 8px',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                cursor: 'pointer',
            }}
        >
            {/* collapsed strip — always visible */}
            <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                writingMode: 'vertical-rl',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.15em',
                color: 'var(--color-text-muted)',
                userSelect: 'none',
            }}>
                POOL
            </div>

            {/* expanded content */}
            <div style={{
                width: 200,
                padding: '24px 20px',
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}>
                {/* logo */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    letterSpacing: '0.06em',
                    color: 'var(--color-text)',
                    lineHeight: 1,
                }}>
                    AAVART
                    <span style={{
                        display: 'inline-block',
                        width: 6, height: 6,
                        background: 'var(--color-text)',
                        borderRadius: '50%',
                        marginLeft: 3, marginBottom: 4,
                        verticalAlign: 'bottom',
                    }} />
                </div>

                {/* divider */}
                <div style={{
                    height: 1,
                    background: 'var(--color-border)',
                    margin: '0 -20px',
                    width: 'calc(100% + 40px)',
                }} />

                {/* tagline */}
                <p style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    Stake SOL on your favourite manga arcs.
                </p>

                {/* stats row */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.08em',
                            marginBottom: 2,
                        }}>
                            POOLS
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            color: 'var(--color-text)',
                            lineHeight: 1,
                        }}>
                            12
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.08em',
                            marginBottom: 2,
                        }}>
                            TVL
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            color: 'var(--color-text)',
                            lineHeight: 1,
                        }}>
                            420◎
                        </div>
                    </div>
                </div>

                {/* divider */}
                <div style={{
                    height: 1,
                    background: 'var(--color-border)',
                    margin: '0 -20px',
                    width: 'calc(100% + 40px)',
                }} />

                {/* CTA */}
                <button
                    onClick={onJoinPool}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        letterSpacing: '0.08em',
                        background: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                        width: '100%',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    JOIN POOL →
                </button>

                <button
                    onClick={() => {/* create pool */ }}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        letterSpacing: '0.08em',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        border: '2px solid var(--color-border)',
                        borderRadius: 4,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                        width: '100%',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-text)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                    CREATE POOL
                </button>
            </div>
        </div>
    )
}