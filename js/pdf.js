let lastGeneratedQuotePdfBlob = null;
let lastGeneratedQuotePdfName = "";

function pdfMoney(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function pdfText(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function pdfNumber(id) {
  const el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}

function safePdfFileName(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

function getPdfJsPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("The PDF library did not load. Refresh the page and try again.");
  }
  return window.jspdf.jsPDF;
}

function getSelectedPdfDeals(r) {
  const combine = checked("combine") === "yes";
  const trade = r.totalTradeValue;
  const payoff = r.totalPayoff;
  const leaseMisc = pdfNumber("miscFee") + pdfNumber("afterSell1") + pdfNumber("afterSell2") + pdfNumber("acquisitionFee") + r.d.cashBack;
  const financeMisc = pdfNumber("miscFee") + pdfNumber("afterSell1") + pdfNumber("afterSell2") + r.d.cashBack;
  const milesEl = document.getElementById("includedMiles");
  const miles = milesEl ? milesEl.options[milesEl.selectedIndex].text : "";

  function discountRows(incentives, details) {
    if (combine) return [["Discounts & Incentives", pdfMoney(r.d.discount + incentives)]];
    const rows = [["Discounts", pdfMoney(r.d.discount)], ["Incentives", pdfMoney(incentives)]];
    details.forEach(item => rows.push(["  " + item.name, pdfMoney(item.amount)]));
    return rows;
  }

  const deals = [];

  if (isShown("displayLease")) {
    const onePay = r.leaseType === "onepay";
    const totalLeaseCost = (r.leasePayment * r.leaseMonths) + Math.max(r.leaseDue - r.leasePayment, 0);
    deals.push({
      title: "LEASE", color: [28,105,212],
      payment: pdfMoney(onePay ? r.onePayAmount : r.leasePayment),
      paymentLabel: onePay ? "ONE-PAY LEASE" : "PER MONTH",
      subPayment: onePay ? "Equivalent Monthly: " + pdfMoney(r.onePayEquivalentMonthly) : "",
      dueUpFront: pdfMoney(onePay ? r.onePayAmount : r.leaseDue),
      rows: [
        ["MSRP / Market Value", pdfMoney(r.d.msrp)],
        ...discountRows(r.d.leaseIncentives, r.d.leaseIncentiveDetails),
        ["Adjusted Price", pdfMoney(r.d.leaseSellingPrice)],
        ["Trade Value", pdfMoney(trade)], ["Subtotal", pdfMoney(r.d.leaseSellingPrice - trade)],
        ["Vehicle Payoff", pdfMoney(payoff)], ["Sales Tax", pdfMoney(r.leaseUpfrontTax)],
        ["Registration Fees", pdfMoney(pdfNumber("regFees"))], ["Documentation Fees", pdfMoney(pdfNumber("docFee"))],
        ["Miscellaneous Fees", pdfMoney(leaseMisc)], ["Cash Down", "-" + pdfMoney(r.d.cashDown)],
        ["Net Capitalized Cost", pdfMoney(r.leaseCapCost), "total"], ["Term", r.leaseMonths + " months"],
        ["Included Miles", miles === "Select Miles" ? "" : miles], ["Residual Value", pdfMoney(r.residual)],
        ["Money Factor", r.moneyFactor.toFixed(5)], ["Total Lease Cost", pdfMoney(totalLeaseCost), "highlight"]
      ]
    });
  }

  if (isShown("displayRetail")) {
    const interest = Math.max((r.retailPayment * r.financeMonths) - r.retailFinanceAmount, 0);
    const totalPaid = (r.retailPayment * r.financeMonths) + r.d.cashDown;
    deals.push({
      title: "RETAIL FINANCE", color: [46,139,87], payment: pdfMoney(r.retailPayment), paymentLabel: "PER MONTH", subPayment: "", dueUpFront: pdfMoney(r.d.cashDown),
      rows: [
        ["MSRP / Market Value", pdfMoney(r.d.msrp)], ...discountRows(r.d.retailIncentives, r.d.retailIncentiveDetails),
        ["Adjusted Price", pdfMoney(r.d.retailSellingPrice)], ["Trade Value", pdfMoney(trade)],
        ["Subtotal", pdfMoney(r.d.retailSellingPrice - trade)], ["Vehicle Payoff", pdfMoney(payoff)],
        ["Sales Tax", pdfMoney(r.retailSalesTax)], ["Registration Fees", pdfMoney(pdfNumber("regFees"))],
        ["Documentation Fees", pdfMoney(pdfNumber("docFee"))], ["Miscellaneous Fees", pdfMoney(financeMisc)],
        ["Cash Down", "-" + pdfMoney(r.d.cashDown)], ["Amount Financed", pdfMoney(r.retailFinanceAmount), "total"],
        ["Term", r.financeMonths + " months"], ["Interest Rate", r.aprRate.toFixed(2) + "%"],
        ["Estimated Interest Paid", pdfMoney(interest)], ["Total of Payments", pdfMoney(totalPaid), "highlight"]
      ]
    });
  }

  if (isShown("displaySelect")) {
    const totalPaid = (r.selectPayment * r.selectMonths) + r.balloon + r.d.cashDown;
    deals.push({
      title: "SELECT FINANCING", color: [230,126,34], payment: pdfMoney(r.selectPayment), paymentLabel: "PER MONTH", subPayment: "", dueUpFront: pdfMoney(r.d.cashDown),
      rows: [
        ["MSRP / Market Value", pdfMoney(r.d.msrp)], ...discountRows(r.d.selectIncentives, r.d.selectIncentiveDetails),
        ["Adjusted Price", pdfMoney(r.d.selectSellingPrice)], ["Trade Value", pdfMoney(trade)],
        ["Subtotal", pdfMoney(r.d.selectSellingPrice - trade)], ["Vehicle Payoff", pdfMoney(payoff)],
        ["Sales Tax", pdfMoney(r.selectSalesTax)], ["Registration Fees", pdfMoney(pdfNumber("regFees"))],
        ["Documentation Fees", pdfMoney(pdfNumber("docFee"))], ["Miscellaneous Fees", pdfMoney(financeMisc)],
        ["Cash Down", "-" + pdfMoney(r.d.cashDown)], ["Amount Financed", pdfMoney(r.selectFinanceAmount), "total"],
        ["Term", r.selectMonths + " months"], ["Interest Rate", r.selectApr.toFixed(2) + "%"],
        ["Final Balloon Payment", pdfMoney(r.balloon)], ["Total of Payments", pdfMoney(totalPaid), "highlight"]
      ]
    });
  }
  return deals;
}

function buildQuotePdfDocument() {
  calculateAll();
  const r = window.currentQuoteResults;
  if (!r) throw new Error("The quote has not finished calculating.");
  const deals = getSelectedPdfDeals(r);
  if (!deals.length) throw new Error("Select at least one deal type before generating the PDF.");

  const jsPDF = getPdfJsPdf();
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter", compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const margin = 24, gap = 8, usable = W - margin * 2, cardW = (usable - gap * (deals.length - 1)) / deals.length;

  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(15,47,87);
  doc.text("BMW of Peabody - Payment Comparison", margin, 27);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30,30,30);

  const left = ["Client: " + pdfText("customerName"), pdfText("customerEmail") ? "Email: " + pdfText("customerEmail") : "", pdfText("salesperson") ? "Prepared by: " + pdfText("salesperson") : ""].filter(Boolean);
  const right = ["Vehicle: " + pdfText("vehicle"), pdfText("vin") ? "VIN: " + pdfText("vin") : "", "Quote: " + pdfText("quoteNumber") + (pdfText("quoteDate") ? "   Date: " + pdfText("quoteDate") : "")].filter(Boolean);
  let y = 41; left.forEach(line => { doc.text(line, margin, y); y += 10; });
  y = 41; right.forEach(line => { doc.text(line, W - margin, y, {align:"right"}); y += 10; });
  doc.setDrawColor(200,210,220); doc.line(margin,68,W-margin,68);

  const top = 77, bottom = H - 34, height = bottom - top;
  deals.forEach((deal, i) => {
    const x = margin + i * (cardW + gap), ix = x + 7, iw = cardW - 14, valueX = x + cardW - 8, labelW = iw * .61;
    doc.setDrawColor(...deal.color); doc.setLineWidth(1); doc.roundedRect(x,top,cardW,height,6,6);
    doc.setFillColor(...deal.color); doc.roundedRect(x,top,cardW,25,6,6,"F"); doc.rect(x,top+18,cardW,7,"F");
    doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255); doc.setFontSize(deals.length === 1 ? 14 : 11); doc.text(deal.title,x+cardW/2,top+17,{align:"center"});
    doc.setFillColor(15,47,87); doc.rect(x,top+25,cardW,42,"F"); doc.setFontSize(deals.length === 1 ? 25 : 20); doc.text(deal.payment,x+cardW/2,top+49,{align:"center"});
    doc.setFontSize(7.5); doc.text(deal.paymentLabel,x+cardW/2,top+61,{align:"center"});
    let rowY = top + 78;
    if (deal.subPayment) { doc.setFont("helvetica","normal"); doc.setTextColor(15,47,87); doc.setFontSize(7.2); doc.text(deal.subPayment,x+cardW/2,rowY,{align:"center"}); rowY += 10; }
    doc.setFillColor(238,244,250); doc.roundedRect(ix,rowY,iw,18,4,4,"F"); doc.setTextColor(...deal.color); doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.text("Total Due Up Front",ix+5,rowY+12); doc.text(deal.dueUpFront,valueX-3,rowY+12,{align:"right"}); rowY += 24;
    const rowH = Math.min(14, Math.max(10.2, (bottom - rowY - 8) / deal.rows.length));
    deal.rows.forEach(row => {
      const label = String(row[0]), value = String(row[1]), style = row[2] || "";
      if (style === "total") { doc.setDrawColor(15,47,87); doc.setLineWidth(1.1); doc.line(ix,rowY-7,x+cardW-7,rowY-7); }
      if (style === "highlight") { doc.setFillColor(242,246,250); doc.rect(ix,rowY-7.5,iw,rowH,"F"); }
      doc.setFont("helvetica", style ? "bold" : "normal"); doc.setTextColor(style === "total" ? deal.color[0] : 35, style === "total" ? deal.color[1] : 35, style === "total" ? deal.color[2] : 35);
      let fs = deals.length === 1 ? 9 : 7.2; doc.setFontSize(fs); while (doc.getTextWidth(label) > labelW && fs > 5.7) { fs -= .2; doc.setFontSize(fs); }
      doc.text(label,ix,rowY); doc.setFont("helvetica","bold"); doc.setFontSize(deals.length === 1 ? 9 : 7.2); doc.text(value,valueX,rowY,{align:"right"});
      if (style !== "highlight") { doc.setDrawColor(226,232,238); doc.setLineWidth(.4); doc.line(ix,rowY+3.5,x+cardW-7,rowY+3.5); }
      rowY += rowH;
    });
  });

  doc.setFont("helvetica","normal"); doc.setFontSize(6.6); doc.setTextColor(70,80,90);
  const footer = "Lease due at signing includes the first monthly payment. Select financing includes a final balloon payment. Every effort is made to ensure the accuracy of this quote; pricing and calculations remain subject to final lender and contract approval.";
  doc.text(doc.splitTextToSize(footer,W-margin*2),margin,H-15);
  const base = safePdfFileName(pdfText("quoteNumber")) || safePdfFileName(pdfText("customerName")) || "BMW_Quote";
  return {doc, fileName: base + ".pdf"};
}

