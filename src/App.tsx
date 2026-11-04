import React, { useEffect, useMemo, useState } from "react";
import { Printer, CheckCircle2 } from "lucide-react";
import { deduplicateReportRows } from "./utils/spreadsheetParser";

import type {
  ActiveTab,
  ColumnKey,
  ReportHeaderMeta,
  ReportRow,
  SelectedCell,
  SourceImagesMeta,
  UploadedImage,
} from "./types";
import {
  fileToUploadedImage,
  INITIAL_REPORT_ROWS,
} from "./utils/sampleReceipts";
import { formatCurrency } from "./utils/exporters";
import { executePrintDocument } from "./utils/printHelper";
import { type Language, translations } from "./utils/translations";
import { DualUploadPanel } from "./components/DualUploadPanel";
import { SpreadsheetGrid } from "./components/SpreadsheetGrid";
import { PrintPreviewSheet } from "./components/PrintPreviewSheet";
import { ReceiptLightbox } from "./components/ReceiptLightbox";
import { StorageHub } from "./components/StorageHub";

const STORAGE_ROWS_KEY = "sheetscan_abbfv_rows_v7";
const STORAGE_META_KEY = "report_sale_order_meta_v4";
const STORAGE_LANG_KEY = "sheetscan_abbfv_lang_v1";

const getDefaultPrintDate = () => {
  try {
    return new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "3 พฤศจิกายน 2569";
  }
};

const DEFAULT_META: ReportHeaderMeta = {
  companyName: "",
  reportTitle: "Report sale order",
  periodLabel: "พฤศจิกายน 2569",
  printDate: getDefaultPrintDate(),
  preparedBy: "",
  checkedBy: "",
  customHeaderBlank: "",
};


