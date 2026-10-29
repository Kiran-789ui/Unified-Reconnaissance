# Unified Reconnaissance Platform - REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### 1.1 Register Analyst
- **URL**: `/auth/register`
- **Method**: `POST`
- **Rate Limit**: 20 requests per 15 minutes
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@recon.local",
    "password": "StrongPassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user object and JWT token. Sets `token` HttpOnly cookie.
  - `400 Bad Request`: Validation failure (short password, invalid email).
  - `409 Conflict`: Email already exists.

### 1.2 Login Analyst
- **URL**: `/auth/login`
- **Method**: `POST`
- **Rate Limit**: 20 requests per 15 minutes
- **Request Body**:
  ```json
  {
    "email": "alex@recon.local",
    "password": "StrongPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns authenticated user info and token.
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Logout Analyst
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Responses**:
  - `200 OK`: Clears session cookie.

### 1.4 Get Current User Profile
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>` or session cookie
- **Responses**:
  - `200 OK`: Returns active user data `{ id, name, email, createdAt }`.
  - `401 Unauthorized`: Missing or invalid token.

### 1.5 Update Password
- **URL**: `/auth/change-password`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Password updated.
  - `400 Bad Request`: Current password incorrect or new password weak.

---

## 2. Reconnaissance Endpoints

### 2.1 Full Unified Reconnaissance Scan
- **URL**: `/recon/full`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Rate Limit**: 30 lookups per minute
- **Request Body**:
  ```json
  {
    "target": "cloudflare.com"
  }
  ```
- **Responses**:
  - `200 OK`: Returns complete reconnaissance report.
  - `400 Bad Request`: Target is invalid, loopback, private IP, or contains invalid characters.

### 2.2 Standalone DNS Resolution
- **URL**: `/recon/dns`
- **Method**: `POST`
- **Request Body**: `{ "target": "example.com" }`
- **Responses**:
  - `200 OK`: Resolves A, AAAA, MX, NS, TXT, CNAME, SOA records.

### 2.3 Standalone WHOIS Lookup
- **URL**: `/recon/whois`
- **Method**: `POST`
- **Request Body**: `{ "target": "example.com" }`
- **Responses**:
  - `200 OK`: Returns registrar, creation/expiry dates, nameservers, status codes.

### 2.4 Standalone IP & Routing Lookup
- **URL**: `/recon/ip`
- **Method**: `POST`
- **Request Body**: `{ "target": "1.1.1.1" }`
- **Responses**:
  - `200 OK`: Returns IP version, reverse DNS (PTR), ASN, ISP, country, city.

---

## 3. Report Management Endpoints

### 3.1 List Saved Reports
- **URL**: `/reports`
- **Method**: `GET`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Records per page (default: 10, max: 50)
  - `q`: Target search term
  - `status`: `success` | `partial` | `failed`
- **Responses**:
  - `200 OK`: Returns paginated report summaries.

### 3.2 Retrieve Single Report
- **URL**: `/reports/:id`
- **Method**: `GET`
- **Responses**:
  - `200 OK`: Full detailed report object.
  - `403 Forbidden`: User does not own this report.
  - `404 Not Found`: Report does not exist.

### 3.3 Delete Report
- **URL**: `/reports/:id`
- **Method**: `DELETE`
- **Responses**:
  - `200 OK`: Report deleted.
  - `403 Forbidden`: Access denied.

### 3.4 Export Report
- **URL**: `/reports/:id/export?format=json|csv|pdf`
- **Method**: `GET`
- **Query Parameters**: `format` (`json`, `csv`, or `pdf`)
- **Responses**:
  - `200 OK`: Attachment file with appropriate MIME type and Content-Disposition header.

---

## 4. Dashboard Statistics Endpoint

### 4.1 Get Dashboard Metrics
- **URL**: `/dashboard/stats`
- **Method**: `GET`
- **Responses**:
  - `200 OK`: Returns real MongoDB metrics:
    - `totalReports`: Total scans performed by user.
    - `uniqueTargetsCount`: Distinct hosts analyzed.
    - `avgDurationMs`: Average lookup time in milliseconds.
    - `statusBreakdown`: Counts of success, partial, failed.
    - `typeBreakdown`: Counts of domain, ipv4, ipv6.
    - `timeline`: Daily lookup counts for the last 7 days.
    - `recentScans`: Last 5 lookups.
