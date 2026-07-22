window.addEventListener("error", function(event) {
  console.error("BMW Quote Pro error:", event.error || event.message);

  const status = document.getElementById("connectionStatus");
  if (status) {
    status.textContent = "Application error — check browser console";
    status.classList.add("error");
  }
});

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll(".tab-button").forEach(function(button) {
    button.addEventListener("click", function() {
      showTab(button.dataset.tab);
    });
  });

  document.querySelectorAll("input, select, textarea").forEach(function(element) {
    if (["supabaseUrl", "supabaseKey", "authEmail", "authPassword",
         "savedQuoteSearch", "savedStatusFilter", "presetName"].includes(element.id)) {
      return;
    }

    element.addEventListener("input", calculateAll);
    element.addEventListener("change", calculateAll);
  });

  setDefaultQuoteDate();
  refreshPresetList();
  initializeSupabase();
  calculateAll();
});
