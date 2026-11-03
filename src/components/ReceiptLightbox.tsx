import React from "react";
import { X, FileImage } from "lucide-react";
import type { ReportRow, SourceImagesMeta } from "../types";
import { formatCurrency } from "../utils/exporters";

interface ReceiptLightboxProps {
  title: string;
  images: SourceImagesMeta;
  row?: ReportRow | null;
  language?: "th" | "en";
  onClose: () => void;
}

export const ReceiptLightbox: React.FC<ReceiptLightboxProps> = ({
  title,
  images,
  row,
  language = "th",
  onClose,
}) => {
  const isEn = language === "en";
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col border border-slate-300 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileImage className="h-4 w-4 text-slate-600" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900"
            aria-label={isEn ? "Close window" : "ปิดหน้าต่าง"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {images.files && images.files.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-5 ${
                images.files.length === 1
                  ? "max-w-2xl mx-auto"
                  : images.files.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {images.files.map((file, idx) => (
                <div
                  key={`lightbox-file-${idx}`}
                  className="flex flex-col border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {isEn ? `File ${idx + 1}` : `เอกสารที่ ${idx + 1}`}
                    </span>
                    <span className="max-w-[180px] truncate font-mono text-[11px]">
                      {file.fileName || "-"}
                    </span>
                  </div>
                  {file.previewUrl ? (
                    <div className="flex h-64 items-center justify-center overflow-auto bg-white p-2 border border-slate-200">
                      <img
                        src={file.previewUrl}
                        alt={file.fileName || `file-${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-white text-xs text-slate-400">
                      {isEn ? "No preview available" : "ไม่มีภาพตัวอย่าง"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {isEn ? "File 1: Order Slip / Payment" : "เอกสารที่ 1: ใบออเดอร์ / สลิปรับเงิน"}
                  </span>
                  <span className="truncate font-mono">
                    {images.image1Name || "-"}
                  </span>
                </div>
                {images.image1Preview ? (
                  <div className="flex flex-1 items-center justify-center overflow-auto bg-white p-2">
                    <img
                      src={images.image1Preview}
                      alt={images.image1Name || (isEn ? "File 1" : "เอกสารที่ 1")}
                      referrerPolicy="no-referrer"
                      className="max-h-[52vh] w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-white text-xs text-slate-400">
                    {isEn ? "File 1 not attached" : "ไม่ได้แนบเอกสารที่ 1"}
                  </div>
                )}
              </div>

              <div className="flex flex-col border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {isEn ? "File 2: Receipt / Invoice (ABB/FV)" : "เอกสารที่ 2: ใบเสร็จ/ใบแจ้งหนี้ (ABB / FV)"}
                  </span>
                  <span className="truncate font-mono">
                    {images.image2Name || "-"}
                  </span>
                </div>
                {images.image2Preview ? (
                  <div className="flex flex-1 items-center justify-center overflow-auto bg-white p-2">
                    <img
                      src={images.image2Preview}
                      alt={images.image2Name || (isEn ? "File 2" : "เอกสารที่ 2")}
                      referrerPolicy="no-referrer"
                      className="max-h-[52vh] w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-white text-xs text-slate-400">
                    {isEn ? "File 2 not attached" : "ไม่ได้แนบเอกสารที่ 2"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {row && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-700">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong className="text-slate-900">{isEn ? "1. Order:" : "1. Order:"}</strong>{" "}
                <span className="font-mono">{row.orderNumber}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <strong className="text-slate-900">{isEn ? "2. Receipt / Invoice:" : "2. ใบเสร็จ/ใบแจ้งหนี้:"}</strong>{" "}
                <span className="font-mono">{row.abbFvNumber}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <strong className="text-slate-900">{isEn ? "3. Sales:" : "3. ยอดขาย:"}</strong>{" "}
                <span className="font-mono tabular-nums">
                  {formatCurrency(row.salesAmount)}
                </span>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <strong className="text-slate-900">{isEn ? "4. VAT:" : "4. VAT:"}</strong>{" "}
                <span className="font-mono tabular-nums">
                  {formatCurrency(row.vatAmount)}
                </span>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <strong className="text-slate-900">{isEn ? "5. Channel:" : "5. ช่องทางขาย:"}</strong>{" "}
                {row.salesChannel}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <strong className="text-slate-900">{isEn ? "6. Payment:" : "6. ช่องทางการรับเงิน:"}</strong>{" "}
                {row.paymentMethod}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
