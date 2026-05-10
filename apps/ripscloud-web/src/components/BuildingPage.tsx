import { Wrench, Coffee } from 'lucide-react'

interface BuildingPageProps {
  pageName: string
}

export function BuildingPage({ pageName }: BuildingPageProps) {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-gradient-to-br from-background via-background to-muted p-6">
      <div className="text-center space-y-6 max-w-md">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Wrench className="h-24 w-24 text-primary animate-bounce" />
            <Coffee className="h-12 w-12 text-muted-foreground absolute -bottom-2 -right-2 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {pageName}
          </h1>
          <p className="text-lg text-muted-foreground">
            🚧 Page Under Construction 🚧
          </p>
        </div>

        {/* Description */}
        <div className="bg-muted/50 rounded-lg p-6 border border-muted-foreground/20">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page is currently being built. Our team is working hard to bring you this feature soon.
            In the meantime, feel free to explore other sections of the application.
          </p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <span>Status: In Development</span>
          </div>
        </div>

        {/* Call to action */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
