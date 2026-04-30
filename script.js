// MAIN TABS
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById("panel-" + target).classList.add("active");
  });
});

// SUBTABS (AISLADAS POR PANEL)
document.querySelectorAll(".panel").forEach(panel => {
  const subtabs = panel.querySelectorAll(".subtab");
  const subpanels = panel.querySelectorAll(".subpanel");

  if (!subtabs.length) return;

  subtabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.sub;

      subtabs.forEach(t => t.classList.remove("active"));
      subpanels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      panel
        .querySelector(`.subpanel[data-subpanel="${target}"]`)
        ?.classList.add("active");
    });
  });
});