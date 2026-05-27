/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 */

import { useEffect, useRef, useState } from 'react'

const randomColors = (count) =>
  new Array(count).fill(0).map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"))

export default function TubesBackground({ className = "", enableClickInteraction = true }) {
  const canvasRef = useRef(null)
  const tubesRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!canvasRef.current) return
      try {
        const mod = await import("https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js")
        if (!mounted) return
        const app = mod.default(canvasRef.current, {
          tubes: {
            colors: ["#a78bfa", "#22d3ee", "#6400ff"],
            lights: { intensity: 200, colors: ["#a78bfa", "#22d3ee", "#ff0064", "#6400ff"] },
          },
        })
        tubesRef.current = app
        setIsLoaded(true)
      } catch (err) {
        console.error("TubesBackground failed:", err)
      }
    }

    init()
    return () => { mounted = false }
  }, [])

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current) return
    tubesRef.current.tubes.setColors(randomColors(3))
    tubesRef.current.tubes.setLightsColors(randomColors(4))
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full block ${className}`}
      style={{ touchAction: "none" }}
      onClick={handleClick}
    />
  )
}
