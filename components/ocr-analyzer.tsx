"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Copy, Download, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { detectDocumentType, summarizeDocument, extractDocumentData } from "@/lib/text-analysis"

type DocumentTypeResult = {
  documentType: string
  confidence: number
  reasoning: string
}

type ExtractedData = {
  [key: string]: any
}

type AnalysisResults = {
  documentType?: DocumentTypeResult
  summary?: string
  extractedData?: ExtractedData
}

const STORAGE_KEY = "ocr-analyzer-history"

export function OCRAnalyzer() {
  const [inputText, setInputText] = useState("")
  const [isDetectingType, setIsDetectingType] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isExtractingData, setIsExtractingData] = useState(false)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ text: string; timestamp: number }[]>([])
  const [activeTab, setActiveTab] = useState("input")

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to parse history from localStorage")
      }
    }
  }, [])

  // Save history to local storage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }, [history])

  const handleDetectDocumentType = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze")
      return
    }

    setError(null)
    setIsDetectingType(true)

    try {
      // Detect document type
      const documentType = await detectDocumentType(inputText)
      
      // Update results with document type
      setResults({
        ...results,
        documentType
      })
      
      // Add to history
      const newHistory = [
        { text: inputText.substring(0, 100) + (inputText.length > 100 ? "..." : ""), timestamp: Date.now() },
        ...history,
      ].slice(0, 5)
      
      setHistory(newHistory)
      
      // Switch to results tab
      setActiveTab("results")
      
    } catch (err) {
      setError("An error occurred during document type detection. Please try again.")
      console.error(err)
    } finally {
      setIsDetectingType(false)
    }
  }

  const handleSummarizeDocument = async () => {
    if (!results || !results.documentType) {
      setError("Please detect document type first")
      return
    }

    setError(null)
    setIsSummarizing(true)

    try {
      // Summarize document based on its type
      const summary = await summarizeDocument(inputText, results.documentType.documentType)
      
      // Update results with summary
      setResults({
        ...results,
        summary: summary.toString()
      })
      
    } catch (err) {
      setError("An error occurred during document summarization. Please try again.")
      console.error(err)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleExtractDocumentData = async () => {
    if (!results || !results.documentType) {
      setError("Please detect document type first")
      return
    }

    setError(null)
    setIsExtractingData(true)

    try {
      // Extract data based on document type
      const extractedData = await extractDocumentData(inputText, results.documentType.documentType)
      
      // Update results with extracted data
      setResults({
        ...results,
        extractedData
      })
      
    } catch (err) {
      setError("An error occurred during data extraction. Please try again.")
      console.error(err)
    } finally {
      setIsExtractingData(false)
    }
  }

  const handleProcessAll = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze")
      return
    }

    setError(null)
    
    // Step 1: Detect document type
    setIsDetectingType(true)
    try {
      const documentType = await detectDocumentType(inputText)
      setResults({ documentType })
      setIsDetectingType(false)
      
      // Step 2: Summarize document
      setIsSummarizing(true)
      const summary = await summarizeDocument(inputText, documentType.documentType)
      setResults(prev => ({ ...prev, summary: summary.toString() }))
      setIsSummarizing(false)
      
      // Step 3: Extract document data
      setIsExtractingData(true)
      const extractedData = await extractDocumentData(inputText, documentType.documentType)
      setResults(prev => ({ ...prev, extractedData }))
      
      // Add to history
      const newHistory = [
        { text: inputText.substring(0, 100) + (inputText.length > 100 ? "..." : ""), timestamp: Date.now() },
        ...history,
      ].slice(0, 5)
      
      setHistory(newHistory)
      
      // Switch to results tab
      setActiveTab("results")
      
    } catch (err) {
      setError("An error occurred during document processing. Please try again.")
      console.error(err)
    } finally {
      setIsDetectingType(false)
      setIsSummarizing(false)
      setIsExtractingData(false)
    }
  }

  const handleClear = () => {
    setInputText("")
    setResults(null)
    setError(null)
    setActiveTab("input")
  }

  const loadFromHistory = (text: string) => {
    setInputText(text)
    setResults(null)
    setError(null)
  }

  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Input OCR Text</h2>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setHistory([])}>
                  Clear History
                </Button>
              )}
            </div>

            {history.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Recent:</span>
                {history.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => loadFromHistory(item.text)}
                  >
                    {item.text}
                  </Badge>
                ))}
              </div>
            )}

            <Textarea
              placeholder="Paste your OCR text here..."
              className="min-h-[200px] font-mono text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleDetectDocumentType}
                disabled={isDetectingType || isSummarizing || isExtractingData || !inputText.trim()}
              >
                {isDetectingType ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting Type...
                  </>
                ) : (
                  "Detect Document Type"
                )}
              </Button>

              <Button
                onClick={handleSummarizeDocument}
                disabled={isDetectingType || isSummarizing || isExtractingData || !results || !results.documentType}
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  "Summarize Document"
                )}
              </Button>

              <Button
                onClick={handleExtractDocumentData}
                disabled={isDetectingType || isSummarizing || isExtractingData || !results || !results.documentType}
              >
                {isExtractingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  "Extract Document Data"
                )}
              </Button>

              <Button
                onClick={handleProcessAll}
                disabled={isDetectingType || isSummarizing || isExtractingData || !inputText.trim()}
              >
                {isDetectingType || isSummarizing || isExtractingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process All"
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleClear} 
                disabled={isDetectingType || isSummarizing || isExtractingData || (!inputText && !results)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          {results && (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Document Type Section */}
                {results.documentType && (
                  <div className="space-y-2 border-b pb-4">
                    <h3 className="text-lg font-medium">Document Type</h3>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{results.documentType.documentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="font-medium">{results.documentType.confidence.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reasoning:</span>
                        <p className="mt-1 text-sm">{results.documentType.reasoning}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Document Summary Section */}
                {results.summary ? (
                  <div className="space-y-2 border-b pb-4">
                    <h3 className="text-lg font-medium">Document Summary</h3>
                    <p className="text-sm">{results.summary}</p>
                  </div>
                ) : (
                  <div className="space-y-2 border-b pb-4">
                    <h3 className="text-lg font-medium">Document Summary</h3>
                    <div className="rounded-md border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {isSummarizing ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Summarizing document...
                          </span>
                        ) : (
                          <span>
                            Click "Summarize Document" to generate a summary.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Extracted Data Section */}
                {results.extractedData ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Extracted Data</h3>
                    <div className="rounded-md bg-muted p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(results.extractedData, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Extracted Data</h3>
                    <div className="rounded-md border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {isExtractingData ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting document data...
                          </span>
                        ) : (
                          <span>
                            Click "Extract Document Data" to extract structured information.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setActiveTab("input")}>
                    Back to Input
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

