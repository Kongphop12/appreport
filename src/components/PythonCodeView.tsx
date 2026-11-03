import React, { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { ReportHeaderMeta, ReportRow } from "../types";
import {
  buildPythonDesktopScript,
  downloadPythonScript,
} from "../utils/exporters";

interface PythonCodeViewProps {
  rows: ReportRow[];
  meta: ReportHeaderMeta;
}

export const PythonCodeView: React.FC<PythonCodeViewProps> = ({
  rows,
  meta,
}) => {
  const [copied, setCopied] = useState(false);

  const pythonCode = useMemo(
    () => buildPythonDesktopScript(rows, meta),
    [rows, meta]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <section className="no-print space-y-5">
      <div className="border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              ซอร์สโค้ดโปรแกรม Python (Desktop Excel Style + AI + พิมพ์รายงาน A4)
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              นอกจากใช้งานบนหน้าเว็บนี้ได้ทันทีแล้ว คุณยังสามารถดาวน์โหลดไฟล์{" "}
              <code className="font-mono text-slate-900">sales_report_ai.py</code>{" "}
              ไปรันบนคอมพิวเตอร์ด้วย Python (Tkinter Treeview แบบตาราง Excel) พร้อมข้อมูลปัจจุบันในตารางครบทั้ง 6 หัวข้อ
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-mono text-slate-800">
                pip install google-genai pillow openpyxl
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-800">
                python sales_report_ai.py
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-700" />
                  <span>คัดลอกโค้ดแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>คัดลอกโค้ด Python</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadPythonScript(rows, meta)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>ดาวน์โหลด sales_report_ai.py</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
          <span className="font-mono text-slate-200">sales_report_ai.py</span>
          <span>
            ซิงค์ข้อมูลจากตารางปัจจุบันอัตโนมัติ ({rows.length} รายการ)
          </span>
        </div>
        <pre className="max-h-[62vh] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </section>
  );
};
