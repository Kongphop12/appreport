import React, { useRef, useState } from "react";
import { FileText, ShoppingCart, Trash2, CheckCircle2, Layers, Cpu, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { Language } from "../utils/translations";
import { formatCurrency } from "../utils/exporters";

interface BuyingFileItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  base64Data: string;
  previewUrl?: string;
  uploadedAt: string;
}

interface ProcessedBuyingRow {
  id: string;
  numberSeq: number;
  date: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  vatAmount: number;
}

interface BuyingHubProps {
  language: Language;
  onNotice: (msg: string) => void;
}

export const BuyingHub: React.FC<BuyingHubProps> = ({ language, onNotice }) => {
  const isEn = language === "en";
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [buyingFiles, setBuyingFiles] = useState<BuyingFileItem[]>([]);
  const [processedRows, setProcessedRows] = useState<ProcessedBuyingRow[]>([]);
  const [isProcessingDl, setIsProcessingDl] = useState(false);
  const [summaryNote, setSummaryNote] = useState<string | null>(null);

  const handleMultipleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        const base64Data = preview.split(",")[1] || "";
        const newItem: BuyingFileItem = {
          id: `buy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          base64Data,
          previewUrl: preview,
          uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        setBuyingFiles(prev => [newItem, ...prev]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
    onNotice(isEn ? `Successfully uploaded ${files.length} file(s)` : `อัปโหลดไฟล์สำเร็จ ${files.length} ไฟล์`);
  };

  const handleRemoveFile = (id: string) => {
    setBuyingFiles(prev => prev.filter(f => f.id !== id));
    onNotice(isEn ? "File removed" : "ลบไฟล์ออกจากรายการแล้ว");
  };

  const handleProcessDl = async () => {
    if (buyingFiles.length === 0) {
      onNotice(isEn ? "Please upload at least 1-2 files (PO & Invoice)" : "กรุณาอัปโหลดไฟล์อย่างน้อย 1-2 ไฟล์ (ไฟล์ที่ 1: ใบสั่งซื้อ/PO, ไฟล์ที่ 2: Invoice)");
      return;
    }

    setIsProcessingDl(true);
    setSummaryNote(null);

    try {
      const res = await fetch("/api/extract-buying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: buyingFiles.map(f => ({
            fileName: f.fileName,
            mimeType: f.fileType,
            data: f.base64Data,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to process buying files");
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const mapped: ProcessedBuyingRow[] = rawItems.map((item: any, i: number) => ({
        id: `buy-row-${Date.now()}-${i}`,
        numberSeq: i + 1,
        date: item.date || "-",
        customerId: item.customerId || "B0965-012",
        customerName: item.customerName || "-",
        totalAmount: Number(item.totalAmount) || 0,
        vatAmount: Number(item.vatAmount) || 0,
      }));

      setProcessedRows(mapped);
      if (data.summaryNote) {
        setSummaryNote(data.summaryNote);
      }
      onNotice(isEn ? "Deep Learning processed and merged files successfully!" : "โมเดล DL ประมวลผลและจับคู่ไฟล์จัดซื้อสำเร็จ!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotice(isEn ? `Error: ${msg}` : `เกิดข้อผิดพลาดในการประมวลผลด้วย DL: ${msg}`);
    } finally {
      setIsProcessingDl(false);
    }
  };

  const handleDownloadXlsx = () => {
    if (processedRows.length === 0) return;
    const dataToExport = processedRows.map(r => ({
      "ลำดับ": r.numberSeq,
      "วันที่": r.date,
      "รหัสลูกค้า": r.customerId,
      "ชื่อลูกค้า": r.customerName,
      "ยอดรวม": r.totalAmount,
      "Vat": r.vatAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buying Report");
    XLSX.writeFile(workbook, `Buying_Report_Processed_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onNotice(isEn ? "Downloaded processed buying report XLSX" : "ดาวน์โหลดไฟล์รายงาน (.xlsx) เรียบร้อยแล้ว");
  };

  const handlePrintReport = () => {
    window.print();
  };

  const totalCases = processedRows.length;
  const grandTotalAmount = processedRows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const grandTotalVat = processedRows.reduce((sum, r) => sum + (r.vatAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Hidden multiple file input */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,.pdf,.xlsx,.csv"
        className="hidden"
        onChange={handleMultipleFilesSelected}
      />

      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {isEn ? "Procurement Documents" : "เอกสารจัดซื้อ"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEn ? "Processing System" : "ระบบประมวลผล"}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Files Section */}
        {buyingFiles.length === 0 ? (
          <div 
            onClick={() => multiFileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-10 text-center space-y-3 cursor-pointer hover:bg-emerald-50/80 transition-colors"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isEn ? "Click here to upload File 1 (PO) and File 2 (Invoice)" : "คลิกที่นี่เพื่ออัปโหลดไฟล์ที่ 1 (ใบสั่งซื้อ/PO) และไฟล์ที่ 2 (Invoice) พร้อมกัน"}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isEn ? "Supports XLSX, CSV, PDF, Images" : "รองรับไฟล์ .xlsx, .csv, .pdf, .jpg, .png"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {isEn ? `Uploaded Documents (${buyingFiles.length})` : `เอกสารที่อัปโหลดทั้งหมด (${buyingFiles.length} ไฟล์)`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                >
                  + {isEn ? "Add more files" : "เพิ่มไฟล์"}
                </button>
                <button
                  type="button"
                  onClick={() => { setBuyingFiles([]); setProcessedRows([]); }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                >
                  {isEn ? "Clear All" : "ล้างไฟล์ทั้งหมด"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {buyingFiles.map((file, idx) => (
                <div key={file.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs relative group">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      ไฟล์ที่ {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="ลบไฟล์"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-emerald-700 shrink-0" />
                    <div className="truncate">
                      <p className="truncate font-mono text-xs font-bold text-slate-900" title={file.fileName}>{file.fileName}</p>
                      <p className="text-[11px] text-slate-500">{Math.round(file.fileSize / 1024)} KB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProcessDl}
                disabled={isProcessingDl || buyingFiles.length === 0}
                className="inline-flex items-center gap-2 bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isProcessingDl ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>โปรดรอสักครู่</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 text-emerald-200" />
                    <span>ประมวลผลเอกสารจัดซื้อ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processed Results Table */}
      {processedRows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-950">
                {isEn ? `Processed Buying Report (${processedRows.length} items)` : `ผลลัพธ์ไฟล์รายงานใหม่จากการประมวลผล DL (${processedRows.length} รายการ)`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadXlsx}
                className="inline-flex items-center gap-1.5 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>ดาวน์โหลดไฟล์รายงาน (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="no-print inline-flex items-center gap-1.5 bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
              >
                <span>🖨️ พิมพ์รายงาน</span>
              </button>
            </div>
          </div>

          {summaryNote && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-900 font-medium">
              💡 {summaryNote}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="p-3 text-center">ลำดับ</th>
                  <th className="p-3">วันที่</th>
                  <th className="p-3">รหัสลูกค้า</th>
                  <th className="p-3">ชื่อลูกค้า</th>
                  <th className="p-3 text-right">ยอดรวม</th>
                  <th className="p-3 text-right">Vat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {processedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">{row.numberSeq}</td>
                    <td className="p-3 font-mono">{row.date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{row.customerId}</td>
                    <td className="p-3 font-bold text-slate-900">{row.customerName}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(row.totalAmount)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(row.vatAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 1. Calculated Summary Cards (Below Table) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">Case (รวม case)</p>
                <h3 className="text-2xl font-extrabold text-emerald-800 mt-1">{totalCases} เคส</h3>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">ยอดรวม (รวม)</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(grandTotalAmount)} THB</h3>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Vat (รวม)</p>
                <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{formatCurrency(grandTotalVat)} THB</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
