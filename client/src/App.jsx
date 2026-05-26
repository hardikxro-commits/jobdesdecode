import { useState, useEffect, useRef, useLayoutEffect, memo, useCallback } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { TriangleAlert, CheckCircle, MessageCircle, Loader2, X, Check, ChevronDown, Copy, Download, Sparkles } from "lucide-react"

const PROVIDERS = {
  anthropic: {
    label: "Anthropic (Claude)",
    url: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-sonnet-4-20250514",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    }),
    bodyPrefix: (model, prompt) => ({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
    extract: (data) => data.content[0].text,
  },
  openai: {
    label: "OpenAI (GPT)",
    url: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    bodyPrefix: (model, prompt) => ({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    extract: (data) => data.choices[0].message.content,
  },
  gemini: {
    label: "Google (Gemini)",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.0-flash",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    bodyPrefix: (model, prompt) => ({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    extract: (data) => data.choices[0].message.content,
  },
  deepseek: {
    label: "DeepSeek",
    url: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    bodyPrefix: (model, prompt) => ({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
    extract: (data) => data.choices[0].message.content,
  },
  nvidia: {
    label: "NVIDIA (NIM)",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "openai/gpt-oss-120b",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    bodyPrefix: (model, prompt) => ({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      top_p: 1,
      temperature: 1,
    }),
    extract: (data) => data.choices[0].message.content,
  },
}

const SAMPLE_JD = `Senior Product Engineer at NexGen Solutions (Series B)

Location: San Francisco, CA (Hybrid - 3 days in office)

About Us:
NexGen Solutions is a fast-growing Series B SaaS company on a mission to revolutionize how enterprises handle workflow automation. We're backed by top-tier VCs and growing 3x year over year.

What You'll Do:
- Architect and build scalable microservices that power our core platform
- Collaborate cross-functionally with product, design, and engineering teams
- Mentor junior engineers and contribute to code reviews
- Drive technical decisions for new features and system improvements
- Own the full development lifecycle from conception to deployment
- Work in a fast-paced environment where priorities can shift quickly

What We're Looking For:
- 5+ years of experience in software engineering
- Strong proficiency in TypeScript, Node.js, and React
- Experience with AWS or cloud infrastructure
- Deep understanding of distributed systems and microservices architecture
- Familiarity with PostgreSQL and Redis
- Bachelor's degree in Computer Science or related field (or equivalent experience)
- Excellent communication and leadership skills
- A "roll up your sleeves" attitude — we're a startup, everyone wears multiple hats
- Passion for building great products
- Ability to thrive in ambiguity

Nice to Have:
- Experience with Kubernetes and Docker
- Knowledge of GraphQL
- Previous startup experience
- Contributions to open source projects

Why Join Us:
- Competitive salary and equity package
- Unlimited PTO (we trust you to manage your time)
- Free snacks and drinks in the office
- Annual team retreats
- Work with a rockstar team of engineers
- We're like a family here
- Ping pong table in the office

We are an equal opportunity employer and value diversity at our company. We encourage applications from all backgrounds.`

const Bar = memo(function Bar({ label, score }) {
  let barColor = "bg-red-500"
  if (score >= 70) barColor = "bg-emerald-500"
  else if (score >= 40) barColor = "bg-yellow-500"

  let textColor = "text-red-400"
  if (score >= 70) textColor = "text-emerald-400"
  else if (score >= 40) textColor = "text-yellow-400"

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
})

const DEFAULT_KEY = import.meta.env.VITE_NVIDIA_API_KEY || "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"

function useTypewriter(text, speed = 40, delay = 0) {
  const [displayed, setDisplayed] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [started, text, speed])

  return displayed
}

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    let raf = null
    const handler = () => {
      if (!raf) raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        raf = null
      })
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => {
      window.removeEventListener("scroll", handler)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return scrollY
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-app-entrance">
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
      <div className="skeleton h-24" />
      <div className="skeleton h-40" />
    </div>
  )
}

const addRipple = (e) => {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const span = document.createElement("span")
  span.className = "ripple"
  span.style.left = `${e.clientX - rect.left}px`
  span.style.top = `${e.clientY - rect.top}px`
  btn.appendChild(span)
  span.addEventListener("animationend", () => span.remove())
}

function MouseGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = null
    const handler = (e) => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = null
          el.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`
        })
      }
    }
    window.addEventListener("mousemove", handler, { passive: true })
    return () => {
      window.removeEventListener("mousemove", handler)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="mouse-glow gpu" />
}

function useInView({ once = true, margin = "-60px" } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin: margin, threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

function useScrollFade(ref, { threshold = 0.45 } = {}) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = null

    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const elCenter = rect.top + rect.height / 2
      const viewCenter = vh / 2
      const maxDist = vh * threshold
      const dist = Math.abs(elCenter - viewCenter)
      const progress = 1 - Math.min(1, dist / maxDist)
      const opacity = Math.max(0, Math.min(1, progress))

      el.style.opacity = opacity
      if (opacity < 1) {
        el.style.transform = `translateY(${(1 - opacity) * 35}px)`
      } else {
        el.style.transform = ''
      }
      raf = null
    }

    const handler = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", handler, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", handler)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, threshold])
}

function RevealSection({ children, className = "" }) {
  const ref = useRef(null)
  useScrollFade(ref)
  return (
    <div ref={ref} className={`gpu ${className}`} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}

function RevealHeading({ children, className = "" }) {
  const [inViewRef, inView] = useInView({ margin: "-30px" })
  const fadeRef = useRef(null)
  useScrollFade(fadeRef)
  return (
    <div ref={fadeRef} className={`gpu ${className}`} style={{ opacity: 0 }}>
      <div ref={inViewRef} className={`reveal-heading ${inView ? "in-view" : ""}`}>
        {children}
      </div>
    </div>
  )
}

function Loader() {
  const [show, setShow] = useState(true)
  const [exiting, setExiting] = useState(false)
  const progressRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 5000
    let frame

    const tick = () => {
      const elapsed = performance.now() - start
      const n = Math.min(elapsed / duration, 1)
      let pct
      if (n < 0.08) {
        pct = (n / 0.08) * 4
      } else if (n < 0.3) {
        pct = 4 + ((n - 0.08) / 0.22) * 26
      } else if (n < 0.7) {
        pct = 30 + ((n - 0.3) / 0.4) * 30
      } else if (n < 0.92) {
        pct = 60 + ((n - 0.7) / 0.22) * 35
      } else {
        pct = 95 + ((n - 0.92) / 0.08) * 5
      }
      const rounded = Math.min(Math.round(pct), 99)

      if (progressRef.current) progressRef.current.textContent = rounded
      if (barRef.current) barRef.current.style.transform = `scaleX(${rounded / 100})`

      if (n < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          if (progressRef.current) progressRef.current.textContent = "100"
          if (barRef.current) barRef.current.style.transform = "scaleX(1)"
          setExiting(true)
          setTimeout(() => setShow(false), 800)
        }, 400)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const letters = [
    { char: "J", anim: "firstChar", delay: 0.4 },
    { char: "D", anim: "fromBottomOutRight", delay: 0.65 },
    { char: "-", anim: "fromLeftOutTop", delay: 0.9 },
    { char: "D", anim: "fromBottomOutLeft", delay: 1.15 },
    { char: "E", anim: "fromRightOutTop", delay: 1.4 },
    { char: "C", anim: "fromBottomOutLeft", delay: 1.65 },
    { char: "O", anim: "fromRightOutTop", delay: 1.9 },
    { char: "D", anim: "fromBottomOutRight", delay: 2.15 },
    { char: "E", anim: "fromLeftOutTop", delay: 2.4 },
    { char: "R", anim: "fromBottomOutLeft", delay: 2.65 },
  ]

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000"
      style={{ background: "#000", opacity: exiting ? 0 : 1 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-40 animate-loader-blob gpu"
          style={{
            background: "radial-gradient(ellipse at 25% 35%, rgba(255,0,100,0.12), transparent 60%), radial-gradient(ellipse at 75% 65%, rgba(100,0,255,0.12), transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(0,150,255,0.08), transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            animation: "grid-scroll 20s linear infinite",
          }}
        />
      </div>

      <div
        className="absolute top-6 left-0 right-0 flex justify-between px-6 z-10 overflow-hidden"
        style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 500, color: "#666" }}
      >
        <span className="entrance-fade-down" style={{ animationDelay: "0.2s" }}>AI-POWERED</span>
        <span className="entrance-fade-down" style={{ animationDelay: "0.3s" }}>JOB ANALYSIS</span>
        <span className="entrance-fade-down" style={{ animationDelay: "0.4s" }}>2026</span>
      </div>

      <div
        className="z-10 mb-8 entrance-fade-up"
        style={{ animationDelay: "0.15s" }}
      >
        <span
          className="tracking-[0.4em] text-xs uppercase"
          style={{
            fontFamily: '"Saira Extra Condensed", Impact, sans-serif',
            fontSize: "clamp(14px, 2vw, 20px)",
            color: "#555",
          }}
        >
          LOADING
        </span>
      </div>

      <div className="relative z-10 flex items-center justify-center" style={{ fontFamily: '"Sofia Sans Extra Condensed", "Saira Extra Condensed", Impact, sans-serif', fontSize: "clamp(56px, 14vw, 130px)", lineHeight: 1, gap: "0.04em" }}>
        {letters.map((l, i) => (
          <span
            key={i}
            className={`${l.anim} loader-char`}
            style={{
              animationDelay: `${l.delay}s`,
              animationDuration: "0.9s",
              animationTimingFunction: "cubic-bezier(0.83, 0, 0.17, 1)",
              color: i === 2 ? "transparent" : "#fff",
              textShadow: "0 0 80px rgba(255,255,255,0.08)",
              width: i === 2 ? "0.3em" : "auto",
            }}
          >
            {l.char}
          </span>
        ))}
      </div>

      <div
        className="relative z-10 mt-12 flex items-start gap-1 overflow-hidden entrance-fade-up"
        style={{ fontFamily: '"IBM Plex Mono", monospace', animationDelay: "0.3s" }}
      >
        <span
          ref={progressRef}
          className="text-[clamp(28px,6vw,56px)] font-light tracking-wider"
          style={{ color: "#fff" }}
        >
          0
        </span>
        <span
          className="text-[clamp(18px,4vw,36px)] font-light"
          style={{ color: "#555", marginTop: "0.1em" }}
        >
          %
        </span>
      </div>

      <div
        className="absolute bottom-6 left-0 right-0 flex justify-between px-6 z-10 overflow-hidden"
        style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 500, color: "#666" }}
      >
        <span className="entrance-fade-up" style={{ animationDelay: "0.5s" }}>
          PASTE ANY <span style={{ color: "#ff0064" }}>JOB DESCRIPTION</span>
        </span>
        <span className="entrance-fade-up" style={{ animationDelay: "0.6s" }}>
          @JD-DECODER
        </span>
      </div>

      <div
        ref={barRef}
        className="absolute bottom-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff)",
          transformOrigin: "left",
          transform: "scaleX(0)",
          transition: "transform 0.3s ease-out",
        }}
      />
    </div>
  )
}

const bgParticles = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 1,
  duration: (Math.random() * 6 + 5).toFixed(1),
  delay: (Math.random() * 8).toFixed(1),
  opacity: (Math.random() * 0.35 + 0.1).toFixed(2),
  color: ["#fff", "#ff0064", "#6400ff", "#0096ff", "#ff00c8"][Math.floor(Math.random() * 5)],
}))

const BgLayers = memo(function BgLayers({ blobOpacity, blobScale, gridOpacity }) {
  const parallaxRef = useRef(null)

  useEffect(() => {
    const el = parallaxRef.current
    if (!el) return
    let raf = null
    const handler = (e) => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = null
          el.style.transform = `translate3d(${(e.clientX / window.innerWidth - 0.5) * -20}px, ${(e.clientY / window.innerHeight - 0.5) * -20}px, 0)`
        })
      }
    }
    window.addEventListener("mousemove", handler, { passive: true })
    return () => {
      window.removeEventListener("mousemove", handler)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -inset-40 gpu"
        style={{
          opacity: blobOpacity ?? 1,
          scale: blobScale ?? 1,
          background: "radial-gradient(ellipse at 20% 40%, rgba(255,0,100,0.2), transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(100,0,255,0.2), transparent 60%), radial-gradient(ellipse at 50% 70%, rgba(0,150,255,0.15), transparent 60%)",
        }}
      />
      <div
        ref={parallaxRef}
        className="absolute -inset-40 gpu"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(255,0,100,0.06), transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(100,0,255,0.06), transparent 60%)",
          filter: "blur(60px)",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute inset-0 animate-blob-breathe gpu"
        style={{
          background: "radial-gradient(ellipse at 70% 20%, rgba(255,0,200,0.1), transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(0,100,255,0.1), transparent 50%)",
          filter: "blur(80px)",
        }}
      />
      <div className="absolute inset-0 gpu" style={{
        opacity: gridOpacity ?? 0.03,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div
        className="absolute rounded-full"
        style={{
          width: "40vmin",
          height: "40vmin",
          top: "50%",
          left: "50%",
          marginTop: "-20vmin",
          marginLeft: "-20vmin",
          border: "1px solid rgba(255,0,100,0.08)",
          animation: "ring-pulse 4s ease-in-out infinite",
          transform: "translateZ(0)",
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            top: -4,
            left: "50%",
            marginLeft: -4,
            background: "#ff0064",
            boxShadow: "0 0 12px #ff0064, 0 0 30px #ff0064",
            animation: "orbit 8s linear infinite",
            transform: "translateZ(0)",
          }}
        />
      </div>
      <div className="virtual-particles" />
      {bgParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full gpu"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}, 0 0 ${p.size * 12}px ${p.color}`,
            opacity: p.opacity,
            "--p-opacity": p.opacity,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite, particle-glow ${(parseFloat(p.duration) * 0.7).toFixed(1)}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
      }} />
    </div>
  )
})

