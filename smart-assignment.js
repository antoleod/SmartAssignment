/**
 * SmartAssignment - ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen - https://oryxen.tech/
 *
 * smart-assignment.js
 * Bookmarklet loader - downloads and executes modules from GitHub Raw
 */
(async function () {
  const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/antoleod/SmartAssignment/main/";
  const CACHE_BUSTER = `?t=${Date.now()}`;

  const modules = [
    "utils.js",
    "servicenow.js",
    "assignment-rules.js",
    "assignment-ui.js",
    "assignment-core.js"
  ];

  console.log("[SmartAssignment] Loading modules...");

  try {
    // Load modules sequentially
    for (const module of modules) {
      const url = GITHUB_RAW_BASE + module + CACHE_BUSTER;
      console.log(`[SmartAssignment] Fetching: ${module}`);

      const response = await fetch(url, { cache: "no-store" });
      
      if (!response.ok) {
        throw new Error(`Failed to load ${module}: ${response.status}`);
      }

      const code = await response.text();
      
      // Execute in global scope
      (0, eval)(code);
      
      console.log(`[SmartAssignment] Loaded: ${module}`);
    }

    // Initialize the tool
    if (window.__SN_SMART_ASSIGNMENT__ && window.__SN_SMART_ASSIGNMENT__.core) {
      window.__SN_SMART_ASSIGNMENT__.core.init();
      console.log("[SmartAssignment] Initialized successfully! 🎯");
    } else {
      throw new Error("Core module not loaded properly");
    }

  } catch (error) {
    console.error("[SmartAssignment] Loading failed:", error);
    
    // Show error toast
    const toast = document.createElement("div");
    toast.textContent = `SmartAssignment failed to load: ${error.message}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d32f2f;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-family: sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }
})();
