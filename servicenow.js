/**
 * SmartAssignment - ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen - https://oryxen.tech/
 *
 * servicenow.js
 * ServiceNow integration:
 * - frames-safe DOM access
 * - g_form discovery
 * - table/record detection
 * - table-specific context resolution
 */
(function () {
  const ns = (window.__SN_SMART_ASSIGNMENT__ = window.__SN_SMART_ASSIGNMENT__ || {});
  const { CONFIG } = ns;
  const utils = ns.utils || {};

  const servicenow = (ns.servicenow = ns.servicenow || {});

  servicenow.getAllDocs = () => {
    const docs = [document];

    for (let i = 0; i < window.frames.length; i++) {
      try {
        const frameDoc = window.frames[i].document;
        if (frameDoc && !docs.includes(frameDoc)) docs.push(frameDoc);
      } catch (e) {}
    }

    return docs;
  };

  servicenow.getAllWindows = () => {
    const wins = [window];

    for (let i = 0; i < window.frames.length; i++) {
      try {
        const w = window.frames[i];
        if (w && !wins.includes(w)) wins.push(w);
      } catch (e) {}
    }

    return wins;
  };

  servicenow.getBestGForm = () => {
    const wins = servicenow.getAllWindows();

    for (const w of wins) {
      try {
        if (!w.g_form || typeof w.g_form.getValue !== "function") continue;

        const tableName = utils.cleanValue(w.g_form.getTableName && w.g_form.getTableName());
        const number = utils.cleanValue(w.g_form.getValue("number"));
        const shortDesc = utils.cleanValue(w.g_form.getValue("short_description"));

        if (tableName || number || shortDesc) return w.g_form;
      } catch (e) {}
    }

    return null;
  };

  servicenow.safeGetField = (name) => {
    try {
      const gf = servicenow.getBestGForm();
      if (gf && typeof gf.getValue === "function") {
        return utils.cleanValue(gf.getValue(name));
      }
    } catch (e) {
      utils.log(`safeGetField failed for ${name}`, e);
    }

    return "";
  };

  servicenow.safeGetDisplayValue = (name) => {
    try {
      const gf = servicenow.getBestGForm();
      if (gf && typeof gf.getDisplayValue === "function") {
        return utils.cleanValue(gf.getDisplayValue(name));
      }
    } catch (e) {
      utils.log(`safeGetDisplayValue failed for ${name}`, e);
    }

    return "";
  };

  servicenow.getFirstExistingValue = (selectors) => {
    const docs = servicenow.getAllDocs();

    for (const doc of docs) {
      for (const selector of selectors) {
        try {
          const el = doc.querySelector(selector);
          if (!el) continue;

          const value = utils.cleanValue(el.value || el.innerText || el.textContent || "");
          if (value) return value;
        } catch (e) {}
      }
    }

    return "";
  };

  servicenow.getFieldDisplayValue = (fieldName) => {
    const escaped = fieldName.replace(/\./g, "\\.");

    return servicenow.getFirstExistingValue([
      `#sys_display\\.${escaped}`,
      `#${escaped}`,
      `input[id="sys_display.${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `input[name="${fieldName}"]`,
      `textarea[id="${fieldName}"]`,
      `textarea[name="${fieldName}"]`
    ]);
  };

  servicenow.detectTable = () => {
    const gf = servicenow.getBestGForm();

    try {
      const fromGForm = utils.cleanValue(gf && gf.getTableName && gf.getTableName());
      if (fromGForm) return fromGForm;
    } catch (e) {}

    const hrefs = servicenow
      .getAllWindows()
      .map((w) => {
        try {
          return utils.extractUriFromLocation(w.location.href);
        } catch (e) {
          return "";
        }
      })
      .filter(Boolean);

    for (const href of hrefs) {
      const patterns = [
        /(?:^|\/)(incident)\.do/i,
        /(?:^|\/)(sc_task)\.do/i,
        /(?:^|\/)(sc_req_item)\.do/i,
        /(?:^|\/)(sc_request)\.do/i,
        /(?:sysparm_table=)(incident|sc_task|sc_req_item|sc_request)/i,
        /(?:table=)(incident|sc_task|sc_req_item|sc_request)/i
      ];

      for (const pattern of patterns) {
        const match = href.match(pattern);
        if (match) return utils.cleanValue(match[1]).toLowerCase();
      }
    }

    const byDom = [
      { table: "incident", selectors: ['#incident\\.number', 'input[id="incident.number"]'] },
      { table: "sc_task", selectors: ['#sc_task\\.number', 'input[id="sc_task.number"]'] },
      { table: "sc_req_item", selectors: ['#sc_req_item\\.number', 'input[id="sc_req_item.number"]'] },
      { table: "sc_request", selectors: ['#sc_request\\.number', 'input[id="sc_request.number"]'] }
    ];

    for (const entry of byDom) {
      if (servicenow.getFirstExistingValue(entry.selectors)) return entry.table;
    }

    return "generic";
  };

  servicenow.getPageKey = () => {
    const wins = servicenow.getAllWindows();

    for (const w of wins) {
      try {
        const href = utils.extractUriFromLocation(w.location.href);
        if (href) return href.replace(/#.*$/, "");
      } catch (e) {}
    }

    return "";
  };

  servicenow.getSysId = () => {
    const gf = servicenow.getBestGForm();

    try {
      const fromGForm = utils.cleanValue(gf && gf.getUniqueValue && gf.getUniqueValue());
      if (fromGForm) return fromGForm;
    } catch (e) {}

    const hrefs = servicenow
      .getAllWindows()
      .map((w) => {
        try {
          return utils.extractUriFromLocation(w.location.href);
        } catch (e) {
          return "";
        }
      })
      .filter(Boolean);

    for (const href of hrefs) {
      const match = href.match(/[?&](?:sys_id|sysparm_sys_id)=([0-9a-f]{32})/i);
      if (match) return utils.cleanValue(match[1]);
    }

    return "";
  };

  servicenow.getRecordContext = () => {
    const table = servicenow.detectTable();
    const sysId = servicenow.getSysId();
    const pageKey = servicenow.getPageKey();
    const recordKey = utils.createRecordKey({ table, sysId });

    return { table, sysId, pageKey, recordKey };
  };

  servicenow.waitForPreviewButtonInAnyFrame = async (
    id,
    timeoutMs = CONFIG.PREVIEW_WAIT_MS,
    intervalMs = 250
  ) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const docs = servicenow.getAllDocs();

      for (const doc of docs) {
        try {
          const el = doc.getElementById(id);
          if (el) return { el, doc };
        } catch (e) {}
      }

      await utils.delay(intervalMs);
    }

    return null;
  };

  servicenow.findPopupInAnyFrame = () => {
    const docs = servicenow.getAllDocs();

    for (const doc of docs) {
      try {
        const pops = doc.querySelectorAll(
          '.popover,[role="dialog"],div[id^="popover"],.modal,.glide_box'
        );

        for (const popup of pops) {
          const html = popup.innerHTML || "";
          if (
            html.includes("sys_user.email") ||
            html.includes("sys_user.first_name") ||
            html.includes("sys_user.last_name")
          ) {
            return { popup, doc };
          }
        }
      } catch (e) {}
    }

    return null;
  };

  servicenow.waitForPopupInAnyFrame = async (
    timeoutMs = CONFIG.POPUP_WAIT_MS,
    intervalMs = 150
  ) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const found = servicenow.findPopupInAnyFrame();
      if (found) return found;
      await utils.delay(intervalMs);
    }

    return null;
  };

  servicenow.getPopupValue = (popup, selectors) => {
    for (const selector of selectors) {
      try {
        const el = popup.querySelector(selector);
        if (el && typeof el.value === "string" && el.value.trim()) {
          return utils.cleanValue(el.value);
        }
      } catch (e) {}
    }

    return "";
  };

  servicenow.getUserFromPopup = (popup) => {
    return {
      firstName: servicenow.getPopupValue(popup, [
        "#sys_readonly\\.sys_user\\.first_name",
        "#sys_user\\.first_name",
        'input[id="sys_readonly.sys_user.first_name"]',
        'input[id="sys_user.first_name"]'
      ]),
      lastName: servicenow.getPopupValue(popup, [
        "#sys_readonly\\.sys_user\\.last_name",
        "#sys_user\\.last_name",
        'input[id="sys_readonly.sys_user.last_name"]',
        'input[id="sys_user.last_name"]'
      ]),
      email: servicenow.getPopupValue(popup, [
        "#sys_readonly\\.sys_user\\.email",
        "#sys_user\\.email",
        'input[id="sys_readonly.sys_user.email"]',
        'input[id="sys_user.email"]'
      ])
    };
  };

  servicenow.hidePreview = (popup, popupDoc = document) => {
    if (!popup) return false;

    try {
      popup.style.display = "none";
      popup.style.visibility = "hidden";
      popup.style.opacity = "0";
      popup.style.pointerEvents = "none";
      popup.setAttribute("aria-hidden", "true");
      popup.classList.remove("in", "show", "active");
    } catch (e) {}

    try {
      const overlays = popupDoc.querySelectorAll(
        '.modal-backdrop, .popover-backdrop, .glide_box_overlay, .sn-modal-backdrop, [class*="backdrop"], [class*="overlay"]'
      );

      overlays.forEach((el) => {
        try {
          el.style.display = "none";
          el.style.visibility = "hidden";
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        } catch (e) {}
      });
    } catch (e) {}

    try {
      popupDoc.body.classList.remove("modal-open");
      popupDoc.body.style.overflow = "";
      popupDoc.body.style.pointerEvents = "";
    } catch (e) {}

    return true;
  };

  servicenow.getRequestedForFromPreview = async () => {
    const foundButton = await servicenow.waitForPreviewButtonInAnyFrame(
      CONFIG.PREVIEW_ID,
      CONFIG.PREVIEW_WAIT_MS,
      250
    );

    if (!foundButton) {
      throw new Error(`Preview button not found: ${CONFIG.PREVIEW_ID}`);
    }

    foundButton.el.click();

    const foundPopup = await servicenow.waitForPopupInAnyFrame(CONFIG.POPUP_WAIT_MS, 150);
    if (!foundPopup) {
      throw new Error("Popup not found after clicking preview");
    }

    const user = servicenow.getUserFromPopup(foundPopup.popup);
    if (!utils.cleanValue(user.email)) {
      throw new Error("Email field not found inside popup");
    }

    sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(user));
    servicenow.hidePreview(foundPopup.popup, foundPopup.doc || document);

    return user;
  };

  function splitDisplayName(displayValue) {
    const parts = utils.cleanValue(displayValue).split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  servicenow.getUserFromForm = (table) => {
    const user = { firstName: "", lastName: "", email: "" };
    const userFieldCandidates = {
      incident: ["caller_id", "opened_for", "u_requested_for"],
      sc_task: ["request_item.request.requested_for", "request.requested_for", "requested_for"],
      sc_req_item: ["requested_for", "request.requested_for", "opened_by"],
      sc_request: ["requested_for", "opened_by"]
    };
    const emailFieldCandidates = {
      incident: ["u_email", "email", "caller_id.email", "opened_for.email"],
      sc_task: ["requested_for.email", "request_item.request.requested_for.email", "email"],
      sc_req_item: ["requested_for.email", "email", "opened_by.email"],
      sc_request: ["requested_for.email", "email", "opened_by.email"]
    };

    for (const fieldName of userFieldCandidates[table] || ["requested_for", "caller_id"]) {
      const displayValue =
        servicenow.safeGetDisplayValue(fieldName) || servicenow.getFieldDisplayValue(fieldName);

      if (displayValue) {
        const parsed = splitDisplayName(displayValue);
        user.firstName = user.firstName || parsed.firstName;
        user.lastName = user.lastName || parsed.lastName;
        break;
      }
    }

    for (const fieldName of emailFieldCandidates[table] || ["email"]) {
      const value = servicenow.safeGetField(fieldName) || servicenow.getFieldDisplayValue(fieldName);
      if (value && value.includes("@")) {
        user.email = value;
        break;
      }
    }

    return user;
  };

  servicenow.getUserFromSession = () => {
    try {
      const raw = sessionStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (user && utils.cleanValue(user.email)) return user;
    } catch (e) {}

    return null;
  };

  servicenow.resolveUserContext = async (table) => {
    if (table === "incident") {
      const directUser = servicenow.getUserFromForm("incident");
      if (utils.cleanValue(directUser.email)) {
        utils.log("User resolved from incident form");
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(directUser));
        return directUser;
      }
    }

    if (table === "sc_task") {
      try {
        const previewUser = await servicenow.getRequestedForFromPreview();
        utils.log("User resolved from sc_task preview");
        return previewUser;
      } catch (e) {
        utils.log("sc_task preview unavailable, using form fallback");
      }
    }

    const formUser = servicenow.getUserFromForm(table);
    if (utils.cleanValue(formUser.email)) {
      utils.log("User resolved from form fallback", { table });
      sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(formUser));
      return formUser;
    }

    const sessionUser = servicenow.getUserFromSession();
    if (sessionUser) {
      utils.log("User resolved from session fallback", { table });
      return sessionUser;
    }

    utils.log("User unresolved, using empty fallback", { table });
    return { firstName: "", lastName: "", email: "" };
  };

  servicenow.getShortDescription = () => {
    const fromGForm = servicenow.safeGetField("short_description");
    if (fromGForm) return fromGForm;

    return servicenow.getFirstExistingValue([
      '#incident\\.short_description',
      '#sc_task\\.short_description',
      '#sc_req_item\\.short_description',
      '#sc_request\\.short_description',
      '#short_description',
      'input[name="short_description"]',
      'textarea[name="short_description"]'
    ]);
  };

  servicenow.getDescription = () => {
    return (
      servicenow.safeGetField("description") ||
      servicenow.getFirstExistingValue([
        '#incident\\.description',
        '#sc_task\\.description',
        '#sc_req_item\\.description',
        '#sc_request\\.description',
        '#description',
        'textarea[name="description"]'
      ])
    );
  };

  servicenow.getConfigurationItem = () => {
    return servicenow.getFirstExistingValue(CONFIG.CI_SELECTORS || []);
  };

  servicenow.readContext = async () => {
    const record = servicenow.getRecordContext();
    const user = await servicenow.resolveUserContext(record.table);
    const ticket = servicenow.safeGetField("number") || "Ticket";
    const shortDesc = servicenow.getShortDescription();
    const desc = servicenow.getDescription();
    const ci = record.table === "incident" ? "" : servicenow.getConfigurationItem();

    return {
      ...record,
      user,
      ticket: utils.cleanValue(ticket) || "Ticket",
      shortDesc: utils.cleanValue(shortDesc),
      desc: utils.cleanValue(desc),
      ci: utils.cleanValue(ci)
    };
  };

  servicenow.composeEmailComment = ({ user, mail, ticket }) => {
    const recipient = utils.cleanValue(user && user.email) || "the user";
    const lines = [
      `Email has been sent to the user: ${recipient}.`,
      `Ticket: ${utils.cleanValue(ticket) || "Ticket"}`,
      `Subject: ${utils.cleanValue(mail && mail.subject)}`,
      "",
      utils.cleanValue(mail && mail.body)
    ];

    return lines.filter((line, index) => line || index === 3).join("\n");
  };

  servicenow.composeWorkNote = ({ user, mail, ticket }) => {
    const note = utils.cleanValue(mail && (mail.workNote || mail.workNotes || mail.body));
    if (note) return note;

    const recipient = utils.cleanValue(user && user.email) || "the user";
    return [
      `What happened: Follow-up prepared for ${recipient}.`,
      `Action taken: Communication drafted for ticket ${utils.cleanValue(ticket) || "Ticket"}.`,
      "Current status: Awaiting the next step."
    ].join("\n");
  };

  servicenow.setWorkNotesDraft = (text) => {
    const value = utils.cleanValue(text);
    if (!value) return false;

    const gf = servicenow.getBestGForm();

    try {
      if (gf && typeof gf.setValue === "function") {
        gf.setValue("work_notes", value);
        return true;
      }
    } catch (e) {
      utils.log("g_form.setValue(work_notes) failed", e);
    }

    const selectors = [
      "#activity-stream-textarea",
      "#activity-stream-work_notes-textarea",
      "#work_notes",
      'textarea[aria-label="Work notes"]',
      'textarea[data-stream-text-input="work_notes"]',
      'textarea[id="work_notes"]',
      'textarea[name="work_notes"]',
      'textarea[id*="work_notes"]'
    ];

    const docs = servicenow.getAllDocs();
    for (const doc of docs) {
      for (const selector of selectors) {
        try {
          const el = doc.querySelector(selector);
          if (!el) continue;
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        } catch (e) {}
      }
    }

    return false;
  };

  servicenow.setCommentsDraft = (text) => {
    const value = utils.cleanValue(text);
    if (!value) return false;

    const gf = servicenow.getBestGForm();

    try {
      if (gf && typeof gf.setValue === "function") {
        gf.setValue("comments", value);
        return true;
      }
    } catch (e) {
      utils.log("g_form.setValue(comments) failed", e);
    }

    const selectors = [
      "#activity-stream-comments-textarea",
      "#activity-stream-comments_and_work_notes-textarea",
      "#comments",
      'textarea[name="comments"]',
      'textarea[id="comments"]',
      'textarea[name="comments_and_work_notes"]',
      'textarea[id="comments_and_work_notes"]',
      'textarea[id*="comments"]'
    ];

    const docs = servicenow.getAllDocs();
    for (const doc of docs) {
      for (const selector of selectors) {
        try {
          const el = doc.querySelector(selector);
          if (!el) continue;
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        } catch (e) {}
      }
    }

    return false;
  };
})();
