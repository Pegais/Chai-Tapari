/**
 * Card Nav Component (React Bits Style)
 * 
 * Why: Navigation component with card-based items and search functionality
 * How: Displays items as cards with hover effects and search filtering
 * Impact: Modern, interactive navigation with search capability
 */

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Hash } from "lucide-react"
import { Input } from "./input"
import { cn } from "../../lib/utils"

function CardNav({ items, onItemSelect, selectedItemId, renderItem, searchPlaceholder = "Search..." }) {
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * Filter items based on search query
   * Why: Enable real-time search through navigation items
   * How: Filters items array based on search query
   * Impact: Users can quickly find specific items
   */
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    
    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      if (item.name) return item.name.toLowerCase().includes(query)
      if (item.title) return item.title.toLowerCase().includes(query)
      return false
    })
  }, [items, searchQuery])

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-primary/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = selectedItemId === item.id || selectedItemId === item._id
              
              return (
                <motion.div
                  key={item.id || item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                  onClick={() => onItemSelect(item.id || item._id)}
                  className={cn(
                    "group relative p-4 rounded-lg mb-2 cursor-pointer transition-all",
                    "bg-card/50 border border-primary/10 hover:border-primary/30",
                    "hover:bg-card/80 hover:shadow-lg hover:shadow-primary/10",
                    isSelected && "bg-primary/10 border-primary/50 shadow-lg shadow-primary/20"
                  )}
                >
                  {renderItem ? (
                    renderItem(item, isSelected)
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-md",
                        isSelected ? "bg-primary/20" : "bg-muted/50"
                      )}>
                        <Hash className={cn(
                          "h-4 w-4",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-semibold text-sm truncate",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {item.name || item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        )}
                        {item.memberCount !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.memberCount} members
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Hover effect overlay */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                </motion.div>
              )
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              No items found
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CardNav

