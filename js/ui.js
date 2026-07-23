function showTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach(function(panel) {
    panel.classList.toggle("active", panel.id === tabId);
  });

  document.querySelectorAll(".tab-button").forEach(function(button) {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  if (tabId === "resultsTab") {
    calculateAll();
  }

  if (tabId === "savedTab" && currentUser) loadSavedQuotes();
  if (tabId === "dashboardTab" && currentUser) loadDashboard();
  if (tabId === "clientsTab" && currentUser) loadClients();
  if (tabId === "emailTab") {
    prepareEmailFromCurrentQuote();
    if (currentUser) loadEmailHistory();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setDefaultQuoteDate() {
  const dateField = document.getElementById("quoteDate");

  if (dateField && !dateField.value) {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );

    dateField.value = localDate.toISOString().slice(0, 10);
  }
}

function printWorksheet() {
  document.body.classList.remove("print-quote");
  document.body.classList.add("print-worksheet");
  window.print();
}

function printQuote() {
  calculateAll();
  showTab("resultsTab");
  document.body.classList.remove("print-worksheet");
  document.body.classList.add("print-quote");
  window.print();
}

window.addEventListener("afterprint", function() {
  document.body.classList.remove("print-worksheet", "print-quote");
});


async function createQuotePdf() {
  try {
    calculateAll();

    if (typeof html2pdf === "undefined") {
      throw new Error("PDF library did not load. Refresh the page and try again.");
    }

    const source = document.querySelector("#resultsTab .breakdown-results");
    if (!source) throw new Error("Quote results could not be found.");

    const clone = source.cloneNode(true);
    clone.classList.add("pdf-export-container");

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-100000px";
    wrapper.style.top = "0";
    wrapper.style.width = "10.56in";
    wrapper.style.background = "#fff";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const quoteNumber = document.getElementById("quoteNumber").value.trim() || "BMW-Quote";
    const customer = document.getElementById("customerName").value.trim().replace(/[^a-z0-9]+/gi, "-");
    const filename = (customer ? customer + "-" : "") + quoteNumber + ".pdf";

    await html2pdf().set({
      margin: [0.22, 0.22, 0.22, 0.22],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    }).from(clone).save();

    wrapper.remove();
    if (typeof showToast === "function") showToast("Quote PDF downloaded.", "success");
    const emailStatus = document.getElementById("emailMessageStatus");
    if (emailStatus) {
      emailStatus.textContent = "PDF downloaded. Attach it manually after Gmail or your email application opens.";
      emailStatus.className = "database-message success";
    }
  } catch (error) {
    console.error("PDF creation failed:", error);
    if (typeof showToast === "function") showToast(error.message || "PDF creation failed.", "error");
  }
}

function clearForm() {
  currentQuoteId = null;
  currentCustomerId = null;
  showCurrentRecord(null);

  document.querySelectorAll("input").forEach(function(input) {
    if (
      input.type === "radio" ||
      input.type === "checkbox" ||
      input.readOnly
    ) {
      return;
    }

    input.value = "";
  });

  const defaults = {
    leaseMonths: "36",
    financeMonths: "60",
    selectMonths: "60",
    acquisitionFee: "925",
    regFees: "135",
    docFee: "595",
    includedMiles: "0"
  };

  Object.entries(defaults).forEach(function(entry) {
    const element = document.getElementById(entry[0]);
    if (element) element.value = entry[1];
  });

  const notes = document.getElementById("quoteNotes");
  if (notes) notes.value = "";
  const customerIdDisplay = document.getElementById("customerIdDisplay");
  if (customerIdDisplay) customerIdDisplay.value = "";

  const combineNo = document.querySelector(
    'input[name="combine"][value="no"]'
  );
  if (combineNo) combineNo.checked = true;

  const feesYes = document.querySelector(
    'input[name="feesIncluded"][value="yes"]'
  );
  if (feesYes) feesYes.checked = true;

  const standardLease = document.querySelector(
    'input[name="leaseType"][value="standard"]'
  );
  if (standardLease) standardLease.checked = true;

  const cashPurchase = document.getElementById("cashPurchase");
  if (cashPurchase) cashPurchase.checked = false;

  [
    "displayLease",
    "displayRetail",
    "displaySelect",
    "showLeaseDetails",
    "showRetailRate",
    "showSelectDetails"
  ].forEach(function(id) {
    const element = document.getElementById(id);
    if (element) element.checked = true;
  });

  setDefaultQuoteDate();
  calculateAll();
}
