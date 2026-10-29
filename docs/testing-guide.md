# Unified Reconnaissance Platform - Testing & Quality Assurance Guide

This guide describes how to run automated test suites, verify API endpoints, and execute manual acceptance test procedures.

---

## 1. Automated Testing Suite

The platform includes unit and integration tests for both frontend and backend using **Vitest** and **Supertest**.

### 1.1 Running Backend Tests
From the project root:
```bash
cd backend
npm test
```
**Test Coverage Includes:**
- `targetValidator.test.ts`:
  - RFC 1035 domain format validation.
  - Public IPv4 and IPv6 format validation.
  - SSRF protection: blocking private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`, `::1`), link-local (`169.254.169.254`), and reserved prefixes.
  - Command injection blocking (rejecting `;`, `|`, `` ` ``, `$`, `<`, `>`).
  - Scheme stripping and rejection (`http://`, `ftp://`).
- `auth.test.ts`:
  - Registration with validation and duplicate email rejection.
  - Login authentication and password verification with bcrypt.
  - Protected route checks (401 Unauthorized without session).
  - Session cookie invalidation on logout.
- `recon.test.ts`:
  - Input rejection for malformed and SSRF targets.
  - Full passive scan pipeline execution with mocked external services.
- `reports.test.ts`:
  - User report listing and pagination.
  - Strict tenant/ownership isolation (403 Forbidden when User B queries User A's report).
  - Multi-format exports: JSON, CSV (with CSV formula injection escaping), and PDF generation via PDFKit.
  - MongoDB-backed statistical aggregation for dashboard metrics.

### 1.2 Running Frontend Tests
From the project root:
```bash
cd frontend
npm test
```
**Test Coverage Includes:**
- `validation.test.ts`:
  - Client-side target format regex evaluation.
  - Instant SSRF detection for RFC 1918 subnets and cloud metadata endpoints.

---

## 2. Manual Testing Procedure & Test Cases

Follow these manual steps to evaluate the application end-to-end:

### Test Case 1: Account Registration & Authentication
1. Navigate to `http://localhost:5173/login`.
2. Click **Create Analyst Account** or use the **1-Click Project Viva / Demo Login** button.
3. If creating an account manually, enter:
   - Full Name: `Test Analyst`
   - Email: `analyst@recon.test`
   - Password: `SecurePassword2026!`
4. Verify immediate redirect to the Dashboard Overview upon successful sign-in.
5. Check that your user name and initials appear in the top-right navbar menu.

### Test Case 2: SSRF & Input Validation Guard
1. Navigate to **Reconnaissance Search** (`/scan`).
2. Enter `127.0.0.1` and observe the live warning:
   - *Expected Result*: Target is flagged as private/loopback, Launch button is disabled with SSRF warning.
3. Enter `192.168.1.1` and `http://google.com`.
   - *Expected Result*: System flags private IP and warns against entering URL schemes.
4. Enter `example.com; ls -la`.
   - *Expected Result*: System rejects command injection characters immediately.

### Test Case 3: Domain Passive Reconnaissance
1. On the Recon Search page, enter `cloudflare.com` (or click the quick preset chip).
2. Click **Launch Passive Reconnaissance**.
3. Observe the live 4-phase progress stepper.
4. Verify redirect to the Scan Results page with all 5 tabs populated:
   - **Overview Tab**: Shows target, domain classification, duration, data sources queried.
   - **DNS Records Tab**: Lists A, AAAA, MX, NS records with TTL values and copy buttons.
   - **WHOIS Tab**: Shows registrar name, creation date, expiry date, name servers, and privacy status.
   - **IP & Routing Tab**: Shows resolved IPv4, ASN (`AS13335`), organization, country, and PTR reverse DNS.
   - **Raw Metadata Tab**: Displays full structured JSON representation.

### Test Case 4: IP Address Passive Reconnaissance
1. Enter `8.8.8.8` (Google Public DNS) in the search bar.
2. Click **Launch Passive Reconnaissance**.
3. Verify results:
   - Target classified as `IPV4`.
   - Reverse DNS resolves to `dns.google`.
   - Autonomous system shows `AS15169 Google LLC`.
   - Country shows `United States`.

### Test Case 5: Report Generation & Export
1. On the results page for any completed scan, locate the export toolbar:
   - Click **JSON**: Verifies browser downloads `recon_<target>_<date>.json`.
   - Click **CSV**: Verifies browser downloads properly formatted CSV without formula injection vulnerabilities.
   - Click **PDF**: Verifies browser downloads styled cybersecurity PDF report with header banner, tables, and legal disclaimer.

### Test Case 6: Scan History & Ownership Isolation
1. Navigate to **Scan History** (`/history`).
2. Verify all scans performed during the session appear in the table with accurate timestamps and durations.
3. Use the search field to filter by domain name.
4. Change the status filter dropdown to `Success Only`.
5. Click **Open** on any row to re-open the report.
