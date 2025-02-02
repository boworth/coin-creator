import { execSync } from 'child_process'
import fs from 'fs'

const buildProduction = () => {
  try {
    // Clean previous builds
    console.log('Cleaning previous builds...')
    execSync('rm -rf .next')

    // Run type checks
    console.log('Running type checks...')
    execSync('tsc --noEmit')

    // Run tests
    console.log('Running tests...')
    execSync('npm run test')

    // Build the application
    console.log('Building application...')
    execSync('next build')

    console.log('✅ Production build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

buildProduction() 