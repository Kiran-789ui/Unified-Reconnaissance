import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ReconReport } from '../models/ReconReport.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    // 1. Total reports count
    const totalReports = await ReconReport.countDocuments({ userId: userObjectId });

    // 2. Unique targets analyzed
    const uniqueTargets = await ReconReport.distinct('target', { userId: userObjectId });
    const uniqueTargetsCount = uniqueTargets.length;

    // 3. Status breakdown
    const statusCounts = await ReconReport.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
    ]);

    const statusMap = {
      success: 0,
      partial: 0,
      failed: 0,
    };
    for (const item of statusCounts) {
      if (item._id in statusMap) {
        (statusMap as any)[item._id] = item.count;
      }
    }

    // 4. Target type breakdown
    const typeCounts = await ReconReport.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
    ]);

    const typeMap = {
      domain: 0,
      ipv4: 0,
      ipv6: 0,
    };
    for (const item of typeCounts) {
      if (item._id in typeMap) {
        (typeMap as any)[item._id] = item.count;
      }
    }

    // 5. Recent scans (latest 5)
    const recentScans = await ReconReport.find({ userId: userObjectId })
      .sort({ lookupTimestamp: -1 })
      .limit(5)
      .select('target targetType lookupTimestamp overallStatus summaryStats');

    // 6. Timeline activity (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const timelineData = await ReconReport.aggregate([
      {
        $match: {
          userId: userObjectId,
          lookupTimestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lookupTimestamp' },
          },
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'success'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format last 7 days including zero count days
    const formattedTimeline: { date: string; scans: number; successful: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const match = timelineData.find((t) => t._id === dateStr);
      formattedTimeline.push({
        date: dateStr,
        scans: match ? match.count : 0,
        successful: match ? match.successCount : 0,
      });
    }

    // 7. Average duration
    const avgDurationResult = await ReconReport.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, avgDuration: { $avg: '$summaryStats.durationMs' } } },
    ]);
    const avgDuration = avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avgDuration || 0) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalReports,
        uniqueTargetsCount,
        avgDurationMs: avgDuration,
        statusBreakdown: statusMap,
        typeBreakdown: typeMap,
        recentScans,
        timeline: formattedTimeline,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard stats: ' + err.message,
    });
  }
};
