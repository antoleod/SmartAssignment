# SmartAssignment Configuration Examples

## Quick Reference

### Adding a New Agent

```javascript
// In assignment-rules.js → rules.AGENTS array
{
  id: "agent_004",               // Unique ID
  name: "Carlos Rodríguez",      // Full name (used for assignment)
  location: "VC",                 // Office location
  expertise: [                    // Keywords they handle
    "software",
    "office365", 
    "teams",
    "outlook"
  ],
  available: true                 // Set false to exclude from rotation
}
```

### Adding a New Keyword Rule

```javascript
// In assignment-rules.js → rules.KEYWORD_RULES array
{
  priority: 7,                    // 1-10 (higher = checked first)
  keywords: [                     // Trigger words (case-insensitive)
    "software",
    "application",
    "app",
    "programa"
  ],
  assignee: "Carlos Rodríguez",   // Must match agent name exactly
  reason: "Software specialist",  // Shown in UI
  confidence: "high"              // critical | high | medium | low
}
```

### Adding a VIP User

```javascript
// In assignment-rules.js → rules.VIP_USERS array
{
  email: "president@europarl.europa.eu",
  assignee: "María Sánchez",
  reason: "VIP - President Office"
}
```

---

## Complete Agent Examples

### Hardware Specialist

```javascript
{
  id: "agent_hw_001",
  name: "Pedro García",
  location: "DSS (Brussels)",
  expertise: [
    // English
    "printer", "laptop", "desktop", "monitor", "keyboard", "mouse",
    "hardware", "device", "equipment", "docking", "dock",
    // Spanish
    "impresora", "portátil", "ordenador", "teclado", "ratón",
    // French
    "imprimante", "portable", "matériel"
  ],
  available: true
}
```

### Network Specialist

```javascript
{
  id: "agent_net_001",
  name: "Ana López",
  location: "DSS (Brussels)",
  expertise: [
    // Connectivity
    "network", "wifi", "vpn", "internet", "connection", "ethernet",
    "bandwidth", "latency", "firewall", "router", "switch",
    // Languages
    "red", "conexión", "réseau", "connexion"
  ],
  available: true
}
```

### Mobile/VIP Specialist

```javascript
{
  id: "agent_vip_001",
  name: "María Sánchez",
  location: "DSSM (Brussels)",
  expertise: [
    // Mobile
    "mobile", "smartphone", "iphone", "android", "tablet", "ipad",
    "sim", "cellular", "4g", "5g",
    // VIP
    "vip", "urgent", "director", "cabinet", "president",
    // Languages
    "móvil", "teléfono", "urgente", "prioritario"
  ],
  available: true
}
```

### Software Specialist

```javascript
{
  id: "agent_sw_001",
  name: "Carlos Rodríguez",
  location: "VC",
  expertise: [
    // Microsoft
    "office365", "outlook", "teams", "word", "excel", "powerpoint",
    "onedrive", "sharepoint", "exchange",
    // Adobe
    "adobe", "acrobat", "pdf", "reader",
    // General
    "software", "application", "program", "license"
  ],
  available: true
}
```

---

## Keyword Rule Examples

### VIP / Urgent (Highest Priority)

```javascript
{
  priority: 10,  // Always checked first
  keywords: [
    "vip", "urgent", "urgente", "emergency", "emergencia",
    "director", "president", "cabinet", "minister",
    "critical", "crítico", "critique"
  ],
  assignee: "María Sánchez",
  reason: "VIP/Emergency support",
  confidence: "critical"
}
```

### Printer Issues

```javascript
{
  priority: 8,
  keywords: [
    "printer", "print", "printing", "impresora", "imprimir", "imprimante",
    "epson", "hp", "canon", "xerox", "ricoh",
    "paper jam", "toner", "cartridge", "scan", "scanner"
  ],
  assignee: "Pedro García",
  reason: "Printer specialist",
  confidence: "high"
}
```

### Network Issues

```javascript
{
  priority: 8,
  keywords: [
    "wifi", "network", "internet", "connection", "vpn",
    "red", "conexión", "réseau", "connexion",
    "no connection", "cannot connect", "slow internet",
    "ethernet", "cable", "wireless"
  ],
  assignee: "Ana López",
  reason: "Network specialist",
  confidence: "high"
}
```

### Laptop / Hardware

```javascript
{
  priority: 7,
  keywords: [
    "laptop", "portable", "portátil", "notebook",
    "desktop", "pc", "computer", "ordenador",
    "monitor", "screen", "display", "pantalla",
    "keyboard", "mouse", "teclado", "ratón",
    "docking", "dock", "usb", "port"
  ],
  assignee: "Pedro García",
  reason: "Hardware specialist",
  confidence: "high"
}
```

### Mobile Devices

