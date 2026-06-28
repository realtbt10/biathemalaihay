'use client'
import { Tooltip } from 'antd'
import { ReactElement, cloneElement, useSyncExternalStore } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

function getTouchSnapshot() {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

function getServerSnapshot() {
  return false
}

interface Props {
  title: string
  children: ReactElement
}

/** Tooltip trên desktop; dùng title native trên mobile để tránh chặn tap */
export default function TouchTooltip({ title, children }: Props) {
  const isTouch = useSyncExternalStore(subscribe, getTouchSnapshot, getServerSnapshot)

  if (isTouch) {
    return cloneElement(children, { title })
  }

  return <Tooltip title={title}>{children}</Tooltip>
}
