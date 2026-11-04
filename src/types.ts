export interface SourceImagesMeta {
  image1Preview?: string;
  image1Name?: string;
  image2Preview?: string;
  image2Name?: string;
  files?: Array<{ fileName: string; previewUrl?: string }>;
}

export interface ReportRow {
  id: string;
  orderNumber: string; // Order Number
  abbFvNumber: string; // Number ABB-FV
  salesAmount: number; // ยอดขาย
  vatAmount: number; // VAT
  salesChannel: string; // ช่องทางขาย
  paymentMethod: string; // ช่องทางการรับเงิน
  cancelled?: string; // ลูกค้ายกเลิก (- / ใช่)
  createdAt: string;
  aiNote?: string;
  sourceImages?: SourceImagesMeta;
}

export interface UploadedImage {
  id?: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
  previewUrl: string;
  fileSize?: number;
  parsedRows?: ReportRow[];
}

export interface ReportHeaderMeta {
  companyName: string;
  taxId?: string;
  branchName?: string;
  reportTitle: string;
  periodLabel: string;
  printDate?: string;
  preparedBy: string;
  checkedBy: string;
  customHeaderBlank?: string;
}

export type ActiveTab = "sheet" | "print" | "storage";

export type ColumnKey =
  | "orderNumber"
  | "abbFvNumber"
  | "salesAmount"
  | "vatAmount"
  | "salesChannel"
  | "paymentMethod"
  | "cancelled";

export interface SelectedCell {
  rowId: string;
  colKey: ColumnKey;
}

