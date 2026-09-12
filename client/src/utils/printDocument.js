import bmtechLogo from "../assets/bmtech-logo.jpeg";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function baseStyles() {
  return `
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
      color: #201d17;
      direction: rtl;
      margin: 0;
      padding: 0;
    }
    .doc-letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #16342b;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .doc-letterhead h1 {
      font-size: 18px;
      margin: 0 0 4px 0;
      color: #16342b;
    }
    .doc-letterhead p {
      margin: 2px 0;
      font-size: 11px;
      color: #5c584e;
    }
    .doc-letterhead-meta {
      text-align: left;
      font-size: 11px;
      color: #5c584e;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #16342b;
      margin: 0 0 2px 0;
    }
    .doc-subtitle {
      font-size: 12px;
      color: #5c584e;
      margin: 0 0 18px 0;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 18px;
    }
    table.doc-table th {
      background: #e3ede9;
      color: #16342b;
      text-align: right;
      padding: 8px 10px;
      font-weight: 700;
      border: 1px solid #d8e2dd;
    }
    table.doc-table td {
      padding: 7px 10px;
      border: 1px solid #e8dfc9;
      text-align: right;
    }
    table.doc-table tr:nth-child(even) td {
      background: #faf7ef;
    }
    .doc-summary {
      width: 60%;
      margin-bottom: 18px;
      border: 1px solid #e8dfc9;
      border-radius: 8px;
      overflow: hidden;
    }
    .doc-summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      border-bottom: 1px solid #e8dfc9;
    }
    .doc-summary-row:last-child {
      border-bottom: none;
    }
    .doc-summary-row span:first-child {
      color: #5c584e;
    }
    .doc-summary-row span:last-child {
      font-weight: 700;
      color: #201d17;
    }
    .doc-summary-full {
      width: 100%;
    }
    .doc-grand-total {
      background: #dcfce7;
      border: none;
      margin-top: -4px;
    }
    .doc-grand-total .doc-summary-row {
      border-bottom: none;
      font-size: 16px;
      font-weight: 800;
      color: #15803d;
    }
    .doc-note {
      font-size: 12px;
      color: #5c584e;
      background: #faf7ef;
      border: 1px solid #e8dfc9;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 18px;
    }
    .doc-footer {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #a39c8c;
    }
    .doc-credit {
      margin-top: 18px;
      text-align: center;
      font-size: 9px;
      color: #c9c2b0;
      border-top: 1px dashed #e8dfc9;
      padding-top: 10px;
    }
    .doc-credit img {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      vertical-align: middle;
      margin-left: 4px;
    }
    .doc-toolbar {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      background: #faf7ef;
      padding: 12px 16px;
      border-bottom: 1px solid #e8dfc9;
      margin: -18mm -16mm 18mm -16mm;
    }
    .doc-toolbar button {
      font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .doc-toolbar .doc-print-btn {
      background: #16342b;
      color: #ffffff;
    }
    .doc-toolbar .doc-close-btn {
      background: #e8dfc9;
      color: #201d17;
    }
    @media print {
      .doc-toolbar {
        display: none;
      }
    }
  `;
}

function letterheadHtml(settings) {
  const meta = [];
  if (settings?.vatNumber) meta.push(`الرقم الضريبي: ${escapeHtml(settings.vatNumber)}`);
  if (settings?.commercialRegister) meta.push(`السجل التجاري: ${escapeHtml(settings.commercialRegister)}`);
  return `
    <div class="doc-letterhead">
      <div>
        <h1>${escapeHtml(settings?.companyName || "")}</h1>
        <p>${escapeHtml(settings?.address || "")}</p>
        <p>${escapeHtml(settings?.phone || "")}${settings?.email ? " · " + escapeHtml(settings.email) : ""}</p>
      </div>
      <div class="doc-letterhead-meta">
        ${meta.map((line) => `<p>${line}</p>`).join("")}
      </div>
    </div>
  `;
}

function creditHtml() {
  return `<div class="doc-credit"><img src="${bmtechLogo}" alt="" />تطوير BM Tech</div>`;
}

export function printPurchaseOrder({ settings, supplier, order }) {
  const rows = [
    ["التاريخ", order.date],
    ["عدد الأقفاص", order.cages],
    ["الوزن الإجمالي", `${Number(order.weightKg).toLocaleString("ar-SA")} ${settings?.weightUnit || "كغ"}`],
    ["سعر الكيلو", `${Number(order.kgPrice).toLocaleString("ar-SA")} ${settings?.currency || "ر.س"}`],
  ];

  const html = `
    ${letterheadHtml(settings)}
    <p class="doc-title">فاتورة شراء</p>
    <p class="doc-subtitle">رقم الفاتورة ${escapeHtml(order.code)} — ${escapeHtml(order.date)}</p>
    <div class="doc-summary doc-summary-full">
      <div class="doc-summary-row"><span>المورد</span><span>${escapeHtml(supplier.name)}</span></div>
      <div class="doc-summary-row"><span>الهاتف</span><span>${escapeHtml(supplier.phone)}</span></div>
      <div class="doc-summary-row"><span>المنطقة</span><span>${escapeHtml(supplier.region)}</span></div>
      <div class="doc-summary-row"><span>حالة الدفع</span><span>${escapeHtml(order.paymentStatus)}</span></div>
    </div>
    <table class="doc-table">
      <thead><tr><th>البيان</th><th>القيمة</th></tr></thead>
      <tbody>
        ${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="doc-summary doc-summary-full doc-grand-total">
      <div class="doc-summary-row"><span>الإجمالي الكلي</span><span>${escapeHtml(`${Number(order.total).toLocaleString("ar-SA")} ${settings?.currency || "ر.س"}`)}</span></div>
    </div>
    ${creditHtml()}
  `;

  openPrintDocument(html);
}

