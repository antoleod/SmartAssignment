/**
 * SmartAssignment - ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen - https://oryxen.tech/
 *
 * assignment-ui.js
 * UI components: toasts, overlay panel, buttons
 */
(function () {
  const ns = (window.__SN_SMART_ASSIGNMENT__ = window.__SN_SMART_ASSIGNMENT__ || {});
  const { CONFIG } = ns;
  const utils = ns.utils || {};
  const servicenow = ns.servicenow || {};

  const ui = (ns.ui = ns.ui || {});

  /**
   * Show toast notification
   */
  ui.toast = (message, duration = 3000) => {
    const existingToast = document.getElementById(CONFIG.TOAST_ID);
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = CONFIG.TOAST_ID;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0066cc;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  };

  /**
   * Show suggestion overlay panel
   */
  ui.showSuggestionPanel = ({ suggestion, context, onAssign, onSkip, onNext, onReset }) => {
    ui.hideSuggestionPanel();

    const panel = document.createElement("div");
    panel.id = CONFIG.PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 380px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 999998;
      animation: slideIn 0.3s ease;
    `;

    const confidenceColor = {
      critical: "#d32f2f",
      high: "#0066cc",
      medium: "#ff9800",
      low: "#757575",
      none: "#999"
    }[suggestion.confidence] || "#999";

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">
            Smart Assignment Suggestion
          </h3>
          <button id="close-panel-btn" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 24px;
            height: 24px;
          ">&times;</button>
        </div>
        
        <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
          <strong>Ticket:</strong> ${utils.cleanValue(context.ticket) || "N/A"}
        </div>
        
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
          <strong>Request:</strong> ${utils.cleanValue(context.shortDesc).substring(0, 60)}${context.shortDesc?.length > 60 ? "..." : ""}
        </div>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        ${suggestion.assignee ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              Suggested Assignee
            </div>
            <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px;">
              ${suggestion.assignee}
            </div>
            
            <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
              ${suggestion.reason}
            </div>
            
            <div style="display: inline-block; padding: 4px 8px; background: ${confidenceColor}; color: white; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
              ${suggestion.confidence} confidence
            </div>
          </div>

          ${suggestion.fallback ? `
            <div style="font-size: 12px; color: #999; margin-bottom: 16px; padding: 8px; background: white; border-radius: 4px;">
              <strong>Fallback:</strong> ${suggestion.fallback}
            </div>
          ` : ""}

          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button id="assign-btn" style="
              flex: 1;
              padding: 10px;
              background: #0066cc;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">Assign</button>
            
            <button id="skip-btn" style="
              flex: 1;
              padding: 10px;
              background: white;
              color: #666;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">Skip</button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="next-btn" style="
              flex: 1;
              padding: 8px;
              background: white;
              color: #0066cc;
              border: 1px solid #0066cc;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Next Suggestion</button>
            
            <button id="reset-btn" style="
              padding: 8px 12px;
              background: white;
              color: #ff9800;
              border: 1px solid #ff9800;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Reset Rotation</button>
          </div>
        ` : `
          <div style="text-align: center; padding: 20px; color: #999;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">No assignee available</div>
            <div style="font-size: 12px;">${suggestion.reason}</div>
          </div>
        `}
      </div>

      <div id="history-section" style="padding: 12px 20px; border-top: 1px solid #eee; background: white; border-radius: 0 0 8px 8px;">
        <details>
          <summary style="cursor: pointer; font-size: 12px; color: #666; user-select: none;">
            Recent assignments
          </summary>
          <div id="history-list" style="margin-top: 8px; font-size: 11px; color: #999;"></div>
        </details>
      </div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    const assignBtn = panel.querySelector("#assign-btn");
    const skipBtn = panel.querySelector("#skip-btn");
    const nextBtn = panel.querySelector("#next-btn");
    const resetBtn = panel.querySelector("#reset-btn");
    const closeBtn = panel.querySelector("#close-panel-btn");

    if (assignBtn) assignBtn.addEventListener("click", onAssign);
    if (skipBtn) skipBtn.addEventListener("click", onSkip);
    if (nextBtn) nextBtn.addEventListener("click", onNext);
    if (resetBtn) resetBtn.addEventListener("click", onReset);
    if (closeBtn) closeBtn.addEventListener("click", ui.hideSuggestionPanel);

    // Hover effects
    [assignBtn, skipBtn, nextBtn, resetBtn].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "translateY(-1px)";
        btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "none";
      });
    });

    // Load history
    const historyList = panel.querySelector("#history-list");
    if (historyList && ns.rules) {
      const history = ns.rules.getRotationHistory();
      if (history.length > 0) {
        historyList.innerHTML = history
          .slice(0, 5)
          .map((entry) => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            return `<div style="padding: 4px 0;">${entry.agent} - ${timeStr}</div>`;
          })
          .join("");
      } else {
        historyList.innerHTML = "<div style='padding: 4px 0;'>No recent assignments</div>";
      }
    }

    utils.log("Suggestion panel shown");
  };

  /**
   * Hide suggestion panel
   */
  ui.hideSuggestionPanel = () => {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) {
      panel.style.animation = "slideOut 0.3s ease";
      setTimeout(() => panel.remove(), 300);
    }
  };

  /**
   * Inject main trigger button
   */
  ui.injectTriggerButton = (onClick) => {
    const existingBtn = document.getElementById(CONFIG.BUTTON_ID);
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement("button");
    btn.id = CONFIG.BUTTON_ID;
    btn.textContent = "🎯 Suggest Assignee";
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999997;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: all 0.2s;
    `;

    btn.addEventListener("click", onClick);
    
    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
    });
    
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    });

    document.body.appendChild(btn);
    utils.log("Trigger button injected");
  };

  /**
   * Remove trigger button
   */
  ui.removeTriggerButton = () => {
    const btn = document.getElementById(CONFIG.BUTTON_ID);
    if (btn) btn.remove();
  };

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(20px); }
    }
  `;
  document.head.appendChild(style);
})();
