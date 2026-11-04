import React, { useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  X,
  Printer,
} from "lucide-react";
import type {
  ColumnKey,
  ReportHeaderMeta,
  ReportRow,
  SelectedCell,
} from "../types";
import {
  exportToCsv,
  exportToExcel,
  formatCurrency,
} from "../utils/exporters";
import { type Language, translations } from "../utils/translations";

interface SpreadsheetGridProps {
  rows: ReportRow[];
  filteredRows: ReportRow[];
  meta: ReportHeaderMeta;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  channelFilter: string;
  onChannelFilterChange: (channel: string) => void;
  autoVat7: boolean;
  onToggleAutoVat7: () => void;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onUpdateCell: (rowId: string, colKey: ColumnKey, rawValue: string) => void;
  onAddEmptyRow: () => void;
  onImportSpreadsheet?: (rows: ReportRow[], fileName: string) => void;
  onClearAllRows?: () => void;
  onDeleteRow: (rowId: string) => void;
  onResetSampleData: () => void;
  onInspectRowImages: (row: ReportRow) => void;
  onTriggerPrint?: () => void;
  language?: Language;
  isExtracting: boolean;
  highlightedRowId: string | null;
}

function getColumnDefs(lang: Language): Array<{
  key: ColumnKey;
  excelCol: string;
  headerTitle: string;
  subLabel: string;
  align: "left" | "right";
  isNumeric?: boolean;
  widthClass: string;
}> {
  const t = translations[lang];
  return [
    {
      key: "orderNumber",
      excelCol: "A",
      headerTitle: t.colOrder,
      subLabel: t.colOrderSub,
      align: "left",
      widthClass: "min-w-[175px]",
    },
    {
      key: "abbFvNumber",
      excelCol: "B",
      headerTitle: t.colAbbFv,
      subLabel: t.colAbbFvSub,
      align: "left",
      widthClass: "min-w-[175px]",
    },
    {
      key: "salesAmount",
      excelCol: "C",
      headerTitle: t.colSales,
      subLabel: t.colSalesSub,
      align: "right",
      isNumeric: true,
      widthClass: "min-w-[140px]",
    },
    {
      key: "vatAmount",
      excelCol: "D",
      headerTitle: t.colVat,
      subLabel: t.colVatSub,
      align: "right",
      isNumeric: true,
      widthClass: "min-w-[125px]",
    },
    {
      key: "salesChannel",
      excelCol: "E",
      headerTitle: t.colChannel,
      subLabel: t.colChannelSub,
      align: "left",
      widthClass: "min-w-[160px]",
    },
    {
      key: "paymentMethod",
      excelCol: "F",
      headerTitle: t.colPayment,
      subLabel: t.colPaymentSub,
      align: "left",
      widthClass: "min-w-[170px]",
    },
    {
      key: "cancelled",
      excelCol: "G",
      headerTitle: t.colCancelled,
      subLabel: t.colCancelledSub,
      align: "left",
      widthClass: "min-w-[120px]",
    },
  ];
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows,
  filteredRows,
  meta,
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
  autoVat7,
  onToggleAutoVat7,
  selectedCell,
  onSelectCell,
  onUpdateCell,
  onAddEmptyRow,
  onImportSpreadsheet,
  onClearAllRows,
  onDeleteRow,
  onResetSampleData,
  onInspectRowImages,
  onTriggerPrint,
  language = "th",
  isExtracting,
  highlightedRowId,
}) => {
  const t = translations[language];
  const COLUMN_DEFS = useMemo(() => getColumnDefs(language), [language]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uniqueChannels = useMemo(() => {
    const set = new Set<string>(["Draft Orders", "Online Store"]);
    rows.forEach((r) => {
      if (r.salesChannel && r.salesChannel.trim() && r.salesChannel !== "-") {
        set.add(r.salesChannel.trim());
      }
    });
    return ["all", ...Array.from(set)];
  }, [rows]);

  const totals = useMemo(() => {
    const sales = filteredRows.reduce(
      (acc, r) => acc + (Number(r.salesAmount) || 0),
      0
    );
    const vat = filteredRows.reduce(
      (acc, r) => acc + (Number(r.vatAmount) || 0),
      0
    );
    const preVat = sales - vat;
    return { sales, vat, preVat };
  }, [filteredRows]);

  // Active cell coordinate & value for the Excel Formula Bar
  const activeCellInfo = useMemo(() => {
    if (!selectedCell) {
      return { coord: "A1", value: "", colTitle: t.selectCellToEdit };
    }
    const rowIdx = filteredRows.findIndex((r) => r.id === selectedCell.rowId);
    const colDef = COLUMN_DEFS.find((c) => c.key === selectedCell.colKey);
    const targetRow = filteredRows[rowIdx];
    if (rowIdx === -1 || !colDef || !targetRow) {
      return { coord: "A1", value: "", colTitle: t.selectCellToEdit };
    }
    const rawVal = targetRow[selectedCell.colKey];
    return {
      coord: `${colDef.excelCol}${rowIdx + 1}`,
      value: String(rawVal ?? ""),
      colTitle: colDef.headerTitle,
    };
  }, [selectedCell, filteredRows, COLUMN_DEFS, t.selectCellToEdit]);

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = filteredRows[rowIndex + 1];
      if (nextRow) {
        onSelectCell({
          rowId: nextRow.id,
          colKey: COLUMN_DEFS[colIndex].key,
        });
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      const nextColIdx = colIndex + dir;
      if (nextColIdx >= 0 && nextColIdx < COLUMN_DEFS.length) {
        onSelectCell({
          rowId: filteredRows[rowIndex].id,
          colKey: COLUMN_DEFS[nextColIdx].key,
        });
      } else if (dir === 1 && filteredRows[rowIndex + 1]) {
        onSelectCell({
          rowId: filteredRows[rowIndex + 1].id,
          colKey: COLUMN_DEFS[0].key,
        });
      }
    }
  };

  return (
    <section className="no-print border border-slate-200 bg-white">
      {/* Toolbar Row 1: Search, Channel Filter, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full border border-slate-300 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear Search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Channel Segmented Filter */}
          <div className="flex items-center gap-1 border border-slate-200 bg-white p-0.5">
            {uniqueChannels.slice(0, 6).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => onChannelFilterChange(ch)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  channelFilter === ch
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {ch === "all" ? t.allChannels : ch}
              </button>
            ))}
          </div>

          {/* Auto VAT 7% Checkbox Control */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-700 select-none whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={autoVat7}
              onChange={onToggleAutoVat7}
              className="h-3.5 w-3.5 accent-emerald-700"
            />
            <span>{t.autoVat7Label}</span>
          </label>
        </div>

        {/* Spreadsheet Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => exportToExcel(filteredRows, meta)}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 border border-emerald-700 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>{t.exportExcelBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => exportToCsv(filteredRows)}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.exportCsvBtn}</span>
          </button>

          {onTriggerPrint && (
            <button
              type="button"
              onClick={onTriggerPrint}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              title={t.printToolbarBtn}
            >
              <Printer className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.printToolbarBtn}</span>
            </button>
          )}

          {onClearAllRows && rows.length > 0 && (
            <button
              type="button"
              onClick={onClearAllRows}
              className="inline-flex items-center gap-1 border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 whitespace-nowrap shrink-0"
              title={t.clearAllRowsBtn}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.clearAllRowsBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel Formula / Active Cell Bar */}
      <div className="flex items-center border-b border-slate-200 bg-white text-xs">
        <div className="flex w-20 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 py-2 font-mono font-semibold text-slate-700">
          {activeCellInfo.coord}
        </div>
        <div className="flex w-10 shrink-0 items-center justify-center border-r border-slate-200 py-2 font-mono italic text-slate-400">
          fx
        </div>
        <input
          type="text"
          list={selectedCell?.colKey === "salesChannel" ? "sales-channel-options" : undefined}
          value={activeCellInfo.value}
          disabled={!selectedCell}
          onChange={(e) => {
            if (selectedCell) {
              onUpdateCell(
                selectedCell.rowId,
                selectedCell.colKey,
                e.target.value
              );
            }
          }}
          placeholder="คลิกเลือกช่องในตารางด้านล่างเพื่อแก้ไขข้อมูลได้เหมือน Excel"
          className="flex-1 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50/40"
        />
        <div className="hidden border-l border-slate-200 px-4 py-2 text-xs text-slate-500 sm:block whitespace-nowrap shrink-0">
          แสดง {filteredRows.length} จาก {rows.length} รายการ
        </div>
      </div>

      {/* Datalists for quick channel suggestions */}
      <datalist id="sales-channel-options">
        <option value="Draft Orders" />
        <option value="Online Store" />
        {uniqueChannels
          .filter(
            (c) => c !== "all" && c !== "Draft Orders" && c !== "Online Store"
          )
          .map((c) => (
            <option key={c} value={c} />
          ))}
      </datalist>

      {/* Excel Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {/* Excel Column Letters Row (A - F) */}
            <tr className="border-b border-slate-300 bg-slate-100 text-center font-mono text-[11px] font-medium text-slate-500 select-none">
              <th className="w-12 border-r border-slate-300 py-1">#</th>
              {COLUMN_DEFS.map((col) => (
                <th
                  key={col.excelCol}
                  className={`border-r border-slate-300 py-1 ${
                    selectedCell?.colKey === col.key
                      ? "bg-emerald-100/80 font-bold text-emerald-900"
                      : ""
                  }`}
                >
                  {col.excelCol}
                </th>
              ))}
              <th className="w-24 py-1">{t.colManage}</th>
            </tr>

            {/* Primary 1-6 Headers Row across top */}
            <tr className="border-b-2 border-slate-300 bg-slate-50 text-xs text-slate-800">
              <th className="w-12 border-r border-slate-200 px-2 py-2.5 text-center font-mono font-semibold text-slate-500">
                {t.colIndex}
              </th>
              {COLUMN_DEFS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.widthClass} border-r border-slate-200 px-3 py-2.5 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    {col.headerTitle}
                  </div>
                  <div className="mt-0.5 text-[11px] font-normal text-slate-500 whitespace-nowrap">
                    {col.subLabel}
                  </div>
                </th>
              ))}
              <th className="w-24 px-2 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap">
                {t.colAttachments}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {/* Pending Skeleton Row when AI is extracting */}
            {isExtracting && (
              <tr className="bg-emerald-50/40">
                <td className="border-r border-slate-200 px-2 py-2.5 text-center font-mono text-xs text-emerald-700">
                  AI
                </td>
                {COLUMN_DEFS.map((col) => (
                  <td
                    key={col.key}
                    className="border-r border-slate-200 px-3 py-2.5"
                  >
                    <div className="h-4 w-full animate-pulse bg-emerald-200/60" />
                  </td>
                ))}
                <td className="px-2 py-2.5 text-center text-xs text-emerald-700">
                  {t.aiProcessing}
                </td>
              </tr>
            )}

            {filteredRows.length === 0 && !isExtracting ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  {rows.length === 0 ? (
                    <div className="space-y-3">
                      <p className="font-medium text-slate-700">
                        {t.emptyTableTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {language === "en" 
                          ? "Please use the 'AI Upload' tab above to upload and process your files." 
                          : "กรุณาใช้เมนู 'อัปโหลดไฟล์' ด้านบนเพื่ออัปโหลดไฟล์และประมวลผลข้อมูลรายงาน"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">
                        {language === "en" ? `No records found matching "${searchQuery}"` : `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${searchQuery}"`}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onSearchChange("");
                          onChannelFilterChange("all");
                        }}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        {language === "en" ? "Clear all search filters" : "ล้างตัวกรองการค้นหาทั้งหมด"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => {
                const isRowSelected = selectedCell?.rowId === row.id;
                const isHighlighted = highlightedRowId === row.id;
                const filesCount =
                  row.sourceImages?.files?.length ||
                  (row.sourceImages?.image1Preview ? 1 : 0) +
                    (row.sourceImages?.image2Preview ? 1 : 0);
                const hasImages = filesCount > 0;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isHighlighted
                        ? "bg-emerald-50/70"
                        : isRowSelected
                        ? "bg-slate-50/70"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Excel Row Index */}
                    <td
                      className={`border-r border-slate-200 px-2 py-0 text-center font-mono text-xs select-none ${
                        isRowSelected
                          ? "bg-emerald-100/80 font-bold text-emerald-900"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {rowIndex + 1}
                    </td>

                    {/* 6 Editable Cells */}
                    {COLUMN_DEFS.map((col, colIndex) => {
                      const isSelected =
                        selectedCell?.rowId === row.id &&
                        selectedCell?.colKey === col.key;
                      const cellValue = row[col.key];

                      return (
                        <td
                          key={col.key}
                          onClick={() =>
                            onSelectCell({ rowId: row.id, colKey: col.key })
                          }
                          className={`relative border-r border-slate-200 p-0 ${
                            isSelected
                              ? "z-10 ring-2 ring-inset ring-emerald-700 bg-white"
                              : ""
                          }`}
                        >
                          {isSelected ? (
                            <input
                              type={col.isNumeric ? "number" : "text"}
                              step={col.isNumeric ? "0.01" : undefined}
                              list={
                                col.key === "salesChannel"
                                  ? "sales-channel-options"
                                  : undefined
                              }
                              autoFocus
                              value={cellValue}
                              onChange={(e) =>
                                onUpdateCell(row.id, col.key, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleCellKeyDown(e, rowIndex, colIndex)
                              }
                              className={`h-9 w-full bg-white px-3 text-xs text-slate-900 focus:outline-none ${
                                col.align === "right"
                                  ? "text-right font-mono tabular-nums"
                                  : col.key === "orderNumber" ||
                                    col.key === "abbFvNumber"
                                  ? "font-mono"
                                  : ""
                              }`}
                            />
                          ) : (
                            <div
                              className={`flex h-9 cursor-cell items-center px-3 text-xs text-slate-800 ${
                                col.align === "right"
                                  ? "justify-end font-mono tabular-nums font-medium text-slate-900"
                                  : col.key === "orderNumber" ||
                                    col.key === "abbFvNumber"
                                  ? "font-mono text-slate-900"
                                  : ""
                              }`}
                            >
                              <span className="truncate">
                                {col.isNumeric
                                  ? formatCurrency(Number(cellValue) || 0)
                                  : col.key === "cancelled"
                                  ? (() => {
                                      const c = String(cellValue || "").trim().toLowerCase();
                                      if (c === "ใช่" || c === "yes" || c === "true" || c === "cancelled" || c === "1") {
                                        return language === "en" ? "Yes" : "ใช่";
                                      }
                                      return String(cellValue || "-");
                                    })()
                                  : String(cellValue || "-")}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Utility Actions */}
                    <td className="px-2 py-0 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasImages ? (
                          <button
                            type="button"
                            onClick={() => onInspectRowImages(row)}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            title={
                              language === "en"
                                ? `View ${filesCount} attached files`
                                : `ดูเอกสารแนบ (${filesCount} ไฟล์)`
                            }
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>
                              {filesCount} {language === "en" ? "file(s)" : "ไฟล์"}
                            </span>
                          </button>
                        ) : (
                          <span className="px-1.5 text-[11px] text-slate-300">
                            —
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
                          className="p-1 text-slate-400 transition-colors hover:text-red-600"
                          title="ลบแถวนี้"
                          aria-label="ลบแถว"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Excel SUM Footer Row */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 text-xs font-semibold text-slate-900">
                <td className="border-r border-slate-200 px-2 py-2.5 text-center font-mono text-slate-500">
                  ∑
                </td>
                <td
                  colSpan={2}
                  className="border-r border-slate-200 px-3 py-2.5 text-right text-slate-700"
                >
                  รวมทั้งสิ้น ({filteredRows.length} รายการ) · มูลค่าก่อนภาษี{" "}
                  <span className="font-mono tabular-nums text-slate-900">
                    {formatCurrency(totals.preVat)}
                  </span>
                </td>
                <td className="border-r border-slate-200 px-3 py-2.5 text-right font-mono tabular-nums text-slate-950">
                  {formatCurrency(totals.sales)}
                </td>
                <td className="border-r border-slate-200 px-3 py-2.5 text-right font-mono tabular-nums text-emerald-800">
                  {formatCurrency(totals.vat)}
                </td>
                <td
                  colSpan={3}
                  className="px-3 py-2.5 text-left font-normal text-slate-500"
                >
                  คลิกที่ช่องใดก็ได้เพื่อแก้ไขตัวเลขหรือข้อความก่อนสั่งพิมพ์รายงาน
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
};
