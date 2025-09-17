import mongoose from 'mongoose';

export interface IActivity extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userRole: 'seeker' | 'provider' | 'admin';
  action: string;
  description: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivitySchema = new mongoose.Schema<IActivity>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['seeker', 'provider', 'admin'],
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for better query performance
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ userRole: 1, createdAt: -1 });
ActivitySchema.index({ action: 1, createdAt: -1 });

// TTL index to automatically delete old activities after 90 days
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log activity
ActivitySchema.statics.logActivity = async function(
  userId: string,
  userRole: string,
  action: string,
  description: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const activity = new this({
      userId,
      userRole,
      action,
      description,
      details,
      ipAddress,
      userAgent
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
};

// Static method to get recent activities
ActivitySchema.statics.getRecentActivities = async function(
  userId?: string,
  userRole?: string,
  limit: number = 20,
  skip: number = 0
) {
  const query: any = {};
  
  if (userId) {
    query.userId = userId;
  }
  
  if (userRole) {
    query.userRole = userRole;
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get activity stats
ActivitySchema.statics.getActivityStats = async function(
  timeRange: 'today' | '7d' | '30d' = '7d'
) {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          userRole: '$userRole'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        byRole: {
          $push: {
            role: '$_id.userRole',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ]);
  
  return stats;
};

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
