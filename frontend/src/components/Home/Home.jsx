/**
 * Home Page Component
 * 
 * Why: Landing page for users before authentication
 * How: Displays app branding, anime characters, and navigation buttons
 * Impact: First impression and entry point to the application
 */

import React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import FloatingLinesBackground from "../ui/FloatingLinesBackground"

// Animation variants for page entrance
// Why: Smooth, professional page transitions
// How: Defines animation states for container and children
// Impact: Better UX with polished animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* React Bits Floating Lines Background */}
      <FloatingLinesBackground />
      
      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Anime Characters Section */}
        <motion.div
          className="flex items-center justify-center gap-8 mb-8"
          variants={itemVariants}
        >
          {/* Left Character */}
          <motion.div
            className="relative"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=anime1&style=circle&backgroundColor=FF4655"
              alt="Anime Character 1"
              className="w-32 h-32 rounded-full border-4 border-primary/50 shadow-lg shadow-primary/30"
            />
            {/* Tea cup emoji or icon */}
            <motion.div
              className="absolute -bottom-2 -right-2 text-4xl"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ☕
            </motion.div>
          </motion.div>

          {/* Center Logo/Title */}
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <motion.h1
              className="text-7xl md:text-9xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% auto",
              }}
            >
              CHAI-TAPRI
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground font-light"
              variants={itemVariants}
            >
              Where conversations brew
            </motion.p>
          </motion.div>

          {/* Right Character */}
          <motion.div
            className="relative"
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=anime2&style=circle&backgroundColor=FF6B35"
              alt="Anime Character 2"
              className="w-32 h-32 rounded-full border-4 border-accent/50 shadow-lg shadow-accent/30"
            />
            {/* Tea cup emoji or icon */}
            <motion.div
              className="absolute -bottom-2 -left-2 text-4xl"
              animate={{
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            >
              ☕
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-6 mt-8"
          variants={itemVariants}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-bold border-2 border-primary/50 hover:bg-primary/10 hover:border-primary shadow-lg"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </Button>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute bottom-10 left-10 text-primary/20"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="text-6xl">🍵</div>
        </motion.div>
        <motion.div
          className="absolute top-10 right-10 text-accent/20"
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="text-6xl">☕</div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Home