```javascript
{
  priority: 7,
  keywords: [
    "mobile", "smartphone", "phone", "móvil", "teléfono",
    "iphone", "android", "samsung", "ios",
    "tablet", "ipad",
    "sim", "cellular", "4g", "5g", "data"
  ],
  assignee: "María Sánchez",
  reason: "Mobile device specialist",
  confidence: "high"
}
```

### Software / Office365

```javascript
{
  priority: 6,
  keywords: [
    "office365", "o365", "microsoft 365",
    "outlook", "teams", "word", "excel", "powerpoint",
    "onedrive", "sharepoint", "exchange",
    "email", "calendar", "mail", "correo"
  ],
  assignee: "Carlos Rodríguez",
  reason: "Office365 specialist",
  confidence: "high"
}
```

### Adobe / PDF

```javascript
{
  priority: 6,
  keywords: [
    "adobe", "acrobat", "pdf", "reader",
    "sign", "signature", "firma",
    "digital signature", "e-signature"
  ],
  assignee: "Carlos Rodríguez",
  reason: "Adobe specialist",
  confidence: "high"
}
```

---

## Location-Based Rules

If agents are dedicated to specific locations:

```javascript
// In assignment-rules.js → rules.LOCATION_RULES
rules.LOCATION_RULES = {
  "DSS (Brussels)": ["Pedro García", "Ana López"],
  "DSSM (Brussels)": ["María Sánchez"],
  "KOHL": ["Agent KOHL 1", "Agent KOHL 2"],
  "VC": ["Carlos Rodríguez"]
};
```

**Note:** Location matching is NOT yet implemented in the current version. This is prepared for future enhancement.

---

## VIP User Examples

```javascript
// In assignment-rules.js → rules.VIP_USERS array

// President's office
{
  email: "president@europarl.europa.eu",
  assignee: "María Sánchez",
  reason: "VIP - President Office"
},

// Director General
{
  email: "dg.itec@europarl.europa.eu",
  assignee: "María Sánchez",
  reason: "VIP - Director General ITEC"
},

// Cabinet members
{
  email: "cabinet.president@europarl.europa.eu",
  assignee: "María Sánchez",
  reason: "VIP - Presidential Cabinet"
}
```

---

## Priority Levels Explained

```javascript
priority: 10  // VIP / Emergency only
priority: 9   // (reserved for future use)
priority: 8   // Specialized hardware (printer, laptop)
priority: 7   // General hardware / Mobile
priority: 6   // Software / Applications
priority: 5   // (reserved for future use)
priority: 4   // (reserved for future use)
priority: 3   // Generic support
priority: 2   // (reserved for future use)
priority: 1   // Lowest priority fallback
```

---

## Confidence Levels

```javascript
confidence: "critical"  // VIP users, emergency
confidence: "high"      // Clear keyword match
confidence: "medium"    // Rotation-based (no keyword match)
confidence: "low"       // Default/fallback
confidence: "none"      // No assignee available
```

---

## Multi-Language Support

Always include translations in keyword rules:

```javascript
keywords: [
  // English
  "printer", "print", "printing",
  // Spanish
  "impresora", "imprimir", "impresión",
  // French
  "imprimante", "imprimer", "impression"
]
```

The system automatically normalizes:
- Lowercase conversion
- Accent removal (é → e, ñ → n)
- Extra spaces trimmed

---

## Testing Your Configuration

After modifying `assignment-rules.js`:

1. **Commit to GitHub**
   ```bash
   git add assignment-rules.js
   git commit -m "Update agent roster and rules"
   git push
   ```

2. **Clear browser cache** (or add `?t=123` to bookmarklet)

3. **Test on a real ticket**
   - Create a test SCTASK with keyword in description
   - Run bookmarklet
   - Verify correct assignee is suggested

4. **Check console logs**
   ```javascript
   // In browser console:
   window.__SN_SMART_ASSIGNMENT__.rules.AGENTS
   window.__SN_SMART_ASSIGNMENT__.rules.KEYWORD_RULES
   ```

---

## Common Mistakes

❌ **Wrong agent name**
```javascript
assignee: "pedro garcia"  // Wrong - name mismatch
```
✅ **Correct**
```javascript
assignee: "Pedro García"  // Must match AGENTS array exactly
```

---

❌ **Missing quotes**
```javascript
keywords: [printer, laptop]  // Wrong - syntax error
```
✅ **Correct**
```javascript
keywords: ["printer", "laptop"]  // Strings need quotes
```

---

❌ **Duplicate IDs**
```javascript
{ id: "agent_001", name: "Pedro" },
{ id: "agent_001", name: "Ana" }  // Wrong - duplicate ID
```
✅ **Correct**
```javascript
{ id: "agent_001", name: "Pedro" },
{ id: "agent_002", name: "Ana" }  // Unique IDs
```

---

Need help? Check the main README.md or contact jdioses@outlook.be
