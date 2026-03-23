/**
 * SmartAssignment - STANDALONE VERSION
 * For local testing without GitHub
 * 
 * USAGE:
 * 1. Copy ALL .js files to your local server or use file:// URLs
 * 2. Update BASE_URL below
 * 3. Create bookmarklet with this code
 * 
 * OR: Just paste this entire file content into browser console
 */

// === CONFIGURATION ===
// For local testing, you can use file:// URLs or localhost
const BASE_URL = "file:///C:/Projects/SmartAssignment/"; // Change this!
// const BASE_URL = "http://localhost:8000/SmartAssignment/"; // Or use local server

// === LOADER ===
(async function () {
  const modules = [
    "utils.js",
    "servicenow.js",
    "assignment-rules.js",
    "assignment-ui.js",
    "assignment-core.js"
  ];

  console.log("[SmartAssignment] Loading modules from:", BASE_URL);

  try {
    for (const module of modules) {
      const url = BASE_URL + module;
      console.log(`[SmartAssignment] Fetching: ${module}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${module}: ${response.status}`);
      }

      const code = await response.text();
      (0, eval)(code);
      
      console.log(`[SmartAssignment] Loaded: ${module}`);
    }

    if (window.__SN_SMART_ASSIGNMENT__ && window.__SN_SMART_ASSIGNMENT__.core) {
      window.__SN_SMART_ASSIGNMENT__.core.init();
      console.log("[SmartAssignment] Initialized successfully! 🎯");
    } else {
      throw new Error("Core module not loaded properly");
    }

  } catch (error) {
    console.error("[SmartAssignment] Loading failed:", error);
    alert(`SmartAssignment failed to load: ${error.message}`);
  }
})();
