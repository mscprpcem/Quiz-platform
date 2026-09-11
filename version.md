# MSC Quiz Platform - Version & Release History

Welcome to the official version registry and changelog for the **Microsoft Student Club (MSC) PRPCEM Live Quiz Platform & Technical Event Portal**. This document tracks all architectural milestones, major features, UI redesigns, database migrations, and security enhancements across releases.

---

## Release History Overview

| Version | Release Type | Key Highlights | Status |
| :--- | :--- | :--- | :--- |
| **v1.8.0** | **Minor (Current)** | Homepage UX streamlining, single info button, collapsed FAQ default, normalized footer styles, version registry | **Active Production** |
| **v1.7.0** | Minor | Light Theme UI overhaul, responsive FAQ accordion, Top 3 podium styling, scoring rules matrix modal | Stable |
| **v1.6.0** | Minor | Neon Serverless Postgres integration, Open Source Program guide, universal responsive email engine | Stable |
| **v1.5.0** | Minor | Azure Blob Storage asset migration, bidirectional Verification Portal SSO & password sync | Stable |
| **v1.4.0** | Minor | Interactive SQL Practice Lab (66+ challenges), in-browser SQL engine, DDL/DML tracks | Stable |
| **v1.3.0** | Minor | Multi-Quiz cumulative leaderboard, analytics dashboard, Excel ingestion/export engine | Stable |
| **v1.2.0** | Minor | Scheduled assessments, time-window availability, continuous numbering, IST standardization | Stable |
| **v1.1.0** | Minor | Student authentication, OTP email verification, anti-cheat proctoring, fullscreen enforcement | Stable |
| **v1.0.0** | **Major** | Initial launch: real-time Socket.io quiz engine, live lobby, admin question broadcaster | Legacy |

---

## Detailed Changelog

### Version 1.8.0 (Current Release)
*Theme: Homepage UX Polish, Streamlined CTA Navigation & Version Registry*

- **Homepage CTA Cleanups**:
  - Removed the redundant `"All Quizzes"` navigation button from the Recent Quizzes section header to prevent visual clutter and maintain clean hierarchy.
  - Removed the bottom `"View All Quizzes & Courses ({count})"` button on the homepage, allowing users to naturally explore course offerings via the top navigation bar.
- **Information Actions Consolidation**:
  - Eliminated the duplicate circular `(i)` button adjacent to the `"Top Performers"` title.
  - Retained the primary, accessible `"Scoring Matrix & Rules"` button on the right side of the section header to trigger the evaluation matrix modal.
- **FAQ Accordion User Experience**:
  - Configured FAQ accordion items to start in a default-collapsed state (`openFaqs: {}`), ensuring a tidy initial presentation until a user explicitly expands a question.
- **Brand & Footer Harmonization**:
  - Removed outdated promotional text (`"A secure platform for conducting quizzes during club events."`) and the `"Verified Campus Portal"` badge under the footer brand column.
  - Standardized the `"Linktree"` link under the Connect section with regular font weight and muted slate text matching GitHub, LinkedIn, Instagram, and YouTube.
  - Harmonized verification search checkmark badges to unified brand blue tokens.
- **Version Registry Integration**:
  - Created `version.md` to permanently record the release history and feature milestones of the platform.
  - Updated website version indicators across the application and metadata to `Version 1.8.0`.

---

### Version 1.7.0
*Theme: Modern Light Theme Overhaul & Responsive FAQ System*

- **Design System Migration**:
  - Transitioned the entire frontend interface to a clean, modern Light Theme using Tailwind CSS and custom tokens.
  - Implemented subtle gradients (`#F5FAFF` base), glassmorphism cards, and soft ambient drop shadows.
- **Top 3 Medalist Podium**:
  - Introduced podium rank cards for 1st Place (Gold crown, warm amber accents), 2nd Place (Silver slate), and 3rd Place (Bronze orange).
  - Added participant speed indicators (`⏱ {seconds}s`) and fallback contenders to ensure consistent layout.
- **Interactive Scoring Matrix Modal**:
  - Built an informational dialog displaying difficulty weighting (Beginner 1.0x, Intermediate 2.0x, Hard 3.0x).
  - Clarified differences between live synchronous scoring and scheduled time-based evaluation.
  - Detailed the 4-tier tie-breaking hierarchy: Total Score → Accuracy Count → Speed / Time → Fewest Violations.