function Navbar({ showChat, onChatToggle, showHistory, onHistoryToggle, scrolled, theme, onThemeToggle }) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 entrance-fade-down ${scrolled ? 'nav-scrolled' : ''}`}
      style={{ animationDelay: "0.3s", willChange: "transform", transition: "box-shadow 0.3s ease, background 0.3s ease" }}
    >
      <div className="absolute inset-0 backdrop-blur-lg bg-black/30" />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 max-sm:px-4 max-sm:py-3">
        <div className="flex items-center gap-2">
          <span
            className="text-lg max-sm:text-base font-bold tracking-tight"
            style={{ fontFamily: '"Segoe UI", system-ui, sans-serif', fontWeight: 900, color: "#fff" }}
          >
            JD-DEC
          </span>
          <Sparkles size={12} className="text-zinc-600 icon-pulse" style={{ marginLeft: 2 }} />
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#555", fontFamily: '"IBM Plex Mono", monospace' }}>
            Decoder
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onChatToggle}
            className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:text-white btn-scale-sm"
            style={{
              color: showChat ? "#fff" : "#888",
              background: showChat ? "rgba(255,255,255,0.08)" : "transparent",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            CHAT
          </button>
          <button
            onClick={onHistoryToggle}
            className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:text-white btn-scale-sm"
            style={{
              color: showHistory ? "#fff" : "#888",
              background: showHistory ? "rgba(255,255,255,0.08)" : "transparent",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            HISTORY
          </button>
          <button
            onClick={onThemeToggle}
            className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:text-white btn-scale-sm"
            style={{
              color: "#888",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  )
}

function HeroSection({ onGetStarted, scrollY }) {
  const vh = typeof window !== "undefined" ? window.innerHeight : 720
  const contentOpacity = useTransform(scrollY, [0, vh * 0.8], [1, 0])
  const contentY = useTransform(scrollY, [0, vh * 0.8], [0, -120])
  const contentScale = useTransform(scrollY, [0, vh * 0.8], [1, 0.95])
  const blobScale = useTransform(scrollY, [0, vh * 0.5], [1, 2.5])
  const blobOpacity = useTransform(scrollY, [0, vh * 0.8], [0.4, 0])
  const gridOpacity = useTransform(scrollY, [0, vh * 0.3], [0.03, 0])
  const chevronOpacity = useTransform(scrollY, [0, vh * 0.3], [1, 0])
  const glowOpacity = useTransform(scrollY, [vh * 0.3, vh * 0.9], [0, 1])
  const bgY = useTransform(scrollY, [0, vh], [0, vh * 0.3])

  const typedLine = useTypewriter("NEXT MOVE", 50, 2.2)
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowCursor(true), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden hero-gradient"
    >
      <motion.div
        className="absolute inset-0 gpu"
        style={{ y: bgY }}
      >
        <BgLayers blobOpacity={blobOpacity} blobScale={blobScale} gridOpacity={gridOpacity} />
      </motion.div>

      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        style={{ opacity: contentOpacity, y: contentY, scale: contentScale }}
      >
        <p
          className="text-xs uppercase tracking-[0.3em] mb-6 entrance-fade-up"
          style={{ color: "#888", fontFamily: '"IBM Plex Mono", monospace', animationDelay: "0.5s" }}
        >
          <span className="animate-text-pulse">AI-POWERED</span> JOB ANALYSIS
        </p>

        <h1
          className="text-[clamp(36px,8vw,96px)] font-black tracking-tight leading-[0.9] mb-6"
          style={{ color: "#fff", fontFamily: '"Segoe UI", system-ui, sans-serif', fontWeight: 900 }}
        >
          DECODE YOUR<br />
          <span className="relative inline-block">
            <span className={`${showCursor ? 'typewriter-cursor' : ''}`}>
              {typedLine || (showCursor ? '' : 'NEXT MOVE')}
            </span>
          </span>
        </h1>

        <p
          className="text-base max-sm:text-sm leading-relaxed max-w-md mx-auto mb-12 entrance-fade-up"
          style={{ color: "#888", animationDelay: "1.0s" }}
        >
          Paste any job description. Our AI cuts through the corporate fluff and tells you what the job is really about.
        </p>

        <div className="relative inline-flex items-center justify-center entrance-hero-btn">
          <div
            className="absolute inset-0 rounded-full animate-cta-glow"
            style={{
              background: "radial-gradient(circle at center, rgba(255,0,100,0.3), rgba(100,0,255,0.15), transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          <button
            onClick={onGetStarted}
            className="ripple-btn px-10 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase relative overflow-hidden group cursor-pointer cta-pill"
            onMouseDown={addRipple}
          >
            <span className="relative z-10 text-white">Get Started</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: chevronOpacity }}
      >
        <div className="flex flex-col items-center gap-2 animate-chevron">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#555", fontFamily: '"IBM Plex Mono", monospace' }}>
            Scroll
          </span>
          <ChevronDown size={20} style={{ color: "#666" }} />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none z-20 gpu"
        style={{
          opacity: glowOpacity,
          background: "linear-gradient(to top, rgba(255,0,100,0.3), rgba(100,0,255,0.2), rgba(0,150,255,0.08), transparent)",
          filter: "blur(50px)",
        }}
      />
    </section>
  )
}

export default function App() {
  const [showContent, setShowContent] = useState(false)
  const mainAppRef = useRef(null)
  const [apiKey, setApiKey] = useState(DEFAULT_KEY)
  const [provider, setProvider] = useState("nvidia")
  const [model, setModel] = useState(PROVIDERS.nvidia.defaultModel)
  const [jdText, setJdText] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResume, setShowResume] = useState(false)
  const [jdBrief, setJdBrief] = useState("")
  const [generating, setGenerating] = useState(false)
  const [showJdGenerator, setShowJdGenerator] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jd-history") || "[]") }
    catch { return [] }
  })
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('jd-theme') || 'dark'
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('jd-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const { scrollY } = useScroll()
  const vh = typeof window !== "undefined" ? window.innerHeight : 720
  const mainOpacity = useTransform(scrollY, [vh * 0.4, vh * 1.0], [0, 1])
  const mainY = useTransform(scrollY, [vh * 0.4, vh * 1.0], [50, 0])

  const resultsRef = useRef(null)
  const jdTextareaRef = useRef(null)
  const chatInputRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 4200)
    return () => clearTimeout(timer)
  }, [])

  const autoResize = (el) => {
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [result])

  useEffect(() => {
    if (jdTextareaRef.current) {
      autoResize(jdTextareaRef.current)
    }
  }, [jdText])

  const analyseJD = async () => {
    setLoading(true)
    setError(null)

    const resumeSection = resumeText.trim()
      ? `\n\nResume:\n${resumeText}`
      : ""

    const userPrompt = `Analyse this job description and return this exact JSON structure:
{
  "role_summary": {
    "title": "cleaned up job title",
    "level": "junior | mid | senior | lead | unclear",
    "type": "IC | manager | hybrid | unclear",
    "one_liner": "one honest sentence about what this job actually is"
  },
  "real_requirements": [
    { "skill": "string", "type": "must_have | nice_to_have | filler", "note": "optional" }
  ],
  "red_flags": [
    { "phrase": "exact quote", "meaning": "what it signals", "severity": "minor | moderate | serious" }
  ],
  "green_flags": [
    { "phrase": "exact quote", "meaning": "why it is a good sign" }
  ],
  "clarity_scores": {
    "responsibilities": 0-100,
    "success_metrics": 0-100,
    "team_structure": 0-100,
    "growth_path": 0-100,
    "compensation": 0-100,
    "work_life_balance": 0-100
  },
  "questions_to_ask": ["string"],
  "resume_match": {
    "score": 0-100,
    "strengths": ["string"],
    "gaps": ["string"]
  },
  "verdict": {
    "summary": "2-3 sentence honest assessment",
    "apply": true or false,
    "apply_reason": "one sentence"
  }
}

