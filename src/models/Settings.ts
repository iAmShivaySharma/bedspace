import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  _id: string;
  general: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  booking: {
    maxBookingDuration: number;
    minBookingDuration: number;
    cancellationPolicy: string;
    autoApprovalEnabled: boolean;
    bookingFee: number;
  };
  verification: {
    autoVerifyProviders: boolean;
    requiredDocuments: string[];
    verificationTimeout: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
  };
  localization: {
    defaultCurrency: string;
    currencySymbol: string;
    defaultTimezone: string;
    dateFormat: string;
    timeFormat: string;
    supportedCurrencies: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Extend the Model interface to include static methods
export interface ISettingsModel extends Model<ISettings> {
  getSettings(): Promise<ISettings>;
  updateSettings(updates: Partial<ISettings>): Promise<ISettings>;
  getPublicSettings(): Promise<{
    general: {
      platformName: string;
      platformDescription: string;
    };
    localization: ISettings['localization'];
  }>;
}

const SettingsSchema = new Schema<ISettings>(
  {
    general: {
      platformName: {
        type: String,
        required: true,
        default: 'BedSpace',
      },
      platformDescription: {
        type: String,
        required: true,
        default: 'Find comfortable and affordable bed spaces in Mumbai',
      },
      supportEmail: {
        type: String,
        required: true,
        default: 'support@bedspace.com',
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      registrationEnabled: {
        type: Boolean,
        default: true,
      },
    },
    booking: {
      maxBookingDuration: {
        type: Number,
        default: 365, // days
      },
      minBookingDuration: {
        type: Number,
        default: 1, // days
      },
      cancellationPolicy: {
        type: String,
        default:
          'Free cancellation up to 24 hours before check-in. After that, the first night is non-refundable.',
      },
      autoApprovalEnabled: {
        type: Boolean,
        default: false,
      },
      bookingFee: {
        type: Number,
        default: 3.0, // percentage
      },
    },
    verification: {
      autoVerifyProviders: {
        type: Boolean,
        default: false,
      },
      requiredDocuments: {
        type: [String],
        default: ['Aadhaar Card', 'PAN Card', 'Address Proof', 'Property Documents'],
      },
      verificationTimeout: {
        type: Number,
        default: 7, // days
      },
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      adminAlerts: {
        type: Boolean,
        default: true,
      },
    },
    security: {
      passwordMinLength: {
        type: Number,
        default: 8,
      },
      sessionTimeout: {
        type: Number,
        default: 1440, // minutes (24 hours)
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      twoFactorRequired: {
        type: Boolean,
        default: false,
      },
    },
    localization: {
      defaultCurrency: {
        type: String,
        default: 'INR',
      },
      currencySymbol: {
        type: String,
        default: '₹',
      },
      defaultTimezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
      },
      timeFormat: {
        type: String,
        default: '12',
      },
      supportedCurrencies: {
        type: [String],
        default: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create default settings
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});

  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({});
  }

  return settings;
};

// Static method to update settings
SettingsSchema.statics.updateSettings = async function (updates: Partial<ISettings>) {
  let settings = await this.findOne({});

  if (!settings) {
    settings = await this.create(updates);
  } else {
    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && settings) {
        if (
          typeof updates[key as keyof ISettings] === 'object' &&
          updates[key as keyof ISettings] !== null
        ) {
          (settings as any)[key] = {
            ...(settings as any)[key],
            ...updates[key as keyof ISettings],
          };
        } else {
          (settings as any)[key] = updates[key as keyof ISettings];
        }
      }
    });
    await settings.save();
  }

  return settings;
};

// Static method to get public settings (non-sensitive data)
SettingsSchema.statics.getPublicSettings = async function () {
  const settings = await (this as ISettingsModel).getSettings();

  return {
    general: {
      platformName: settings.general.platformName,
      platformDescription: settings.general.platformDescription,
    },
    localization: settings.localization,
  };
};

const Settings =
  (mongoose.models.Settings as unknown as ISettingsModel) ||
  mongoose.model<ISettings, ISettingsModel>('Settings', SettingsSchema);

export { Settings };
