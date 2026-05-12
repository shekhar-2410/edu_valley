const SCHOOL = {
    name: 'Narendra Edu Valley',
    motto: 'सा विद्या या विमुक्तये',
    address: 'Naya Gao Chainpur Siswan, Siwan, Bihar 841203',
    phone: '+91 70504 21421',
    email: 'info@nevalley.edu.in',
    logo: `${window.location.origin}/images/logo.png`,
}

const fmt = (paise) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((paise || 0) / 100)

const fmtDate = (val) => {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—')

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700;900&display=swap');
body{font-family:'DM Sans','Segoe UI',system-ui,sans-serif;background:#fff;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4 portrait;margin:12mm 14mm 16mm 14mm}
.doc{max-width:780px;margin:0 auto;padding:28px 32px}

/* ── Header ── */
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #D4A017;margin-bottom:22px;gap:16px}
.hdr-left{display:flex;align-items:center;gap:14px}
.logo{width:68px;height:68px;object-fit:contain}
.school-name{font-family:'Playfair Display',Georgia,serif;font-size:21px;font-weight:900;color:#0A1A33;line-height:1.15}
.motto{font-size:9.5px;color:#D4A017;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-top:2px}
.addr{font-size:10.5px;color:#64748b;margin-top:5px;line-height:1.5}
.hdr-right{text-align:right;flex-shrink:0}
.doc-label{font-size:9px;font-weight:900;letter-spacing:.25em;text-transform:uppercase;color:#C92A2A;margin-bottom:4px}
.doc-no{font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:900;color:#0A1A33;line-height:1.2}
.doc-date{font-size:11px;color:#64748b;margin-top:4px}
.badge-paid{display:inline-block;background:#dcfce7;color:#166534;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:3px 11px;border-radius:20px;border:2px solid #16a34a;margin-top:7px}
.badge-pending{display:inline-block;background:#fff7ed;color:#9a3412;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:3px 11px;border-radius:20px;border:2px solid #ea580c;margin-top:7px}
.badge-partial{display:inline-block;background:#fffbeb;color:#78350f;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:3px 11px;border-radius:20px;border:2px solid #d97706;margin-top:7px}

/* ── Section ── */
.sec-title{font-size:9px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;margin-top:20px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;margin-bottom:4px}
.info-item label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:2px}
.info-item span{font-size:13px;font-weight:700;color:#0f172a}

/* ── Table ── */
.tbl{width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:4px;font-size:12px}
.tbl thead tr{background:#0A1A33}
.tbl thead th{color:#fff;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:9px 11px;text-align:left}
.tbl thead th.tr{text-align:right}
.tbl tbody td{padding:10px 11px;border-bottom:1px solid #f1f5f9;color:#1e293b;vertical-align:top}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl .tr{text-align:right}
.tbl tfoot td{background:#f8fafc;font-weight:900;font-size:13px;padding:10px 11px;border-top:2px solid #e2e8f0}
.tbl tfoot .tr{text-align:right}
.amount-main{font-size:14px;font-weight:900;color:#0A1A33}
.amt-due{color:#dc2626;font-weight:900}
.amt-paid{color:#16a34a;font-weight:900}

/* ── Divider ── */
hr{border:none;border-top:1px solid #e2e8f0;margin:22px 0}

/* ── Signature ── */
.sig-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:44px;padding-top:8px}
.sig-box{text-align:center;width:150px}
.sig-line{border-bottom:2px solid #0A1A33;margin:0 auto 6px;height:36px}
.sig-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b}

/* ── Stamp ── */
.stamp{display:flex;align-items:center;justify-content:center;width:76px;height:76px;border-radius:50%;border:3.5px solid #16a34a;color:#166534;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;text-align:center;line-height:1.3;flex-direction:column;gap:1px}
.stamp-pending{border-color:#ea580c;color:#9a3412}

/* ── Footer ── */
.footer{margin-top:20px;text-align:center;font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:.04em;padding-top:12px;border-top:1px solid #f1f5f9}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:88px;font-weight:900;color:rgba(22,101,52,.07);pointer-events:none;letter-spacing:.12em;font-family:'Playfair Display',Georgia,serif;white-space:nowrap}
@media print{.watermark{position:fixed}}
`

const openPrintWindow = (html, title) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Please allow popups for this site to download PDF.'); return }
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title><style>${BASE_CSS}</style></head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
}

export const printReceiptPDF = (data) => {
    const { school_name, receipt_no, issued_at, student, profile, invoice, payment } = data
    const balance = Math.max(0, (invoice.amount_paise || 0) - (invoice.paid_paise || 0))

    const html = `
<div class="watermark">PAID</div>
<div class="doc">
  <div class="hdr">
    <div class="hdr-left">
      <img src="${SCHOOL.logo}" class="logo" alt="Logo" onerror="this.style.display='none'">
      <div>
        <div class="school-name">${school_name || SCHOOL.name}</div>
        <div class="motto">${SCHOOL.motto}</div>
        <div class="addr">${SCHOOL.address}<br>${SCHOOL.phone} · ${SCHOOL.email}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="doc-label">Payment Receipt</div>
      <div class="doc-no">${receipt_no}</div>
      <div class="doc-date">Issued: ${fmtDate(issued_at)}</div>
      <div><span class="badge-paid">● PAID</span></div>
    </div>
  </div>

  <div class="sec-title">Student Details</div>
  <div class="info-grid">
    <div class="info-item"><label>Student Name</label><span>${student.full_name}</span></div>
    <div class="info-item"><label>Admission No</label><span>${profile.admission_no}</span></div>
    <div class="info-item"><label>Class &amp; Section</label><span>${profile.class_name}-${profile.section}</span></div>
    <div class="info-item"><label>Guardian Name</label><span>${profile.guardian_name || '—'}</span></div>
    ${profile.address ? `<div class="info-item" style="grid-column:1/-1"><label>Address</label><span>${profile.address}</span></div>` : ''}
  </div>

  <div class="sec-title">Invoice Details</div>
  <table class="tbl">
    <thead>
      <tr>
        <th>Invoice No</th>
        <th>Description</th>
        <th>Term</th>
        <th>Due Date</th>
        <th class="tr">Invoice Amount</th>
        <th class="tr">Amount Paid</th>
        <th class="tr">Balance Due</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:700">${invoice.invoice_no}</td>
        <td>${invoice.title}</td>
        <td>${invoice.term || '—'}</td>
        <td>${fmtDate(invoice.due_date)}</td>
        <td class="tr">${fmt(invoice.amount_paise)}</td>
        <td class="tr amt-paid">${fmt(payment.amount_paise)}</td>
        <td class="tr ${balance > 0 ? 'amt-due' : 'amt-paid'}">${fmt(balance)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="color:#64748b;font-size:11px;font-weight:600">Total for this receipt</td>
        <td class="tr amount-main">${fmt(payment.amount_paise)}</td>
        <td class="tr ${balance > 0 ? 'amt-due' : 'amt-paid'}">${fmt(balance)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="sec-title">Payment Details</div>
  <div class="info-grid">
    <div class="info-item"><label>Payment Method</label><span>${cap(payment.method)}</span></div>
    <div class="info-item"><label>Payment Date</label><span>${fmtDate(payment.paid_at)}</span></div>
    ${payment.razorpay_payment_id ? `<div class="info-item"><label>Transaction ID</label><span style="font-size:11px">${payment.razorpay_payment_id}</span></div>` : ''}
    <div class="info-item"><label>Receipt No</label><span>${receipt_no}</span></div>
  </div>

  <hr>

  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised Signatory</div>
    </div>
    <div class="stamp">PAID</div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Principal / Director</div>
    </div>
  </div>

  <div class="footer">
    This is a computer-generated document · ${SCHOOL.name} ERP · ${SCHOOL.address}
  </div>
</div>`

    openPrintWindow(html, `Receipt ${receipt_no}`)
}

export const printInvoicePDF = ({ inv, student }) => {
    const balance = inv.balance_paise !== undefined ? inv.balance_paise : Math.max(0, (inv.amount_paise || 0) - (inv.paid_paise || 0))
    const statusBadge = inv.status === 'paid'
        ? '<span class="badge-paid">● PAID</span>'
        : inv.status === 'partial'
            ? '<span class="badge-partial">◐ PARTIAL</span>'
            : '<span class="badge-pending">○ PENDING</span>'

    const stampClass = inv.status === 'paid' ? 'stamp' : 'stamp stamp-pending'
    const stampText = inv.status === 'paid' ? 'PAID' : inv.status === 'partial' ? 'PARTIAL' : 'DUE'
    const watermarkText = inv.status === 'paid' ? 'PAID' : 'UNPAID'

    const html = `
<div class="watermark">${watermarkText}</div>
<div class="doc">
  <div class="hdr">
    <div class="hdr-left">
      <img src="${SCHOOL.logo}" class="logo" alt="Logo" onerror="this.style.display='none'">
      <div>
        <div class="school-name">${SCHOOL.name}</div>
        <div class="motto">${SCHOOL.motto}</div>
        <div class="addr">${SCHOOL.address}<br>${SCHOOL.phone} · ${SCHOOL.email}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="doc-label">Fee Invoice</div>
      <div class="doc-no">${inv.invoice_no}</div>
      <div class="doc-date">Due: ${fmtDate(inv.due_date)}</div>
      <div>${statusBadge}</div>
    </div>
  </div>

  <div class="sec-title">Billed To</div>
  <div class="info-grid">
    <div class="info-item"><label>Student Name</label><span>${student.full_name}</span></div>
    <div class="info-item"><label>Admission No</label><span>${student.admission_no}</span></div>
    <div class="info-item"><label>Class &amp; Section</label><span>${student.class_name}-${student.section}</span></div>
    ${student.guardian_name ? `<div class="info-item"><label>Guardian Name</label><span>${student.guardian_name}</span></div>` : ''}
  </div>

  <div class="sec-title">Invoice Details</div>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width:40%">Description</th>
        <th>Term</th>
        <th>Due Date</th>
        <th class="tr">Amount</th>
        <th class="tr">Paid</th>
        <th class="tr">Balance Due</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:700">${inv.title}</td>
        <td>${inv.term || '—'}</td>
        <td>${fmtDate(inv.due_date)}</td>
        <td class="tr">${fmt(inv.amount_paise)}</td>
        <td class="tr amt-paid">${fmt((inv.paid_paise || 0))}</td>
        <td class="tr ${balance > 0 ? 'amt-due' : 'amt-paid'}">${fmt(balance)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="color:#64748b;font-size:11px;font-weight:600">Total Outstanding</td>
        <td class="tr">${fmt(inv.amount_paise)}</td>
        <td class="tr amt-paid">${fmt((inv.paid_paise || 0))}</td>
        <td class="tr amount-main ${balance > 0 ? 'amt-due' : 'amt-paid'}">${fmt(balance)}</td>
      </tr>
    </tfoot>
  </table>

  ${balance > 0 ? `
  <div style="margin-top:16px;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px">
    <span style="font-size:11px;font-weight:900;color:#9a3412;letter-spacing:.05em">PAYMENT DUE</span>
    <span style="font-size:20px;font-weight:900;color:#c2410c">${fmt(balance)}</span>
    <span style="font-size:10px;color:#9a3412;margin-left:auto">Please pay by ${fmtDate(inv.due_date)}</span>
  </div>
  <div style="margin-top:8px;font-size:10px;color:#94a3b8;padding-left:4px">
    Pay online via the student portal or contact the school office for cash/cheque payment.
  </div>` : ''}

  <hr>

  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Accounts Department</div>
    </div>
    <div class="${stampClass}">${stampText}</div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Principal / Director</div>
    </div>
  </div>

  <div class="footer">
    This is a computer-generated document · ${SCHOOL.name} ERP · ${SCHOOL.address}
  </div>
</div>`

    openPrintWindow(html, `Invoice ${inv.invoice_no}`)
}

const toWhatsAppNumber = (raw) => {
    if (!raw) return null
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return digits
    if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
    return digits.length >= 10 ? digits : null
}

export const shareReceiptWhatsApp = (data) => {
    const { receipt_no, issued_at, student, profile, invoice, payment } = data
    const balance = Math.max(0, (invoice.amount_paise || 0) - (invoice.paid_paise || 0))
    const waNum = toWhatsAppNumber(profile.guardian_phone)

    const lines = [
        `*Fee Receipt — ${receipt_no}*`,
        `_${SCHOOL.name}_`,
        '',
        `Dear ${profile.guardian_name || 'Guardian'} (guardian of ${student.full_name}),`,
        '',
        `A fee payment has been successfully recorded.`,
        '',
        `*Student Details*`,
        `• Name: ${student.full_name}`,
        `• Admission No: ${profile.admission_no}`,
        `• Class: ${profile.class_name}-${profile.section}`,
        '',
        `*Payment Details*`,
        `• Invoice: ${invoice.title}${invoice.term ? ` (${invoice.term})` : ''}`,
        `• Invoice No: ${invoice.invoice_no}`,
        `• Amount Paid: ${fmt(payment.amount_paise)}`,
        `• Payment Method: ${cap(payment.method)}`,
        `• Date: ${fmtDate(payment.paid_at)}`,
        ...(balance > 0 ? [`• Balance Due: ${fmt(balance)}`] : [`• Status: PAID ✓`]),
        '',
        `For queries, contact us at ${SCHOOL.phone}`,
        `_${SCHOOL.name} · ${SCHOOL.address}_`,
    ]

    const message = encodeURIComponent(lines.join('\n'))
    const url = waNum
        ? `https://wa.me/${waNum}?text=${message}`
        : `https://wa.me/?text=${message}`

    window.open(url, '_blank', 'noopener,noreferrer')
    return !!waNum
}
