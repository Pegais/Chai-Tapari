/**
 * Signup Page Component with Stepper
 * 
 * Why: Multi-step registration for better UX and data organization
 * How: Uses stepper component to guide users through registration steps
 * Impact: Clearer form flow and reduced cognitive load
 */

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import Stepper from "../ui/Stepper"
import AvatarSelector from "./AvatarSelector"
import FloatingLinesBackground from "../ui/FloatingLinesBackground"
import { signup } from "../../services/api"
import { useAuth } from "../../context/AuthContext"

// Stepper steps configuration
// Why: Define the registration flow steps
// How: Array of step objects with labels
// Impact: Clear step progression for users
const steps = [
  { id: 1, label: "Username" },
  { id: 2, label: "Email" },
  { id: 3, label: "Avatar" },
  { id: 4, label: "Password" },
  { id: 5, label: "Confirm" },
]

// Animation variants for step transitions
// Why: Smooth transitions between form steps
// How: Defines slide animations for step content
// Impact: Professional, polished step transitions
const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

function Signup() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  
  // Form data state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: null,
    password: "",
    confirmPassword: "",
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  /**
   * Handle next step navigation
   * Why: Move to next step after validation
   * How: Validates current step, updates direction, increments step
   * Impact: Controlled step progression with validation
   */
  const handleNext = () => {
    // Validate current step
    const validation = validateStep(currentStep)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    setDirection(1)
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  /**
   * Handle previous step navigation
   * Why: Allow users to go back and edit
   * How: Decrements step and updates direction
   * Impact: Better UX with ability to correct mistakes
   */
  const handlePrevious = () => {
    setDirection(-1)
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  /**
   * Validate current step
   * Why: Ensure data quality before proceeding
   * How: Checks step-specific validation rules
   * Impact: Prevents invalid data submission
   */
  const validateStep = (step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!formData.username.trim()) {
          newErrors.username = "Username is required"
        } else if (formData.username.length < 3) {
          newErrors.username = "Username must be at least 3 characters"
        }
        break
      case 2:
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Invalid email format"
        }
        break
      case 3:
        if (!formData.avatar) {
          newErrors.avatar = "Please select an avatar"
        }
        break
      case 4:
        if (!formData.password) {
          newErrors.password = "Password is required"
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters"
        }
        break
      case 5:
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
        }
        break
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    }
  }

  /**
   * Handle form submission
   * Why: Create new user account
   * How: Validates all steps, calls signup API
   * Impact: New user account created in system
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    const validation = validateStep(5)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        // Send just the filename (e.g., "avatar_1.jpg") - backend will construct full URL
        avatar: formData.avatar?.filename || null,
      }

      const response = await signup(userData)

      if (response.success) {
        // Store token and user
        const { user, token } = response.data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
        
        navigate("/chat")
      } else {
        setErrors({ submit: response.message || "Signup failed. Please try again." })
      }
    } catch (error) {
      console.error("[Signup] Error:", error)
      setErrors({ 
        submit: error.message || "An error occurred. Please try again.",
        ...(error.errors && { fields: error.errors })
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Render step content based on current step
   * Why: Display appropriate form fields for each step
   * How: Conditional rendering based on currentStep
   * Impact: Focused, step-by-step form completion
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-background/50 border-primary/20 focus:border-primary"
                autoFocus
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/50 border-primary/20 focus:border-primary"
                autoFocus
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block mb-4">
                Choose Your Avatar
              </label>
              <AvatarSelector
                selectedAvatar={formData.avatar}
                onSelect={(avatar) => setFormData({ ...formData, avatar })}
              />
              {errors.avatar && (
                <p className="text-sm text-destructive text-center mt-2">{errors.avatar}</p>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-background/50 border-primary/20 focus:border-primary"
                autoFocus
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-background/50 border-primary/20 focus:border-primary"
                autoFocus
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            {/* Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">Review your information:</p>
              <p><span className="text-muted-foreground">Username:</span> {formData.username}</p>
              <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
              {formData.avatar && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Avatar:</span>
                  <img src={formData.avatar.url} alt={formData.avatar.name} className="w-8 h-8 rounded-full" />
                  <span>{formData.avatar.name}</span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Lines Background */}
      <FloatingLinesBackground />
      
      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-2xl backdrop-blur-sm bg-card/95 shadow-xl border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Join Chai Tapri and start chatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stepper */}
            <Stepper steps={steps} currentStep={currentStep} />

            {/* Step Content */}
            <div className="min-h-[400px] relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-4 border-t border-primary/20">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-primary/20 hover:bg-primary/10"
              >
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              )}
            </div>

            {/* Back to Login */}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:text-accent transition-colors"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Signup
