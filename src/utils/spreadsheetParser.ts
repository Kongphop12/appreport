import * as XLSX from "xlsx";
import type { ReportRow, UploadedImage } from "../types";

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[\s_\-./()]/g, "");
}

function findValueByKeywords(
  row: Record<string, unknown>,
  keywords: string[],
  blacklistKeywords: string[] = []
): string {
  const entries = Object.entries(row);
  for (const [key, val] of entries) {
    const normKey = normalizeKey(key);
    // Ignore columns matching any blacklisted keyword (อันอื่นไม่ใช่ปล่อยเขา)
    if (blacklistKeywords.some((b) => normKey.includes(normalizeKey(b)))) {
      continue;
    }
    for (const kw of keywords) {
      if (normKey.includes(normalizeKey(kw))) {
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (str !== "") return str;
        }
      }
    }
  }
  return "";
}

export function extractFourDigitOrderNumber(raw: unknown): string {
  if (raw === undefined || raw === null) return "-";
  const str = String(raw).trim();
  if (
    !str ||
    str === "-" ||
    str === "N/A" ||
    str === "null" ||
    str === "undefined" ||
    str.toLowerCase() === "none"
  ) {
    return "-";
  }

  // 1. ตรวจหาตัวเลข 4 หลักจากข้อความก่อนเสมอ (เช่น #8245 261028SP9HMD5G -> 8245)
  const digitMatches = str.match(/\d+/g);
  if (digitMatches && digitMatches.length > 0) {
    const exactFour = digitMatches.find((m) => m.length === 4);
    if (exactFour) {
      return `#${exactFour}`;
    }
    const validNum = digitMatches.find((m) => m.length >= 3 && m.length <= 6);
    if (validNum) {
      return `#${validNum}`;
    }
    const allDigits = digitMatches.join("");
    if (allDigits.length >= 4) {
      return `#${allDigits.slice(-4)}`;
    }
    return `#${allDigits}`;
  }

  if (/^\d{3,6}$/.test(str)) {
    return `#${str}`;
  }

  return str.startsWith("#") ? str.split(/\s+/)[0] : `#${str.split(/\s+/)[0]}`;
}


