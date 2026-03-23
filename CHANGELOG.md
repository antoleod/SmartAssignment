# Changelog

All notable changes to SmartAssignment will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-03-23

### 🎉 Initial Release

#### Added
- **Core functionality**
  - Keyword-based agent suggestion
  - Round-robin rotation (localStorage)
  - Confidence scoring system
  - Multi-frame ServiceNow support
  
- **UI Components**
  - Trigger button ("Suggest Assignee")
  - Suggestion overlay panel
  - Toast notifications
  - Assignment history viewer
  
- **Agent Management**
  - Agent roster with expertise tags
  - Availability toggle (available: true/false)
  - Location support (DSS, DSSM, KOHL, VC)
  
- **Rules Engine**
  - Keyword matching with priority levels
  - VIP user routing
  - Fallback suggestions
  - Skip reason logging
  
- **Audit & Logging**
  - Assignment log (localStorage)
  - Rotation history (last 10)
  - Skip reason tracking
  
- **Documentation**
  - Complete README.md
  - CONFIG_EXAMPLES.md
  - Inline code comments

#### Supported Ticket Types
- SCTASK (Catalog Tasks)
- RITM (Request Items)
- INC (Incidents)

#### Initial Agent Roster
- Pedro García (Hardware/Printer specialist)
- Ana López (Network specialist)
- María Sánchez (VIP/Mobile specialist)

#### Initial Keyword Rules
- VIP/Urgent → María Sánchez
- Printer → Pedro García
- Laptop → Pedro García
- Network/WiFi → Ana López
- Mobile → María Sánchez

---

## [Unreleased]

### Planned Features (Phase 2)

- [ ] Google Sheet integration (shared rotation)
- [ ] Workload balancing (assign to least busy)
- [ ] Time-based rules (after-hours routing)
- [ ] Assignment group filtering
- [ ] Category-based rules
- [ ] Dashboard widget (stats & metrics)
- [ ] Email notifications
- [ ] Slack integration
- [ ] Machine learning suggestions

### Under Consideration

- [ ] Manual assignment dropdown
- [ ] Bulk assignment mode
- [ ] Assignment templates
- [ ] Custom fields support
- [ ] Multi-language UI
- [ ] Dark mode

---

## Version History

- **v1.0.0** (2026-03-23) - Initial release