export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("sheet");
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === "en" || saved === "th") return saved;
    } catch {
      // ignore
    }
    return "th";
  });

  const t = translations[language];

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  };

  const [rows, setRows] = useState<ReportRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROWS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    // เริ่มต้นว่างเปล่า ไม่โหลด 5 รายการตัวอย่างตามที่ผู้ใช้กำหนด
    return [];
  });

  const [meta, setMeta] = useState<ReportHeaderMeta>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_META_KEY);
      if (saved) {
        return { ...DEFAULT_META, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_META;
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedImage[]>([]);
  const image1 = uploadedFiles[0] || null;
  const image2 = uploadedFiles[1] || null;
  const setImage1 = (img: UploadedImage | null) => {
    setUploadedFiles((prev) => {
      if (!img) return prev.slice(1);
      if (prev.length === 0) return [img];
      return [img, ...prev.slice(1)];
    });
  };
  const setImage2 = (img: UploadedImage | null) => {
    setUploadedFiles((prev) => {
      if (!img) {
        if (prev.length <= 1) return prev;
        return [prev[0], ...prev.slice(2)];
      }
      if (prev.length === 0) return [img];
      if (prev.length === 1) return [prev[0], img];
      return [prev[0], img, ...prev.slice(2)];
    });
  };

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [autoVat7, setAutoVat7] = useState(true);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    title: string;
    images: SourceImagesMeta;
    row?: ReportRow | null;
  } | null>(null);

  // Persist rows without base64 blob bloat
  useEffect(() => {
    try {
      const compactRows = rows.map((r) => ({
        ...r,
        sourceImages: undefined,
      }));
      localStorage.setItem(STORAGE_ROWS_KEY, JSON.stringify(compactRows));
    } catch {
      // ignore quota errors
    }
  }, [rows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore quota errors
    }
  }, [meta]);

  // Support Ctrl+V / Cmd+V clipboard paste of images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const f = items[i].getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (imageFiles.length === 0) return;

      try {
        const newImages = await Promise.all(
          imageFiles.map(async (file, idx) => {
            const p = await fileToUploadedImage(file);
            return {
              ...p,
              id: `paste-${Date.now()}-${idx}`,
              fileSize: file.size,
            };
          })
        );
        setUploadedFiles((prev) => [...prev, ...newImages]);
        showNotice(
          language === "en"
            ? `Pasted ${newImages.length} image(s) from clipboard`
            : `วางรูปภาพจากคลิปบอร์ดแล้ว ${newImages.length} รูป`
        );
      } catch {
        // ignore paste failures
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [language]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        channelFilter !== "all" &&
        row.salesChannel.trim() !== channelFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        row.orderNumber.toLowerCase().includes(q) ||
        row.abbFvNumber.toLowerCase().includes(q) ||
        row.salesChannel.toLowerCase().includes(q) ||
        row.paymentMethod.toLowerCase().includes(q) ||
        String(row.salesAmount).includes(q) ||
        String(row.vatAmount).includes(q)
      );
    });
  }, [rows, searchQuery, channelFilter]);

  const summaryStats = useMemo(() => {
    const totalSales = filteredRows.reduce(
      (sum, r) => sum + (Number(r.salesAmount) || 0),
      0
    );
    const totalVat = filteredRows.reduce(
      (sum, r) => sum + (Number(r.vatAmount) || 0),
      0
    );
    return {
      count: filteredRows.length,
      totalSales,
      totalVat,
      netPreVat: totalSales - totalVat,
    };
  }, [filteredRows]);

  const handleExtractWithAi = async () => {
    // If spreadsheet file exists, directly import into table without contacting Gemini AI (avoids 503 errors)
    const sheetRows: ReportRow[] = deduplicateReportRows(
      uploadedFiles.flatMap((f) => f.parsedRows || [])
    );
    if (sheetRows.length > 0) {
      const fileNames = uploadedFiles
        .map((f) => f.fileName)
        .filter(Boolean)
        .join(", ");
      handleImportSpreadsheet(sheetRows, fileNames);
      return;
    }

    if (uploadedFiles.length === 0) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch("/api/extract-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploadedFiles.map((f) => ({
            mimeType: f.mimeType,
            data: f.base64Data,
            fileName: f.fileName,
          })),
          // Fallback legacy slots
          image1: uploadedFiles[0]
            ? {
                mimeType: uploadedFiles[0].mimeType,
                data: uploadedFiles[0].base64Data,
                fileName: uploadedFiles[0].fileName,
              }
            : null,
          image2: uploadedFiles[1]
            ? {
                mimeType: uploadedFiles[1].mimeType,
                data: uploadedFiles[1].base64Data,
                fileName: uploadedFiles[1].fileName,
              }
            : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload?.error || "ไม่สามารถประมวลผลรูปภาพด้วย AI ได้ในขณะนี้"
        );
      }

      // Payload contains items array or single object fallback
      const rawList: Array<{
        orderNumber?: string;
        abbFvNumber?: string;
        salesAmount?: number;
        vatAmount?: number;
        salesChannel?: string;
        paymentMethod?: string;
        cancelled?: string;
        aiNote?: string;
        sourceFileName?: string;
      }> = Array.isArray(payload.items) && payload.items.length > 0
        ? payload.items
        : [payload];

      const sourceMeta: SourceImagesMeta = {
        files: uploadedFiles.map((f) => ({
          fileName: f.fileName,
          previewUrl: f.previewUrl,
        })),
        image1Preview: uploadedFiles[0]?.previewUrl,
        image1Name: uploadedFiles[0]?.fileName,
        image2Preview: uploadedFiles[1]?.previewUrl,
        image2Name: uploadedFiles[1]?.fileName,
      };

      const mappedRows: ReportRow[] = rawList.map((item, idx) => ({
        id: `row-${Date.now()}-${idx}`,
        orderNumber: item.orderNumber || "-",
        abbFvNumber: item.abbFvNumber || "-",
        salesAmount: Number(item.salesAmount) || 0,
        vatAmount: Number(item.vatAmount) || 0,
        salesChannel: item.salesChannel || "Online Store",
        paymentMethod: item.paymentMethod || "-",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        aiNote: item.aiNote || `สกัดจากเอกสาร`,
        sourceImages: sourceMeta,
      }));

      const finalNewRows = deduplicateReportRows(mappedRows);
      const duplicatesSkipped = rawList.length - finalNewRows.length;

      if (finalNewRows.length === 0) {
        showNotice(
          language === "en"
            ? `Duplicate records detected: All ${rawList.length} items already exist in table with matching sales/invoice — displayed once to prevent duplicates.`
            : `โมเดลตรวจสอบพบข้อมูลซ้ำ: รายการทั้งหมด ${rawList.length} รายการ มียอดขายหรือใบเสร็จตรงกับในตารางแล้ว — นำมาแสดงแค่อันเดียวเพื่อกันซ้ำกัน`
        );
        setActiveTab("sheet");
        return;
      }

      setRows((prev) => deduplicateReportRows([...prev, ...finalNewRows]));
      setChannelFilter("all");
      setSearchQuery("");
      const firstAddedId = finalNewRows[0].id;
      setHighlightedRowId(firstAddedId);
      setSelectedCell({ rowId: firstAddedId, colKey: "orderNumber" });
      setActiveTab("sheet");

      if (duplicatesSkipped > 0) {
        showNotice(
          language === "en"
            ? `AI successfully added ${finalNewRows.length} record(s) from ${uploadedFiles.length} file(s) (${duplicatesSkipped} duplicate(s) filtered)`
            : `AI ตรวจจับและเพิ่มข้อมูลสำเร็จ ${finalNewRows.length} รายการ จาก ${uploadedFiles.length} ไฟล์ (คัดกรองรายการซ้ำซ้อน ${duplicatesSkipped} รายการออกแล้ว)`
        );
      } else {
        showNotice(
          language === "en"
            ? `AI successfully extracted ${finalNewRows.length} record(s) from ${uploadedFiles.length} file(s)`
            : `AI ตรวจจับและสกัดข้อมูลสำเร็จ ${finalNewRows.length} รายการ จาก ${uploadedFiles.length} ไฟล์ เข้าสู่ตารางเรียบร้อย`
        );
      }

      setTimeout(() => {
        setHighlightedRowId((curr) => (curr === firstAddedId ? null : curr));
      }, 4500);
    } catch (err: unknown) {
      setExtractError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ AI"
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportSpreadsheet = (
    newRows: ReportRow[],
    fileName: string,
    replace = true
  ) => {
    if (replace) {
      setRows(newRows);
      showNotice(
        `โหลดเฉพาะข้อมูลจากไฟล์ "${fileName}" เรียบร้อยแล้ว (${newRows.length} รายการ — ไม่รวมข้อมูลอื่น)`
      );
    } else {
      setRows((prev) => [...prev, ...newRows]);
      showNotice(
        `เพิ่มข้อมูลจากไฟล์ "${fileName}" ต่อท้ายตารางแล้ว (${newRows.length} รายการ)`
      );
    }
    setActiveTab("sheet");
  };

  const handleClearAllRows = () => {
    setRows([]);
    setSelectedCell(null);
    showNotice("ล้างข้อมูลในตารางทั้งหมดแล้ว พร้อมสำหรับนำเข้าเฉพาะไฟล์ของคุณ");
  };

  const handleUpdateCell = (
    rowId: string,
    colKey: ColumnKey,
    rawValue: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (colKey === "salesAmount") {
          const parsedSales =
            rawValue === "" ? 0 : Math.round(Number(rawValue) * 100) / 100;
          const safeSales = Number.isFinite(parsedSales) ? parsedSales : 0;
          const computedVat = autoVat7
            ? Math.round(((safeSales * 7) / 107) * 100) / 100
            : row.vatAmount;
          return {
            ...row,
            salesAmount: safeSales,
            vatAmount: computedVat,
          };
        }

        if (colKey === "vatAmount") {
          const parsedVat =
            rawValue === "" ? 0 : Math.round(Number(rawValue) * 100) / 100;
          return {
            ...row,
            vatAmount: Number.isFinite(parsedVat) ? parsedVat : 0,
          };
        }

        return {
          ...row,
          [colKey]: rawValue,
        };
      })
    );
  };

  const handleAddEmptyRow = () => {
    const nextIdx = rows.length + 1;
    const newId = `row-${Date.now()}`;
    const newRow: ReportRow = {
      id: newId,
      orderNumber: `#${String(nextIdx).padStart(4, "0")}`,
      abbFvNumber: `ABB-202611-${String(nextIdx).padStart(4, "0")}`,
      salesAmount: 0,
      vatAmount: 0,
      salesChannel: "Online Store",
      paymentMethod: "-",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    setRows((prev) => [...prev, newRow]);
    setSelectedCell({ rowId: newId, colKey: "orderNumber" });
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    if (selectedCell?.rowId === rowId) {
      setSelectedCell(null);
    }
  };

  const handleResetSampleData = () => {
    setRows([]);
    setSearchQuery("");
    setChannelFilter("all");
    setSelectedCell(null);
    showNotice("ล้างข้อมูลในตารางทั้งหมดแล้ว");
  };

  const handleTriggerPrint = async () => {
    setActiveTab("print");
    showNotice(t.noticePreparingPrint);
    const res = await executePrintDocument(filteredRows, meta, language);
    if (!res.success) {
      showNotice(t.noticePrintSaved);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Zone 1 Brand — Zone 2 Nav Links — Zone 3 Primary Action */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white px-6 py-3.5">
        <a
          href="#sheet"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("sheet");
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          {t.appName}
        </a>

        <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("sheet")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "sheet"
                ? "border-b-2 border-emerald-700 font-semibold text-slate-950"
                : "hover:text-slate-900"
            }`}
          >
            {t.tabSheet}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "storage"
                ? "border-b-2 border-emerald-700 font-semibold text-slate-950"
                : "hover:text-slate-900"
            }`}
          >
            {t.tabStorage}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("print")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "print"
                ? "border-b-2 border-emerald-700 font-semibold text-slate-950"
                : "hover:text-slate-900"
            }`}
          >
            {t.tabPrint}
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher Toggle (ไทย | EN) */}
          <div className="flex items-center rounded border border-slate-300 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleToggleLanguage("th")}
              className={`rounded px-2.5 py-1 transition-colors ${
                language === "th"
                  ? "bg-white text-slate-950 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="เปลี่ยนเป็นภาษาไทย"
            >
              ไทย
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage("en")}
              className={`rounded px-2.5 py-1 transition-colors ${
                language === "en"
                  ? "bg-white text-slate-950 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={handleTriggerPrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t.printReportBtn}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
        {/* Clean Summary Header Strip */}
        <div className="no-print mb-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              {meta.reportTitle}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {meta.companyName ? (
                <>
                  <span>{meta.companyName}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>
                {language === "en" ? "Period" : "งวด"} {meta.periodLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.quickPasteTip}</span>
            </div>
          </div>

        </div>

        {/* Status Toast Notice */}
        {statusNotice && (
          <div className="no-print mb-4 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Tab 1: Combined Excel Sheet */}
        {activeTab === "sheet" && (
          <div className="space-y-4">
            <DualUploadPanel
              files={uploadedFiles}
              onChangeFiles={setUploadedFiles}
              image1={image1}
              image2={image2}
              onChangeImage1={setImage1}
              onChangeImage2={setImage2}
              onExtractWithAi={handleExtractWithAi}
              onImportSpreadsheet={handleImportSpreadsheet}
              isExtracting={isExtracting}
              errorMessage={extractError}
              onClearError={() => setExtractError(null)}
              collapsible={true}
              language={language}
              showButtons={false}
              onPreviewPair={() =>
                setLightboxState({
                  title:
                    language === "en"
                      ? "Attached Files AI Inspection"
                      : "เอกสารที่แนบเตรียมประมวลผลด้วยโมเดล AI",
                  images: {
                    files: uploadedFiles.map((f) => ({
                      fileName: f.fileName,
                      previewUrl: f.previewUrl,
                    })),
                    image1Preview: image1?.previewUrl,
                    image1Name: image1?.fileName,
                    image2Preview: image2?.previewUrl,
                    image2Name: image2?.fileName,
                  },
                })
              }
              onPreviewFile={(file) =>
                setLightboxState({
                  title: file.fileName,
                  images: {
                    files: [
                      {
                        fileName: file.fileName,
                        previewUrl: file.previewUrl,
                      },
                    ],
                    image1Preview: file.previewUrl,
                    image1Name: file.fileName,
                  },
                })
              }
            />

            <SpreadsheetGrid
              rows={rows}
              filteredRows={filteredRows}
              meta={meta}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              channelFilter={channelFilter}
              onChannelFilterChange={setChannelFilter}
              autoVat7={autoVat7}
              onToggleAutoVat7={() => setAutoVat7((v) => !v)}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
              onUpdateCell={handleUpdateCell}
              onAddEmptyRow={handleAddEmptyRow}
              onImportSpreadsheet={handleImportSpreadsheet}
              onClearAllRows={handleClearAllRows}
              onDeleteRow={handleDeleteRow}
              onResetSampleData={handleResetSampleData}
              onInspectRowImages={(row) => {
                if (!row.sourceImages) return;
                setLightboxState({
                  title: `${language === "en" ? "Attached Documents for Order:" : "เอกสารแนบของ Order:"} ${row.orderNumber}`,
                  images: row.sourceImages,
                  row,
                });
              }}
              onTriggerPrint={handleTriggerPrint}
              isExtracting={isExtracting}
              highlightedRowId={highlightedRowId}
              language={language}
            />
          </div>
        )}

        {/* Tab: Storage / เก็บข้อมูล */}
        {activeTab === "storage" && (
          <StorageHub language={language} onNotice={showNotice} />
        )}

        {/* Tab 3: Print Preview Sheet */}
        {activeTab === "print" && (
          <PrintPreviewSheet
            rows={filteredRows}
            meta={meta}
            onChangeMeta={setMeta}
            showInteractiveControls={true}
            onTriggerPrint={handleTriggerPrint}
            language={language}
          />
        )}

      </main>

      {/* Lightbox Modal for Inspecting Source Receipts */}
      {lightboxState && (
        <ReceiptLightbox
          title={lightboxState.title}
          images={lightboxState.images}
          row={lightboxState.row}
          language={language}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}

export default App;