export function printAccountStatement({ settings, row, isSuppliers, entries, fmtMoney }) {
  const chronological = [...entries].reverse();
  const rows = chronological.map((e) => [
    e.date,
    e.label,
    e.debit ? fmtMoney(e.debit) : "—",
    e.credit ? fmtMoney(e.credit) : "—",
    `${fmtMoney(Math.abs(e.balance))} (${e.balance >= 0 ? "مدين" : "دائن"})`,
  ]);

  const html = `
    ${letterheadHtml(settings)}
    <p class="doc-title">كشف حساب — ${escapeHtml(row.name)}</p>
    <p class="doc-subtitle">${isSuppliers ? "مورد" : "مسلخ"}</p>
    <div class="doc-summary doc-summary-full">
      <div class="doc-summary-row"><span>${isSuppliers ? "إجمالي المشتريات" : "إجمالي المبيعات"}</span><span>${escapeHtml(fmtMoney(row.total))}</span></div>
      <div class="doc-summary-row"><span>المدفوع</span><span>${escapeHtml(fmtMoney(row.paid))}</span></div>
      <div class="doc-summary-row"><span>المتبقي</span><span>${escapeHtml(fmtMoney(row.remaining))}</span></div>
    </div>
    <table class="doc-table">
      <thead><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>${r.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
    ${creditHtml()}
  `;

  openPrintDocument(html);
}

export function openPrintDocument(bodyHtml) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">
        <style>${baseStyles()}</style>
      </head>
      <body>
        <div class="doc-toolbar">
          <button class="doc-print-btn" onclick="window.print()">طباعة / حفظ PDF</button>
          <button class="doc-close-btn" onclick="window.close()">إغلاق</button>
        </div>
        ${bodyHtml}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
}

export function printReport({ settings, title, subtitle, summaryLines, columns, rows }) {
  const summaryHtml = summaryLines
    ? `<div class="doc-summary">${summaryLines
        .map(([label, value]) => `<div class="doc-summary-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`)
        .join("")}</div>`
    : "";

  const tableHtml = columns
    ? `
      <table class="doc-table">
        <thead>
          <tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `
    : "";

  const generatedAt = new Date().toLocaleString("ar-SA");

  const html = `
    ${letterheadHtml(settings)}
    <p class="doc-title">${escapeHtml(title)}</p>
    ${subtitle ? `<p class="doc-subtitle">${escapeHtml(subtitle)}</p>` : ""}
    ${summaryHtml}
    ${tableHtml}
    <div class="doc-footer">
      <span>تم إنشاء التقرير: ${generatedAt}</span>
      <span>${escapeHtml(settings?.companyName || "")}</span>
    </div>
    ${creditHtml()}
  `;

  openPrintDocument(html);
}

export function printVoucher({ settings, invoice }) {
  const rows = [
    ["رقم الفاتورة", invoice.invoiceNumber],
    ["التاريخ", invoice.date],
    ["المسلخ", invoice.slaughterhouse],
    ["عدد الأقفاص", invoice.cages],
    ["الوزن", `${invoice.weightKg} ${settings?.weightUnit || "كغ"}`],
    ["الخصم", invoice.discount || "—"],
    ["الإجمالي", `${Number(invoice.total).toLocaleString("ar-SA")} ${settings?.currency || "ر.س"}`],
    ["حالة الدفع", invoice.paymentStatus],
  ];
  if (invoice.notes) {
    rows.push(["ملاحظات", invoice.notes]);
  }

  const itemsTable =
    invoice.items && invoice.items.length > 0
      ? `
        <table class="doc-table">
          <thead>
            <tr><th>عدد الأقفاص</th><th>وزن العبوة</th><th>الوزن الإجمالي</th></tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) =>
                  `<tr><td>${escapeHtml(item.cages)}</td><td>${escapeHtml(item.packageWeight)} ${escapeHtml(settings?.weightUnit || "كغ")}</td><td>${escapeHtml(item.weightKg)} ${escapeHtml(settings?.weightUnit || "كغ")}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      `
      : "";

  const html = `
    ${letterheadHtml(settings)}
    <p class="doc-title">سند فاتورة بيع</p>
    <p class="doc-subtitle">رقم ${escapeHtml(invoice.invoiceNumber)}</p>
    <div class="doc-summary doc-summary-full">
      ${rows.map(([label, value]) => `<div class="doc-summary-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`).join("")}
    </div>
    ${itemsTable}
    ${settings?.invoiceFooterNote ? `<p class="doc-note">${escapeHtml(settings.invoiceFooterNote)}</p>` : ""}
    <div class="doc-footer">
      <span>توقيع المستلم: ____________________</span>
      <span>توقيع المسؤول: ____________________</span>
    </div>
    ${creditHtml()}
  `;

  openPrintDocument(html);
}
