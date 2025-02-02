import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Add actual health checks here
    return NextResponse.json(
      { status: 'healthy' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 