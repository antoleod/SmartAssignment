/**
 * SmartAssignment - ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen - https://oryxen.tech/
 *
 * assignment-core.js
 * Core orchestration: read ticket → suggest assignee → assign
 */
(function () {
  const ns = (window.__SN_SMART_ASSIGNMENT__ = window.__SN_SMART_ASSIGNMENT__ || {});
  const utils = ns.utils || {};
  const servicenow = ns.servicenow || {};
  const rules = ns.rules || {};
  const ui = ns.ui || {};

  const core = (ns.core = ns.core || {});

  /**
   * Initialize the tool - inject trigger button
   */
  core.init = () => {
    utils.log("SmartAssignment initializing...");

    // Check if we're on a valid ticket page
    const table = servicenow.detectTable();
    
    if (!table || !["sc_task", "sc_req_item", "incident"].includes(table)) {
      utils.log("Not on a valid ticket page, skipping initialization");
      return;
    }

    // Check if ticket is already assigned
    const currentAssignee = servicenow.safeGetDisplayValue("assigned_to");
    
    if (currentAssignee && utils.cleanValue(currentAssignee)) {
      utils.log("Ticket already assigned to:", currentAssignee);
      ui.toast("Ticket already assigned", 2000);
      return;
    }

    // Inject trigger button
    ui.injectTriggerButton(() => core.run());
    ui.toast("Smart Assignment ready! 🎯", 2000);
    
    utils.log("SmartAssignment initialized successfully");
  };

  /**
   * Main flow - analyze ticket and suggest assignee
   */
  core.run = async () => {
    try {
      utils.log("Starting assignment suggestion flow...");
      ui.toast("Analyzing ticket...", 1500);

      // Read ticket context
      const context = await servicenow.readContext();
      
      utils.log("Ticket context loaded:", context);

      // Get suggestion
      const suggestion = rules.suggestAssignee(context);
      
      utils.log("Suggestion generated:", suggestion);

      // Show suggestion panel
      ui.showSuggestionPanel({
        suggestion,
        context,
        onAssign: () => core.assignTicket(suggestion.assignee, context),
        onSkip: () => core.skipSuggestion(suggestion, context),
        onNext: () => core.showNextSuggestion(context),
        onReset: () => core.resetAndReload(context)
      });

    } catch (error) {
      utils.log("Error in core.run:", error);
      ui.toast("Error analyzing ticket", 3000);
    }
  };

  /**
   * Assign ticket to the suggested agent
   */
  core.assignTicket = (assigneeName, context) => {
    try {
      utils.log("Assigning ticket to:", assigneeName);

      // Get g_form
      const gf = servicenow.getBestGForm();
      
      if (!gf || typeof gf.setValue !== "function") {
        ui.toast("Cannot assign - g_form not available", 3000);
        utils.log("g_form not available for assignment");
        return;
      }

      // Set the assigned_to field (display value)
      // ServiceNow auto-complete fields need the display value, not sys_id
      gf.setValue("assigned_to", assigneeName);

      ui.toast(`✅ Assigned to ${assigneeName}`, 3000);
      ui.hideSuggestionPanel();

      // Log the assignment
      core.logAssignment({
        ticket: context.ticket,
        assignee: assigneeName,
        reason: "Confirmed via Smart Assignment",
        timestamp: new Date().toISOString()
      });

      utils.log("Ticket assigned successfully");

    } catch (error) {
      utils.log("Error assigning ticket:", error);
      ui.toast("Assignment failed - please assign manually", 3000);
    }
  };

  /**
   * Skip current suggestion and ask for reason
   */
  core.skipSuggestion = (suggestion, context) => {
    const reason = prompt(
      `Why are you skipping ${suggestion.assignee}?\n\n` +
      "Options:\n" +
      "1. Agent unavailable\n" +
      "2. Need different expertise\n" +
      "3. Will assign manually\n" +
      "4. Other\n\n" +
      "Enter reason:"
    );

    if (reason) {
      utils.log("Suggestion skipped:", { assignee: suggestion.assignee, reason });
      
      core.logAssignment({
        ticket: context.ticket,
        assignee: suggestion.assignee,
        reason: `SKIPPED: ${reason}`,
        timestamp: new Date().toISOString()
      });

      ui.toast("Suggestion skipped", 2000);
    }

    ui.hideSuggestionPanel();
  };

  /**
   * Show next suggestion (use rotation)
   */
  core.showNextSuggestion = (context) => {
    utils.log("Showing next suggestion (rotation fallback)");
    
    const rotationSuggestion = rules.getNextInRotation();
    
    if (!rotationSuggestion || !rotationSuggestion.assignee) {
      ui.toast("No more suggestions available", 2000);
      return;
    }

    ui.showSuggestionPanel({
      suggestion: rotationSuggestion,
      context,
      onAssign: () => core.assignTicket(rotationSuggestion.assignee, context),
      onSkip: () => core.skipSuggestion(rotationSuggestion, context),
      onNext: () => core.showNextSuggestion(context),
      onReset: () => core.resetAndReload(context)
    });
  };

  /**
   * Reset rotation and reload suggestions
   */
  core.resetAndReload = (context) => {
    const confirm = window.confirm(
      "Reset rotation counter?\n\n" +
      "This will restart the rotation from the first agent."
    );

    if (confirm) {
      rules.resetRotation();
      ui.toast("Rotation reset ✅", 2000);
      ui.hideSuggestionPanel();
      
      // Wait a bit then re-run
      setTimeout(() => core.run(), 500);
    }
  };

  /**
   * Log assignment to localStorage (audit trail)
   */
  core.logAssignment = (entry) => {
    try {
      const LOG_KEY = "sn_assignment_log";
      const stored = localStorage.getItem(LOG_KEY);
      const log = stored ? JSON.parse(stored) : [];
      
      log.unshift(entry); // Add to beginning
      
      // Keep last 100 entries
      const trimmed = log.slice(0, 100);
      
      localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
      
      utils.log("Assignment logged:", entry);
    } catch (e) {
      utils.log("Failed to log assignment:", e);
    }
  };

  /**
   * Get assignment log (for debugging/audit)
   */
  core.getAssignmentLog = () => {
    try {
      const LOG_KEY = "sn_assignment_log";
      const stored = localStorage.getItem(LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  /**
   * Clear assignment log
   */
  core.clearAssignmentLog = () => {
    try {
      const LOG_KEY = "sn_assignment_log";
      localStorage.removeItem(LOG_KEY);
      utils.log("Assignment log cleared");
      return true;
    } catch (e) {
      utils.log("Failed to clear log:", e);
      return false;
    }
  };
})();
