import { promises as fs } from 'fs'
import path from 'path'

interface MembershipData {
  isActive: boolean
  expiresAt: number | null
}

const STORAGE_DIR = path.join(process.cwd(), '.membership-data')
const getStorageFilePath = (walletAddress: string) => path.join(STORAGE_DIR, `${walletAddress}.json`)

// Initialize storage directory
async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR)
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  }
}

export async function getMembershipStatus(walletAddress: string): Promise<MembershipData> {
  try {
    await ensureStorageDir()
    const filePath = getStorageFilePath(walletAddress)
    
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const membershipData = JSON.parse(data)
      const isActive = membershipData.expiresAt > Date.now()

      return {
        isActive,
        expiresAt: membershipData.expiresAt
      }
    } catch (error) {
      // If file doesn't exist or other error, return inactive status
      return { isActive: false, expiresAt: null }
    }
  } catch (error) {
    console.error('Error getting membership status:', error)
    return { isActive: false, expiresAt: null }
  }
}

export async function updateMembershipStatus(
  walletAddress: string,
  duration: number
): Promise<void> {
  try {
    await ensureStorageDir()
    const filePath = getStorageFilePath(walletAddress)
    
    const membershipData = {
      isActive: true,
      expiresAt: Date.now() + duration
    }

    await fs.writeFile(filePath, JSON.stringify(membershipData, null, 2))
    console.log(`Updated membership for ${walletAddress}:`, membershipData)
  } catch (error) {
    console.error('Error updating membership status:', error)
    throw error
  }
} 