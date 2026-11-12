export type Language = "th" | "en";

export const translations = {
  th: {
    // App Header & Nav
    appName: "Program Report",
    tabSheet: "ตารางรายงาน",
    tabUploadData: "นำเข้า",
    tabUpload: "อัปโหลดรูป AI",
    tabPrint: "ประมวลผล",
    tabBuying: "Buying",
    tabStorage: "เก็บข้อมูล",
    btnUploadImage: "อัพโหลด",
    btnCameraScan: "ถ่ายรูป",
    tabPython: "โค้ด Python",
    printReportBtn: "สั่งพิมพ์รายงาน (A4)",
    quickPasteTip: "รองรับวางรูปด่วนด้วย Ctrl+V",

    // Summary Strip
    statCase: "Case:",
    unitCase: "เคส",
    statSalesReceived: "ยอดขายที่ได้รับในเดือน:",
    unitBaht: "บาท",
    statNetSales: "ยอดขายจริง (ก่อนภาษี):",
    statVat: "VAT 7%:",

    // Columns
    colOrder: "Order",
    colOrderSub: "เลขที่คำสั่งซื้อ",
    colAbbFv: "ใบเสร็จ/ใบแจ้งหนี้",
    colAbbFvSub: "เลขที่ใบเสร็จ / ใบแจ้งหนี้",
    colSales: "ยอดขาย",
    colSalesSub: "จำนวนเงินรวม (บาท)",
    colVat: "VAT",
    colVatSub: "ภาษีมูลค่าเพิ่ม 7%",
    colChannel: "ช่องทางขาย",
    colChannelSub: "Draft Orders / Online Store",
    colPayment: "ช่องทางการรับเงิน",
    colPaymentSub: "อิงตามไฟล์",
    colCancelled: "ลูกค้ายกเลิก",
    colCancelledSub: "- / ใช่",
    colIndex: "ลำดับ",
    colAttachments: "ไฟล์แนบ",
    colManage: "จัดการ",

    // Spreadsheet Toolbar & Actions
    searchPlaceholder: "ค้นหา Order, ใบเสร็จ/ใบแจ้งหนี้, ช่องทางขาย, การรับเงิน...",
    allChannels: "ทุกช่องทาง",
    autoVat7Label: "คำนวณ VAT 7% อัตโนมัติจากยอดขาย",
    importSpreadsheetBtn: "นำเข้า XLSX / CSV",
    addEmptyRowBtn: "เพิ่มแถวว่าง",
    exportExcelBtn: "ส่งออก Excel (.xlsx)",
    exportCsvBtn: "CSV",
    printToolbarBtn: "พิมพ์รายงาน (A4)",
    clearAllRowsBtn: "ล้างตารางทั้งหมด",
    emptyTableTitle: "ตารางเริ่มต้นว่างเปล่า — ยังไม่มีรายการข้อมูล",
    emptyTableDesc: "นำเข้าไฟล์ XLSX หรือ CSV ของคุณเพื่อแสดงข้อมูลตามจริง หรือกดเพิ่มแถวว่าง",
    selectCellToEdit: "เลือกช่องเซลล์เพื่อแก้ไข",
    deleteRowTooltip: "ลบแถวนี้",
    viewAttachmentsTooltip: "ดูเอกสารแนบ",
    aiProcessing: "AI รอสักครู่...",

    // Multi-File Upload Panel
    uploadHeader: "อัปโหลดไฟล์ (รองรับมากกว่า 1 ไฟล์) ให้โมเดล AI ตรวจจับและสกัดข้อมูล",
    uploadSubtitle: "ใส่ไฟล์พร้อมกันได้หลายไฟล์ (สลิป, ใบออเดอร์, ใบเสร็จ, ใบกำกับภาษี) โมเดล AI จะคิดวิเคราะห์และป้องกันข้อมูลซ้ำซ้อนอย่างแม่นยำ",
    collapse: "ย่อ",
    expand: "ขยาย",
    image1Label: "1) รูปใบออเดอร์ / สลิปโอนเงิน",
    image2Label: "2) รูปใบกำกับภาษี / ใบเสร็จรับเงิน",
    dragDropOrBrowse: "ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์ (เลือกได้มากกว่า 1 ไฟล์พร้อมกัน)",
    supportedFormats: "รองรับไฟล์รูปภาพ (PNG, JPG, WEBP) หรือไฟล์ตาราง (XLSX, CSV) ใส่ได้หลายไฟล์",
    btnExtractAi: "ประมวลผลด้วย AI ({count} ไฟล์)",
    btnExtracting: "โมเดล AI กำลังคิดและตรวจจับข้อมูล...",
    previewPairBtn: "ดูเอกสารขนาดเต็ม",
    addMoreFiles: "+ เพิ่มไฟล์อีก",
    clearAllFiles: "ล้างไฟล์ทั้งหมด",
    attachedFilesCount: "แนบเอกสารแล้ว {count} ไฟล์",
    presetLabel: "หรือทดลองใช้ตัวอย่างสำเร็จรูป:",
    samplePreset: "ตัวอย่างที่",

    // Print Preview
    printSettingsTitle: "ตั้งค่าหัวกระดาษรายงานก่อนพิมพ์",
    printA4PortraitBadge: "A4 หน้าตั้ง (Portrait)",
    printSettingsSubtitle: "รายงานจัดพิมพ์แบบหน้าตั้ง (Portrait) ข้อมูลสรุปอ้างอิงตามรายการจริงในไฟล์ CSV / XLSX",
    btnDownloadExcel: "ดาวน์โหลด Excel (.xlsx)",
    btnDownloadPrintHtml: "ดาวน์โหลดไฟล์พิมพ์ A4 (พิมพ์ได้ 100%)",
    btnPrintSheet: "สั่งพิมพ์หน้ารายงาน (A4 หน้าตั้ง)",
    printTipTitle: "คำแนะนำสำหรับการพิมพ์:",
    printTipText: "กดปุ่ม 'สั่งพิมพ์หน้ารายงาน' เพื่อเปิดหน้าต่างเครื่องพิมพ์ของคุณได้ทันที หากระบบอยู่ใน iFrame แล้วไม่แสดงหน้าต่างพิมพ์ ให้กดปุ่ม 'ดาวน์โหลดไฟล์พิมพ์ A4' เพื่อเปิดพิมพ์ได้ทันที 100%",
    
    // Print Form Fields
    fieldCompany: "ชื่อบริษัท / ร้านค้า",
    fieldReportTitle: "ชื่อหัวข้อรายงาน",
    fieldPeriod: "ประจำงวด / เดือนภาษี",
    fieldPrintDate: "วันที่พิมพ์",
    fieldPreparedBy: "ชื่อผู้จัดทำ",
    fieldCheckedBy: "ชื่อผู้ตรวจสอบ",
    fieldExtraNote: "หมายเหตุ / ช่องว่างเพิ่มเติม",

    // Print Document Sheet
    printPeriodLabel: "งวดรายงาน:",
    printDateLabel: "วันที่พิมพ์:",
    tableSumLabel: "รวมยอดในตาราง:",
    tableCasesSummary: "รวม {count} เคส",
    noDataInReport: "ไม่มีรายการข้อมูลในรายงาน",

    // Summary Metric Cards
    cardCaseTitle: "Case (เคสทั้งหมด)",
    cardCaseSub: "ผลรวมทั้งหมดของไฟล์ {count} รายการ",
    cardReceivedSalesTitle: "ยอดขายที่ได้รับในเดือน",
    cardReceivedSalesSub: "ผลรวมยอดขายทั้งหมดของไฟล์",
    cardNetSalesTitle: "ยอดขายจริง (ก่อนภาษี)",
    cardNetSalesVatSub: "VAT 7%: {vat} บาท",

    // Signatures
    signatureLine: "ลงชื่อ ............................................................",
    preparedByRole: "ผู้จัดทำรายงาน",
    checkedByRole: "สมุห์บัญชี / ผู้ตรวจสอบ",

    // Python Tab
    pythonTabTitle: "โค้ดโปรแกรม Desktop Python (GUI)",
    pythonTabDesc: "ซอร์สโค้ด Python ภาษาไทย สำหรับนำไปรันบนคอมพิวเตอร์ของคุณ (Tkinter + Excel + Gemini AI)",
    copyCodeBtn: "คัดลอกโค้ดทั้งหมด",
    codeCopied: "คัดลอกโค้ดแล้ว!",
    downloadScriptBtn: "ดาวน์โหลดไฟล์ .py",

    // Notices & Status
    noticeCleared: "ล้างข้อมูลในตารางทั้งหมดแล้ว",
    noticeImported: "โหลดเฉพาะข้อมูลจากไฟล์ \"{name}\" เรียบร้อยแล้ว ({count} รายการ — กรองรายการซ้ำซ้อนอย่างแม่นยำ)",
    noticeAppended: "เพิ่มข้อมูลจากไฟล์ \"{name}\" ต่อท้ายตารางแล้ว ({count} รายการ)",
    noticeAiSuccess: "AI เพิ่มข้อมูลสำเร็จ: Order {order} · {abb}",
    noticePreparingPrint: "กำลังเปิดหน้าต่างพิมพ์รายงาน A4...",
    noticePrintSaved: "ดาวน์โหลดไฟล์พิมพ์ A4 ให้เรียบร้อยแล้ว (เปิดไฟล์แล้วสั่งพิมพ์ได้ทันที 100%)",
  },

  en: {
    // App Header & Nav
    appName: "Program Report",
    tabSheet: "Spreadsheet",
    tabUploadData: "Import",
    tabUpload: "AI Upload",
    tabPrint: "Process",
    tabBuying: "Buying",
    tabStorage: "Storage",
    btnUploadImage: "Upload",
    btnCameraScan: "Camera Photo",
    tabPython: "Python Code",
    printReportBtn: "Print Report (A4)",
    quickPasteTip: "Quick paste screenshots with Ctrl+V",

    // Summary Strip
    statCase: "Cases:",
    unitCase: "cases",
    statSalesReceived: "Monthly Received Sales:",
    unitBaht: "THB",
    statNetSales: "Net Sales (Pre-VAT):",
    statVat: "VAT 7%:",

    // Columns
    colOrder: "Order",
    colOrderSub: "Order No. / Project",
    colAbbFv: "Receipt / Invoice",
    colAbbFvSub: "Receipt / Tax Invoice No.",
    colSales: "Sales Amount",
    colSalesSub: "Total Amount (THB)",
    colVat: "VAT",
    colVatSub: "Value Added Tax 7%",
    colChannel: "Sales Channel",
    colChannelSub: "Draft Orders / Online Store",
    colPayment: "Payment Method",
    colPaymentSub: "As per file",
    colCancelled: "Cancelled",
    colCancelledSub: "- / Yes",
    colIndex: "#",
    colAttachments: "Attachment",
    colManage: "Actions",

    // Spreadsheet Toolbar & Actions
    searchPlaceholder: "Search Order, Receipt/Invoice, Channel, Payment...",
    allChannels: "All Channels",
    autoVat7Label: "Auto Calculate VAT 7% from Sales",
    importSpreadsheetBtn: "Import XLSX / CSV",
    addEmptyRowBtn: "Add Empty Row",
    exportExcelBtn: "Export Excel (.xlsx)",
    exportCsvBtn: "CSV",
    printToolbarBtn: "Print Report (A4)",
    clearAllRowsBtn: "Clear Table",
    emptyTableTitle: "Table is empty — No records yet",
    emptyTableDesc: "Import your XLSX or CSV file to load actual data, or click Add Empty Row.",
    selectCellToEdit: "Select a cell to edit",
    deleteRowTooltip: "Delete this row",
    viewAttachmentsTooltip: "View attached documents",
    aiProcessing: "AI is processing...",

    // Multi-File Upload Panel
    uploadHeader: "Upload Files (>1 File Supported) for AI Model Detection & Extraction",
    uploadSubtitle: "Upload multiple files (Slips, Orders, Invoices, ABB-FV). The AI model inspects and precision-deduplicates automatically.",
    collapse: "Collapse",
    expand: "Expand",
    image1Label: "1) Order Document / Payment Slip",
    image2Label: "2) Tax Invoice / Receipt (ABB-FV)",
    dragDropOrBrowse: "Drag & drop files here, or click to browse (Select more than 1 file at once)",
    supportedFormats: "Supports Images (PNG, JPG, WEBP) or Spreadsheets (XLSX, CSV). Multiple files supported.",
    btnExtractAi: "Extract with AI ({count} files)",
    btnExtracting: "AI model is inspecting & detecting records...",
    previewPairBtn: "Preview Attached Files",
    addMoreFiles: "+ Add More Files",
    clearAllFiles: "Clear All Files",
    attachedFilesCount: "{count} files attached",
    presetLabel: "Or try preset demo pairs:",
    samplePreset: "Sample",

    // Print Preview
    printSettingsTitle: "Report Header & Print Settings",
    printA4PortraitBadge: "A4 Portrait",
    printSettingsSubtitle: "Report formatted for A4 Portrait print. Summary strictly based on actual records in file.",
    btnDownloadExcel: "Download Excel (.xlsx)",
    btnDownloadPrintHtml: "Download A4 Print File (100% Reliable)",
    btnPrintSheet: "Print Report Sheet (A4 Portrait)",
    printTipTitle: "Printing Tip:",
    printTipText: "Click 'Print Report Sheet' to open your printer dialog immediately. If inside an iframe sandbox, click 'Download A4 Print File' to open and print directly with 100% reliability.",

    // Print Form Fields
    fieldCompany: "Company / Store Name",
    fieldReportTitle: "Report Title",
    fieldPeriod: "Tax Period / Month",
    fieldPrintDate: "Print Date",
    fieldPreparedBy: "Prepared By",
    fieldCheckedBy: "Checked By",
    fieldExtraNote: "Note / Future Blank Field",

    // Print Document Sheet
    printPeriodLabel: "Report Period:",
    printDateLabel: "Print Date:",
    tableSumLabel: "Table Total:",
    tableCasesSummary: "Total {count} cases",
    noDataInReport: "No data in report",

    // Summary Metric Cards
    cardCaseTitle: "Case (Total Cases)",
    cardCaseSub: "Total file records: {count} items",
    cardReceivedSalesTitle: "Monthly Received Sales",
    cardReceivedSalesSub: "Total gross sales from file",
    cardNetSalesTitle: "Net Sales (Pre-VAT)",
    cardNetSalesVatSub: "VAT 7%: {vat} THB",

    // Signatures
    signatureLine: "Signature ............................................................",
    preparedByRole: "Report Prepared By",
    checkedByRole: "Accountant / Verified By",

    // Python Tab
    pythonTabTitle: "Standalone Desktop Python Script (GUI)",
    pythonTabDesc: "Python source code to run locally on your computer (Tkinter + Excel + Gemini AI)",
    copyCodeBtn: "Copy All Code",
    codeCopied: "Code Copied!",
    downloadScriptBtn: "Download .py Script",

    // Notices & Status
    noticeCleared: "Cleared all rows in table",
    noticeImported: "Successfully imported \"{name}\" ({count} records — precision deduplication applied)",
    noticeAppended: "Appended data from \"{name}\" ({count} records)",
    noticeAiSuccess: "AI Extracted: Order {order} · {abb}",
    noticePreparingPrint: "Opening A4 print window...",
    noticePrintSaved: "Saved A4 print file (open to print directly with 100% reliability)",
  },
};
