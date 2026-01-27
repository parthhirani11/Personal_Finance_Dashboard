import express from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

const router = express.Router();

function normalize(t) {
    return {
        type: t.type,
        amount: t.amount,
        recipient: t.person || '-',
        category: t.description || '-',
        tags: Array.isArray(t.tags) ? t.tags.join(', ') : '-',
        date: dayjs(t.date).format('YYYY-MM-DD')
    };
}

// ================= CSV =================
router.post('/export/csv', (req, res) => {
    const data = req.body.data.map(normalize);
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
});

// ================= EXCEL =================
router.post('/export/xlsx', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transactions');

    sheet.columns = [
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Recipient', key: 'recipient', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Tags', key: 'tags', width: 30 },
        { header: 'Date', key: 'date', width: 15 }
    ];

    req.body.data.map(normalize).forEach(row => sheet.addRow(row));

    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

// ================= PDF =================

router.post('/export/pdf', (req, res) => {
    // const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=transactions.pdf"
    );

    doc.pipe(res);

      // Unicode font (IMPORTANT)
  
    /* ================= TITLE ================= */
    doc.fontSize(18).text("Transactions Report", { align: "center" });
    doc.moveDown(2);

    /* ================= TABLE CONFIG ================= */
    const tableTop = 120;
    const rowHeight = 25;

    const columnX = {
        sr: 40,
        type: 70,
        amount: 120,
        recipient: 190,
        category: 300,
        tags: 380,
        date: 470
    };

    /* ================= TABLE HEADER ================= */
    doc.fontSize(11).font("Helvetica-Bold");

    doc.text("No", columnX.sr, tableTop);
    doc.text("Type", columnX.type, tableTop);
    doc.text("Amount", columnX.amount, tableTop);
    doc.text("Recipient", columnX.recipient, tableTop);
    doc.text("Category", columnX.category, tableTop);
    doc.text("Tags", columnX.tags, tableTop);
    doc.text("Date", columnX.date, tableTop);

    doc.moveTo(40, tableTop + 18)
       .lineTo(555, tableTop + 18)
       .stroke();

    /* ================= TABLE ROWS ================= */
    doc.font("Helvetica");

    let y = tableTop + rowHeight;

    req.body.data.map(normalize).forEach((t, index) => {

        // Page break handling
        if (y > 750) {
            doc.addPage();
            y = 60;
        }

        doc.text(index + 1, columnX.sr, y);
        doc.text(t.type, columnX.type, y);
        doc.text(`INR  ${t.amount}`, columnX.amount, y);
        doc.text(t.recipient || "-", columnX.recipient, y, { width: 100 });
        doc.text(t.category || "-", columnX.category, y);
        doc.text(t.tags || "-", columnX.tags, y, { width: 80 });
        doc.text(t.date, columnX.date, y);

        // Row line
        doc.moveTo(40, y + 18)
           .lineTo(555, y + 18)
           .strokeColor("#cccccc")
           .stroke();

        y += rowHeight;
    });

    doc.end();
});

export default router;