export function parseSpreadsheetToReportRows(
  buffer: ArrayBuffer,
  fileName: string
): ReportRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel หรือ CSV");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rawJson.length === 0) {
    throw new Error("ไฟล์ไม่มีข้อมูลแถวรายการ");
  }

  const resultRows: ReportRow[] = [];

  // คอลัมน์อื่นๆ ที่ไม่ใช่เลขออเดอร์ ปล่อยไป (ห้ามนำมาใส่เป็นเลขออเดอร์เด็ดขาด)
  const BLACKLIST_ORDER_COLUMNS = [
    "tracking",
    "track",
    "พัสดุ",
    "ขนส่ง",
    "courier",
    "waybill",
    "phone",
    "tel",
    "โทร",
    "เบอร์",
    "postcode",
    "zip",
    "ไปรษณีย์",
    "sku",
    "barcode",
    "บาร์โค้ด",
    "itemid",
    "productid",
    "variant",
    "taxid",
    "ผู้เสียภาษี",
    "price",
    "amount",
    "total",
    "ยอด",
    "vat",
    "ภาษี",
    "date",
    "วันที่",
    "time",
    "เวลา",
    "customer",
    "ลูกค้า",
    "ผู้รับ",
    "address",
    "ที่อยู่",
    "channel",
    "ช่องทาง",
    "payment",
    "ชำระ",
  ];

  rawJson.forEach((row, idx) => {
    // 1. Order Number: กฎสำคัญ: "ชื่อโปรเจกต์" กับ "เลขออเดอร์" มันตรงกันมันคืออันเดียวกัน อันอื่นไม่ใช่ปล่อย
    const rawOrderVal =
      // 1.1) หาจากชื่อโปรเจกต์ / โครงการ / Project (ตรงกับเลขออเดอร์คืออันเดียวกัน)
      findValueByKeywords(
        row,
        [
          "ชื่อโปรเจกต์",
          "ชื่อโปรเจค",
          "โปรเจกต์",
          "โปรเจค",
          "โครงการ",
          "projectname",
          "project_name",
          "projectno",
          "project_no",
          "project",
          "ชื่องาน",
          "jobname",
          "job_name",
          "job",
        ],
        BLACKLIST_ORDER_COLUMNS
      ) ||
      // 1.2) หาจากเลขออเดอร์ / Order Number / Name (เช่น Shopify Name #1001)
      findValueByKeywords(
        row,
        [
          "เลขออเดอร์",
          "เลขที่คำสั่งซื้อ",
          "รหัสคำสั่งซื้อ",
          "เลขอ้างอิง",
          "ordernumber",
          "order_number",
          "orderno",
          "order_no",
          "orderid",
          "order_id",
          "คำสั่งซื้อ",
          "ออเดอร์",
          "order",
          "name",
          "pk",
        ],
        BLACKLIST_ORDER_COLUMNS
      );

    const orderNumber = extractFourDigitOrderNumber(rawOrderVal);

    // 2. ใบเสร็จ/ใบแจ้งหนี้ (ABB-FV)
    const abbFvNumber =
      findValueByKeywords(row, [
        "ใบเสร็จ",
        "ใบแจ้งหนี้",
        "ใบแจ้งหนี",
        "ใบเสร็จรับเงิน",
        "abb",
        "fv",
        "abbfv",
        "ใบกำกับ",
        "ใบกำกับภาษี",
        "เลขใบกำกับ",
        "tax",
        "taxinvoice",
        "inv",
        "invoice",
        "receipt",
      ]) || "-";

    // 3. Sales Amount
    const rawSales = findValueByKeywords(row, [
      "sales",
      "amount",
      "total",
      "ยอดขาย",
      "ยอดเงิน",
      "จำนวนเงิน",
      "ราคา",
      "รวมสุทธิ",
    ]);
    const cleanSalesStr = rawSales.replace(/,/g, "").replace(/[^0-9.-]/g, "");
    const salesAmount =
      Number.isFinite(Number(cleanSalesStr)) && cleanSalesStr !== ""
        ? Math.round(Number(cleanSalesStr) * 100) / 100
        : 0;

    // 4. VAT Amount
    const rawVat = findValueByKeywords(row, [
      "vat",
      "ภาษี",
      "vat7",
      "ภาษีมูลค่าเพิ่ม",
      "7%",
      "taxamount",
    ]);
    const cleanVatStr = rawVat.replace(/,/g, "").replace(/[^0-9.-]/g, "");
    let vatAmount =
      Number.isFinite(Number(cleanVatStr)) && cleanVatStr !== ""
        ? Math.round(Number(cleanVatStr) * 100) / 100
        : 0;

    if (vatAmount === 0 && salesAmount > 0) {
      vatAmount = Math.round(((salesAmount * 7) / 107) * 100) / 100;
    }

    // 5. Sales Channel: หากเจอในไฟล์ให้อิงตามไฟล์ตามจริง
    const rawChannel = findValueByKeywords(row, [
      "channel",
      "platform",
      "ช่องทาง",
      "ช่องทางขาย",
      "แพลตฟอร์ม",
      "saleschannel",
      "orderchannel",
      "source",
      "type",
      "draft",
      "online",
      "store",
    ]);
    const salesChannel = rawChannel || "Online Store";

    // 6. Payment Method: ให้อิงตามไฟล์เท่านั้น หากไม่มีให้เป็น "-" ห้ามคิดขึ้นเอง
    const paymentMethod =
      findValueByKeywords(row, [
        "payment",
        "method",
        "การรับเงิน",
        "ช่องทางการรับเงิน",
        "วิธีชำระ",
        "วิธีชำระเงิน",
        "ชำระเงิน",
        "paymentmethod",
        "gateway",
        "bank",
        "ธนาคาร",
      ]) || "-";

    const rawCancelled = findValueByKeywords(row, [
      "ลูกค้ายกเลิก",
      "status",
      "สถานะ",
      "cancelled",
      "ยกเลิก",
    ]).toLowerCase();
    let cancelled = "-";
    if (
      rawCancelled.includes("ใช่") ||
      rawCancelled.includes("yes") ||
      rawCancelled.includes("true") ||
      (rawCancelled.includes("ยกเลิก") && !rawCancelled.includes("ไม่"))
    ) {
      cancelled = "ใช่";
    }

    resultRows.push({
      id: `row-${Date.now()}-${idx}`,
      orderNumber,
      abbFvNumber,
      salesAmount,
      vatAmount,
      salesChannel,
      paymentMethod,
      cancelled,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      aiNote: `นำเข้าจากไฟล์ ${fileName}`,
    });
  });


  // ให้อิงจาก Primary Key (Order + Invoice / fv-abb) สร้างความสัมพันธ์เพื่อป้องกันข้อมูลซ้ำซ้อนระหว่างไฟล์
  const dedupedRows: ReportRow[] = [];
  const seenPrimaryKeys = new Set<string>();

  for (const row of resultRows) {
    if (row.orderNumber === "-" || !row.orderNumber) {
      dedupedRows.push(row);
      continue;
    }

    const primaryKey = `${row.orderNumber.toLowerCase()}_${row.abbFvNumber.toLowerCase()}`;
    if (seenPrimaryKeys.has(primaryKey) || seenPrimaryKeys.has(row.orderNumber.toLowerCase())) {
      continue; // ถ้า Order หรือ Primary Key (Order + Invoice) ซ้ำกัน ให้ข้ามทันที
    }

    seenPrimaryKeys.add(primaryKey);
    seenPrimaryKeys.add(row.orderNumber.toLowerCase());
    dedupedRows.push(row);
  }

  return dedupedRows;
}