function createQuotePdfBlob() { const built = buildQuotePdfDocument(); const blob = built.doc.output("blob"); lastGeneratedQuotePdfBlob = blob; lastGeneratedQuotePdfName = built.fileName; return {blob, fileName: built.fileName, doc: built.doc}; }
function downloadQuotePdf() { try { const built = buildQuotePdfDocument(); lastGeneratedQuotePdfBlob = built.doc.output("blob"); lastGeneratedQuotePdfName = built.fileName; built.doc.save(built.fileName); } catch(e) { alert(e.message); console.error(e); } }
function printQuotePdf() { try { const g = createQuotePdfBlob(), url = URL.createObjectURL(g.blob), w = window.open(url,"_blank"); if (!w) throw new Error("Allow pop-ups and try again."); setTimeout(() => { w.focus(); w.print(); },900); setTimeout(() => URL.revokeObjectURL(url),60000); } catch(e) { alert(e.message); console.error(e); } }
async function emailQuotePdf() { try { const g = createQuotePdfBlob(), email = pdfText("customerEmail"), name = pdfText("customerName") || "Customer", file = new File([g.blob],g.fileName,{type:"application/pdf"}); if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) { await navigator.share({title:"BMW Quote for " + name,text:"Attached is your BMW payment comparison.",files:[file]}); return; } const built = buildQuotePdfDocument(); built.doc.save(built.fileName); const subject=encodeURIComponent("BMW Payment Comparison"), body=encodeURIComponent("Hi " + name + ",\n\nAttached is your BMW payment comparison. The PDF has been downloaded to this device; please attach it to this email.\n\nThank you."); window.location.href="mailto:"+encodeURIComponent(email)+"?subject="+subject+"&body="+body; } catch(e) { if (e && e.name === "AbortError") return; alert(e.message); console.error(e); } }
