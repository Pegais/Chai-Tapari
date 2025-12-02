/**
 * Create Channel Modal Component
 * 
 * Why: Allows users to create new channels
 * How: Modal form with channel name and description inputs
 * Impact: Enables users to organize conversations into channels
 */

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"

function CreateChannel({ onClose, onSuccess }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  /**
   * Handle channel creation
   * Why: Create new channel in the system
   * How: Validates input, calls API, adds channel to list
   * Impact: New channel available for users to join
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setLoading(true)

    // TODO: Replace with actual API call
    setTimeout(() => {
      const newChannel = {
        _id: `channel${Date.now()}`,
        name: name.trim().toLowerCase(),
        description: description.trim(),
        members: [],
        createdBy: "user1", // Current user
        isPrivate: false,
        createdAt: new Date(),
        memberCount: 1,
      }
      
      setLoading(false)
      onSuccess(newChannel)
      setName("")
      setDescription("")
    }, 500)
  }

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-2xl border-primary/20">
            <CardHeader className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-4 h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pr-8">
                Create New Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="channel-name" className="text-sm font-semibold">
                    Channel Name
                  </label>
                  <Input
                    id="channel-name"
                    placeholder="e.g. general, random"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="channel-description" className="text-sm font-semibold">
                    Description (Optional)
                  </label>
                  <Input
                    id="channel-description"
                    placeholder="What's this channel about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={loading}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    {loading ? "Creating..." : "Create Channel"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CreateChannel

