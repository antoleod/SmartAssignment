/**
 * SmartAssignment - ServiceNow Auto-Assignment Assistant
 * Author: Juan Dioses (Gean)
 * Company: Oryxen - https://oryxen.tech/
 *
 * assignment-rules.js
 * Agent definitions, keyword rules, and assignment logic
 */
(function () {
  const ns = (window.__SN_SMART_ASSIGNMENT__ = window.__SN_SMART_ASSIGNMENT__ || {});
  const utils = ns.utils || {};

  const rules = (ns.rules = ns.rules || {});

  // AGENT ROSTER
  rules.AGENTS = [
    {
      id: "agent_001",
      name: "Pedro García",
      location: "DSS (Brussels)",
      expertise: ["printer", "laptop", "hardware", "impresora", "portátil", "equipo"],
      available: true
    },
    {
      id: "agent_002",
      name: "Ana López",
      location: "DSS (Brussels)",
      expertise: ["network", "wifi", "vpn", "red", "conectividad", "connection"],
      available: true
    },
    {
      id: "agent_003",
      name: "María Sánchez",
      location: "DSSM (Brussels)",
      expertise: ["vip", "urgent", "mobile", "smartphone", "urgente", "prioritario"],
      available: true
    }
  ];

  // KEYWORD-BASED ASSIGNMENT RULES
  // Higher priority = checked first
  rules.KEYWORD_RULES = [
    {
      priority: 10, // VIP always wins
      keywords: ["vip", "urgent", "urgente", "director", "cabinet", "prioritario", "priority"],
      assignee: "María Sánchez",
      reason: "VIP/Urgent support specialist",
      confidence: "critical"
    },
    {
      priority: 8,
      keywords: ["printer", "impresora", "imprimir", "print", "epson", "hp", "canon"],
      assignee: "Pedro García",
      reason: "Printer specialist",
      confidence: "high"
    },
    {
      priority: 8,
      keywords: ["laptop", "portátil", "portable", "computer", "ordenador", "pc"],
      assignee: "Pedro García",
      reason: "Laptop/hardware specialist",
      confidence: "high"
    },
    {
      priority: 8,
      keywords: ["hardware", "equipo", "material", "device", "dispositivo"],
      assignee: "Pedro García",
      reason: "Hardware specialist",
      confidence: "high"
    },
    {
      priority: 8,
      keywords: ["wifi", "network", "red", "vpn", "connection", "conectividad", "internet"],
      assignee: "Ana López",
      reason: "Network specialist",
      confidence: "high"
    },
    {
      priority: 7,
      keywords: ["mobile", "smartphone", "phone", "móvil", "teléfono", "iphone", "android"],
      assignee: "María Sánchez",
      reason: "Mobile device specialist",
      confidence: "high"
    }
  ];

  // VIP USER RULES (specific emails that always go to specific agents)
  rules.VIP_USERS = [
    // Example: { email: "director@europarl.europa.eu", assignee: "María Sánchez", reason: "VIP - Director" }
  ];

  // LOCATION-BASED RULES (optional)
  rules.LOCATION_RULES = {
    "DSS (Brussels)": ["Pedro García", "Ana López"],
    "DSSM (Brussels)": ["María Sánchez"],
    "KOHL": [], // Add agents for KOHL if needed
    "VC": [] // Add agents for VC if needed
  };

  /**
   * Find the best assignee based on ticket content
   * @param {Object} context - Ticket context from servicenow.js
   * @returns {Object} { assignee, reason, confidence, fallback, score }
   */
  rules.findBestAssignee = (context) => {
    const { shortDesc, desc, user, table } = context;
    const combinedText = utils.normalize(`${shortDesc} ${desc}`);
    
    utils.log("Finding best assignee for:", { shortDesc, combinedText });

    // Check VIP users first
    if (user && user.email) {
      const vipMatch = rules.VIP_USERS.find((vip) => 
        utils.normalize(vip.email) === utils.normalize(user.email)
      );
      
      if (vipMatch) {
        utils.log("VIP match found:", vipMatch);
        return {
          assignee: vipMatch.assignee,
          reason: vipMatch.reason,
          confidence: "critical",
          fallback: null,
          score: 100
        };
      }
    }

    // Check keyword rules (sorted by priority)
    const sortedRules = [...rules.KEYWORD_RULES].sort((a, b) => b.priority - a.priority);
    const matches = [];

    for (const rule of sortedRules) {
      let matchCount = 0;
      const matchedKeywords = [];

      for (const keyword of rule.keywords) {
        if (combinedText.includes(utils.normalize(keyword))) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }

      if (matchCount > 0) {
        const score = rule.priority * matchCount;
        matches.push({
          assignee: rule.assignee,
          reason: `${rule.reason} (matched: ${matchedKeywords.join(", ")})`,
          confidence: rule.confidence,
          score: score,
          matchCount: matchCount
        });
      }
    }

    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      const best = matches[0];
      const fallback = matches.length > 1 ? matches[1].assignee : null;

      utils.log("Keyword match found:", { best, fallback });
      
      return {
        assignee: best.assignee,
        reason: best.reason,
        confidence: best.confidence,
        fallback: fallback,
        score: best.score
      };
    }

    // No keyword match - use rotation
    utils.log("No keyword match - will use rotation");
    return null;
  };

  /**
   * Get next agent in rotation (round-robin)
   * Uses localStorage to persist state
   */
  rules.getNextInRotation = () => {
    const STORAGE_KEY = "sn_assignment_rotation_state";
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const state = stored ? JSON.parse(stored) : { currentIndex: 0, history: [] };

      // Get available agents only
      const availableAgents = rules.AGENTS.filter((agent) => agent.available);
      
      if (availableAgents.length === 0) {
        utils.log("No available agents in rotation");
        return null;
      }

      // Get current index (wrap around if needed)
      const currentIndex = state.currentIndex % availableAgents.length;
      const agent = availableAgents[currentIndex];

      // Advance to next
      const nextState = {
        currentIndex: currentIndex + 1,
        history: [
          { 
            agent: agent.name, 
            timestamp: new Date().toISOString() 
          },
          ...state.history.slice(0, 9) // Keep last 10
        ]
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

      utils.log("Rotation: selected agent", { agent: agent.name, nextIndex: nextState.currentIndex });

      return {
        assignee: agent.name,
        reason: "Next in rotation",
        confidence: "medium",
        fallback: availableAgents[(currentIndex + 1) % availableAgents.length]?.name || null,
        score: 0
      };
    } catch (e) {
      utils.log("Rotation error:", e);
      return null;
    }
  };

  /**
   * Get rotation history (last 10 assignments)
   */
  rules.getRotationHistory = () => {
    try {
      const STORAGE_KEY = "sn_assignment_rotation_state";
      const stored = localStorage.getItem(STORAGE_KEY);
      const state = stored ? JSON.parse(stored) : { history: [] };
      return state.history || [];
    } catch (e) {
      return [];
    }
  };

  /**
   * Reset rotation to start from beginning
   */
  rules.resetRotation = () => {
    try {
      const STORAGE_KEY = "sn_assignment_rotation_state";
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex: 0, history: [] }));
      utils.log("Rotation reset to start");
      return true;
    } catch (e) {
      utils.log("Reset rotation failed:", e);
      return false;
    }
  };

  /**
   * Main suggestion function - combines keyword matching + rotation
   */
  rules.suggestAssignee = (context) => {
    // Try keyword-based match first
    const keywordMatch = rules.findBestAssignee(context);
    
    if (keywordMatch) {
      return keywordMatch;
    }

    // Fallback to rotation
    const rotationMatch = rules.getNextInRotation();
    
    if (rotationMatch) {
      return rotationMatch;
    }

    // Ultimate fallback - first available agent
    const firstAvailable = rules.AGENTS.find((agent) => agent.available);
    
    if (firstAvailable) {
      return {
        assignee: firstAvailable.name,
        reason: "Default assignee (no matches found)",
        confidence: "low",
        fallback: null,
        score: 0
      };
    }

    // No agents available
    return {
      assignee: null,
      reason: "No available agents",
      confidence: "none",
      fallback: null,
      score: 0
    };
  };
})();