Rules:
- Pull ONLY from what is written. Do not invent.
- filler means buzzwords with no real meaning such as rockstar, ninja, passionate, etc.
- Red flags are real. Do not soften them.
- questions_to_ask should expose what the JD is hiding.
- Verdict reads like a friend, not a career coach.
- Only include resume_match if a resume was provided. Otherwise omit that key entirely.
- Return ONLY valid JSON. No markdown. No fences. No explanation.

Job Description:
${jdText}${resumeSection}`

    const cfg = PROVIDERS[provider]

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cfg.url,
          headers: cfg.headers(apiKey),
          body: cfg.bodyPrefix(model, userPrompt),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || `API error: ${response.status}`)
      }

      const raw = cfg.extract(data)
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const firstBrace = cleaned.indexOf("{")
      const lastBrace = cleaned.lastIndexOf("}")
      const firstBracket = cleaned.indexOf("[")
      if (firstBrace === -1) throw new Error("No JSON object found in response")
      const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)
      const parsed = JSON.parse(jsonStr)
      setResult(parsed)
      saveToHistory(jdText, parsed)
    } catch (err) {
      setError(err.message || "Something went wrong parsing the response. Try again.")
    } finally {
      if (jdTextareaRef.current) {
        jdTextareaRef.current.style.height = "auto"
      }
      setLoading(false)
    }
  }

  const generateJD = async () => {
    if (!jdBrief.trim()) return
    setGenerating(true)
    setError(null)

    const prompt = `Write a professional job description by expanding ONLY what is given in the brief below. DO NOT invent company names, company history, benefits, perks, culture values, team size, or any details not explicitly mentioned. Use "[Company Name]" if no company is given. Use "[TBD]" for any section where details are missing. Format with proper section headers and bullet points. Return ONLY the job description text, no extra commentary.

