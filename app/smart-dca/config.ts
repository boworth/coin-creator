import { NextConfig } from 'next'

// Only include this route in development
export const dynamic = 'force-static'
export const dynamicParams = false

// This is the key config that will prevent the route from being built in production
export const generateStaticParams = () => {
  if (process.env.NODE_ENV === 'production') {
    return []
  }
  return [{}]
} 