export function deduplicateReportRows(rows: ReportRow[]): ReportRow[] {
  const map = new Map<string, ReportRow>();

  for (const row of rows) {
    const rawOrder = (row.orderNumber || "").trim();
    if (!rawOrder || rawOrder === "-") {
      map.set(`no-order-${row.id || Math.random()}`, row);
      continue;
    }

    const digits = rawOrder.replace(/\D/g, "");
    const orderKey = digits.length >= 3 ? digits : rawOrder.toLowerCase().replace(/[^a-z0-9]/g, "");

    const existing = map.get(orderKey);
    if (!existing) {
      map.set(orderKey, { ...row });
    } else {
      if (existing.abbFvNumber === "-" && row.abbFvNumber !== "-") {
        existing.abbFvNumber = row.abbFvNumber;
      }
      if (existing.paymentMethod === "-" && row.paymentMethod !== "-") {
        existing.paymentMethod = row.paymentMethod;
      }
      if ((existing.salesChannel === "Online Store" || existing.salesChannel === "-" || !existing.salesChannel) && row.salesChannel && row.salesChannel !== "-") {
        existing.salesChannel = row.salesChannel;
      }
      if (row.salesAmount > 0 && existing.salesAmount === 0) {
        existing.salesAmount = row.salesAmount;
      }
      if (row.vatAmount > 0 && existing.vatAmount === 0) {
        existing.vatAmount = row.vatAmount;
      }
      if (row.orderNumber.length > existing.orderNumber.length) {
        existing.orderNumber = row.orderNumber;
      }
    }
  }

  return Array.from(map.values());
}

export function renderSpreadsheetToCanvasPreview(
  fileName: string,
  rows: ReportRow[]
): string {
  const c = document.createElement("canvas");
  c.width = 800;
  c.height = 920;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);

  // Top header band (Excel green)
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 0, c.width, 100);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("ไฟล์ตารางข้อมูล (XLSX / CSV)", 36, 45);
  ctx.font = "16px monospace";
  ctx.fillText(`${fileName}  (${rows.length} แถวข้อมูล)`, 36, 80);

  // Sheet grid frame
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 120, c.width - 48, c.height - 150);

  // Table header
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(24, 120, c.width - 48, 44);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("#", 36, 148);
  ctx.fillText("1. Order Number", 80, 148);
  ctx.fillText("2. ABB-FV", 260, 148);
  ctx.fillText("3. ยอดขาย", 410, 148);
  ctx.fillText("4. VAT", 510, 148);
  ctx.fillText("5. ช่องทาง", 600, 148);
  ctx.fillText("6. การรับเงิน", 690, 148);

  const previewRows = rows.slice(0, 14);
  previewRows.forEach((r, i) => {
    const y = 164 + i * 42;
    if (i % 2 === 1) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(25, y, c.width - 50, 42);
    }
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(24, y + 42);
    ctx.lineTo(c.width - 24, y + 42);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "12px monospace";
    ctx.fillText(String(i + 1), 36, y + 26);

    ctx.fillStyle = "#0f172a";
    ctx.font = "500 12px monospace";
    ctx.fillText(r.orderNumber.slice(0, 16), 80, y + 26);
    ctx.fillText(r.abbFvNumber.slice(0, 14), 260, y + 26);

    ctx.textAlign = "right";
    ctx.fillText(r.salesAmount.toFixed(2), 480, y + 26);
    ctx.fillText(r.vatAmount.toFixed(2), 570, y + 26);
    ctx.textAlign = "left";

    ctx.font = "12px sans-serif";
    ctx.fillText(r.salesChannel.slice(0, 10), 600, y + 26);
    ctx.fillText(r.paymentMethod.slice(0, 12), 690, y + 26);
  });

  if (rows.length > 14) {
    ctx.fillStyle = "#64748b";
    ctx.font = "italic 13px sans-serif";
    ctx.fillText(`... และอีก ${rows.length - 14} แถวในไฟล์`, 36, 164 + 14 * 42 + 32);
  }

  // Footer note
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(24, c.height - 70, c.width - 48, 40);
  ctx.fillStyle = "#15803d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("✓ ไฟล์พร้อมนำเข้าตารางรายงาน 6 หัวข้อสไตล์ Excel เรียบร้อยแล้ว", 36, c.height - 44);

  return c.toDataURL("image/png");
}

export function isSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("csv") ||
    file.type === "application/vnd.ms-excel" ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "text/csv"
  );
}

export async function processSpreadsheetFile(
  file: File
): Promise<{ rows: ReportRow[]; image: UploadedImage }> {
  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheetToReportRows(buffer, file.name);
  const previewUrl = renderSpreadsheetToCanvasPreview(file.name, rows);
  const base64Data = previewUrl.replace(/^data:image\/png;base64,/, "");

  return {
    rows,
    image: {
      fileName: file.name,
      mimeType: "image/png",
      base64Data,
      previewUrl,
      parsedRows: rows,
    },
  };
}