Brief: ${jdBrief}`

    const cfg = PROVIDERS[provider]
    const body = {
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cfg.url,
          headers: cfg.headers(apiKey),
          body,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || `API error: ${response.status}`)
      }

      const raw = cfg.extract(data)
      const cleaned = raw.replace(/```json|```|```text/g, "").trim()
      setJdText(cleaned)
      setJdBrief("")
    } catch (err) {
      setError(err.message || "Failed to generate job description")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError(`Please enter your ${PROVIDERS[provider].label} API key`)
      return
    }
    if (!jdText.trim()) {
      setError("Please paste a job description")
      return
    }
    analyseJD()
  }

  const reset = () => {
    setResult(null)
    setJdText("")
    setResumeText("")
    setError(null)
    setShowResume(false)
  }

  const loadSample = () => {
    setJdText(SAMPLE_JD)
    setError(null)
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: "user", content: chatInput.trim() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput("")
    setChatLoading(true)

    const cfg = PROVIDERS.nvidia
    const history = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cfg.url,
          headers: cfg.headers(apiKey),
          body: { ...cfg.bodyPrefix(cfg.defaultModel, ""), messages: history },
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || data.error || `API error: ${response.status}`)

      const raw = cfg.extract(data)
      setChatMessages(prev => [...prev, { role: "assistant", content: raw }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const saveToHistory = (jd, res) => {
    const entry = { id: Date.now(), date: new Date().toLocaleString(), jd, result: res, provider, model }
    const updated = [entry, ...history].slice(0, 20)
    setHistory(updated)
    localStorage.setItem("jd-history", JSON.stringify(updated))
  }

  const deleteHistoryItem = (id) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem("jd-history", JSON.stringify(updated))
  }

  const loadFromHistory = (entry) => {
    setJdText(entry.jd)
    setResult(entry.result)
    setShowHistory(false)
  }

  const copyAnalysis = () => {
    if (!result) return
    const r = result
    const lines = [
      `${r.role_summary.title}`,
      `${r.role_summary.level} · ${r.role_summary.type === "IC" ? "Individual Contributor" : r.role_summary.type}`,
      `${r.role_summary.one_liner}`,
      "",
      "REQUIREMENTS",
      ...(r.real_requirements || []).map(req => `  ${req.type === "must_have" ? "✓" : req.type === "nice_to_have" ? "○" : "✗"} ${req.skill}${req.note ? ` — ${req.note}` : ""}`),
      "",
      "RED FLAGS",
      ...(r.red_flags || []).map(f => `  " ${f.phrase}" — ${f.meaning} (${f.severity})`),
      "",
      "GREEN FLAGS",
      ...(r.green_flags || []).map(f => `  " ${f.phrase}" — ${f.meaning}`),
      "",
      "CLARITY SCORES",
      ...Object.entries(r.clarity_scores || {}).map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}/100`),
      "",
      "QUESTIONS TO ASK",
      ...(r.questions_to_ask || []).map((q, i) => `  ${i + 1}. ${q}`),
      "",
      ...(r.resume_match ? [
        `RESUME MATCH: ${r.resume_match.score}%`,
        "  Strengths:",
        ...(r.resume_match.strengths || []).map(s => `    ✓ ${s}`),
        "  Gaps:",
        ...(r.resume_match.gaps || []).map(g => `    ✗ ${g}`),
        "",
      ] : []),
      "VERDICT",
      `  ${r.verdict.summary}`,
      `  ${r.verdict.apply ? "✓ Apply" : "✗ Don't Apply"} — ${r.verdict.apply_reason}`,
    ].join("\n")

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const exportJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `jd-analysis-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scrolled = useScrollPosition() > 50

  const getStarted = useCallback(() => {
    mainAppRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <>
      <div className="scanline-overlay" />
      <MouseGlow />
      <Loader />
      {showContent && (
        <div className="min-h-screen text-white animate-app-entrance" style={{ background: "#000" }}>
          <Navbar showChat={showChat} onChatToggle={() => setShowChat(!showChat)} showHistory={showHistory} onHistoryToggle={() => setShowHistory(!showHistory)} scrolled={scrolled} theme={theme} onThemeToggle={toggleTheme} />
          <HeroSection onGetStarted={getStarted} scrollY={scrollY} />

          <motion.div
            ref={mainAppRef}
            className="relative"
            style={{
              background: "#000",
              opacity: mainOpacity,
              y: mainY,
            }}
          >
            <div className="min-h-screen text-white flex flex-col relative">
              <BgLayers />
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, x: -320 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -320 }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="absolute left-0 top-0 bottom-0 z-20 w-80 max-sm:w-full flex flex-col bg-black/20 backdrop-blur-lg border-r border-white/[0.06] shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Chat</span>
                        <button
                          type="button"
                          onClick={() => setShowChat(false)}
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {chatMessages.length === 0 && (
                          <p className="text-zinc-600 text-xs text-center pt-8">Ask me anything about the job description...</p>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                              msg.role === "user"
                                ? "bg-white/10 text-white"
                                : "bg-white/[0.04] text-zinc-300 border border-white/[0.06]"
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                              <Loader2 size={14} className="animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="p-3 border-t border-white/[0.06]">
                        <div className="flex gap-2">
                          <textarea
                            ref={chatInputRef}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleChatKeyDown}
                            placeholder="Ask a question..."
                            rows={1}
                            className="flex-1 px-3 py-2 bg-black/20 border border-white/[0.06] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                            style={{ maxHeight: "120px" }}
                          />
                          <button
                            type="button"
                            onClick={sendChatMessage}
                            disabled={chatLoading || !chatInput.trim()}
                            className="shrink-0 self-end px-3 py-2 bg-white/10 hover:bg-white/20 btn-scale-sm disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all border border-white/[0.06]"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-[3px] w-full shrink-0">
                      <div className="absolute inset-0 animate-rgb rounded-full" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                      <div className="absolute inset-0 blur-md opacity-60 animate-rgb" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative z-10 flex flex-col min-h-screen">
                <div className="max-sm:left-2 max-sm:right-2 max-sm:top-2 absolute top-4 right-4 z-10 flex flex-col items-end gap-2" style={{ top: "4rem" }}>
                  <div className="flex gap-1.5 max-sm:flex-wrap max-sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowJdGenerator(!showJdGenerator)}
                      className="rounded-xl px-3 py-2 bg-black/20 backdrop-blur-xl text-white/90 hover:text-white hover:bg-white/10 btn-scale-sm transition-all text-xs font-medium border border-white/[0.06] max-sm:text-[10px] max-sm:px-2 max-sm:py-1.5"
                      style={{ textShadow: "0 0 8px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.15)" }}
                    >
                      {showJdGenerator ? "Close Generator" : "Generate JD"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showJdGenerator && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl bg-black/20 backdrop-blur-lg w-72 max-sm:w-full max-sm:max-w-full shadow-2xl overflow-hidden border border-white/[0.06] relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
                        <div className="p-4 max-h-[55vh] overflow-y-auto relative z-10">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Generate Job Description</span>
                          <textarea
                            value={jdBrief}
                            onChange={(e) => setJdBrief(e.target.value)}
                            placeholder="e.g. Senior React dev for fintech startup, 5+ yrs exp, TypeScript, remote..."
                            rows={3}
                            className="w-full px-2.5 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none mb-2"
                          />
                            <button
                              type="button"
                              onClick={generateJD}
                              disabled={generating || !jdBrief.trim()}
                              className="ripple-btn w-full py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-zinc-200 btn-scale-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              onMouseDown={addRipple}
                            >
                            {generating ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : "Generate Full Job Description"}
                          </button>
                        </div>
                        <div className="relative h-[3px] w-full shrink-0">
                          <div className="absolute inset-0 animate-rgb rounded-full" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                          <div className="absolute inset-0 blur-md opacity-60 animate-rgb" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl bg-black/20 backdrop-blur-lg w-72 max-sm:w-full max-sm:max-w-full shadow-2xl overflow-hidden border border-white/[0.06] relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
                        <div className="p-4 max-h-[55vh] overflow-y-auto relative z-10">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Analysis History</span>
                          {history.length === 0 ? (
                            <p className="text-zinc-600 text-xs text-center py-4">No saved analyses yet</p>
                          ) : (
                            <div className="space-y-1.5">
                              {history.map(entry => (
                                <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/20 transition-colors group cursor-pointer"
                                  onClick={() => loadFromHistory(entry)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/80 truncate">{entry.result?.role_summary?.title || "Unknown"}</p>
                                    <p className="text-[10px] text-zinc-500">{entry.date}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); deleteHistoryItem(entry.id) }}
                                    className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                                  >
                                    <X size={12} className="text-zinc-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative h-[3px] w-full shrink-0">
                          <div className="absolute inset-0 animate-rgb rounded-full" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                          <div className="absolute inset-0 blur-md opacity-60 animate-rgb" style={{ background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)" }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto px-4 max-sm:px-2 pb-4 mt-16">
                  <div className="max-w-2xl mx-auto">
                    {error && (
                      <div className="rounded-xl p-4 max-sm:p-3 mb-4 border border-red-900 bg-red-950 text-red-300 text-sm max-sm:text-xs flex items-start gap-2">
                        <TriangleAlert size={18} className="shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    {loading && <LoadingSkeleton />}

                    {!result && !error && !loading && (
                      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                        <p className="text-sm">Your decoded results will appear here</p>
                      </div>
                    )}

                    {result && (
                      <motion.div
                        ref={resultsRef}
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: {},
                          visible: {
                            transition: { staggerChildren: 0.1, delayChildren: 0.15 },
                          },
                        }}
                      >
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="flex gap-2 justify-end"
                        >
                          <button
                            type="button"
                            onClick={copyAnalysis}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/20 backdrop-blur-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10 btn-scale-sm transition-all flex items-center gap-1.5"
                          >
                            <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={exportJSON}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/20 backdrop-blur-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10 btn-scale-sm transition-all flex items-center gap-1.5"
                          >
                            <Download size={12} /> Export JSON
                          </button>
                        </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <h2 className="text-2xl max-sm:text-xl font-bold mb-2">{result.role_summary.title}</h2>
                            <div className="flex gap-2 mb-3">
                              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                                {result.role_summary.level}
                              </span>
                              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                                {result.role_summary.type === "IC" ? "Individual Contributor" : result.role_summary.type}
                              </span>
                            </div>
                            <p className="text-zinc-400">{result.role_summary.one_liner}</p>
                          </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <RevealHeading>Real requirements</RevealHeading>
                            {result.real_requirements && result.real_requirements.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {result.real_requirements.map((req, i) => {
                                  let pillClass = "bg-blue-900 text-blue-200"
                                  if (req.type === "nice_to_have") pillClass = "bg-zinc-700 text-zinc-300"
                                  if (req.type === "filler") pillClass = "bg-red-950 text-red-400 line-through"
                                  return (
                                    <span
                                      key={i}
                                      title={req.note || ""}
                                      className={`inline-block px-3 py-1.5 text-xs font-medium rounded-full cursor-default ${pillClass}`}
                                    >
                                      {req.skill}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-zinc-500 text-sm italic">None found</p>
                            )}
                          </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <RevealHeading><TriangleAlert size={16} className="text-red-400 icon-pulse" /> Red Flags</RevealHeading>
                            {result.red_flags && result.red_flags.length > 0 ? (
                              <div className="space-y-3">
                                {result.red_flags.map((flag, i) => {
                                  let severityClass = "bg-yellow-900 text-yellow-300"
                                  if (flag.severity === "moderate") severityClass = "bg-orange-900 text-orange-300"
                                  if (flag.severity === "serious") severityClass = "bg-red-900 text-red-300"
                                  return (
                                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0 last:pb-0">
                                      <TriangleAlert size={16} className="shrink-0 mt-1 text-red-400" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-zinc-500 italic text-sm mb-0.5">&ldquo;{flag.phrase}&rdquo;</p>
                                        <p className="text-zinc-300 text-sm">{flag.meaning}</p>
                                      </div>
                                      <span className={`shrink-0 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${severityClass}`}>
                                        {flag.severity}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-zinc-500 text-sm italic">None found</p>
                            )}
                          </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <RevealHeading><CheckCircle size={16} className="text-emerald-400 icon-pulse" /> Green Flags</RevealHeading>
                            {result.green_flags && result.green_flags.length > 0 ? (
                              <div className="space-y-3">
                                {result.green_flags.map((flag, i) => (
                                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0 last:pb-0">
                                    <CheckCircle size={16} className="shrink-0 mt-1 text-emerald-400" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-zinc-500 italic text-sm mb-0.5">&ldquo;{flag.phrase}&rdquo;</p>
                                      <p className="text-zinc-300 text-sm">{flag.meaning}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-zinc-500 text-sm italic">None found</p>
                            )}
                          </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <RevealHeading>Clarity Scores</RevealHeading>
                            <Bar label="Responsibilities" score={result.clarity_scores.responsibilities} />
                            <Bar label="Success metrics" score={result.clarity_scores.success_metrics} />
                            <Bar label="Team structure" score={result.clarity_scores.team_structure} />
                            <Bar label="Growth path" score={result.clarity_scores.growth_path} />
                            <Bar label="Compensation" score={result.clarity_scores.compensation} />
                            <Bar label="Work-life balance" score={result.clarity_scores.work_life_balance} />
                          </motion.div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                        >
                            <RevealHeading><MessageCircle size={16} className="text-zinc-400 icon-pulse" /> Questions to ask</RevealHeading>
                            {result.questions_to_ask && result.questions_to_ask.length > 0 ? (
                              <ol className="space-y-2">
                                {result.questions_to_ask.map((q, i) => (
                                  <li key={i} className="flex gap-3 pb-2 border-b border-zinc-800 last:border-0 last:pb-0">
                                    <span className="text-zinc-500 text-sm font-mono w-6 shrink-0">{i + 1}.</span>
                                    <span className="text-zinc-300 text-sm">{q}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="text-zinc-500 text-sm italic">None generated</p>
                            )}
                          </motion.div>
                          {result.resume_match && (
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 24 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                              }}
                              className="rounded-xl p-6 max-sm:p-4 border border-zinc-800 bg-zinc-900 god-card card-float gpu result-card"
                            >
                              <RevealHeading>Resume Match</RevealHeading>
                              <div className="text-center mb-6">
                                <span className={`text-5xl font-bold ${
                                  result.resume_match.score >= 70 ? 'text-emerald-400' :
                                  result.resume_match.score >= 40 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {result.resume_match.score}%
                                </span>
                                <p className="text-zinc-500 text-sm mt-1">Match score</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                                    <Check size={14} className="icon-float" /> Strengths
                                  </h4>
                                  {result.resume_match.strengths && result.resume_match.strengths.length > 0 ? (
                                    <ul className="space-y-1">
                                      {result.resume_match.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                          <Check size={14} className="shrink-0 mt-0.5 text-emerald-400 icon-float" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-zinc-500 text-xs italic">None identified</p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1">
                                    <X size={14} className="icon-float" /> Gaps
                                  </h4>
                                  {result.resume_match.gaps && result.resume_match.gaps.length > 0 ? (
                                    <ul className="space-y-1">
                                      {result.resume_match.gaps.map((g, i) => (
                                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                          <X size={14} className="shrink-0 mt-0.5 text-red-400" />
                                          {g}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-zinc-500 text-xs italic">None identified</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          className="rounded-xl p-6 border-2 border-zinc-700 bg-zinc-900 god-card card-float gpu result-card"
                        >
                          <RevealHeading>Verdict</RevealHeading>
                          <p className="text-lg leading-relaxed text-zinc-100 mb-4">{result.verdict.summary}</p>
                          <div className="mb-4">
                            {result.verdict.apply ? (
                              <span className="inline-block px-4 py-1.5 text-sm font-bold rounded-full bg-emerald-900 text-emerald-300">
                                Apply
                              </span>
                            ) : (
                              <span className="inline-block px-4 py-1.5 text-sm font-bold rounded-full bg-red-900 text-red-300">
                                Don't Apply
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-500 text-sm">{result.verdict.apply_reason}</p>
                          <button
                            onClick={reset}
                            className="ripple-btn mt-6 w-full bg-white text-black hover:bg-zinc-200 btn-scale font-semibold rounded-lg px-6 py-3 max-sm:py-2.5 transition-all"
                            onMouseDown={addRipple}
                          >
                            Reset
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 pointer-events-none">
                  <div className="max-w-2xl mx-auto px-4 max-sm:px-2 pb-6 max-sm:pb-3">
                    <div className="rounded-2xl bg-black/20 backdrop-blur-lg shadow-2xl pointer-events-auto overflow-hidden border border-white/[0.06] relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
                      <div className="px-5 max-sm:px-3 pt-4 pb-3 relative z-10">
                        <form onSubmit={handleSubmit}>
                          <textarea
                            ref={jdTextareaRef}
                            value={jdText}
                            onChange={(e) => {
                              setJdText(e.target.value)
                              autoResize(e.target)
                            }}
                            placeholder="Paste a job description or type one in..."
                            rows={1}
                            className="w-full px-0 py-0 bg-transparent border-0 text-white placeholder-zinc-500 focus:outline-none focus:ring-0 resize-none text-base max-sm:text-sm leading-relaxed"
                            style={{ minHeight: "1.5em", maxHeight: "50vh" }}
                          />
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50 max-sm:flex-col max-sm:gap-2">
                            <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-start">
                              {!showResume ? (
                                <button
                                  type="button"
                                  onClick={() => setShowResume(true)}
                                  className="px-3 max-sm:px-2 py-1.5 max-sm:py-1 rounded-lg text-xs max-sm:text-[10px] font-medium bg-black/20 backdrop-blur-lg border border-white/[0.06] text-white/80 hover:text-white hover:bg-white/10 btn-scale-sm transition-all"
                                  style={{ textShadow: "0 0 6px rgba(255,255,255,0.25)" }}
                                >
                                  + resume
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setShowResume(false); setResumeText("") }}
                                  className="px-3 max-sm:px-2 py-1.5 max-sm:py-1 rounded-lg text-xs max-sm:text-[10px] font-medium bg-black/20 backdrop-blur-lg border border-white/[0.06] text-white/80 hover:text-white hover:bg-white/10 btn-scale-sm transition-all flex items-center gap-1"
                                  style={{ textShadow: "0 0 6px rgba(255,255,255,0.25)" }}
                                >
                                  <X size={12} /> resume
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={loadSample}
                                className="px-3 max-sm:px-2 py-1.5 max-sm:py-1 rounded-lg text-xs max-sm:text-[10px] font-medium bg-black/20 backdrop-blur-lg border border-white/[0.06] text-white/80 hover:text-white hover:bg-white/10 btn-scale-sm transition-all"
                                style={{ textShadow: "0 0 6px rgba(255,255,255,0.25)" }}
                              >
                                sample
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={loading}
                              className="ripple-btn bg-white text-black hover:bg-zinc-200 btn-scale font-semibold rounded-lg px-6 max-sm:px-4 py-2.5 text-sm max-sm:text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 max-sm:w-full max-sm:justify-center"
                              onMouseDown={addRipple}
                            >
                              {loading ? <><Loader2 size={16} className="animate-spin" /> Decoding</> : "Decode \u2192"}
                            </button>
                          </div>
                          {showResume && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/50">
                              <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Paste your resume here..."
                                rows={3}
                                className="w-full px-0 py-0 bg-transparent border-0 text-white text-xs placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none"
                              />
                            </div>
                          )}
                        </form>
                      </div>
                      <div className="relative h-[3px] w-full">
                        <div
                          className="absolute inset-0 animate-rgb rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)",
                          }}
                        />
                        <div
                          className="absolute inset-0 blur-md opacity-60 animate-rgb"
                          style={{
                            background: "linear-gradient(90deg, #ff0064, #6400ff, #0096ff, #ff00c8, #ff0064)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
