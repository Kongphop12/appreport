import React, { useRef, useState } from "react";
import { Upload, Camera, FileText, Database, CheckCircle2, Trash2, Eye, Loader2, Sparkles, FolderArchive } from "lucide-react";
import type { Language } from "../utils/translations";
import { formatCurrency } from "../utils/exporters";

export interface StoredDocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  previewUrl?: string;
  extractedData: {
    orderNumber: string;
    abbFvNumber: string;
    salesAmount: number;
    vatAmount: number;
    salesChannel: string;
    paymentMethod: string;
  };
  savedAt: string;
  dbStatus: "saved" | "syncing";
}

interface StorageHubProps {
  language: Language;
  onNotice: (msg: string) => void;
  onAddToReportTable?: (doc: StoredDocumentRecord) => void;
}

const STORAGE_DB_KEY = "sheetscan_db_archive_v1";

export const StorageHub: React.FC<StorageHubProps> = ({ language, onNotice }) => {
  const isEn = language === "en";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [storedRecords, setStoredRecords] = useState<StoredDocumentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: "db-doc-001",
        fileName: "slip_transfer_kbank_1502.jpg",
        fileType: "image/jpeg",
        fileSize: 245000,
        previewUrl: "",
        extractedData: {
          orderNumber: "#1001",
          abbFvNumber: "ABB-202611-0001",
          salesAmount: 1500.0,
          vatAmount: 98.13,
          salesChannel: "Online Store",
          paymentMethod: "KBANK Transfer",
        },
        savedAt: "2026-11-03 14:20",
        dbStatus: "saved",
      },
      {
        id: "db-doc-002",
        fileName: "tax_invoice_abb_fv_562.pdf",
        fileType: "application/pdf",
        fileSize: 480000,
        previewUrl: "",
        extractedData: {
          orderNumber: "#1002",
          abbFvNumber: "ABB-202611-0002",
          salesAmount: 562502.0,
          vatAmount: 36799.21,
          salesChannel: "Draft Orders",
          paymentMethod: "PromptPay",
        },
        savedAt: "2026-11-03 15:10",
        dbStatus: "saved",
      },
    ];
  });

  const [currentFile, setCurrentFile] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
    previewUrl?: string;
  } | null>(null);

  const [extractedPreview, setExtractedPreview] = useState<{
    orderNumber: string;
    abbFvNumber: string;
    salesAmount: number;
    vatAmount: number;
    salesChannel: string;
    paymentMethod: string;
  } | null>(null);

  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const preview = event.target?.result as string;
      setCurrentFile({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        previewUrl: preview,
      });

      // Simulate ML / AI extraction
      setIsProcessingAi(true);
      setTimeout(() => {
        setExtractedPreview({
          orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
          abbFvNumber: `ABB-202611-${Math.floor(100 + Math.random() * 900)}`,
          salesAmount: Math.floor(1000 + Math.random() * 50000) / 100,
          vatAmount: Math.floor(70 + Math.random() * 3500) / 100,
          salesChannel: Math.random() > 0.5 ? "Online Store" : "Draft Orders",
          paymentMethod: Math.random() > 0.5 ? "QR PromptPay" : "Bank Transfer",
        });
        setIsProcessingAi(false);
        onNotice(isEn ? "AI successfully extracted document data!" : "AI ตรวจจับและสกัดข้อมูลจากเอกสารสำเร็จ!");
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToDatabase = () => {
    if (!currentFile || !extractedPreview) return;
    setIsSavingDb(true);

    setTimeout(() => {
      const newRecord: StoredDocumentRecord = {
        id: `db-doc-${Date.now()}`,
        fileName: currentFile.fileName,
        fileType: currentFile.fileType,
        fileSize: currentFile.fileSize,
        previewUrl: currentFile.previewUrl,
        extractedData: extractedPreview,
        savedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        dbStatus: "saved",
      };

      const updated = [newRecord, ...storedRecords];
      setStoredRecords(updated);
      try {
        localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }

      setIsSavingDb(false);
      setCurrentFile(null);
      setExtractedPreview(null);
      onNotice(isEn ? "Document successfully saved to Database!" : "บันทึกข้อมูลและไฟล์เอกสารเข้าสู่ระบบฐานข้อมูล (DB) สำเร็จเรียบร้อยแล้ว!");
    }, 1000);
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm(isEn ? "Delete this record from DB archive?" : "คุณต้องการลบข้อมูลเอกสารนี้ออกจากฐานข้อมูลใช่หรือไม่?")) {
      return;
    }
    const updated = storedRecords.filter((r) => r.id !== id);
    setStoredRecords(updated);
    try {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    onNotice(isEn ? "Record deleted from database" : "ลบข้อมูลออกจากฐานข้อมูลเรียบร้อยแล้ว");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.xlsx,.csv"
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {isEn ? "Data Storage & Database Hub (DB Ingestion)" : "เมนูเก็บข้อมูลและจัดเก็บลงฐานข้อมูล (Database Storage Hub)"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEn
                  ? "Ingest source documents (Photos, Slips, PDF Invoices) processed via ML Model and persist directly into DB storage."
                  : "โครงสร้างจัดเก็บเอกสารต้นฉบับ (รูปถ่ายสลิป ใบเสร็จ PDF) ผ่านระบบสกัดข้อมูลด้วย AI / ML Model และบันทึกจัดเก็บลงฐานข้อมูล (DB) แยกส่วนจากตารางรายงาน"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>{isEn ? "Upload Document" : "อัพโหลดไฟล์เอกสาร"}</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>{isEn ? "Camera Scan" : "ถ่ายรูปสแกน"}</span>
            </button>
          </div>
        </div>

        {/* Current Ingestion & Extraction Staging Area */}
        {currentFile && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
                <Sparkles className="h-3.5 w-3.5" />
                {isEn ? "Staging Document for DB Storage" : "ข้อมูลเอกสารรอนำส่งเข้าฐานข้อมูล"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentFile(null);
                  setExtractedPreview(null);
                }}
                className="text-xs text-slate-500 hover:text-red-700 font-medium"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* File Preview Card */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-slate-50">
                  {currentFile.previewUrl && currentFile.fileType.startsWith("image/") ? (
                    <img src={currentFile.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-7 w-7 text-emerald-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-bold text-slate-900">{currentFile.fileName}</p>
                  <p className="text-[11px] text-slate-500">{Math.round((currentFile.fileSize || 0) / 1024)} KB</p>
                </div>
              </div>

              {/* Extracted Fields Preview */}
              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {isEn ? "AI Extracted Fields for DB" : "ข้อมูลที่ AI สกัดเพื่อบันทึกลง DB"}
                </h4>

                {isProcessingAi ? (
                  <div className="flex items-center gap-3 py-4 text-xs font-medium text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                    <span>{isEn ? "AI / ML Model is analyzing document..." : "โมเดล AI / ML กำลังสกัดข้อมูลจากภาพถ่าย..."}</span>
                  </div>
                ) : extractedPreview ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Order No:</span>
                      <p className="font-bold text-slate-900">{extractedPreview.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Receipt/Invoice:</span>
                      <p className="font-bold text-slate-900">{extractedPreview.abbFvNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sales Amount:</span>
                      <p className="font-bold text-emerald-700">{formatCurrency(extractedPreview.salesAmount)} THB</p>
                    </div>
                    <div>
                      <span className="text-slate-500">VAT 7%:</span>
                      <p className="font-bold text-slate-900">{formatCurrency(extractedPreview.vatAmount)} THB</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sales Channel:</span>
                      <p className="font-bold text-slate-900">{extractedPreview.salesChannel}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment:</span>
                      <p className="font-bold text-slate-900">{extractedPreview.paymentMethod}</p>
                    </div>
                  </div>
                ) : null}

                {extractedPreview && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isSavingDb}
                      onClick={handleSaveToDatabase}
                      className="inline-flex items-center gap-2 bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                    >
                      {isSavingDb ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{isEn ? "Saving to DB..." : "กำลังบันทึกเข้าสู่ DB..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                          <span>{isEn ? "Save Record & File to Database" : "บันทึกข้อมูลเข้าสู่ฐานข้อมูล (Save to DB)"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Archives & Records List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="h-5 w-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-950">
              {isEn ? `Database Archive Records (${storedRecords.length})` : `ประวัติเอกสารที่จัดเก็บในฐานข้อมูล (${storedRecords.length} รายการ)`}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isEn ? "Persistent DB Storage Collection" : "ตารางจัดเก็บข้อมูลถาวรในระบบ DB"}
          </span>
        </div>

        {storedRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {isEn ? "No records stored in database yet." : "ยังไม่มีประวัติเอกสารจัดเก็บในฐานข้อมูล"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">{isEn ? "File Name" : "ชื่อไฟล์เอกสาร"}</th>
                  <th className="p-3">Order No.</th>
                  <th className="p-3">Receipt/Invoice</th>
                  <th className="p-3 text-right">{isEn ? "Sales Amount" : "ยอดขาย"}</th>
                  <th className="p-3">{isEn ? "Channel" : "ช่องทาง"}</th>
                  <th className="p-3">{isEn ? "Saved At" : "เวลาจัดเก็บ DB"}</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">{isEn ? "Action" : "จัดการ"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {storedRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{rec.fileName}</td>
                    <td className="p-3">{rec.extractedData.orderNumber}</td>
                    <td className="p-3 font-mono text-emerald-800">{rec.extractedData.abbFvNumber}</td>
                    <td className="p-3 text-right font-bold text-slate-950">{formatCurrency(rec.extractedData.salesAmount)}</td>
                    <td className="p-3">{rec.extractedData.salesChannel}</td>
                    <td className="p-3 text-slate-500">{rec.savedAt}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Saved in DB
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title={isEn ? "Delete from DB" : "ลบออกจากฐานข้อมูล"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
