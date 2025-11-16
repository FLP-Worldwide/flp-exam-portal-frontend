import React from 'react'

export default function LoaderComp() {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="h-12 w-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
    </div>
  )
}
