/**
 * Avatar Selector Component
 * 
 * Why: Allow users to choose their avatar from anime characters
 * How: Grid display of anime character avatars with selection state
 * Impact: Personalization and visual identity for users
 */

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

// Anime character avatars - Using local avatar images
// Why: Provide diverse character options for user selection
// How: Uses local avatar images from public/avatars folder
// Impact: Users can express their personality through avatar choice
// Note: 18 avatars total - 12 male (avatar_1 to avatar_12), 6 female (avatar_13 to avatar_18)
const animeAvatars = {
  male: [
    { id: "avatar_1", name: "Hero", url: "/avatars/avatar_1.jpg" },
    { id: "avatar_2", name: "Warrior", url: "/avatars/avatar_2.jpg" },
    { id: "avatar_3", name: "Ninja", url: "/avatars/avatar_3.jpg" },
    { id: "avatar_4", name: "Samurai", url: "/avatars/avatar_4.jpg" },
    { id: "avatar_5", name: "Mage", url: "/avatars/avatar_5.jpg" },
    { id: "avatar_6", name: "Knight", url: "/avatars/avatar_6.jpg" },
    { id: "avatar_7", name: "Ranger", url: "/avatars/avatar_7.jpg" },
    { id: "avatar_8", name: "Rogue", url: "/avatars/avatar_8.jpg" },
    { id: "avatar_9", name: "Paladin", url: "/avatars/avatar_9.jpg" },
    { id: "avatar_10", name: "Bard", url: "/avatars/avatar_10.jpg" },
    { id: "avatar_11", name: "Monk", url: "/avatars/avatar_11.jpg" },
    { id: "avatar_12", name: "Druid", url: "/avatars/avatar_12.jpg" },
  ],
  female: [
    { id: "avatar_13", name: "Princess", url: "/avatars/avatar_13.jpg" },
    { id: "avatar_14", name: "Valkyrie", url: "/avatars/avatar_14.jpg" },
    { id: "avatar_15", name: "Enchantress", url: "/avatars/avatar_15.jpg" },
    { id: "avatar_16", name: "Archer", url: "/avatars/avatar_16.jpg" },
    { id: "avatar_17", name: "Priestess", url: "/avatars/avatar_17.jpg" },
    { id: "avatar_18", name: "Ranger", url: "/avatars/avatar_18.jpg" },
  ],
}

function AvatarSelector({ selectedAvatar, onSelect }) {
  const [activeTab, setActiveTab] = useState("male")

  /**
   * Handle avatar selection
   * Why: Update selected avatar when user clicks
   * How: Calls onSelect callback with selected avatar data
   * Impact: User's avatar choice is stored for account creation
   */
  const handleAvatarClick = (avatar) => {
    onSelect(avatar)
  }

  const allAvatars = [...animeAvatars.male, ...animeAvatars.female]

  return (
    <div className="w-full space-y-4">
      {/* Tab Selector */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActiveTab("male")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeTab === "male"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Male ({animeAvatars.male.length})
        </button>
        <button
          onClick={() => setActiveTab("female")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeTab === "female"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Female ({animeAvatars.female.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeTab === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All ({allAvatars.length})
        </button>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-6 max-h-96 overflow-y-auto p-4">
        <AnimatePresence>
          {(activeTab === "all" ? allAvatars : animeAvatars[activeTab]).map((avatar, index) => {
            const isSelected = selectedAvatar?.id === avatar.id

            return (
              <motion.button
                key={avatar.id}
                onClick={() => handleAvatarClick(avatar)}
                className={cn(
                  "relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 transition-all overflow-hidden",
                  isSelected
                    ? "border-primary ring-4 ring-primary/30 scale-110"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:scale-105"
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Check className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {selectedAvatar && (
        <motion.div
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Selected: <span className="text-primary font-medium">{selectedAvatar.name}</span>
        </motion.div>
      )}
    </div>
  )
}

export default AvatarSelector

