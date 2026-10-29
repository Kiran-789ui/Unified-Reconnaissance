export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
  priority?: number;
  raw?: any;
}

export interface WhoisData {
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  registrantOrganization?: string;
  registrantCountry?: string;
  isPrivacyProtected?: boolean;
  rawText?: string;
}

export interface IpMetadata {
  ip: string;
  ipVersion: 4 | 6;
  isPrivate: boolean;
  reverseDns?: string[];
  asn?: string;
  asName?: string;
  isp?: string;
  organization?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface DataSourceMeta {
  name: string;
  description: string;
  status: string;
  queriedAt: string;
}

export interface ReconReport {
  _id: string;
  userId: string;
  target: string;
  targetType: 'domain' | 'ipv4' | 'ipv6';
  lookupTimestamp: string;
  overallStatus: 'success' | 'partial' | 'failed';
  summaryStats: {
    dnsRecordsCount: number;
    whoisAvailable: boolean;
    ipInfoAvailable: boolean;
    durationMs: number;
  };
  dns?: {
    status: 'success' | 'partial' | 'failed' | 'skipped';
    records: DnsRecord[];
    error?: string;
    source?: string;
  };
  whois?: {
    status: 'success' | 'partial' | 'failed' | 'skipped' | 'unavailable';
    data?: WhoisData;
    error?: string;
    source?: string;
  };
  ipInfo?: {
    status: 'success' | 'partial' | 'failed' | 'skipped';
    data?: IpMetadata;
    error?: string;
    source?: string;
  };
  dataSources: DataSourceMeta[];
  notes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalReports: number;
  uniqueTargetsCount: number;
  avgDurationMs: number;
  statusBreakdown: {
    success: number;
    partial: number;
    failed: number;
  };
  typeBreakdown: {
    domain: number;
    ipv4: number;
    ipv6: number;
  };
  recentScans: ReconReport[];
  timeline: {
    date: string;
    scans: number;
    successful: number;
  }[];
}
