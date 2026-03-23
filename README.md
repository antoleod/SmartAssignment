# SmartAssignment — ServiceNow Auto-Assignment Assistant

**Author:** Juan Dioses (Gean)  
**Company:** Oryxen — https://oryxen.tech/

Intelligent ticket assignment assistant for ServiceNow. Suggests assignees based on keywords, expertise, and round-robin rotation.

---

## 🎯 Features

- **Keyword-based matching** — Automatically detects expertise from ticket content
- **Round-robin rotation** — Fair distribution when no keyword match
- **VIP user support** — Priority routing for specific users
- **Confidence scoring** — Shows how sure the system is about the suggestion
- **Skip tracking** — Log why suggestions were rejected
- **Assignment history** — Audit trail in localStorage
- **Multi-location support** — Handles different office locations

---

## 🚀 Quick Start

### 1. Upload to GitHub

1. Create a new repository: `SmartAssignment`
2. Upload all `.js` files to the `main` branch
3. Make sure the repo is **public** (or configure GitHub token for private)

### 2. Update the loader

Edit `smart-assignment.js` and replace:

```javascript
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/YOUR_USERNAME/SmartAssignment/main/";
```

With your actual GitHub username:

```javascript
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/jdioses/SmartAssignment/main/";
```

### 3. Create the bookmarklet

Copy this code and create a browser bookmark:

```javascript
javascript:(function(){const script=document.createElement('script');script.src='https://raw.githubusercontent.com/YOUR_USERNAME/SmartAssignment/main/smart-assignment.js?t='+Date.now();document.body.appendChild(script);})();
```

**Replace `YOUR_USERNAME` with your GitHub username!**

### 4. Use it

1. Open an **unassigned** SCTASK, RITM, or INC in ServiceNow
2. Click the bookmarklet
3. Wait for "Smart Assignment ready! 🎯"
4. Click "🎯 Suggest Assignee" button
5. Review suggestion → Click "Assign" or "Skip"

---

## 📁 Project Structure

```
SmartAssignment/
├── utils.js                  # Shared helpers and CONFIG
├── servicenow.js             # ServiceNow data extraction (frames-safe)
├── assignment-rules.js       # Agent roster, keyword rules, rotation logic
├── assignment-ui.js          # Overlay panel, toasts, buttons
├── assignment-core.js        # Main orchestration flow
├── smart-assignment.js       # Bookmarklet loader
└── README.md                 # This file
```

---

## ⚙️ Configuration

### Add/Edit Agents

Edit `assignment-rules.js` → `rules.AGENTS`:

```javascript
rules.AGENTS = [
  {
    id: "agent_001",
    name: "Pedro García",
    location: "DSS (Brussels)",
    expertise: ["printer", "laptop", "hardware"],
    available: true  // Set to false to exclude from rotation
  },
  {
    id: "agent_002",
    name: "Ana López",
    location: "DSS (Brussels)",
    expertise: ["network", "wifi", "vpn"],
    available: true
  }
  // Add more agents here
];
```

### Add/Edit Keyword Rules

Edit `assignment-rules.js` → `rules.KEYWORD_RULES`:

```javascript
rules.KEYWORD_RULES = [
  {
    priority: 10,  // Higher = checked first (1-10)
    keywords: ["vip", "urgent", "director"],
    assignee: "María Sánchez",
    reason: "VIP/Urgent support specialist",
    confidence: "critical"
  },
  {
    priority: 8,
    keywords: ["printer", "impresora", "print"],
    assignee: "Pedro García",
    reason: "Printer specialist",
    confidence: "high"
  }
  // Add more rules here
];
```

### Add VIP Users

Edit `assignment-rules.js` → `rules.VIP_USERS`:

```javascript
rules.VIP_USERS = [
  {
    email: "director@europarl.europa.eu",
    assignee: "María Sánchez",
    reason: "VIP - Director General"
  }
];
```

---

## 🔄 How It Works

### Flow