- **Responsive Multi-Open FAQ Accordion**:
  - Implemented an animated accordion supporting multi-expanded states with desktop dual-column grid.

---

### Version 1.6.0
*Theme: Neon Serverless Postgres Integration & Universal Email Engine*

- **Neon Postgres Architecture**:
  - Integrated Neon serverless PostgreSQL database with dynamic autoscaling, connection pooling, and SSL encryption.
  - Created diagnostic connection tests (`npm run test:neon`) and health monitors.
  - Authored comprehensive Neon Open Source Program guide with Mermaid architecture diagrams.
- **Universal Responsive Email Engine**:
  - Re-architected student email dispatching for OTP verification, quiz invitations, and event registrations.
  - Implemented single-column fluid mobile layouts preventing overflow on Outlook, Gmail, and Apple Mail.

---

### Version 1.5.0
*Theme: Cloud Storage Migration & Verification Platform SSO*

- **Azure Blob Storage Migration**:
  - Migrated database diagrams, curriculum media, problem assets, and club logos to Azure Blob Storage containers.
  - Implemented resilient fallback systems for image loading errors and offline handling.
- **Bidirectional Verification Platform SSO**:
  - Enabled cross-portal Single Sign-On (SSO) and password synchronization between Quiz Platform and the MSC Verification Portal (`verify.mscprpcem.tech`).
  - Added cryptographic verification lookup allowing instant handle (@username) and certificate ID searches.
- **Security Audit & Hardening**:
  - Audited 25 potential security vulnerabilities across JWT handling, rate limiting, and SQL parameterization.

---

### Version 1.4.0
*Theme: Interactive SQL Practice Lab & Engine*

- **In-Browser SQL Execution**:
  - Integrated `sql.js` (WebAssembly SQLite engine) enabling client-side query evaluation without backend roundtrips.
- **SQL Curriculum & Challenges**:
  - Added 66+ practice questions spanning Database Fundamentals, DDL (Data Definition Language), and DML (Data Manipulation Language).
  - Built interactive schema tables, expected output diffs, and query syntax highlighters.
- **Admin Authoring**:
  - Added admin capabilities to author, test, and publish new interactive SQL challenges.

---

### Version 1.3.0
*Theme: Cumulative Leaderboards, Analytics & Reporting*

- **Cumulative Tournament Leaderboards**:
  - Added multi-week score aggregation allowing organizers to evaluate season-long performance.
  - Standardized question scoring to a clean 1-point scale to avoid legacy 10,000-point inflation.
- **Excel Ingestion & Export Engine**:
  - Implemented full Excel (`.xlsx`) report generation for attendee scores, times, and anti-cheat violation counts.
  - Added clean spreadsheet ingestion templates supporting Multiple Choice, True/False, and Multi-Select formats.

---

### Version 1.2.0
*Theme: Scheduled Assessments & Timezone Standardization*

- **Scheduled Quizzes**:
  - Built time-window assessments allowing students to take scheduled tests asynchronously within designated availability windows.
  - Implemented continuous question numbering across multi-part modules.
- **IST Timezone Standardization**:
  - Enforced strict Indian Standard Time (`UTC+05:30`) formatting across all lobbies, clocks, and admin scheduling tools.

---

### Version 1.1.0
*Theme: Student Authentication & Anti-Cheat Proctoring*

- **Student Authentication & Verification**:
  - Added registration flow with email OTP validation and PRPCEM institutional domain checks.
  - Added persistent student profile tracking with XP accumulation.
- **Proctoring & Anti-Cheat Engine**:
  - Enforced mandatory fullscreen mode on desktop and mobile browsers.
  - Tracked tab switching, blur events, and window resizing, logging anti-cheat violations in real-time.

---

### Version 1.0.0
*Theme: Initial Launch*

- **Real-Time Live Quiz Core**:
  - Real-time synchronous multiplayer quiz rooms powered by Node.js, Express, and Socket.io.
  - Host admin control panel with question broadcasting, timers, and instant answer reveals.
  - Live participant lobby, dynamic scoreboards, and instant celebration screens.
