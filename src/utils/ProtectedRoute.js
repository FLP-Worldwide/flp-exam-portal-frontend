'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('role')

    if (!token || !allowedRoles.includes(role)) {
      // Clear token and role
      localStorage.removeItem('access_token')
      localStorage.removeItem('role')
      router.push('/')
    } else {
      setLoading(false)
    }
  }, [router, allowedRoles])

  if (loading) return <div>Loading...</div>
  return children
}
