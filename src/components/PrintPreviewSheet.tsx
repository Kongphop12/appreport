import React, { useMemo, useState } from "react";
import { Printer, FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import type { ReportHeaderMeta, ReportRow } from "../types";
import { exportToExcel, formatCurrency } from "../utils/exporters";
import { downloadPrintableReportFile, executePrintDocument } from "../utils/printHelper";
import { type Language, translations } from "../utils/translations";

interface PrintPreviewSheetProps {
  rows: ReportRow[];
  meta: ReportHeaderMeta;
  onChangeMeta: (next: ReportHeaderMeta) => void;
  showInteractiveControls: boolean;
  onTriggerPrint: () => void;
  language?: Language;
}

export const PrintPreviewSheet: React.FC<PrintPreviewSheetProps> = ({
  rows,
  meta,
  onChangeMeta,
  showInteractiveControls,
  onTriggerPrint,
  language = "th",
}) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const t = translations[language];

  const totals = useMemo(() => {
    const sales = rows.reduce((sum, r) => sum + (Number(r.salesAmount) || 0), 0);
    const vat = rows.reduce((sum, r) => sum + (Number(r.vatAmount) || 0), 0);
    const preVat = sales - vat;
    const cancelledCount = rows.filter(r => {
      const c = (r.cancelled || "").trim().toLowerCase();
      return c === "ใช่" || c === "ยกเลิก" || c === "yes" || c === "cancelled" || c === "true" || c === "1";
    }).length;
    return { sales, vat, preVat, cancelledCount };
  }, [rows]);

  // วันที่พิมพ์เริ่มต้น " " หรือวันที่แก้ไขได้
  const defaultDate = language === "en" ? "November 3, 2026" : "3 พฤศจิกายน 2569";
  const displayPrintDate = meta.printDate && meta.printDate.trim() !== "" ? meta.printDate : defaultDate;

  const handleExecutePrint = async () => {
    setPrintStatus(language === "en" ? "Preparing document for printing..." : "กำลังเตรียมเอกสารสำหรับพิมพ์...");
    const res = await executePrintDocument(rows, meta, language);
    if (res.success) {
      setPrintStatus(language === "en" ? "Print command sent to printer window" : "ส่งคำสั่งไปยังหน้าต่างพิมพ์เรียบร้อยแล้ว");
    } else {
      setPrintStatus(t.noticePrintSaved);
    }
    setTimeout(() => setPrintStatus(null), 5000);
  };

  const handleDownloadPrintableHtml = () => {
    downloadPrintableReportFile(rows, meta, language);
    setPrintStatus(t.noticePrintSaved);
    setTimeout(() => setPrintStatus(null), 5000);
  };

  return (
    <div className={showInteractiveControls ? "space-y-5" : "block print-only"}>
      {/* Print Header Configuration Controls (Hidden on Paper Print) */}
      {showInteractiveControls && (
        <div className="no-print border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {t.printSettingsTitle}
                </h2>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {t.printA4PortraitBadge}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {t.printSettingsSubtitle} ({rows.length} {t.unitCase})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportToExcel(rows, meta)}
                className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                <span>{t.btnDownloadExcel}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrintableHtml}
                className="inline-flex items-center gap-1.5 border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0"
                title={t.btnDownloadPrintHtml}
              >
                <Download className="h-4 w-4 text-emerald-700" />
                <span>{t.btnDownloadPrintHtml}</span>
              </button>

              <button
                type="button"
                onClick={handleExecutePrint}
                className="inline-flex items-center gap-1.5 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0 shadow-sm"
              >
                <Printer className="h-4 w-4 text-emerald-400" />
                <span>{t.btnPrintSheet}</span>
              </button>
            </div>
          </div>

          {printStatus && (
            <div className="mb-4 flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>{printStatus}</span>
            </div>
          )}

          <div className="mb-3 rounded bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
            <span className="font-semibold shrink-0">💡 {t.printTipTitle}</span>
            <span>{t.printTipText}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {t.fieldCompany}
              </label>
              <input
                type="text"
                value={meta.companyName}
                onChange={(e) =>
                  onChangeMeta({ ...meta, companyName: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {t.fieldReportTitle}
              </label>
              <input
                type="text"
                value={meta.reportTitle}
                onChange={(e) =>
                  onChangeMeta({ ...meta, reportTitle: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {t.fieldPeriod}
              </label>
              <input
                type="text"
                value={meta.periodLabel}
                onChange={(e) =>
                  onChangeMeta({ ...meta, periodLabel: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            {/* วันที่พิมพ์:  ให้สามารถแก้ไขได้ */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <span>{t.fieldPrintDate}</span>
                <span className="text-[10px] text-emerald-600 font-normal">({language === "en" ? "Editable" : "แก้ไขได้"})</span>
              </label>
              <input
                type="text"
                value={meta.printDate !== undefined ? meta.printDate : defaultDate}
                onChange={(e) =>
                  onChangeMeta({ ...meta, printDate: e.target.value })
                }
                placeholder={defaultDate}
                className="w-full border border-emerald-400 bg-emerald-50/30 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
              />
            </div>

            {/* ช่องว่างเพิ่มเติมสำหรับใช้งานในอนาคต */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {t.fieldExtraNote}
              </label>
              <input
                type="text"
                value={meta.customHeaderBlank || ""}
                onChange={(e) =>
                  onChangeMeta({ ...meta, customHeaderBlank: e.target.value })
                }
                placeholder={language === "en" ? "(Optional blank field)" : "(เว้นว่างไว้สำหรับใช้งานในอนาคต)"}
                className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Printable A4 Portrait Accounting Report Sheet (หน้าตั้ง) */}
      <div className="print-sheet-container mx-auto max-w-[794px] border border-slate-300 bg-white p-7 text-slate-950 shadow-sm">
        {/* Document Header (สำนักงานใหญ่, เลขประจำตัวผู้เสียภาษีอากร, หน้ากระดาษ A4 หน้าตั้ง นำออกและเว้นว่างไว้สำหรับอนาคต) */}
        <div className="mb-4 flex items-start justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h1 className="text-base font-bold text-slate-950 sm:text-lg">
              {meta.reportTitle}
            </h1>
            {meta.companyName ? (
              <p className="mt-1 text-xs font-semibold text-slate-800 sm:text-sm">
                {meta.companyName}
              </p>
            ) : null}
            {/* ช่องว่างเว้นไว้สำหรับอนาคต */}
            <div className="mt-0.5 min-h-[14px] text-[11px] text-slate-500">
              {meta.customHeaderBlank || ""}
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-700">
            <p className="font-semibold text-slate-900">
              {t.printPeriodLabel} {meta.periodLabel}
            </p>
            <p className="mt-0.5">
              <span className="font-medium text-slate-900">{t.printDateLabel}</span>{" "}
              <span>{displayPrintDate}</span>
            </p>
          </div>
        </div>

        {/* 6-Column Printable Excel-Style Ledger Table (Fit for Portrait A4) */}
        <table className="w-full border-collapse border border-slate-900 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-950">
              <th className="w-8 border border-slate-900 px-1 py-1.5 text-center font-semibold">
                #
              </th>
              <th className="w-[105px] border border-slate-900 px-2 py-1.5 text-left font-semibold">
                {t.colOrder}
              </th>
              <th className="w-[125px] border border-slate-900 px-2 py-1.5 text-left font-semibold">
                {t.colAbbFv}
              </th>
              <th className="w-[85px] border border-slate-900 px-2 py-1.5 text-right font-semibold">
                {t.colSales}
              </th>
              <th className="w-[75px] border border-slate-900 px-2 py-1.5 text-right font-semibold">
                {t.colVat}
              </th>
              <th className="w-[90px] border border-slate-900 px-2 py-1.5 text-left font-semibold">
                {t.colChannel}
              </th>
              <th className="w-[95px] border border-slate-900 px-2 py-1.5 text-left font-semibold">
                {t.colPayment}
              </th>
              <th className="w-[75px] border border-slate-900 px-2 py-1.5 text-center font-semibold">
                {t.colCancelled}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="border border-slate-900 px-4 py-8 text-center text-slate-500"
                >
                  {t.noDataInReport}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="border border-slate-900 px-1 py-1 text-center font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 font-mono break-all">
                    {row.orderNumber}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 font-mono break-all">
                    {row.abbFvNumber}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 text-right font-mono tabular-nums font-medium">
                    {formatCurrency(row.salesAmount)}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 text-right font-mono tabular-nums">
                    {formatCurrency(row.vatAmount)}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 truncate max-w-[90px]" title={row.salesChannel}>
                    {row.salesChannel}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 truncate max-w-[95px]" title={row.paymentMethod}>
                    {row.paymentMethod}
                  </td>
                  <td className="border border-slate-900 px-2 py-1 text-center truncate max-w-[75px]" title={row.cancelled || "-"}>
                    {(() => {
                      const c = (row.cancelled || "").trim().toLowerCase();
                      if (c === "ใช่" || c === "yes" || c === "true" || c === "cancelled" || c === "1") {
                        return language === "en" ? "Yes" : "ใช่";
                      }
                      return row.cancelled || "-";
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

        {/* 4 Summary Metrics Cards */}
        <div className="mt-4 mb-6 grid grid-cols-4 divide-x divide-slate-300 border border-slate-900 bg-slate-50 text-left">
          {/* Card 1: Case (เคสทั้งหมด) */}
          <div className="p-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              {t.cardCaseTitle}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-lg font-extrabold text-slate-950">
                {rows.length}
              </span>
              <span className="text-xs font-semibold text-slate-700">{t.unitCase}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {t.cardCaseSub.replace("{count}", String(rows.length))}
            </p>
          </div>

          {/* Card 2: ลูกค้ายกเลิก (แทนที่ยอดขายที่ได้รับในเดือน) */}
          <div className="p-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              {language === "en" ? "Cancelled Orders" : "ลูกค้ายกเลิก"}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-lg font-extrabold text-red-600">
                {totals.cancelledCount}
              </span>
              <span className="text-xs font-semibold text-slate-700">{t.unitCase}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {language === "en" ? "Total cancelled orders" : "รายการที่ถูกยกเลิกในระบบ"}
            </p>
          </div>

          {/* Card 3: ยอดขายจริง (รวมภาษีมูลค่าเพิ่ม) */}
          <div className="p-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              {language === "en" ? "Net Sales (Including VAT)" : "ยอดขายจริง (รวมภาษีมูลค่าเพิ่ม)"}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-lg font-extrabold text-slate-950">
                {formatCurrency(totals.sales)}
              </span>
              <span className="text-xs font-semibold text-slate-700">{t.unitBaht}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-slate-600">
              {language === "en" ? "Including VAT 7%" : "รวมภาษีมูลค่าเพิ่มแล้ว"}
            </p>
          </div>

          {/* Card 4: VAT 7% */}
          <div className="p-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              VAT 7%
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-lg font-extrabold text-slate-950">
                {formatCurrency(totals.vat)}
              </span>
              <span className="text-xs font-semibold text-slate-700">{t.unitBaht}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-slate-600">
              {language === "en" ? "Total Output VAT" : "ภาษีมูลค่าเพิ่มรวม"}
            </p>
          </div>
        </div>

        {/* 3 Additional Blank Boxes for Handwritten Notes */}
        <div className="mb-6 grid grid-cols-3 divide-x divide-slate-300 border-x border-b border-slate-900 bg-slate-50 text-left">
          <div className="p-3.5">
            <span className="text-[11px] font-bold text-slate-700 block uppercase">
              case credit
            </span>
            <div className="mt-2 h-6 border-b border-dashed border-slate-400"></div>
            <p className="mt-1 text-[10px] text-slate-400 italic">
              {language === "en" ? " " : " "}
            </p>
          </div>
          <div className="p-3.5">
            <span className="text-[11px] font-bold text-slate-700 block uppercase">
              credit 30 วัน
            </span>
            <div className="mt-2 h-6 border-b border-dashed border-slate-400"></div>
            <p className="mt-1 text-[10px] text-slate-400 italic">
              {language === "en" ? " " : " "}
            </p>
          </div>
          <div className="p-3.5">
            <span className="text-[11px] font-bold text-slate-700 block uppercase">
              ยอดเงิน
            </span>
            <div className="mt-2 h-6 border-b border-dashed border-slate-400"></div>
            <p className="mt-1 text-[10px] text-slate-400 italic">
              {language === "en" ? " " : " "}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
