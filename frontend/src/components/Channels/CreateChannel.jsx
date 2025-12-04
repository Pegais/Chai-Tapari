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
import { useCreateChannel } from "../../hooks/useChannels"
import { useUsers } from "../../hooks/useUsers"
import { useAuth } from "../../context/AuthContext"

function CreateChannel({ onClose, onSuccess }) {
  const { user } = useAuth()
  const { data: users = [] } = useUsers()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [error, setError] = useState("")
  const createChannel = useCreateChannel()

  /**
   * Handle channel creation
   * Why: Create new channel in the system
   * How: Validates input, calls API, adds channel to list
   * Impact: New channel available for users to join
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }

    // Validate private channel has at least one member
    if (isPrivate && selectedMembers.length === 0) {
      setError("Private channels require at least one member (besides yourself)")
      return
    }

    try {
      const newChannel = await createChannel.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate: isPrivate,
        members: isPrivate ? selectedMembers : undefined,
      })
      
      onSuccess(newChannel)
      setName("")
      setDescription("")
      setIsPrivate(false)
      setSelectedMembers([])
      onClose()
    } catch (err) {
      console.error("[CreateChannel] Error:", err)
      setError(err.message || "Failed to create channel. Please try again.")
    }
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
                    disabled={createChannel.isPending}
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
                    disabled={createChannel.isPending}
                    className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      disabled={createChannel.isPending}
                      className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-semibold">Private Channel</span>
                  </label>
                  {isPrivate && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-semibold">
                        Select Members (at least 1 required)
                      </label>
                      <div className="max-h-48 overflow-y-auto border border-primary/20 rounded-md p-2 bg-background/50">
                        {users.filter(u => u._id !== user?._id).map((userItem) => (
                          <label 
                            key={userItem._id} 
                            className="flex items-center gap-2 p-2 hover:bg-accent/20 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(userItem._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, userItem._id])
                                } else {
                                  setSelectedMembers(selectedMembers.filter(id => id !== userItem._id))
                                }
                              }}
                              disabled={createChannel.isPending}
                              className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{userItem.username}</span>
                            {userItem.isOnline && (
                              <span className="h-2 w-2 bg-primary rounded-full"></span>
                            )}
                          </label>
                        ))}
                      </div>
                      {selectedMembers.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Please select at least one member for private channels
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={createChannel.isPending}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createChannel.isPending}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    {createChannel.isPending ? "Creating..." : "Create Channel"}
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

