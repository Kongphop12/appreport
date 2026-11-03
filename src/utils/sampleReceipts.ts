import type { ReportRow, UploadedImage } from "../types";

export const INITIAL_REPORT_ROWS: ReportRow[] = [
  {
    id: "row-101",
    orderNumber: "#4092",
    abbFvNumber: "ABB-202611-0001",
    salesAmount: 1605.0,
    vatAmount: 105.0,
    salesChannel: "Shopee",
    paymentMethod: "โอนเงิน QR PromptPay",
    createdAt: "2026-11-01 09:42",
    aiNote: "ใบออเดอร์ Shopee และใบกำกับภาษีอย่างย่อ ABB",
  },
  {
    id: "row-102",
    orderNumber: "#1805",
    abbFvNumber: "FV-202611-0014",
    salesAmount: 3424.0,
    vatAmount: 224.0,
    salesChannel: "TikTok Shop",
    paymentMethod: "บัตรเครดิต",
    createdAt: "2026-11-01 11:15",
    aiNote: "ใบคำสั่งซื้อ TikTok Shop และใบกำกับภาษีเต็มรูป FV",
  },
  {
    id: "row-103",
    orderNumber: "#4451",
    abbFvNumber: "ABB-202611-0002",
    salesAmount: 963.0,
    vatAmount: 63.0,
    salesChannel: "Lazada",
    paymentMethod: "Lazada Wallet",
    createdAt: "2026-11-01 13:28",
    aiNote: "ใบสรุปคำสั่งซื้อ Lazada และใบกำกับภาษีอย่างย่อ ABB",
  },
  {
    id: "row-104",
    orderNumber: "#0518",
    abbFvNumber: "ABB-202611-0003",
    salesAmount: 2140.0,
    vatAmount: 140.0,
    salesChannel: "LINE OA",
    paymentMethod: "โอนเงินธนาคารกสิกรไทย",
    createdAt: "2026-11-01 15:50",
    aiNote: "สลิปโอนเงิน LINE OA และใบกำกับภาษีอย่างย่อ ABB",
  },
  {
    id: "row-105",
    orderNumber: "#0094",
    abbFvNumber: "FV-202611-0015",
    salesAmount: 5350.0,
    vatAmount: 350.0,
    salesChannel: "หน้าร้าน",
    paymentMethod: "เงินสด",
    createdAt: "2026-11-01 17:10",
    aiNote: "ใบเสร็จหน้าร้านและใบกำกับภาษีเต็มรูป FV",
  },
];

export interface SampleDocumentPreset {
  id: string;
  label: string;
  description: string;
  orderSpec: {
    platformHeader: string;
    accentHex: string;
    orderNumber: string;
    salesChannel: string;
    paymentMethod: string;
    itemSummary: string;
    totalAmount: string;
    paidTime: string;
    fileName: string;
  };
  taxSpec: {
    docTypeLabel: string;
    abbFvNumber: string;
    refOrder: string;
    preVat: string;
    vatAmount: string;
    grandTotal: string;
    issueDate: string;
    fileName: string;
  };
}

export const SAMPLE_PRESETS: SampleDocumentPreset[] = [
  {
    id: "preset-shopee-abb",
    label: "ชุดที่ 1 (Shopee + ABB)",
    description: "ออเดอร์ Shopee ชำระผ่าน QR PromptPay คู่กับใบกำกับภาษีอย่างย่อ ABB",
    orderSpec: {
      platformHeader: "ใบสรุปคำสั่งซื้อและสลิปรับเงิน",
      accentHex: "#c2410c",
      orderNumber: "#8841",
      salesChannel: "Shopee",
      paymentMethod: "โอนเงิน QR PromptPay",
      itemSummary: "ชุดเครื่องเขียนสำนักงานพรีเมียม x 2 ชุด",
      totalAmount: "1,605.00",
      paidTime: "02/11/2026 10:18",
      fileName: "order_shopee_8841.png",
    },
    taxSpec: {
      docTypeLabel: "ใบกำกับภาษีอย่างย่อ (ABB)",
      abbFvNumber: "ABB-202611-0142",
      refOrder: "#8841",
      preVat: "1,500.00",
      vatAmount: "105.00",
      grandTotal: "1,605.00",
      issueDate: "02/11/2026",
      fileName: "tax_ABB_202611_0142.png",
    },
  },
  {
    id: "preset-tiktok-fv",
    label: "ชุดที่ 2 (TikTok + FV)",
    description: "ออเดอร์ TikTok Shop ชำระด้วยบัตรเครดิต คู่กับใบกำกับภาษีเต็มรูป FV",
    orderSpec: {
      platformHeader: "รายละเอียดคำสั่งซื้อออนไลน์",
      accentHex: "#0f172a",
      orderNumber: "#3420",
      salesChannel: "TikTok Shop",
      paymentMethod: "บัตรเครดิต Visa",
      itemSummary: "เก้าอี้ทำงานเพื่อสุขภาพ รุ่น ErgoLite x 1 ตัว",
      totalAmount: "4,280.00",
      paidTime: "02/11/2026 14:05",
      fileName: "order_tiktok_3420.png",
    },
    taxSpec: {
      docTypeLabel: "ใบกำกับภาษีเต็มรูป (Full Tax Invoice - FV)",
      abbFvNumber: "FV-202611-0039",
      refOrder: "#3420",
      preVat: "4,000.00",
      vatAmount: "280.00",
      grandTotal: "4,280.00",
      issueDate: "02/11/2026",
      fileName: "tax_FV_202611_0039.png",
    },
  },
  {
    id: "preset-line-abb",
    label: "ชุดที่ 3 (LINE OA + สลิปโอนเงิน)",
    description: "สลิปโอนเงินลูกค้าสั่งผ่าน LINE OA คู่กับใบกำกับภาษีอย่างย่อ ABB",
    orderSpec: {
      platformHeader: "ใบแจ้งยอดออเดอร์ & สลิปโอนเงิน",
      accentHex: "#15803d",
      orderNumber: "#0955",
      salesChannel: "LINE OA",
      paymentMethod: "โอนเงินธนาคารกสิกรไทย",
      itemSummary: "กระดาษความร้อนพิมพ์ใบเสร็จ 80mm (ยกลัง)",
      totalAmount: "856.00",
      paidTime: "02/11/2026 16:42",
      fileName: "slip_line_0955.png",
    },
    taxSpec: {
      docTypeLabel: "ใบกำกับภาษีอย่างย่อ (ABB)",
      abbFvNumber: "ABB-202611-0143",
      refOrder: "#0955",
      preVat: "800.00",
      vatAmount: "56.00",
      grandTotal: "856.00",
      issueDate: "02/11/2026",
      fileName: "tax_ABB_202611_0143.png",
    },
  },
];

