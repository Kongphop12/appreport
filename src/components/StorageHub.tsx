import React, { useRef, useState } from "react";
import { Upload, Camera, FileText, Database, CheckCircle2, Loader2, Sparkles, FolderArchive, HardDrive } from "lucide-react";
import type { Language } from "../utils/translations";
import { formatCurrency } from "../utils/exporters";

export interface StoredDocumentRecord {
  id: string;
  numberSeq: number;       // ลำดับ Number
  customerName: string;    // ช่องที่ 1: ชื่อลูกค้า
  customerId: string;      // ช่องที่ 2: รหัสลูกค้า
  subTotal: number;        // ช่องที่ 3: Sub Total
  vat: number;             // ช่องที่ 4: VAT
  shippingFee: number;     // ช่องที่ 5: ค่าจัดส่ง
  total: number;           // ช่องที่ 6: TOTAL
  imageFileName: string;   // ชื่อไฟล์
  savedAt: string;
}

interface StorageHubProps {
  language: Language;
  onNotice: (msg: string) => void;
}

const STORAGE_DB_KEY = "sheetscan_db_ml_dl_archive_v6";

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
    return [];
  });

  const [currentFile, setCurrentFile] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
    previewUrl?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "AS No. ",
    subTotal: 0,
    vat: 0,
    shippingFee: 0,
  });

  const [validationErrors, setValidationErrors] = useState<{
    customerName?: string;
    customerId?: string;
    subTotal?: string;
    vat?: string;
    shippingFee?: string;
  }>({});

  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;

      setCurrentFile({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        previewUrl: preview,
      });

      setFormData({
        customerName: "",
        customerId: "AS No. ",
        subTotal: 0,
        vat: 0,
        shippingFee: 0,
      });
      setValidationErrors({});
      onNotice(isEn ? "File loaded successfully. Please enter form details." : "อัปโหลดไฟล์เรียบร้อยแล้ว กรุณากรอกข้อมูลตามปกติ");
    };
    reader.readAsDataURL(file);
  };

  const computedTotal = Number(formData.subTotal || 0) + Number(formData.vat || 0) + Number(formData.shippingFee || 0);

  const validateFields = () => {
    const errors: typeof validationErrors = {};
    
    const nameRegex = /^[ก-๙a-zA-Z\s.]+$/;
    if (!formData.customerName.trim()) {
      errors.customerName = "กรุณากรอกชื่อลูกค้า";
    } else if (!nameRegex.test(formData.customerName)) {
      errors.customerName = "ช่องชื่อลูกค้าต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น";
    }

    const idRegex = /^[a-zA-Z0-9\s.-]+$/;
    if (!formData.customerId.trim()) {
      errors.customerId = "กรุณากรอกรหัสลูกค้า";
    } else if (!idRegex.test(formData.customerId)) {
      errors.customerId = "รหัสลูกค้าต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีด (-) เท่านั้น";
    }

    if (isNaN(Number(formData.subTotal)) || formData.subTotal < 0) {
      errors.subTotal = "Sub Total ต้องเป็นตัวเลขเท่านั้น";
    }
    if (isNaN(Number(formData.vat)) || formData.vat < 0) {
      errors.vat = "VAT ต้องเป็นตัวเลขเท่านั้น";
    }
    if (isNaN(Number(formData.shippingFee)) || formData.shippingFee < 0) {
      errors.shippingFee = "ค่าจัดส่งต้องเป็นตัวเลขเท่านั้น";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFile) return;

    if (!validateFields()) {
      onNotice(isEn ? "Please fix validation errors before submit" : "กรุณาแก้ไขข้อมูลให้ถูกต้องตามประเภทที่กำหนดก่อนส่งข้อมูล");
      return;
    }

    setIsSavingDb(true);

    setTimeout(() => {
      const nextSeq = storedRecords.length > 0 ? Math.max(...storedRecords.map(r => r.numberSeq || 0)) + 1 : 1;
      const newRecord: StoredDocumentRecord = {
        id: `db-doc-${Date.now()}`,
        numberSeq: nextSeq,
        customerName: formData.customerName,
        customerId: formData.customerId,
        subTotal: Number(formData.subTotal),
        vat: Number(formData.vat),
        shippingFee: Number(formData.shippingFee),
        total: computedTotal,
        imageFileName: currentFile.fileName,
        savedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      const updated = [newRecord, ...storedRecords];
      setStoredRecords(updated);
      try {
        localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(updated));
        fetch("/api/sync-google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: updated }),
        }).catch(() => {});
        
        // Automatic download of db_data CSV
        const headers = ["ลำดับ", "ชื่อลูกค้า", "รหัสลูกค้า", "Sub Total", "VAT", "ค่าจัดส่ง", "TOTAL", "ชื่อไฟล์", "วันที่บันทึก"];
        const rows = updated.map(r => [
          r.numberSeq,
          `"${r.customerName.replace(/"/g, '""')}"`,
          `"${r.customerId.replace(/"/g, '""')}"`,
          r.subTotal,
          r.vat,
          r.shippingFee,
          r.total,
          `"${r.imageFileName.replace(/"/g, '""')}"`,
          `"${r.savedAt}"`
        ]);
        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Report_Case_Buying_db_data_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // ignore
      }

      setIsSavingDb(false);
      setCurrentFile(null);
      setFormData({ customerName: "", customerId: "AS No. ", subTotal: 0, vat: 0, shippingFee: 0 });
      setValidationErrors({});
      onNotice("ส่งข้อมูลเรียบร้อยครับ");
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,.pdf,.xlsx,.csv"
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

      {/* Header & Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {isEn ? "Data Storage & Document Management" : "เมนูเก็บข้อมูล"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEn
                  ? "Upload document files and record entry."
                  : "อัปโหลดไฟล์และบันทึกข้อมูลเอกสาร"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900 font-semibold shadow-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <HardDrive className="h-4 w-4 text-emerald-700" />
              <span>Drive Connected</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>{isEn ? "Upload File (.pdf/.xlsx/.jpg/.png)" : "อัปโหลดไฟล์เอกสาร"}</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>{isEn ? "Camera" : "ถ่ายรูปสแกน"}</span>
            </button>
          </div>
        </div>

        {/* Staging Form & Preview Area when file is uploaded */}
        {currentFile && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
                <FileText className="h-3.5 w-3.5" />
                {isEn ? "Document Upload & Form Entry" : "อัปโหลดเอกสารและกรอกข้อมูล"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentFile(null);
                  setFormData({ customerName: "", customerId: "", subTotal: 0, vat: 0, shippingFee: 0 });
                  setValidationErrors({});
                }}
                className="text-xs text-slate-500 hover:text-red-700 font-medium cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* File Preview */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded border bg-slate-50">
                  {currentFile.previewUrl && currentFile.fileType.startsWith("image/") ? (
                    <img src={currentFile.previewUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <FileText className="h-12 w-12 text-emerald-700" />
                  )}
                </div>
                <div>
                  <p className="truncate font-mono text-xs font-bold text-slate-900">{currentFile.fileName}</p>
                  <p className="text-[11px] text-slate-500">{Math.round((currentFile.fileSize || 0) / 1024)} KB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {isEn ? "Form Fields (Editable)" : "ช่องกรอกข้อมูลเอกสาร"}
                </h4>

                {isProcessingAi ? (
                  <div className="flex items-center gap-3 py-12 text-xs font-medium text-slate-600 justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                    <span>{isEn ? "ML/DL Model is scanning keywords from file..." : "ระบบ ML/DL กำลังสแกนหาคีย์เวิร์ดจากไฟล์..."}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* ช่องที่ 1: ชื่อลูกค้า */}
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        ช่องที่ 1: ชื่อลูกค้า <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className={`w-full rounded border px-3 py-2 text-xs text-slate-900 focus:outline-hidden ${
                          validationErrors.customerName ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-600"
                        }`}
                        placeholder="ชื่อลูกค้า"
                      />
                      {validationErrors.customerName && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{validationErrors.customerName}</p>
                      )}
                    </div>

                    {/* ช่องที่ 2: รหัสลูกค้า */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ช่องที่ 2: รหัสลูกค้า <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        className={`w-full rounded border px-3 py-2 font-mono text-xs text-slate-900 focus:outline-hidden ${
                          validationErrors.customerId ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-600"
                        }`}
                        placeholder="รหัสลูกค้า"
                      />
                      {validationErrors.customerId && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{validationErrors.customerId}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-slate-500">รหัสลูกค้าต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีด (-) เท่านั้น</p>
                    </div>

                    {/* ช่องที่ 3: Sub Total */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ช่องที่ 3: Sub Total <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.subTotal === 0 ? "" : formData.subTotal}
                        onChange={(e) => setFormData({ ...formData, subTotal: e.target.value === "" ? 0 : Number(e.target.value) })}
                        className={`w-full rounded border px-3 py-2 font-mono text-xs text-slate-900 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          validationErrors.subTotal ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-600"
                        }`}
                        placeholder="ระบุราคา Sub Total"
                      />
                      {validationErrors.subTotal && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{validationErrors.subTotal}</p>
                      )}
                    </div>

                    {/* ช่องที่ 4: VAT */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ช่องที่ 4: VAT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.vat === 0 ? "" : formData.vat}
                        onChange={(e) => setFormData({ ...formData, vat: e.target.value === "" ? 0 : Number(e.target.value) })}
                        className={`w-full rounded border px-3 py-2 font-mono text-xs text-slate-900 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          validationErrors.vat ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-600"
                        }`}
                        placeholder="ระบุราคา VAT"
                      />
                      {validationErrors.vat && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{validationErrors.vat}</p>
                      )}
                    </div>

                    {/* ช่องที่ 5: ค่าจัดส่ง */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ช่องที่ 5: ค่าจัดส่ง <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.shippingFee === 0 ? "" : formData.shippingFee}
                        onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value === "" ? 0 : Number(e.target.value) })}
                        className={`w-full rounded border px-3 py-2 font-mono text-xs text-slate-900 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          validationErrors.shippingFee ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-600"
                        }`}
                        placeholder="ระบุค่าจัดส่ง"
                      />
                      {validationErrors.shippingFee && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{validationErrors.shippingFee}</p>
                      )}
                    </div>

                    {/* ช่องที่ 6: TOTAL */}
                    <div className="sm:col-span-2 rounded bg-slate-50 p-3 flex items-center justify-between border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block">ช่องที่ 6: TOTAL</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-emerald-700">{formatCurrency(computedTotal)} THB</span>
                    </div>

                    {/* ชื่อไฟล์ */}
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อไฟล์</label>
                      <input
                        type="text"
                        readOnly
                        value={currentFile.fileName}
                        className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingDb || isProcessingAi}
                    className="inline-flex items-center gap-2 bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSavingDb ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>กำลังส่งข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                        <span>Submit (ส่งข้อมูล)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Main Submission Log Table (Censored / Confidential) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="h-5 w-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-950">
              {isEn ? `Submission Records (${storedRecords.length})` : `ตารางการส่งข้อมูล (${storedRecords.length} รายการ)`}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            🔒 ข้อมูลลับ (Censored & Time-Hidden Log)
          </span>
        </div>

        {storedRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {isEn ? "No submission records yet." : "ยังไม่มีรายการการส่งข้อมูลในระบบ"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="p-3 text-center">ลำดับ</th>
                  <th className="p-3">ชื่อลูกค้า</th>
                  <th className="p-3 text-right">Sub Total</th>
                  <th className="p-3 text-right">VAT</th>
                  <th className="p-3 text-right">ค่าจัดส่ง</th>
                  <th className="p-3 text-right">TOTAL</th>
                  <th className="p-3">ชื่อไฟล์</th>
                  <th className="p-3 text-center">สถานะ / เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {storedRecords.slice(0, 10).map((rec) => {
                  const partialName = rec.customerName ? rec.customerName.slice(0, 4) + " •••" : "K. •••";
                  const partialFileName = rec.imageFileName ? (rec.imageFileName.length > 14 ? rec.imageFileName.slice(0, 12) + "..." : rec.imageFileName) : "document.pdf";

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="p-3 text-center font-mono font-bold text-emerald-800">{rec.numberSeq}</td>
                      <td className="p-3 font-medium text-slate-900">{partialName}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(rec.subTotal)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(rec.vat)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(rec.shippingFee)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(rec.total)}</td>
                      <td className="p-3 font-mono text-slate-600 truncate max-w-[140px]" title={rec.imageFileName}>
                        {partialFileName}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> สถานะ ปกติ
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{rec.savedAt}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
