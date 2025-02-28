import { OCRAnalyzer } from "@/components/ocr-analyzer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">OCR Text Analyzer</h1>
          <p className="mt-2 text-muted-foreground">Analyze, clean, and extract insights from OCR-generated text</p>
        </header>
        <OCRAnalyzer />
      </div>
    </main>
  )
}

