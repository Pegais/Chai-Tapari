/**
 * Stepper Component (React Bits Style)
 * 
 * Why: Multi-step form navigation for better UX
 * How: Displays step indicators and manages current step state
 * Impact: Clear progress indication and organized form flow
 */

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

function Stepper({ steps, currentStep }) {
  /**
   * Render stepper with step indicators
   * Why: Visual progress indication for multi-step forms
   * How: Shows completed, active, and upcoming steps
   * Impact: Users understand their progress in the form
   */
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep
        const isUpcoming = stepNumber > currentStep

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                  isCompleted && "bg-primary border-primary",
                  isActive && "bg-primary/20 border-primary scale-110",
                  isUpcoming && "bg-background border-muted-foreground/30"
                )}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive && "text-primary",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {stepNumber}
                  </span>
                )}
              </motion.div>
              <motion.span
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isActive && "text-primary",
                  isCompleted && "text-foreground",
                  isUpcoming && "text-muted-foreground"
                )}
                animate={{
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {step.label}
              </motion.span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative">
                <div className="absolute inset-0 bg-muted-foreground/20" />
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: isCompleted ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  style={{ transformOrigin: "left" }}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Stepper

