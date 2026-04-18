import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react'

export interface TopbarState {
  breadcrumb?: string[]
  subtitle?: string
  search?: {
    value: string
    placeholder?: string
    onChange: (v: string) => void
  }
  actions?: React.ReactNode
}

// Split into two contexts: state (consumed by Topbar) + setters (consumed by pages).
// Pages only consume setters, so updating state doesn't re-render pages.
const TopbarStateContext = createContext<TopbarState>({})

interface TopbarSetters {
  setTopbar: (s: Partial<TopbarState>) => void
  resetTopbar: () => void
}
const TopbarSettersContext = createContext<TopbarSetters>({
  setTopbar: () => {},
  resetTopbar: () => {},
})

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TopbarState>({})

  const setTopbar = useCallback((partial: Partial<TopbarState>) => {
    setState(s => ({ ...s, ...partial }))
  }, [])

  const resetTopbar = useCallback(() => setState({}), [])

  const setters = useMemo(() => ({ setTopbar, resetTopbar }), [setTopbar, resetTopbar])

  return (
    <TopbarSettersContext.Provider value={setters}>
      <TopbarStateContext.Provider value={state}>
        {children}
      </TopbarStateContext.Provider>
    </TopbarSettersContext.Provider>
  )
}

export function useTopbarValue() {
  return useContext(TopbarStateContext)
}

export function useTopbarSetters() {
  return useContext(TopbarSettersContext)
}

/**
 * Push topbar state on every render of the consuming page. Auto-clears on unmount.
 * Safe because consuming pages only subscribe to setters (stable), not state,
 * so they don't re-render when Topbar state updates.
 */
export function useTopbarState(state: Partial<TopbarState>) {
  const { setTopbar, resetTopbar } = useTopbarSetters()

  // Push on every render so the Topbar always reflects the latest props
  // (including derived JSX like view-toggle highlights, counts, etc.)
  useLayoutEffect(() => {
    setTopbar(state)
  })

  // Reset on unmount only
  useEffect(() => {
    return () => resetTopbar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
