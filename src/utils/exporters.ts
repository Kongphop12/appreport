import * as XLSX from "xlsx";
import type { ReportHeaderMeta, ReportRow } from "../types";

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function exportToExcel(rows: ReportRow[], meta: ReportHeaderMeta): void {
  const totalSales = rows.reduce((sum, r) => sum + (Number(r.salesAmount) || 0), 0);
  const totalVat = rows.reduce((sum, r) => sum + (Number(r.vatAmount) || 0), 0);

  const sheetAoA: Array<Array<string | number>> = [
    [meta.companyName],
    [`เลขประจำตัวผู้เสียภาษี: ${meta.taxId} (${meta.branchName}) | งวดรายงาน: ${meta.periodLabel}`],
    [meta.reportTitle],
    [],
    [
      "ลำดับ",
      "Order",
      "ใบเสร็จ/ใบแจ้งหนี้",
      "ยอดขาย",
      "VAT",
      "ช่องทางขาย",
      "ช่องทางการรับเงิน",
    ],
  ];

  rows.forEach((row, idx) => {
    sheetAoA.push([
      idx + 1,
      row.orderNumber,
      row.abbFvNumber,
      Number(row.salesAmount.toFixed(2)),
      Number(row.vatAmount.toFixed(2)),
      row.salesChannel,
      row.paymentMethod,
    ]);
  });

  sheetAoA.push([
    "",
    "รวมสุทธิ",
    `${rows.length} รายการ`,
    Number(totalSales.toFixed(2)),
    Number(totalVat.toFixed(2)),
    "",
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetAoA);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report_Sale_Order");
  XLSX.writeFile(workbook, `Report_Sale_Order_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToCsv(rows: ReportRow[]): void {
  const headers = [
    "ลำดับ",
    "Order",
    "ใบเสร็จ/ใบแจ้งหนี้",
    "ยอดขาย",
    "VAT",
    "ช่องทางขาย",
    "ช่องทางการรับเงิน",
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCsv).join(",")];
  rows.forEach((row, index) => {
    lines.push(
      [
        index + 1,
        row.orderNumber,
        row.abbFvNumber,
        row.salesAmount.toFixed(2),
        row.vatAmount.toFixed(2),
        row.salesChannel,
        row.paymentMethod,
      ]
        .map(escapeCsv)
        .join(",")
    );
  });

  const csvWithBom = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report_sale_order_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildPythonDesktopScript(
  rows: ReportRow[],
  meta: ReportHeaderMeta
): string {
  const seedRowsJson = JSON.stringify(
    rows.map((r) => ({
      order: r.orderNumber,
      invoice: r.abbFvNumber,
      sales: Number(r.salesAmount.toFixed(2)),
      vat: Number(r.vatAmount.toFixed(2)),
      channel: r.salesChannel,
      payment: r.paymentMethod,
    })),
    null,
    2
  );

  return `"""
โปรแกรมรายงานยอดขายและใบกำกับภาษี (Report Sale Order)
ด้วย Python DL Model และ Multi-File Processing

วิธีติดตั้งไลบรารี:
    pip install pandas numpy openpyxl pillow
วิธีใช้งาน:
    python sales_report_ai.py
"""

import os
import glob
import pandas as pd
import numpy as np
import tempfile
import webbrowser
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from datetime import datetime

COMPANY_NAME = ${JSON.stringify(meta.companyName)}
REPORT_TITLE = ${JSON.stringify(meta.reportTitle)}
TAX_ID = ${JSON.stringify(meta.taxId)}

INITIAL_ROWS = ${seedRowsJson}


def extract_and_summarize_sales(file_paths):
    """
    ฟังก์ชันสำหรับอ่านไฟล์ .csv หรือ .xlsx หลายไฟล์ 
    ปรับคอลัมน์ให้อยู่ในมาตรฐานเดียวกัน และคำนวณผลรวมรายงานยอดขาย พร้อมเชื่อมโยง Primary Key (Order + Invoice)
    """
    combined_df = pd.DataFrame()
    
    # 1. นิยาม Keywords สำหรับค้นหาคอลัมน์ (รองรับภาษาไทย/อังกฤษ และพิมพ์เล็ก/ใหญ่)
    column_mappings = {
        'order': ['order', 'order id', 'เลขที่สั่งซื้อ', 'ออเดอร์', 'order_no'],
        'invoice': ['ใบเสร็จ', 'ใบแจ้งหนี้', 'invoice', 'receipt', 'เลขที่ใบเสร็จ'],
        'sales': ['ยอดขาย', 'sales', 'amount', 'ราคา', 'total', 'ยอดเงิน'],
        'vat': ['vat', 'ภาษี', 'ภาษีมูลค่าเพิ่ม', 'vat 7%'],
        'channel': ['ช่องทางขาย', 'sales channel', 'platform', 'ช่องทางการขาย'],
        'payment': ['ช่องทางการรับเงิน', 'payment method', 'การชำระเงิน', 'payment']
    }
    
    for path in file_paths:
        if path.endswith('.csv'):
            df = pd.read_csv(path)
        elif path.endswith('.xlsx') or path.endswith('.xls'):
            df = pd.read_excel(path)
        else:
            continue
            
        standardized_df = pd.DataFrame()
        
        for std_key, keywords in column_mappings.items():
            matched_col = None
            for col in df.columns:
                if any(kw in str(col).lower() for kw in keywords):
                    matched_col = col
                    break
            
            if matched_col is not None:
                standardized_df[std_key] = df[matched_col]
            else:
                standardized_df[std_key] = np.nan if std_key != 'sales' else 0.0

        combined_df = pd.concat([combined_df, standardized_df], ignore_index=True)
    
    # ให้อิงจาก Primary Key (order + invoice) สร้างความสัมพันธ์เพื่อป้องกันข้อมูลซ้ำซ้อนระหว่างไฟล์
    if 'order' in combined_df.columns and 'invoice' in combined_df.columns:
        combined_df['order'] = combined_df['order'].fillna('-').astype(str).str.strip()
        combined_df['invoice'] = combined_df['invoice'].fillna('-').astype(str).str.strip()
        combined_df['pk'] = combined_df['order'] + "_" + combined_df['invoice']
        valid_mask = ~combined_df['order'].isin(['-', '', 'nan', 'None'])
        valid_df = combined_df[valid_mask].drop_duplicates(subset=['pk'], keep='first')
        invalid_df = combined_df[~valid_mask]
        combined_df = pd.concat([valid_df, invalid_df], ignore_index=True)
        if 'pk' in combined_df.columns:
            combined_df = combined_df.drop(columns=['pk'])
    
    if combined_df.empty:
        return "ไม่พบข้อมูลที่ตรงกับเงื่อนไขในไฟล์ที่อัปโหลด"
    
    # 2. กระบวนการคำนวณผลรวม (Data Aggregation)
    for col in ['sales', 'vat']:
        if col in combined_df.columns:
            combined_df[col] = pd.to_numeric(combined_df[col].astype(str).str.replace(',', ''), errors='coerce').fillna(0.0)
    
    total_cases = len(combined_df)
    total_records = total_cases
    
    total_sales_with_vat = combined_df['sales'].sum()
    
    if 'vat' in combined_df.columns and combined_df['vat'].sum() > 0:
        total_vat = combined_df['vat'].sum()
        total_sales_before_vat = total_sales_with_vat - total_vat
    else:
        total_sales_before_vat = total_sales_with_vat / 1.07
        total_vat = total_sales_with_vat - total_sales_before_vat

    print("="*40)
    print("ผลรวม")
    print(f"Case (เคสทั้งหมด)\\n{total_cases:,} เคส\\n")
    print(f"ผลรวมทั้งหมดของไฟล์ {total_records:,} รายการ")
    print(f"ยอดขายที่ได้รับในเดือน\\n{total_sales_with_vat:,.2f} บาท\\n")
    print("ผลรวมยอดขายทั้งหมดของไฟล์")
    print(f"ยอดขายจริง (ก่อนภาษี)\\n{total_sales_before_vat:,.2f} บาท\\n")
    print(f"VAT 7%: {total_vat:,.2f} บาท")
    print("="*40)
    
    return combined_df


class ReportSaleOrderApp:
    COLUMNS = (
        "idx",
        "order",
        "invoice",
        "sales",
        "vat",
        "channel",
        "payment",
    )

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Report sale order (Python DL Model)")
        self.root.geometry("1220x720")
        self.root.configure(bg="#f8fafc")

        self.df_data = pd.DataFrame(INITIAL_ROWS)

        self._configure_styles()
        self._build_toolbar()
        self._build_table()
        self._build_summary_bar()
        self.refresh_table()

    def _configure_styles(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure(
            "Excel.Treeview",
            background="#ffffff",
            foreground="#0f172a",
            rowheight=32,
            fieldbackground="#ffffff",
            font=("Tahoma", 10),
            borderwidth=1,
        )
        style.configure(
            "Excel.Treeview.Heading",
            background="#f1f5f9",
            foreground="#0f172a",
            font=("Tahoma", 10, "bold"),
            padding=(8, 8),
        )

    def _build_toolbar(self):
        frame = tk.Frame(self.root, bg="#ffffff", bd=1, relief="solid", padx=14, pady=10)
        frame.pack(fill="x", padx=14, pady=(12, 6))

        tk.Label(
            frame,
            text="Program Report Sale Order:",
            bg="#ffffff",
            fg="#0f172a",
            font=("Tahoma", 11, "bold"),
        ).pack(side="left", padx=(0, 10))

        tk.Button(
            frame,
            text="📁 นำเข้าไฟล์ (รองรับหลายไฟล์ .csv, .xlsx)",
            command=self.import_files,
            bg="#15803d",
            fg="#ffffff",
            font=("Tahoma", 10, "bold"),
            relief="flat",
            padx=12,
            pady=5,
        ).pack(side="left", padx=4)

        tk.Button(
            frame,
            text="🤖 รัน DL Model โฟลเดอร์ uploads",
            command=self.process_uploads_folder,
            bg="#0f172a",
            fg="#ffffff",
            font=("Tahoma", 10, "bold"),
            relief="flat",
            padx=12,
            pady=5,
        ).pack(side="left", padx=4)

        tk.Button(
            frame,
            text="พิมพ์รายงาน (A4)",
            command=self.print_report,
            bg="#334155",
            fg="#ffffff",
            font=("Tahoma", 10, "bold"),
            relief="flat",
            padx=12,
            pady=5,
        ).pack(side="right", padx=4)

    def _build_table(self):
        container = tk.Frame(self.root, bg="#ffffff", padx=14)
        container.pack(fill="both", expand=True)

        self.tree = ttk.Treeview(
            container,
            columns=self.COLUMNS,
            show="headings",
            style="Excel.Treeview",
        )

        headings = {
            "idx": ("#", 50, "center"),
            "order": ("Order", 180, "w"),
            "invoice": ("ใบเสร็จ/ใบแจ้งหนี้", 190, "w"),
            "sales": ("ยอดขาย", 140, "e"),
            "vat": ("VAT", 120, "e"),
            "channel": ("ช่องทางขาย", 180, "w"),
            "payment": ("ช่องทางการรับเงิน", 210, "w"),
        }

        for col, (text, width, anchor) in headings.items():
            self.tree.heading(col, text=text)
            self.tree.column(col, width=width, anchor=anchor)

        vsb = ttk.Scrollbar(container, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

    def _build_summary_bar(self):
        self.summary_label = tk.Label(
            self.root,
            text="",
            bg="#f1f5f9",
            fg="#0f172a",
            font=("Tahoma", 10, "bold"),
            anchor="e",
            padx=18,
            pady=10,
        )
        self.summary_label.pack(fill="x", padx=14, pady=(6, 12))

    def import_files(self):
        paths = filedialog.askopenfilenames(
            title="เลือกไฟล์ข้อมูล (.csv, .xlsx, .xls)",
            filetypes=[("Spreadsheet files", "*.csv *.xlsx *.xls"), ("All files", "*.*")],
        )
        if not paths:
            return
        
        result = extract_and_summarize_sales(list(paths))
        if isinstance(result, str):
            messagebox.showwarning("แจ้งเตือน", result)
            return

        self.df_data = result
        self.refresh_table()
        messagebox.showinfo("สำเร็จ", f"ประมวลผลสำเร็จ {len(self.df_data)} เคส")

    def process_uploads_folder(self):
        upload_dir = 'uploads'
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        files = glob.glob(os.path.join(upload_dir, "*.csv")) + glob.glob(os.path.join(upload_dir, "*.xlsx"))
        if not files:
            messagebox.showwarning("แจ้งเตือน", f"ไม่พบไฟล์ในโฟลเดอร์ '{upload_dir}'")
            return

        result = extract_and_summarize_sales(files)
        if isinstance(result, str):
            messagebox.showwarning("แจ้งเตือน", result)
            return

        self.df_data = result
        self.refresh_table()
        messagebox.showinfo("สำเร็จ", f"DL Model ประมวลผลจากโฟลเดอร์ uploads สำเร็จ {len(self.df_data)} เคส")

    def refresh_table(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        if self.df_data is None or self.df_data.empty:
            return

        total_sales = 0.0
        total_vat = 0.0

        for idx, row in self.df_data.iterrows():
            sales_val = float(row.get('sales', 0.0))
            vat_val = float(row.get('vat', 0.0))
            if vat_val == 0 and sales_val > 0:
                vat_val = sales_val * 7 / 107
            
            total_sales += sales_val
            total_vat += vat_val

            self.tree.insert(
                "",
                "end",
                values=(
                    idx + 1,
                    str(row.get('order', '-')),
                    str(row.get('invoice', '-')),
                    f"{sales_val:,.2f}",
                    f"{vat_val:,.2f}",
                    str(row.get('channel', 'Online Store')),
                    str(row.get('payment', '-')),
                )
            )

        self.summary_label.config(
            text=f"Case ทั้งหมด: {len(self.df_data):,} เคส   |   ยอดขายรวม: {total_sales:,.2f} บาท   |   VAT 7%: {total_vat:,.2f} บาท"
        )

    def print_report(self):
        if self.df_data is None or self.df_data.empty:
            return
        
        tr_html = ""
        total_sales = 0.0
        total_vat = 0.0
        for idx, row in self.df_data.iterrows():
            s = float(row.get('sales', 0.0))
            v = float(row.get('vat', 0.0))
            if v == 0 and s > 0:
                v = s * 7 / 107
            total_sales += s
            total_vat += v

            tr_html += f"<tr><td>{idx+1}</td><td>{row.get('order','-')}</td><td>{row.get('invoice','-')}</td><td style='text-align:right'>{s:,.2f}</td><td style='text-align:right'>{v:,.2f}</td><td>{row.get('channel','-')}</td><td>{row.get('payment','-')}</td></tr>"

        html = f"""<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>{REPORT_TITLE}</title>
<style>
  @page {{ size: A4 landscape; margin: 12mm; }}
  body {{ font-family: Tahoma, sans-serif; padding: 20px; }}
  h2 {{ margin: 0 0 4px 0; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }}
  th, td {{ border: 1px solid #333; padding: 6px 10px; }}
  th {{ background: #f1f5f9; }}
</style>
</head>
<body onload="window.print()">
  <h2>{COMPANY_NAME} — {REPORT_TITLE}</h2>
  <div>วันที่พิมพ์: {datetime.now().strftime('%d/%m/%Y %H:%M')}</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Order</th>
        <th>ใบเสร็จ/ใบแจ้งหนี้</th>
        <th style="text-align:right">ยอดขาย</th>
        <th style="text-align:right">VAT</th>
        <th>ช่องทางขาย</th>
        <th>ช่องทางการรับเงิน</th>
      </tr>
    </thead>
    <tbody>{tr_html}</tbody>
    <tfoot>
      <tr style="font-weight:bold; background:#f8fafc;">
        <td colspan="3" style="text-align:right">รวมทั้งสิ้น ({len(self.df_data)} เคส)</td>
        <td style="text-align:right">{total_sales:,.2f}</td>
        <td style="text-align:right">{total_vat:,.2f}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>"""
        tmp = tempfile.NamedTemporaryFile("w", delete=False, suffix=".html", encoding="utf-8")
        tmp.write(html)
        tmp.close()
        webbrowser.open(f"file://{tmp.name}")


if __name__ == "__main__":
    root = tk.Tk()
    app = ReportSaleOrderApp(root)
    root.mainloop()
`;
}

export function downloadPythonScript(
  rows: ReportRow[],
  meta: ReportHeaderMeta
): void {
  const scriptContent = buildPythonDesktopScript(rows, meta);
  const blob = new Blob([scriptContent], { type: "text/x-python;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sales_report_ai.py";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