function canvasToUploadedImage(
  canvas: HTMLCanvasElement,
  fileName: string
): UploadedImage {
  const previewUrl = canvas.toDataURL("image/png");
  const base64Data = previewUrl.replace(/^data:image\/png;base64,/, "");
  return {
    fileName,
    mimeType: "image/png",
    base64Data,
    previewUrl,
  };
}

export function renderSamplePresetPair(preset: SampleDocumentPreset): {
  image1: UploadedImage;
  image2: UploadedImage;
} {
  // Image 1: Order & Payment Slip
  const c1 = document.createElement("canvas");
  c1.width = 760;
  c1.height = 920;
  const ctx1 = c1.getContext("2d")!;

  ctx1.fillStyle = "#ffffff";
  ctx1.fillRect(0, 0, c1.width, c1.height);

  // Header band
  ctx1.fillStyle = preset.orderSpec.accentHex;
  ctx1.fillRect(0, 0, c1.width, 112);

  ctx1.fillStyle = "#ffffff";
  ctx1.font = "bold 28px sans-serif";
  ctx1.fillText(preset.orderSpec.platformHeader, 44, 54);
  ctx1.font = "20px sans-serif";
  ctx1.fillText(`ช่องทางขาย (Sales Channel): ${preset.orderSpec.salesChannel}`, 44, 88);

  // Document card frame
  ctx1.strokeStyle = "#cbd5e1";
  ctx1.lineWidth = 2;
  ctx1.strokeRect(36, 144, c1.width - 72, c1.height - 188);

  const drawField = (
    ctx: CanvasRenderingContext2D,
    y: number,
    label: string,
    value: string,
    boldValue = false
  ) => {
    ctx.fillStyle = "#475569";
    ctx.font = "21px sans-serif";
    ctx.fillText(label, 64, y);

    ctx.fillStyle = "#0f172a";
    ctx.font = boldValue ? "bold 24px monospace" : "600 22px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(value, c1.width - 64, y);
    ctx.textAlign = "left";

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, y + 22);
    ctx.lineTo(c1.width - 64, y + 22);
    ctx.stroke();
  };

  drawField(ctx1, 205, "Order Number (เลขที่คำสั่งซื้อ)", preset.orderSpec.orderNumber, true);
  drawField(ctx1, 275, "ช่องทางขาย (Sales Channel)", preset.orderSpec.salesChannel);
  drawField(ctx1, 345, "ช่องทางการรับเงิน (Payment)", preset.orderSpec.paymentMethod);
  drawField(ctx1, 415, "วันที่รับชำระเงิน", preset.orderSpec.paidTime);

  ctx1.fillStyle = "#334155";
  ctx1.font = "bold 21px sans-serif";
  ctx1.fillText("รายการสินค้า:", 64, 490);
  ctx1.fillStyle = "#0f172a";
  ctx1.font = "21px sans-serif";
  ctx1.fillText(preset.orderSpec.itemSummary, 64, 530);

  // Total highlight box
  ctx1.fillStyle = "#f8fafc";
  ctx1.fillRect(64, 600, c1.width - 128, 120);
  ctx1.strokeStyle = "#94a3b8";
  ctx1.strokeRect(64, 600, c1.width - 128, 120);

  ctx1.fillStyle = "#334155";
  ctx1.font = "bold 24px sans-serif";
  ctx1.fillText("ยอดขายสุทธิ (Total Paid)", 92, 670);

  ctx1.fillStyle = "#0f172a";
  ctx1.font = "bold 36px monospace";
  ctx1.textAlign = "right";
  ctx1.fillText(`${preset.orderSpec.totalAmount} THB`, c1.width - 92, 674);
  ctx1.textAlign = "left";

  ctx1.fillStyle = "#64748b";
  ctx1.font = "18px sans-serif";
  ctx1.fillText("สถานะการชำระเงิน: ชำระเงินเรียบร้อยแล้ว (Verified Slip)", 64, 800);

  // Image 2: Tax Invoice ABB / FV
  const c2 = document.createElement("canvas");
  c2.width = 760;
  c2.height = 920;
  const ctx2 = c2.getContext("2d")!;

  ctx2.fillStyle = "#ffffff";
  ctx2.fillRect(0, 0, c2.width, c2.height);

  ctx2.strokeStyle = "#0f172a";
  ctx2.lineWidth = 3;
  ctx2.strokeRect(32, 32, c2.width - 64, c2.height - 64);

  ctx2.fillStyle = "#0f172a";
  ctx2.font = "bold 26px sans-serif";
  ctx2.fillText("บริษัท สยามซัพพลาย การบัญชี จำกัด (สำนักงานใหญ่)", 64, 96);
  ctx2.fillStyle = "#475569";
  ctx2.font = "19px sans-serif";
  ctx2.fillText("เลขประจำตัวผู้เสียภาษีอากร (TAX ID): 0105566098765", 64, 132);

  ctx2.fillStyle = "#f1f5f9";
  ctx2.fillRect(64, 162, c2.width - 128, 68);
  ctx2.fillStyle = "#0f172a";
  ctx2.font = "bold 24px sans-serif";
  ctx2.fillText(preset.taxSpec.docTypeLabel, 84, 205);

  drawField(ctx2, 290, "เลขที่ใบกำกับภาษี (Number ABB-FV)", preset.taxSpec.abbFvNumber, true);
  drawField(ctx2, 360, "อ้างอิง Order Number", preset.taxSpec.refOrder, true);
  drawField(ctx2, 430, "วันที่ออกเอกสาร", preset.taxSpec.issueDate);

  drawField(ctx2, 540, "มูลค่าสินค้าก่อนภาษี (Pre-VAT)", `${preset.taxSpec.preVat} บาท`);
  drawField(ctx2, 615, "ภาษีมูลค่าเพิ่ม VAT 7%", `${preset.taxSpec.vatAmount} บาท`, true);

  ctx2.fillStyle = "#0f172a";
  ctx2.fillRect(64, 675, c2.width - 128, 96);
  ctx2.fillStyle = "#ffffff";
  ctx2.font = "bold 24px sans-serif";
  ctx2.fillText("ยอดขายรวมภาษี (Grand Total)", 90, 732);
  ctx2.font = "bold 34px monospace";
  ctx2.textAlign = "right";
  ctx2.fillText(`${preset.taxSpec.grandTotal} บาท`, c2.width - 90, 735);
  ctx2.textAlign = "left";

  ctx2.fillStyle = "#64748b";
  ctx2.font = "18px sans-serif";
  ctx2.fillText("เอกสารออกเป็นชุด — รวมภาษีมูลค่าเพิ่ม 7% เรียบร้อยแล้ว", 64, 835);

  return {
    image1: canvasToUploadedImage(c1, preset.orderSpec.fileName),
    image2: canvasToUploadedImage(c2, preset.taxSpec.fileName),
  };
}

export async function fileToUploadedImage(file: File): Promise<UploadedImage> {
  const { isSpreadsheetFile, processSpreadsheetFile } = await import(
    "./spreadsheetParser"
  );

  // If user provides XLSX or CSV
  if (isSpreadsheetFile(file)) {
    const { image } = await processSpreadsheetFile(file);
    return image;
  }

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(
        new Error(
          "รองรับไฟล์รูปภาพ (PNG, JPG, WEBP) หรือไฟล์ตาราง (XLSX, CSV) เท่านั้น"
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("รูปแบบไฟล์ไม่ถูกต้อง"));
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const base64Fallback = dataUrl.split(",")[1] || "";
          resolve({
            fileName: file.name,
            mimeType: file.type || "image/png",
            base64Data: base64Fallback,
            previewUrl: dataUrl,
          });
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const outputMime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const compressedUrl = canvas.toDataURL(outputMime, 0.92);
        const base64Data = compressedUrl.split(",")[1] || "";

        resolve({
          fileName: file.name,
          mimeType: outputMime,
          base64Data,
          previewUrl: compressedUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
