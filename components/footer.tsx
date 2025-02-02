export function Footer() {
  return (
    <footer className="w-full py-6 px-8 border-t">
      <div className="container mx-auto flex justify-between items-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Solana Token Creator. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

