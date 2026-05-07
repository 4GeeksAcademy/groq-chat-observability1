'use client'

import { useState, useEffect, useCallback } from 'react'

export function useSessionStorage<T>(key: string, initialValue: T) {
  // Initialize state with a function to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const item = sessionStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
    }
    setIsHydrated(true)
  }, [key])

  // Persist to sessionStorage whenever value changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return
    try {
      sessionStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue, isHydrated])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value
      return newValue
    })
  }, [])

  const clearValue = useCallback(() => {
    setStoredValue(initialValue)
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return { value: storedValue, setValue, clearValue, isHydrated }
}
