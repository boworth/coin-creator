import { MetadataUpdater } from "@/components/metadata-updater"
import { AnimatedDescription } from "@/components/animated-description"

export default function UpdateMetadataPage() {
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">Update Token Metadata</h1>
        <div className="h-12 mb-4">
          <AnimatedDescription
            text="Update your Solana token's metadata including name, symbol, description, and logo. Enter your token address to get started."
            speed={30}
          />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg mt-6">
          <MetadataUpdater />
        </div>
      </div>
    </div>
  )
}