```
1. Click bookmarklet
   ↓
2. Loads modules from GitHub
   ↓
3. Injects "Suggest Assignee" button
   ↓
4. User clicks button
   ↓
5. Reads ticket: number, description, requested_for
   ↓
6. Applies rules (priority order):
   - VIP user match? → Assign to VIP handler
   - Keyword match? → Assign to specialist
   - No match? → Use rotation (round-robin)
   ↓
7. Shows suggestion panel with:
   - Suggested assignee
   - Reason
   - Confidence level
   - Fallback option
   ↓
8. User confirms → Assigns ticket via g_form.setValue()
```

### Rotation Logic

- Stored in `localStorage` under key: `sn_assignment_rotation_state`
- Round-robin: Agent 1 → 2 → 3 → 1 → 2 → 3...
- Skips unavailable agents (`available: false`)
- Can be reset via "Reset Rotation" button

---

## 🛠️ Customization

### Change Overlay Position

Edit `assignment-ui.js` → `ui.showSuggestionPanel()`:

```javascript
panel.style.cssText = `
  position: fixed;
  top: 80px;      // ← Change this
  right: 20px;    // ← Or this
  width: 380px;
  ...
`;
```

### Change Button Text/Style

Edit `assignment-ui.js` → `ui.injectTriggerButton()`:

```javascript
btn.textContent = "🎯 Suggest Assignee";  // ← Change text
btn.style.cssText = `
  bottom: 20px;   // ← Change position
  right: 20px;
  background: #0066cc;  // ← Change color
  ...
`;
```

### Add More Ticket Types

Edit `assignment-core.js` → `core.init()`:

```javascript
if (!table || !["sc_task", "sc_req_item", "incident"].includes(table)) {
  // Add more table names here, e.g., "problem", "change_request"
}
```

---

## 📊 Debug & Audit

### View Assignment Log

Open browser console and run:

```javascript
window.__SN_SMART_ASSIGNMENT__.core.getAssignmentLog();
```

### View Rotation State

```javascript
window.__SN_SMART_ASSIGNMENT__.rules.getRotationHistory();
```

### Clear All Data

```javascript
localStorage.removeItem('sn_assignment_rotation_state');
localStorage.removeItem('sn_assignment_log');
```

---

## 🐛 Troubleshooting

### "Smart Assignment failed to load"

**Cause:** GitHub raw files not accessible or wrong URL

**Fix:**
1. Check if repo is public
2. Verify GitHub username in `smart-assignment.js`
3. Make sure files are in `main` branch (not `master`)

### "Cannot assign - g_form not available"

**Cause:** Not on a valid ticket form page

**Fix:**
1. Make sure you're on the ticket **form** (not list view)
2. Try refreshing the page and running bookmarklet again

### "Ticket already assigned"

**Cause:** The `assigned_to` field already has a value

**Fix:**
- This is expected behavior (prevents accidental re-assignment)
- Clear the field manually if you want to test

### Rotation not working

**Cause:** localStorage not persisting

**Fix:**
1. Check browser privacy settings (allow localStorage)
2. Try in a different browser
3. Check console for errors

---

## 🔐 Security Notes

- **localStorage only** — Data stored locally in your browser
- **No server calls** — Everything runs client-side
- **Read-only API** — Only reads from ServiceNow, doesn't modify (except assignment)
- **GitHub Raw** — Scripts loaded from your public repo (can use private with token)

---

## 🚀 Future Enhancements

**Phase 2 ideas:**
- Google Sheet integration (shared rotation)
- Workload balancing (assign to least busy agent)
- Time-based rules (assign after hours to on-call)
- Machine learning (learn from past assignments)
- Dashboard widget (stats + metrics)

---

## 📝 License

MIT License — Free to use and modify

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## 📧 Support

**Author:** Juan Dioses (Gean)  
**Email:** jdioses@outlook.be  
**Company:** Oryxen — https://oryxen.tech/

For bugs or feature requests, open an issue on GitHub.

---

## 🎉 Credits

Based on the **EmailsBots** project architecture.

Built with ❤️ for the European Parliament IT Support team.
