import { z } from "zod";

export const LineItemSchema = z.object({
    description: z.string().describe("Description of the item or service"),
    quantity: z.number().optional().describe("Quantity of items"),
    unitPrice: z.number().optional().describe("Price per unit"),
    totalPrice: z.number().describe("Total price for this line item"),
    vatRate: z.number().optional().describe("VAT rate applied to this item (in %)"),
    vatAmount: z.number().optional().describe("VAT amount for this line item"),
  });
  
export const BaseDocumentSchema = z.object({
    documentNumber: z.string().describe("Document identifier/number"),
    date: z.string().describe("Document date in YYYY-MM-DD format"),
    seller: z.object({
      name: z.string().describe("Name of the seller/company"),
      registrationNumber: z.string().optional().describe("Registration number of the seller"),
      vatNumber: z.string().optional().describe("VAT number of the seller"),
      address: z.string().optional().describe("Address of the seller"),
    }),
    buyer: z.object({
      name: z.string().describe("Name of the buyer/customer"),
      registrationNumber: z.string().optional().describe("Registration number of the buyer"),
      vatNumber: z.string().optional().describe("VAT number of the buyer"),
      address: z.string().optional().describe("Address of the buyer"),
    }),
    totalAmount: z.number().describe("Total amount including VAT"),
    currency: z.string().describe("Currency used in the document (e.g., EUR)"),
  });
  
export const InvoiceSchema = BaseDocumentSchema.extend({
    documentType: z.literal("invoice"),
    lineItems: z.array(LineItemSchema),
    subtotal: z.number().describe("Total amount before VAT"),
    vatAmount: z.number().describe("Total VAT amount"),
    dueDate: z.string().optional().describe("Payment due date in YYYY-MM-DD format"),
    paymentDetails: z.object({
      bankAccount: z.string().optional().describe("Bank account number"),
      bankName: z.string().optional().describe("Name of the bank"),
      reference: z.string().optional().describe("Payment reference"),
    }).optional(),
  });
  
export const DeliveryNoteSchema = BaseDocumentSchema.extend({
    documentType: z.literal("deliveryNote"),
    lineItems: z.array(LineItemSchema),
    deliveryDate: z.string().optional().describe("Date of delivery in YYYY-MM-DD format"),
    relatedInvoice: z.string().optional().describe("Reference to related invoice number"),
  });
  
export const ReceiptSchema = BaseDocumentSchema.extend({
    documentType: z.literal("receipt"),
    lineItems: z.array(LineItemSchema),
    paymentMethod: z.string().optional().describe("Method of payment (cash, card, etc.)"),
    cashierName: z.string().optional().describe("Name of the cashier"),
  });
  
// Combined schema for document type detection
export const DocumentTypeSchema = z.object({
    documentType: z.enum(["invoice", "deliveryNote", "receipt"]).describe("The detected document type"),
    confidence: z.number().describe("Confidence level in the detection (0-1)"),
    reasoning: z.string().describe("Reasoning behind the document type detection"),
  });