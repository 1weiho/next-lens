'use client'

import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import { ScanAnimation } from '@/components/scan-animation'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  },
}

export function LandingHero() {
  return (
    <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
      {/* Text Content */}
      <motion.div
        className="flex flex-col text-left space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          <motion.h1
            variants={itemVariants}
            className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            next-lens
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-zinc-400">
            Visualize Your Next.js App Router
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="text-zinc-500 text-lg leading-relaxed max-w-lg"
          >
            Automatically scan your project to identify all routes. Interact
            through the Web UI, CLI, or MCP, choose the way you like best.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
          <Link
            href="/docs"
            className="px-6 py-1.5 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            Read Documentation
          </Link>
          <Link
            href="/docs/quickstart"
            className="px-6 py-1.5 rounded-xl text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Quickstart
          </Link>
        </motion.div>
      </motion.div>

      {/* Animation/Visual */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          duration: 1,
          delay: 0.5,
          ease: [0.21, 0.47, 0.32, 0.98] as const,
        }}
      >
        <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 to-purple-500/10 blur-2xl rounded-3xl -z-10" />
        <ScanAnimation />
      </motion.div>
    </div>
  )
}
