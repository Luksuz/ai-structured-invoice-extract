"use server"
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { DocumentTypeSchema, InvoiceSchema, DeliveryNoteSchema, ReceiptSchema } from "./types";

// Initialize the OpenAI model
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

// Document type detection prompt
const documentTypePrompt = PromptTemplate.fromTemplate(`
You are a document analysis expert specializing in Latvian business documents.
Analyze the following OCR text and determine the document type.

Document types:
- Invoice (rēķins): Contains billing information, payment terms, and usually has line items with prices.
- Delivery Note (pavadzīme): Documents goods being delivered, may reference an invoice, focuses on items delivered.
- Receipt (čeks): Typically shorter, issued at point of sale, often has a simpler format than invoices.

OCR Text:
{text}

Determine the document type based on the content, structure, and any explicit mentions.
If the document is ambiguous, look for key indicators:
- Invoices typically mention payment terms, due dates, and have "Rēķins" or "Invoice" in the title.
- Delivery notes focus on delivered items and may mention "Pavadzīme" or "Delivery Note".
- Receipts are usually shorter, from retail establishments, and may mention "Čeks" or "Receipt".

Provide your analysis in the requested format.
`);

// Create the document type detection chain
const documentTypeDetectionChain = RunnableSequence.from([
  documentTypePrompt,
  model.withStructuredOutput(DocumentTypeSchema),
]);

// Document summarization prompt
const documentSummaryPrompt = PromptTemplate.fromTemplate(`
You are a document summarization expert.
Provide a concise summary of the following {documentType} document.

OCR Text:
{text}

Focus on the key information relevant to this type of document:
- For invoices: Focus on parties involved, total amounts, payment terms, and key dates.
- For delivery notes: Focus on items delivered, delivery dates, and parties involved.
- For receipts: Focus on the merchant, purchased items, and total amounts.

Provide a concise summary in 3-5 sentences.
`);

// Create the document summary chain
const documentSummaryChain = RunnableSequence.from([
  documentSummaryPrompt,
  model,
]);

// Base extraction prompt template
const baseExtractionPromptTemplate = `
You are a document data extraction expert specializing in Latvian business documents.
Extract structured information from the following {documentType} OCR text.

OCR Text:
{text}

Guidelines for extraction:
1. Reconstruct the document structure, especially tables and line items.
2. For tables, identify column headers and align values correctly.
3. Validate data integrity (e.g., check if quantity × price = total).
4. For dates, use YYYY-MM-DD format.
5. For numbers, extract as numeric values (without currency symbols).
6. Pay special attention to distinguishing between seller and buyer information.
7. For Latvian documents, look for terms like "Pārdevējs" (Seller) and "Pircējs" (Buyer).
8. VAT may be referred to as "PVN" in Latvian documents.

Extract the information in the requested structured format.
`;

// Create extraction prompts for each document type
const invoiceExtractionPrompt = PromptTemplate.fromTemplate(
  baseExtractionPromptTemplate.replace("{documentType}", "invoice")
);

const deliveryNoteExtractionPrompt = PromptTemplate.fromTemplate(
  baseExtractionPromptTemplate.replace("{documentType}", "delivery note")
);

const receiptExtractionPrompt = PromptTemplate.fromTemplate(
  baseExtractionPromptTemplate.replace("{documentType}", "receipt")
);

// Create extraction chains for each document type
const invoiceExtractionChain = RunnableSequence.from([
  invoiceExtractionPrompt,
  model.withStructuredOutput(InvoiceSchema),
]);

const deliveryNoteExtractionChain = RunnableSequence.from([
  deliveryNoteExtractionPrompt,
  model.withStructuredOutput(DeliveryNoteSchema),
]);

const receiptExtractionChain = RunnableSequence.from([
  receiptExtractionPrompt,
  model.withStructuredOutput(ReceiptSchema),
]);

/**
 * Detects the document type from OCR text
 * @param {string} ocrText - The OCR text from the document
 * @returns {Promise<object>} - Document type detection result
 */
export async function detectDocumentType(ocrText: string) {
  try {
    const typeDetectionResult = await documentTypeDetectionChain.invoke({
      text: ocrText,
    });
    
    console.log(`Detected document type: ${typeDetectionResult.documentType} (confidence: ${typeDetectionResult.confidence})`);
    
    return {
      documentType: typeDetectionResult.documentType,
      confidence: typeDetectionResult.confidence,
      reasoning: typeDetectionResult.reasoning
    };
  } catch (error) {
    console.error("Error detecting document type:", error);
    throw error;
  }
}

/**
 * Generates a summary of the document based on its type
 * @param {string} ocrText - The OCR text from the document
 * @param {string} documentType - The detected document type
 * @returns {Promise<string>} - Document summary
 */
export async function summarizeDocument(ocrText: string, documentType: string) {
  try {
    const summaryResult = await documentSummaryChain.invoke({
      text: ocrText,
      documentType: documentType,
    });
    
    return summaryResult.content;
  } catch (error) {
    console.error("Error summarizing document:", error);
    throw error;
  }
}

/**
 * Extracts structured data from the document based on its type
 * @param {string} ocrText - The OCR text from the document
 * @param {string} documentType - The detected document type
 * @returns {Promise<object>} - Extracted data from the document
 */
export async function extractDocumentData(ocrText: string, documentType: string) {
  try {
    let extractionResult;
    
    switch (documentType) {
      case "invoice":
        extractionResult = await invoiceExtractionChain.invoke({
          text: ocrText,
        });
        console.log("Invoice extraction result:", extractionResult);
        break;
      case "deliveryNote":
        extractionResult = await deliveryNoteExtractionChain.invoke({
          text: ocrText,
        });
        console.log("Delivery note extraction result:", extractionResult);
        break;
      case "receipt":
        extractionResult = await receiptExtractionChain.invoke({
          text: ocrText,
        });
        console.log("Receipt extraction result:", extractionResult);
        break;
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
    
    return extractionResult;
  } catch (error) {
    console.error("Error extracting document data:", error);
    throw error;
  }
}