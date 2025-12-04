/**
 * Login Page Component
 * 
 * Why: User authentication entry point for the application
 * How: Form with email and password fields, submits to auth endpoint
 * Impact: Secures application access and establishes user session
 */

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import FloatingLinesBackground from "../ui/FloatingLinesBackground"
import { useAuth } from "../../context/AuthContext"

// Animation variants for page entrance
// Why: Smooth, professional page transitions
// How: Defines animation states for container and children
// Impact: Better UX with polished animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
}

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  /**
   * Handle form submission
   * Why: Process user login credentials
   * How: Validates input, calls auth API, stores session, redirects
   * Impact: User gains access to application
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        navigate("/chat")
      } else {
        setError(result.message || "Login failed. Please try again.")
      }
    } catch (err) {
      console.error("[Login] Error:", err)
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Lines Background */}
      <FloatingLinesBackground />
      
      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      <motion.div variants={itemVariants} className="w-full max-w-md md:max-w-2xl px-4">
        <Card className="w-full backdrop-blur-sm bg-card/95 shadow-xl border-primary/20">
          <CardHeader className="space-y-3 md:space-y-4 pb-6 md:pb-8">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-sm sm:text-base md:text-lg">
                Sign in to your Chai Tapri account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <motion.div className="space-y-2 md:space-y-4" variants={itemVariants}>
                <label htmlFor="email" className="text-sm sm:text-base font-semibold block">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 sm:h-14 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary px-4"
                />
              </motion.div>
              <motion.div className="space-y-2 md:space-y-4" variants={itemVariants}>
                <label htmlFor="password" className="text-sm sm:text-base font-semibold block">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 sm:h-14 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary px-4"
                />
              </motion.div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm sm:text-base text-destructive bg-destructive/10 p-3 sm:p-4 rounded-md border border-destructive/20"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="submit" 
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
              <motion.div className="text-center text-sm sm:text-base text-muted-foreground pt-2 md:pt-4" variants={itemVariants}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-primary hover:text-accent transition-colors font-semibold"
                >
                  Sign up
                </button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
    </div>
  )
}

export default Login

