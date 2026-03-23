/**
 * SmartAssignment — ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen — https://oryxen.tech/
 *
 * utils.js
 * Helpers shared across modules + global CONFIG constants.
 */
(function () {
  const ns = (window.__SN_SMART_ASSIGNMENT__ = window.__SN_SMART_ASSIGNMENT__ || {});

  // Shared constants
  ns.CONFIG = {
    BUTTON_ID: "sn-smart-assignment-trigger",
    PANEL_ID: "sn-smart-assignment-panel",
    TOAST_ID: "sn-smart-assignment-toast",
    STORAGE_KEY: "sn_assignment_state",
    POSITION_STORAGE_KEY: "sn_assignment_launcher_position"
  };

  const utils = (ns.utils = ns.utils || {});
  const runtime = (ns.runtime = ns.runtime || {});

  /** Promise-based delay helper (used for polling and UX timing). */
  utils.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Console logger with a stable prefix for easier filtering in DevTools. */
  utils.log = (...args) => {
    console.log("[SN Smart Email]", ...args);
  };

  utils.debug = (label, data) => {
    console.log("[SN Smart Email]", label, data);
  };

  /**
   * Normalize values coming from ServiceNow fields / DOM.
   * - Converts null/undefined to ""
   * - Filters literal strings "null"/"undefined"
   */
  utils.cleanValue = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value).trim();
    return text === "undefined" || text === "null" ? "" : text;
  };

  /**
   * Normalized text used for keyword detection:
   * - lowercase
   * - remove accents/diacritics
   * - collapse whitespace
   */
  utils.normalize = (text) => {
    return utils
      .cleanValue(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  utils.extractUriFromLocation = (href) => {
    const raw = utils.cleanValue(href);
    if (!raw) return "";

    try {
      const url = new URL(raw, window.location.origin);
      const nested = url.searchParams.get("uri");
      return nested ? decodeURIComponent(nested) : raw;
    } catch (e) {
      const match = raw.match(/[?&]uri=([^&]+)/i);
      return match ? decodeURIComponent(match[1]) : raw;
    }
  };

  utils.createRecordKey = ({ table, sysId }) => {
    return [utils.cleanValue(table) || "unknown", utils.cleanValue(sysId) || "unknown"].join(":");
  };

  utils.getRuntimeState = () => {
    runtime.state = runtime.state || {
      mountedRecordKey: "",
      mountedPageKey: "",
      activeRecordKey: "",
      pending: false,
      currentPanel: "",
      lastUser: null,
      lastMail: null,
      lastDebugFields: null,
      lastTemplateType: "",
      locks: {}
    };

    return runtime.state;
  };

  utils.clearRuntimeState = (options = {}) => {
    const { preserveMount = true } = options;
    const state = utils.getRuntimeState();
    const mountedRecordKey = preserveMount ? state.mountedRecordKey : "";
    const mountedPageKey = preserveMount ? state.mountedPageKey : "";

    runtime.state = {
      mountedRecordKey,
      mountedPageKey,
      activeRecordKey: "",
      pending: false,
      currentPanel: "",
      launcherVisible: true,
      lastUser: null,
      lastMail: null,
      lastDebugFields: null,
      lastTemplateType: "",
      locks: {}
    };

    try {
      sessionStorage.removeItem(ns.CONFIG.STATE_STORAGE_KEY);
      sessionStorage.removeItem(ns.CONFIG.STORAGE_KEY);
    } catch (e) {}

    utils.log("State cleared", { preserveMount, mountedRecordKey, mountedPageKey });
    return runtime.state;
  };

  utils.persistRuntimeState = () => {
    try {
      const state = utils.getRuntimeState();
      sessionStorage.setItem(
        ns.CONFIG.STATE_STORAGE_KEY,
        JSON.stringify({
            activeRecordKey: state.activeRecordKey,
            lastTemplateType: state.lastTemplateType,
            pending: state.pending,
            launcherVisible: state.launcherVisible !== false
          })
      );
    } catch (e) {}
  };
})();
