import mongoose, { Document, Schema } from 'mongoose';

export interface IDnsRecord {
  type: string;
  value: string;
  ttl?: number;
  priority?: number;
  raw?: any;
}

export interface IWhoisData {
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

export interface IIpMetadata {
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

export interface IReconReport extends Document {
  userId: mongoose.Types.ObjectId;
  target: string;
  targetType: 'domain' | 'ipv4' | 'ipv6';
  lookupTimestamp: Date;
  overallStatus: 'success' | 'partial' | 'failed';
  summaryStats: {
    dnsRecordsCount: number;
    whoisAvailable: boolean;
    ipInfoAvailable: boolean;
    durationMs: number;
  };
  dns?: {
    status: 'success' | 'partial' | 'failed' | 'skipped';
    records: IDnsRecord[];
    error?: string;
  };
  whois?: {
    status: 'success' | 'partial' | 'failed' | 'skipped' | 'unavailable';
    data?: IWhoisData;
    error?: string;
  };
  ipInfo?: {
    status: 'success' | 'partial' | 'failed' | 'skipped';
    data?: IIpMetadata;
    error?: string;
  };
  dataSources: {
    name: string;
    description: string;
    status: string;
    queriedAt: Date;
  }[];
  notes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReconReportSchema = new Schema<IReconReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['domain', 'ipv4', 'ipv6'],
      required: true,
    },
    lookupTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    overallStatus: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'success',
    },
    summaryStats: {
      dnsRecordsCount: { type: Number, default: 0 },
      whoisAvailable: { type: Boolean, default: false },
      ipInfoAvailable: { type: Boolean, default: false },
      durationMs: { type: Number, default: 0 },
    },
    dns: {
      status: {
        type: String,
        enum: ['success', 'partial', 'failed', 'skipped'],
        default: 'skipped',
      },
      records: [
        {
          type: { type: String, required: true },
          value: { type: String, required: true },
          ttl: Number,
          priority: Number,
          raw: Schema.Types.Mixed,
        },
      ],
      error: String,
    },
    whois: {
      status: {
        type: String,
        enum: ['success', 'partial', 'failed', 'skipped', 'unavailable'],
        default: 'skipped',
      },
      data: {
        registrar: String,
        creationDate: String,
        expirationDate: String,
        updatedDate: String,
        nameServers: [String],
        status: [String],
        registrantOrganization: String,
        registrantCountry: String,
        isPrivacyProtected: Boolean,
        rawText: String,
      },
      error: String,
    },
    ipInfo: {
      status: {
        type: String,
        enum: ['success', 'partial', 'failed', 'skipped'],
        default: 'skipped',
      },
      data: {
        ip: String,
        ipVersion: { type: Number, enum: [4, 6] },
        isPrivate: Boolean,
        reverseDns: [String],
        asn: String,
        asName: String,
        isp: String,
        organization: String,
        country: String,
        countryCode: String,
        region: String,
        city: String,
        timezone: String,
      },
      error: String,
    },
    dataSources: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, required: true },
        queriedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [String],
  },
  {
    timestamps: true,
  }
);

// Compound index for user query and lookup sorting
ReconReportSchema.index({ userId: 1, lookupTimestamp: -1 });
ReconReportSchema.index({ userId: 1, target: 1 });

export const ReconReport = mongoose.model<IReconReport>('ReconReport', ReconReportSchema);
