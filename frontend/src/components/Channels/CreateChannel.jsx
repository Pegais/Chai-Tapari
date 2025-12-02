/**
 * Create Channel Modal Component
 * 
 * Why: Allows users to create new channels
 * How: Modal form with channel name and description inputs
 * Impact: Enables users to organize conversations into channels
 */

import React, { useState } from "react"
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
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="channel-name" className="text-sm font-medium">
                Channel Name
              </label>
              <Input
                id="channel-name"
                placeholder="e.g. general, random"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="channel-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                id="channel-description"
                placeholder="What's this channel about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Channel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateChannel

