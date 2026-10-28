import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const completed = useRef(false)
  const [leaving, setLeaving] = useState(false)

  const finish = useCallback(() => {
    if (completed.current) return
    completed.current = true
    setLeaving(true)
    window.setTimeout(onComplete, 320)
  }, [onComplete])

  useEffect(() => {
    const timeout = window.setTimeout(finish, 2400)
    return () => window.clearTimeout(timeout)
  }, [finish])

  return (
    <div
      className="intro-overlay fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-background"
      data-leaving={leaving}
      role="dialog"
      aria-modal="true"
      aria-label="CipherTrail introduction"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="intro-grid absolute inset-0" />
        <div className="intro-scan top-0" />
        <svg className="absolute left-1/2 top-1/2 h-[min(66vh,520px)] w-[min(88vw,960px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]" viewBox="0 0 960 520" fill="none">
          <path d="M152 276 294 160l150 83 164-126 196 154" stroke="var(--primary)" strokeDasharray="5 9" />
          <path d="m294 160 62 194 88-111 164 102 64-124" stroke="var(--chart-2)" strokeDasharray="3 10" />
          {[[152, 276], [294, 160], [444, 243], [608, 117], [804, 271], [356, 354], [608, 345], [672, 221]].map(([x, y], index) => (
            <circle key={`${x}-${y}`} className={index % 2 === 0 ? 'intro-node' : undefined} cx={x} cy={y} r={index === 2 ? 7 : 4} fill="var(--primary)" />
          ))}
        </svg>
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 text-center">
        <div className="grid size-[68px] place-items-center rounded-[22px] border border-primary/25 bg-primary/10 text-primary shadow-[0_0_42px_rgba(40,210,222,0.14)]">
          <Fingerprint className="size-8" aria-hidden="true" />
        </div>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="intro-node size-1.5 rounded-full bg-primary" /> CipherTrail <span className="text-muted-foreground/70">/</span> Command center
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
          Trace the signal.<br /><span className="text-primary">Reveal the network.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          A financial crime investigation workspace for connecting suspicious activity to a clear, reviewable trail.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          <span className="rounded-full border border-border/80 bg-card/70 px-3 py-1.5">Synthetic data only</span>
          <span className="rounded-full border border-border/80 bg-card/70 px-3 py-1.5">Indian context · INR</span>
          <span className="rounded-full border border-border/80 bg-card/70 px-3 py-1.5">Local demo</span>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-primary/25 bg-primary/[0.04] px-4 text-xs text-primary hover:bg-primary/10 hover:text-primary" onClick={finish}>
            Skip intro <ArrowRight data-icon="inline-end" />
          </Button>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">No banking connection · demo environment</span>
        </div>
      </div>
    </div>
  )
}
