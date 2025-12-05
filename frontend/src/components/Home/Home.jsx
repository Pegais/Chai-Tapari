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
        {/* Anime Characters Section - Responsive */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6 md:mb-8"
          variants={itemVariants}
        >
          {/* Left Character - Hidden on mobile */}
          <motion.div
            className="relative hidden md:block"
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
              className="w-24 md:w-32 h-24 md:h-32 rounded-full border-4 border-primary/50 shadow-lg shadow-primary/30"
            />
            <motion.div
              className="absolute -bottom-2 -right-2 text-3xl md:text-4xl"
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
            className="text-center px-4"
            variants={itemVariants}
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black mb-2 md:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
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
              NUBEE
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-light"
              variants={itemVariants}
            >
              Where conversations brew
            </motion.p>
          </motion.div>

          {/* Right Character - Hidden on mobile */}
          <motion.div
            className="relative hidden md:block"
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
              className="w-24 md:w-32 h-24 md:h-32 rounded-full border-4 border-accent/50 shadow-lg shadow-accent/30"
            />
            <motion.div
              className="absolute -bottom-2 -left-2 text-3xl md:text-4xl"
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

        {/* Action Buttons - Responsive */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6 md:mt-8 w-full max-w-md px-4"
          variants={itemVariants}
        >
          <motion.div 
            className="w-full sm:w-auto" 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </motion.div>
          <motion.div 
            className="w-full sm:w-auto" 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold border-2 border-primary/50 hover:bg-primary/10 hover:border-primary shadow-lg"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </Button>
          </motion.div>
        </motion.div>

        {/* Decorative Elements - Hidden on mobile */}
        <motion.div
          className="hidden md:block absolute bottom-10 left-10 text-primary/20"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="text-4xl md:text-6xl">🍵</div>
        </motion.div>
        <motion.div
          className="hidden md:block absolute top-10 right-10 text-accent/20"
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="text-4xl md:text-6xl">☕</div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Home

