# Unified Reconnaissance Platform - Architecture Document

## 1. System Overview

The **Unified Reconnaissance Platform** is a full-stack cybersecurity reconnaissance and OSINT (Open Source Intelligence) analysis application. It provides an automated, non-intrusive environment for security students, analysts, and system administrators to gather domain registration data, DNS zone mapping, and autonomous system routing information for legitimate research and defensive auditing.

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

## 2. Core Architectural Pillars

### 2.1 Passive Reconnaissance Design
The platform is architected exclusively around **safe, passive lookups**:
- **DNS Resolution**: Queries recursive and authoritative name servers for standard public records (A, AAAA, MX, NS, TXT, CNAME, SOA) without sending TCP/UDP traffic to non-DNS ports on the target.
- **WHOIS & RDAP**: Queries ICANN-accredited registries via modern RFC 7480-7484 RESTful RDAP and port 43 TCP WHOIS fallback.
- **IP & ASN Intelligence**: Collects public BGP autonomous system information, ISP allocations, and coarse regional metadata without precision geolocation or privacy invasion.

### 2.2 Security & SSRF Defense Layer
To prevent abuse and internal network probing, targets pass through a server-side validation pipeline:
1. **Sanitization**: Strips whitespace, rejects command injection characters (`;&|`$><`).
2. **Protocol Stripping**: Enforces hostnames or IP addresses without URL schemes (`http://`, `ftp://`).
3. **SSRF Blocking**: Restricts queries targeting RFC 1918 private IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`, `fe80::/10`), and cloud metadata services (`169.254.169.254`).
4. **Internal TLD Blocking**: Blocks lookups for `.local`, `.internal`, `.lan`, `.home`, and `localhost`.

### 2.3 Authentication & Session Isolation
- **Password Security**: Passwords hashed using bcrypt with salt rounds of 10.
- **Token Handling**: Standard JSON Web Tokens (JWT) signed with HMAC-SHA256. Issued via HttpOnly, SameSite cookies with fallback to Bearer header.
- **Tenant Isolation**: MongoDB queries strictly filter by `userId: req.userId`. No user can read, delete, or export scan reports belonging to another analyst.

---

## 3. Data Flow Workflow

1. **User Target Entry**: User inputs target domain or IP on the Reconnaissance Search page.
2. **Client Validation**: Instant client-side validation checks input format, highlighting detected type (Domain, IPv4, IPv6) or displaying SSRF warnings.
3. **API Dispatch**: Authenticated request sent to `POST /api/recon/full`.
4. **Server SSRF Guard**: Target validated by server-side `validateTarget()` validator.
5. **Parallel Lookups**:
   - `lookupDns()` executes parallel queries for A, AAAA, MX, NS, TXT, CNAME, SOA.
   - `lookupWhois()` queries ICANN RDAP bootstrap and TCP Port 43.
   - `lookupIp()` resolves PTR reverse DNS and autonomous system metadata.
6. **Aggregation & Normalization**: Data consolidated into a typed `ReconReport` object.
7. **Persistence**: Report stored in MongoDB associated with `req.userId`.
8. **Client Visualization**: Dashboard updates recent scans, charts, and redirects user to detailed tabbed results page.
