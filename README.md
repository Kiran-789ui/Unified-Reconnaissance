# Unified Reconnaissance Platform (URP)

> **A modern, centralized passive reconnaissance and OSINT intelligence dashboard designed for B.Tech cybersecurity students, security researchers, and authorized analysts.**

[![Full Stack Architecture](https://img.shields.io/badge/Architecture-Full%20Stack%20MERN-blue?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](#)
[![Security Audited](https://img.shields.io/badge/Security-SSRF%20Guard%20%7C%20Passive%20Only-emerald?style=flat-square)](#)
[![Tests Passing](https://img.shields.io/badge/Tests-24%2F24%20Passing-brightgreen?style=flat-square)](#)

---

## 1. Project Abstract

In modern defensive cybersecurity and ethical security assessments, reconnaissance is the foundational first phase of the Cyber Kill Chain and the MITRE ATT&CK framework (Reconnaissance TA0043). Security analysts, penetration testers, and incident responders routinely gather information about public domains, authoritative DNS zone records, WHOIS domain registrations, and autonomous system (ASN) network mappings.

However, beginner cybersecurity students often rely on disjointed web tools, clunky CLI utilities, or risky active scanners that can trigger legal violations or network intrusion alarms. The **Unified Reconnaissance Platform** resolves this challenge by providing an authorized, non-intrusive, and modern web application that centralizes passive domain, DNS, WHOIS, and IP intelligence into one intuitive, dark-themed dashboard.

---

## 2. Problem Statement

1. **Fragmentation of OSINT Tools**: Analysts are typically forced to consult 4 to 6 separate third-party websites or CLI scripts (`dig`, `whois`, `nslookup`, `bgpview`) to obtain a baseline profile of a domain or IP.
2. **Accidental Active Scanning Risks**: Beginners frequently confuse passive intelligence gathering with active port scanning (`nmap`), which can transmit unsolicited packets and violate university acceptable use policies or cybersecurity laws.
3. **Lack of Centralized Scan History & Audit Trails**: CLI lookups leave ephemeral logs that cannot easily be cross-referenced, visualized, or exported into formal reports for risk assessments and academic viva demonstrations.
4. **Poor SSRF and Injection Protections in Legacy Scripts**: Custom internal recon tools often fail to sanitize user input, exposing web servers to Server-Side Request Forgery (SSRF) against internal cloud metadata services (e.g., `169.254.169.254`) and RFC 1918 private subnets.

---

## 3. Project Objectives

- **Centralize Passive Reconnaissance**: Aggregate DNS records, WHOIS registration information, and IP routing metadata into one responsive web console.
- **Enforce Safe, Authorized Lookups**: Prevent active intrusion, brute-forcing, port scanning, or web scraping by strictly utilizing passive DNS resolvers, ICANN RDAP, and public BGP routing databases.
- **Implement Robust SSRF Defense**: Enforce server-side filters that block loopback (`127.0.0.1`), cloud metadata (`169.254.169.254`), and private RFC 1918 subnets (`10.x.x.x`, `192.168.x.x`, `172.16.x.x`).
- **Provide Actionable Reporting**: Enable authenticated security analysts to export findings in structured JSON, sanitized CSV (preventing spreadsheet formula injection), and branded PDF formats.
- **Serve as a B.Tech Cybersecurity Capstone**: Deliver production-ready code with clean architecture, comprehensive test coverage, and documentation suitable for college project evaluation and technical vivas.

---

## 4. Key Features

- **Cybersecurity Dark Navy Dashboard**: Built with Tailwind CSS, custom cyan accents, accessible contrast ratios, and responsive layouts across desktop, tablet, and mobile.
- **Instant Target Format Recognition**: Detects domain names, IPv4, and IPv6 addresses in real time with client-side and server-side validation.
- **Passive DNS Resolver**: Resolves A, AAAA, MX, NS, TXT, CNAME, and SOA zone records in parallel with individual safe timeouts.
- **Modern RDAP & WHOIS Integration**: Queries ICANN-accredited Registration Data Access Protocol (RDAP) endpoints with fallback to socket-level WHOIS, handling redacted and privacy-protected records cleanly.
- **Autonomous System (ASN) & IP Intelligence**: Identifies BGP autonomous system numbers, ISP organizations, PTR reverse DNS records, and coarse geographic regions without individual location tracking.
- **User-Isolated Scan History**: Securely persists scans in MongoDB indexed by user ID; users can only view, search, filter, and delete their own reports.
- **Multi-Format Export Engine**: Downloadable reports in JSON, CSV (escaped against CSV injection), and PDF (rendered via PDFKit with executive banners and legal disclaimers).
- **Interactive Metrics Visualization**: Dynamic Recharts timeline displaying lookup frequency over the past 7 days and target classification distribution.
- **1-Click Project Viva / Demo Login**: Instant guest authentication button for college professors and evaluators to test live functionality in 1 click without manual signup.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS with custom cyber color palette
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Area charts and Donut charts)
- **Routing**: React Router DOM v6
- **Testing**: Vitest

### Backend
- **Runtime**: Node.js LTS (v20+ / v24+)
- **Framework**: Express.js with TypeScript
- **Security Middleware**: Helmet, CORS, Express-Rate-Limit, Cookie-Parser
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs password hashing
- **Validation**: Zod schema validation & custom SSRF guard
- **PDF Generation**: PDFKit
- **Testing**: Vitest + Supertest

### Database
- **Database Engine**: MongoDB with Mongoose ODM
- **In-Memory Fallback**: Automatic `mongodb-memory-server` fallback for zero-configuration testing and dev environments where a local mongod daemon is not installed!

---

## 6. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide React + Recharts           |
|                                                                                   |
|  [ Dashboard Overview ] <--> [ Recon Search ] <--> [ History & Export Engine ]    |
+-----------------------------------------------------------------------------------+
                                       |
                   HTTP/REST + JWT / HttpOnly Cookie
                                       |
+-----------------------------------------------------------------------------------+
|                                 API GATEWAY                                       |
|  Node.js + Express.js + Helmet + CORS + Express Rate Limit + Request Parser       |
+-----------------------------------------------------------------------------------+
                                       |
             +-------------------------+-------------------------+
             |                                                   |
+-------------------------+                         +-------------------------------+
|  SECURITY / AUTH LAYER  |                         |  RECONNAISSANCE ENGINE        |
|  - JWT Verifier         |                         |  - Input Validation & SSRF    |
|  - bcrypt Password Hash |                         |  - Node.js DNS Resolver       |
|  - User Ownership Guard |                         |  - ICANN RDAP / WHOIS Service |
|  - Rate Limiting        |                         |  - IP Metadata & ASN Lookup   |
+-------------------------+                         +-------------------------------+
             |                                                   |
             +-------------------------+-------------------------+
                                       |
+-----------------------------------------------------------------------------------+
|                                DATABASE TIER                                      |
|  MongoDB + Mongoose ODM (Native Atlas / Local daemon + In-Memory Fallback)        |
|  Collections: Users, ReconnaissanceReports                                        |
+-----------------------------------------------------------------------------------+
```

---

## 7. Windows Setup and Installation (Beginner-Friendly)

This guide assumes you are a student using a Windows 10/11 machine.

### Step 1: Install Node.js LTS and Git
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/) and run the installer. Verify in PowerShell:
   ```powershell
   node -v
   npm -v
   ```
2. Download Git from [git-scm.com](https://git-scm.com/) and run the installer. Verify:
   ```powershell
   git --version
   ```

### Step 2: Open the Project in VS Code
1. Open PowerShell or Command Prompt.
2. Navigate to your project directory:
   ```powershell
   cd "C:\unified recconnace"
   code .
   ```

### Step 3: Install Backend Dependencies
Open a PowerShell terminal in VS Code:
```powershell
cd "C:\unified recconnace\backend"
npm install
```

### Step 4: Install Frontend Dependencies
In the same or a new PowerShell terminal:
```powershell
cd "C:\unified recconnace\frontend"
npm install
```

### Step 5: Configure Environment Variables
1. Verify `backend\.env`:
   ```ini
   PORT=5000
   NODE_ENV=development
   # Use MongoDB Atlas URI, local MongoDB, or set USE_IN_MEMORY_DB=true
   MONGODB_URI=mongodb://127.0.0.1:27017/unified-recon-db
   USE_IN_MEMORY_DB=false
   JWT_SECRET=super_secret_jwt_key_recon_platform_2026_secure
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   REQUEST_TIMEOUT_MS=8000
   ```
   > **Note on MongoDB**: If you don't have MongoDB installed locally, the backend **automatically detects this and falls back to an in-memory MongoDB database** so you can run the app immediately with zero database installation required!

2. Verify `frontend\.env`:
   ```ini
   VITE_API_URL=/api
   ```

### Step 6: Start the Backend Server
In the first PowerShell terminal:
```powershell
cd "C:\unified recconnace\backend"
npm run dev
```
You will see:
```
====================================================
🛡️  UNIFIED RECONNAISSANCE PLATFORM API SERVER
📡 Listening on http://localhost:5000
⚡ Environment: development
====================================================
```

### Step 7: Start the Frontend in a Separate Terminal
Open a second PowerShell terminal:
```powershell
cd "C:\unified recconnace\frontend"
npm run dev
```
You will see:
```
  VITE v6.0.7  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 8: Open in Browser & Run First Recon
1. Open your browser and navigate to `http://localhost:5173/`.
2. Click **1-Click Project Viva / Demo Login** to immediately authenticate as a student analyst.
3. In the quick search or on the **Reconnaissance Search** page, enter `cloudflare.com` or `8.8.8.8`.
4. Click **Launch Passive Reconnaissance**.
5. Inspect the DNS zone records, WHOIS registration info, and IP routing details.
6. Click **PDF** or **CSV** to download an executive intelligence report!

---

## 8. Running Automated Tests

Run the backend test suite:
```powershell
cd "C:\unified recconnace\backend"
npm test
```
*Result*: 24 out of 24 unit and integration tests passing covering input validation, SSRF defense, authentication, authorization, report ownership, and export engines.

Run the frontend test suite:
```powershell
cd "C:\unified recconnace\frontend"
npm test
```
*Result*: All client-side validation tests passing.

---

## 9. Viva & B.Tech Presentation Talking Points

Use these points to ace your project presentation and technical viva:

1. **Why is Passive Reconnaissance preferable to Active Scanning in initial OSINT?**
   - *Answer*: Passive reconnaissance queries public intermediaries (recursive DNS servers, ICANN RDAP registries, and BGP routing tables) without directly connecting to or probing the target's internal services. It generates zero intrusion detection alerts on the target infrastructure and carries zero risk of service disruption.
2. **How does this platform prevent Server-Side Request Forgery (SSRF)?**
   - *Answer*: The backend implements a multi-stage `validateTarget()` validator that rejects URL schemes (`http://`, `gopher://`), command separators (`;`, `|`, `` ` ``), and explicitly compares target IPs against RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), and cloud link-local metadata endpoints (`169.254.169.254`).
3. **What is the difference between WHOIS (Port 43) and RDAP?**
   - *Answer*: Traditional WHOIS operates over raw TCP port 43 with unstructured plain text that varies across registrars and is often blocked by corporate firewalls. RDAP (Registration Data Access Protocol, RFC 7480-7484) is ICANN's standardized, secure RESTful JSON protocol over HTTPS that supports structured entity objects, internationalization, and privacy access levels.
4. **How is tenant isolation maintained in MongoDB?**
   - *Answer*: Every scan report stores a `userId` field referencing the authenticated MongoDB user document. All read (`find`), delete (`findByIdAndDelete`), and export endpoints strictly enforce that the request's JWT `req.userId` matches the report's owner, returning `403 Forbidden` if an unauthorized analyst attempts to view another user's scan.
5. **How is CSV injection mitigated during export?**
   - *Answer*: Formula injection in spreadsheets occurs when user-supplied strings start with `=, +, -, @`, which Excel or Google Sheets might interpret as executable macros. The export service sanitizes every cell by prepending a single quote (`'`) to neutralize formula execution.

---

## 10. Ethical and Legal Considerations

- **Strictly Educational & Defensive**: The Unified Reconnaissance Platform is built for authorized educational demonstrations, security defense, and threat intelligence research.
- **No Exploitation**: The software contains no exploits, port scanners, brute-force engines, or vulnerability testing payloads.
- **Public Domain Data**: All intelligence displayed is publicly queryable information published voluntarily by domain owners and internet service providers under ICANN and IETF RFC standards.

---

## 11. Limitations & Future Enhancements

### Limitations
- Domain WHOIS availability depends on registrar privacy settings and ICANN redactions (GDPR compliance).
- Dynamic IP addresses or CDN front-ends (e.g., Cloudflare, Fastly) return proxy server metadata rather than origin server details, which is normal for passive DNS.

### Future Enhancements
- Integration with Certificate Transparency (CT) logs via crt.sh to map subdomains passively.
- Subdomain enumeration using passive DNS aggregation.
- Real-time DNS change tracking and alerting for domain hijacking detection.
- Multi-factor authentication (MFA/TOTP) for high-security enterprise deployments.

---

## 12. Authors & License

Developed as a modern full-stack cybersecurity project for B.Tech Cybersecurity and Computer Science engineering students.

Released under the **MIT License**.
