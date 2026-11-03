import React, { useRef, useState } from "react";
import {
  Upload,
  FileImage,
  FileSpreadsheet,
  X,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle,
  Plus,
  Files,
  FileCheck,
} from "lucide-react";
import type { ReportRow, UploadedImage } from "../types";
import { fileToUploadedImage } from "../utils/sampleReceipts";
import {
  isSpreadsheetFile,
  processSpreadsheetFile,
} from "../utils/spreadsheetParser";
import { type Language, translations } from "../utils/translations";

interface DualUploadPanelProps {
  files?: UploadedImage[];
  onChangeFiles?: (files: UploadedImage[]) => void;
  // Backward compatibility props
  image1?: UploadedImage | null;
  image2?: UploadedImage | null;
  onChangeImage1?: (img: UploadedImage | null) => void;
  onChangeImage2?: (img: UploadedImage | null) => void;

  onExtractWithAi: () => Promise<void>;
  onImportSpreadsheet?: (rows: ReportRow[], fileName: string) => void;
  isExtracting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  collapsible?: boolean;
  onPreviewPair?: () => void;
  onPreviewFile?: (file: UploadedImage) => void;
  language?: Language;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSpreadsheetFileName(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv");
}

export const DualUploadPanel: React.FC<DualUploadPanelProps> = ({
  files: propFiles,
  onChangeFiles,
  image1,
  image2,
  onChangeImage1,
  onChangeImage2,
  onExtractWithAi,
  onImportSpreadsheet,
  isExtracting,
  errorMessage,
  onClearError,
  collapsible = true,
  onPreviewPair,
  onPreviewFile,
  language = "th",
}) => {
  const t = translations[language];
  const isEn = language === "en";
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive active files list from propFiles or legacy image1/image2
  const activeFiles: UploadedImage[] =
    propFiles !== undefined
      ? propFiles
      : ([image1, image2].filter(Boolean) as UploadedImage[]);

  const updateFiles = (nextFiles: UploadedImage[]) => {
    if (onChangeFiles) {
      onChangeFiles(nextFiles);
    }
    // Also notify legacy handlers
    if (onChangeImage1) {
      onChangeImage1(nextFiles[0] || null);
    }
    if (onChangeImage2) {
      onChangeImage2(nextFiles[1] || null);
    }
  };

  const handleProcessIncomingFiles = async (
    fileList: FileList | File[] | null | undefined,
    appendMode = true
  ) => {
    if (!fileList || fileList.length === 0) return;
    setLocalError(null);
    onClearError();

    const incoming = Array.from(fileList);
    const newProcessed: UploadedImage[] = [];

    for (const file of incoming) {
      try {
        if (isSpreadsheetFile(file)) {
          const { rows, image } = await processSpreadsheetFile(file);
          const sheetImage: UploadedImage = {
            ...image,
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            fileSize: file.size,
            parsedRows: rows,
          };
          newProcessed.push(sheetImage);
          if (onImportSpreadsheet && rows.length > 0) {
            onImportSpreadsheet(rows, file.name);
          }
        } else if (file.type.startsWith("image/")) {
          const processed = await fileToUploadedImage(file);
          newProcessed.push({
            ...processed,
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            fileSize: file.size,
          });
        }
      } catch (err: unknown) {
        setLocalError(
          err instanceof Error
            ? err.message
            : isEn
            ? "Supported file types: PNG, JPG, WEBP, XLSX, CSV"
            : "รองรับไฟล์รูปภาพ (PNG, JPG, WEBP) หรือไฟล์ตาราง (XLSX, CSV) เท่านั้น"
        );
      }
    }

    if (newProcessed.length > 0) {
      const nextList = appendMode ? [...activeFiles, ...newProcessed] : newProcessed;
      updateFiles(nextList);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await handleProcessIncomingFiles(e.dataTransfer.files, true);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const nextList = activeFiles.filter((_, idx) => idx !== indexToRemove);
    updateFiles(nextList);
  };

  const handleClearAll = () => {
    updateFiles([]);
    setLocalError(null);
    onClearError();
  };

  const activeError = localError || errorMessage;
  const hasFiles = activeFiles.length > 0;
  const hasSpreadsheet = activeFiles.some((f) =>
    isSpreadsheetFileName(f.fileName) || (f.parsedRows && f.parsedRows.length > 0)
  );

  return (
    <section className="no-print border border-slate-200 bg-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Files className="h-4 w-4 text-emerald-700" />
             <span>{isEn ? "File Upload" : "อัปโหลดไฟล์"}</span>
          </div>

          {hasFiles && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              <FileCheck className="h-3 w-3" />
              <span>
                {isEn
                  ? `${activeFiles.length} file${activeFiles.length > 1 ? "s" : ""} ready for AI`
                  : `เลือกแล้ว ${activeFiles.length} ไฟล์ (พร้อมให้โมเดลตรวจจับ)`}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              {isCollapsed ? (
                <>
                  <span>{t.expand}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>{t.collapse}</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Upload Body */}
      {!isCollapsed && (
        <div className="p-5">
          {activeError && (
            <div className="mb-4 flex items-start justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{activeError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onClearError();
                }}
                className="text-red-600 hover:text-red-900 shrink-0"
                aria-label={isEn ? "Close error notice" : "ปิดข้อความแจ้งเตือน"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Hidden Multiple File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleProcessIncomingFiles(e.target.files, true);
              e.target.value = "";
            }}
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? "border-emerald-600 bg-emerald-50/50"
                : "border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 text-slate-700">
              <Upload className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {isEn
                ? "Click to choose files or drag & drop here (Select >1 file simultaneously)"
                : "คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่ (เลือกได้มากกว่า 1 ไฟล์พร้อมกัน)"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isEn
                ? "Supports arbitrary multiple files: Payment slips, order photos, tax invoices/receipts, or spreadsheets (XLSX, CSV). The AI model detects & extracts all."
                : "รองรับการใส่ไฟล์มากกว่า 1 ไฟล์: สลิปโอนเงิน, ใบสั่งซื้อ, ใบเสร็จ/ใบกำกับภาษี ABB-FV หรือไฟล์ตาราง XLSX/CSV โมเดล AI จะคิดวิเคราะห์และตรวจจับร่วมกัน"}
            </p>
          </div>

          {/* Attached Files List */}
          {hasFiles && (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span>
                    {isEn
                      ? `Attached Files (${activeFiles.length} files)`
                      : `เอกสารที่แนบ (${activeFiles.length} ไฟล์)`}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-normal text-slate-500">
                    {isEn
                      ? "AI will inspect all files and precision-deduplicate records"
                      : "โมเดลจะตรวจจับและคัดกรองข้อมูลซ้ำซ้อนอย่างแม่นยำ"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{isEn ? "+ Add More Files" : "+ เพิ่มไฟล์อีก"}</span>
                  </button>

                  {onPreviewPair && activeFiles.length >= 2 && (
                    <button
                      type="button"
                      onClick={onPreviewPair}
                      className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isEn ? "View All Files" : "ดูเอกสารทั้งหมด"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>{isEn ? "Clear All" : "ล้างไฟล์ทั้งหมด"}</span>
                  </button>
                </div>
              </div>

              {/* Grid of File Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {activeFiles.map((file, idx) => {
                  const isSheet =
                    isSpreadsheetFileName(file.fileName) ||
                    (file.parsedRows && file.parsedRows.length > 0);

                  return (
                    <div
                      key={file.id || `file-${idx}`}
                      className="group relative flex items-center gap-3 border border-slate-200 bg-white p-2.5 transition-shadow hover:shadow-xs hover:border-slate-300"
                    >
                      {/* Thumbnail or Sheet Icon */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50">
                        {isSheet ? (
                          <FileSpreadsheet className="h-7 w-7 text-emerald-700" />
                        ) : file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt={file.fileName}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileImage className="h-6 w-6 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                            #{idx + 1}
                          </span>
                          {isSheet ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              XLSX / CSV
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                              {isEn ? "Image" : "รูปภาพ"}
                            </span>
                          )}
                        </div>

                        <p
                          className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-900"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          {file.fileSize && <span>{formatFileSize(file.fileSize)}</span>}
                          {onPreviewFile && !isSheet && (
                            <button
                              type="button"
                              onClick={() => onPreviewFile(file)}
                              className="text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                            >
                              <Eye className="h-3 w-3" />
                              <span>{isEn ? "View" : "ดูรูป"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={isExtracting}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title={isEn ? "Remove this file" : "ลบไฟล์นี้"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                {isEn ? "AI File Detection:" : "ระบบ AI ตรวจจับของไฟล์"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasSpreadsheet && onImportSpreadsheet && (
                <button
                  type="button"
                  onClick={() => {
                    const sheetRows: ReportRow[] = activeFiles.flatMap(
                      (f) => f.parsedRows || []
                    );
                    const names = activeFiles
                      .map((f) => f.fileName)
                      .filter(Boolean)
                      .join(", ");
                    if (sheetRows.length > 0) {
                      onImportSpreadsheet(sheetRows, names);
                    }
                  }}
                  disabled={isExtracting}
                  className="inline-flex items-center gap-1.5 border border-emerald-600 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                  <span>
                    {isEn ? "Direct Import XLSX / CSV to Table" : "นำเข้าข้อมูล XLSX / CSV ลงตาราง"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onExtractWithAi}
                disabled={!hasFiles || isExtracting}
                className="inline-flex items-center gap-2 bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shadow-xs"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {isEn
                        ? "AI is inspecting all files..."
                        : "โมเดล AI กำลังคิดและตรวจจับข้อมูล..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {isEn ? "Process" : "ประมวลผล"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
