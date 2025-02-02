export function Footer() {
  return (
    <footer className="py-6 md:py-0">
      <div className="container flex items-center justify-center h-16">
        <p className="text-sm text-center text-muted-foreground">
          Built by{" "}
          <a
            href="https://backwardsduck.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            backwardsduck
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  )
}

