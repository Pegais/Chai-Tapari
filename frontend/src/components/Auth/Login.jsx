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

    // TODO: Replace with actual API call
    // Simulate API call delay
    setTimeout(() => {
      // Mock authentication - in production, this would call the backend
      if (email && password) {
        // Store mock session
        localStorage.setItem("user", JSON.stringify({
          _id: "user1",
          username: "alice",
          email: email,
        }))
        setLoading(false)
        navigate("/chat")
      } else {
        setError("Please enter email and password")
        setLoading(false)
      }
    }, 500)
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 relative z-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl border-primary/20">
          <CardHeader className="space-y-1">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center">
                Sign in to your Chai Tapri account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div className="space-y-2" variants={itemVariants}>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                />
              </motion.div>
              <motion.div className="space-y-2" variants={itemVariants}>
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                />
              </motion.div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
              <motion.div className="text-center text-sm text-muted-foreground" variants={itemVariants}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-primary hover:text-accent transition-colors"
                >
                  Sign up
                </button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Login

