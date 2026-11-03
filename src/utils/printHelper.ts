import type { ReportHeaderMeta, ReportRow } from "../types";
import { formatCurrency } from "./exporters";
import type { Language } from "./translations";

/**
 * สร้าง HTML สำหรับพิมพ์รายงาน A4 หน้าตั้งแบบสมบูรณ์
 * มี CSS จัดหน้า A4 Portrait สวยงาม คมชัด และสคริปต์ window.print() อัตโนมัติเมื่อเปิดไฟล์
 */
export function generatePrintableReportHtml(
  rows: ReportRow[],
  meta: ReportHeaderMeta,
  lang: Language = "th"
): string {
  const totalSales = rows.reduce((sum, r) => sum + (Number(r.salesAmount) || 0), 0);
  const totalVat = rows.reduce((sum, r) => sum + (Number(r.vatAmount) || 0), 0);
  const netPreVat = totalSales - totalVat;

  const defaultPrintDate =
    lang === "en" ? "November 3, 2026" : "3 พฤศจิกายน 2569";
  const displayPrintDate = meta.printDate && meta.printDate.trim() !== "" ? meta.printDate : defaultPrintDate;

  const labels = {
    th: {
      order: "1. Order",
      abbFv: "2. ใบเสร็จ/ใบแจ้งหนี้",
      sales: "3. ยอดขาย",
      vat: "4. VAT",
      channel: "5. ช่องทางขาย",
      payment: "6. การรับเงิน",
      period: "งวดรายงาน:",
      printDate: "วันที่พิมพ์:",
      sumTable: "รวมยอดในตาราง:",
      totalCases: `รวม ${rows.length} เคส`,
      emptyRows: "ไม่มีรายการข้อมูลในรายงาน",
      card1Title: "Case (เคสทั้งหมด)",
      card1Unit: "เคส",
      card1Sub: `ผลรวมทั้งหมดของไฟล์ ${rows.length} รายการ`,
      card2Title: "ยอดขายที่ได้รับในเดือน",
      card2Unit: "บาท",
      card2Sub: "ผลรวมยอดขายทั้งหมดของไฟล์",
      card3Title: "ยอดขายจริง (ก่อนภาษี)",
      card3Unit: "บาท",
      card3Sub: `VAT 7%: ${formatCurrency(totalVat)} บาท`,
      sigPrep: "ผู้จัดทำรายงาน",
      sigCheck: "สมุห์บัญชี / ผู้ตรวจสอบ",
      barTitle: "หน้ารายงานพร้อมพิมพ์ A4 (หน้าตั้ง) — หากหน้าต่างสั่งพิมพ์ไม่แสดง กรุณากดปุ่มสั่งพิมพ์",
      barBtn: "🖨️ สั่งพิมพ์เอกสาร (Print)",
    },
    en: {
      order: "1. Order",
      abbFv: "2. Receipt / Invoice",
      sales: "3. Sales Amount",
      vat: "4. VAT",
      channel: "5. Sales Channel",
      payment: "6. Payment Method",
      period: "Report Period:",
      printDate: "Print Date:",
      sumTable: "Table Total:",
      totalCases: `Total ${rows.length} cases`,
      emptyRows: "No data in report",
      card1Title: "Case (Total Cases)",
      card1Unit: "cases",
      card1Sub: `Total file records: ${rows.length} items`,
      card2Title: "Monthly Received Sales",
      card2Unit: "THB",
      card2Sub: "Total gross sales from file",
      card3Title: "Net Sales (Pre-VAT)",
      card3Unit: "THB",
      card3Sub: `VAT 7%: ${formatCurrency(totalVat)} THB`,
      sigPrep: "Report Prepared By",
      sigCheck: "Accountant / Verified By",
      barTitle: "Ready to Print A4 (Portrait) — Click button if print dialog does not appear",
      barBtn: "🖨️ Print Document",
    },
  }[lang];

  const tableRowsHtml =
    rows.length === 0
      ? `<tr><td colspan="7" class="text-center empty-cell">${labels.emptyRows}</td></tr>`
      : rows
          .map(
            (r, i) => `
      <tr>
        <td class="text-center font-mono">${i + 1}</td>
        <td class="font-mono">${escapeHtml(r.orderNumber)}</td>
        <td class="font-mono">${escapeHtml(r.abbFvNumber)}</td>
        <td class="text-right font-mono">${formatCurrency(r.salesAmount)}</td>
        <td class="text-right font-mono">${formatCurrency(r.vatAmount)}</td>
        <td>${escapeHtml(r.salesChannel)}</td>
        <td>${escapeHtml(r.paymentMethod)}</td>
      </tr>`
          )
          .join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.reportTitle)}${meta.companyName ? ` — ${escapeHtml(meta.companyName)}` : ""}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: "IBM Plex Sans Thai", "Tahoma", "Sarabun", sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .sheet-wrapper {
      width: 100%;
      max-width: 794px;
      margin: 0 auto;
      padding: 16px;
      background: #ffffff;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .company-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 2px 0;
    }
    .meta-sub-blank {
      font-size: 11px;
      color: #475569;
      min-height: 14px;
      margin: 0;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #334155;
    }
    .header-right strong {
      color: #0f172a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #0f172a;
      font-size: 11px;
      margin-bottom: 14px;
    }
    th, td {
      border: 1px solid #0f172a;
      padding: 4px 6px;
      vertical-align: middle;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
      text-align: left;
    }
    tfoot td {
      background-color: #f8fafc;
      font-weight: 700;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono {
      font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
    }
    .empty-cell {
      padding: 24px;
      color: #64748b;
    }

    /* 3 Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 1px solid #0f172a;
      background-color: #f8fafc;
      margin-bottom: 20px;
    }
    .summary-card {
      padding: 10px 12px;
      border-right: 1px solid #cbd5e1;
    }
    .summary-card:last-child {
      border-right: none;
    }
    .card-label {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      display: block;
      margin-bottom: 3px;
    }
    .card-val {
      font-size: 16px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      color: #0f172a;
    }
    .card-val-green {
      color: #166534;
    }
    .card-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }


    .no-print-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 4px;
    }
    .no-print-bar button {
      background: #16a34a;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
    }
    .no-print-bar button:hover {
      background: #15803d;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      .sheet-wrapper {
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="no-print-bar">
      <span>${labels.barTitle}</span>
      <button type="button" onclick="window.print()">${labels.barBtn}</button>
    </div>

    <!-- Header (สำนักงานใหญ่, เลขประจำตัวผู้เสียภาษีอากร, หน้ากระดาษ นำออกและเว้นว่างไว้สำหรับอนาคต) -->
    <div class="header-box">
      <div>
        <h1 class="report-title">${escapeHtml(meta.reportTitle)}</h1>
        ${meta.companyName ? `<div class="company-title">${escapeHtml(meta.companyName)}</div>` : ""}
        <div class="meta-sub-blank">${escapeHtml(meta.customHeaderBlank || "")}</div>
      </div>
      <div class="header-right">
        <div><strong>${labels.period}</strong> ${escapeHtml(meta.periodLabel)}</div>
        <div style="margin-top:3px;"><strong>${labels.printDate}</strong> ${escapeHtml(displayPrintDate)}</div>
      </div>
    </div>

    <!-- Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 34px; text-align: center;">#</th>
          <th style="width: 105px;">${labels.order}</th>
          <th style="width: 125px;">${labels.abbFv}</th>
          <th style="width: 90px; text-align: right;">${labels.sales}</th>
          <th style="width: 80px; text-align: right;">${labels.vat}</th>
          <th style="width: 95px;">${labels.channel}</th>
          <th style="width: 100px;">${labels.payment}</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-right">${labels.sumTable}</td>
          <td class="text-right font-mono">${formatCurrency(totalSales)}</td>
          <td class="text-right font-mono">${formatCurrency(totalVat)}</td>
          <td colspan="2" style="font-size: 10px; color: #475569;">${labels.totalCases}</td>
        </tr>
      </tfoot>
    </table>

    <!-- 3 Summary Metric Cards (ย้ายลงมาข้างล่าง) -->
    <div class="summary-grid">
      <div class="summary-card">
        <span class="card-label">${labels.card1Title}</span>
        <div class="card-val">${rows.length} <span style="font-size:12px;font-weight:normal;">${labels.card1Unit}</span></div>
        <div class="card-sub">${labels.card1Sub}</div>
      </div>

      <div class="summary-card">
        <span class="card-label">${labels.card2Title}</span>
        <div class="card-val card-val-green">${formatCurrency(totalSales)} <span style="font-size:12px;font-weight:normal;">${labels.card2Unit}</span></div>
        <div class="card-sub">${labels.card2Sub}</div>
      </div>

      <div class="summary-card">
        <span class="card-label">${labels.card3Title}</span>
        <div class="card-val">${formatCurrency(netPreVat)} <span style="font-size:12px;font-weight:normal;">${labels.card3Unit}</span></div>
        <div class="card-sub">${labels.card3Sub}</div>
      </div>
    </div>
  </div>

  <script>
    // สั่งพิมพ์ทันทีหลังจากโหลดเนื้อหาเสร็จ
    window.addEventListener("load", function() {
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.error("Print error:", e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * ดาวน์โหลดไฟล์ HTML สำหรับพิมพ์รายงาน A4 ทันที (การันตี 100% ว่าเปิดแล้วพิมพ์ได้ทุกเบราว์เซอร์)
 */
export function downloadPrintableReportFile(
  rows: ReportRow[],
  meta: ReportHeaderMeta,
  lang: Language = "th"
): void {
  const html = generatePrintableReportHtml(rows, meta, lang);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `รายงานยอดขาย_A4หน้าตั้ง_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * สั่งพิมพ์เอกสารผ่าน Hidden IFrame และ window.print()
 * หากติด Sandbox ของ iFrame จะแจ้งผลและเตรียมไฟล์ดาวน์โหลดให้ทันที
 */
export async function executePrintDocument(
  rows: ReportRow[],
  meta: ReportHeaderMeta,
  lang: Language = "th"
): Promise<{ success: boolean; method: string }> {
  const htmlContent = generatePrintableReportHtml(rows, meta, lang);

  // 1. ลองวิธี IFrame Print ซึ่งรองรับการพิมพ์เฉพาะแผ่นกระดาษรายงาน
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute(
      "style",
      "position:fixed;top:-9999px;left:-9999px;width:10px;height:10px;border:none;visibility:hidden;"
    );
    iframe.setAttribute("title", "Print Document Frame");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc && iframe.contentWindow) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      await new Promise((res) => setTimeout(res, 300));
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          // ignore
        }
      }, 30000);

      return { success: true, method: "iframe" };
    }
  } catch (err) {
    console.warn("IFrame print error, fallback to window.print:", err);
  }

  // 2. ลองวิธี window.print() โดยตรง
  try {
    window.print();
    return { success: true, method: "window" };
  } catch (err) {
    console.warn("Direct window.print blocked:", err);
    // 3. หากโดนบล็อก ให้ดาวน์โหลดไฟล์ HTML พร้อมพิมพ์ให้ผู้ใช้ทันที
    downloadPrintableReportFile(rows, meta, lang);
    return { success: false, method: "download" };
  }
}
