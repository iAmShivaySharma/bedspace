'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Globe,
  Database,
  Bell,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface PlatformSettings {
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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Show success message
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'booking', label: 'Booking', icon: DollarSign },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return <PageSkeleton type='form' />;
  }

  if (!settings) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>Failed to Load Settings</h2>
          <Button onClick={fetchSettings}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title='Platform Settings'>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Platform Settings</h1>
            <p className='text-gray-600 mt-1'>Configure platform behavior and policies</p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className='flex items-center gap-2'>
            {saving ? (
              <RefreshCw className='h-4 w-4 skeleton-loading' />
            ) : (
              <Save className='h-4 w-4' />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Sidebar */}
          <div className='lg:w-64'>
            <nav className='space-y-2'>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className='flex-1'>
            {activeTab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic platform configuration</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='platformName'>Platform Name</Label>
                      <Input
                        id='platformName'
                        value={settings.general.platformName}
                        onChange={e => updateSetting('general', 'platformName', e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='supportEmail'>Support Email</Label>
                      <Input
                        id='supportEmail'
                        type='email'
                        value={settings.general.supportEmail}
                        onChange={e => updateSetting('general', 'supportEmail', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='platformDescription'>Platform Description</Label>
                    <Textarea
                      id='platformDescription'
                      value={settings.general.platformDescription}
                      onChange={e =>
                        updateSetting('general', 'platformDescription', e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Maintenance Mode</Label>
                        <p className='text-sm text-gray-500'>Temporarily disable platform access</p>
                      </div>
                      <Switch
                        checked={settings.general.maintenanceMode}
                        onCheckedChange={checked =>
                          updateSetting('general', 'maintenanceMode', checked)
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Registration Enabled</Label>
                        <p className='text-sm text-gray-500'>Allow new user registrations</p>
                      </div>
                      <Switch
                        checked={settings.general.registrationEnabled}
                        onCheckedChange={checked =>
                          updateSetting('general', 'registrationEnabled', checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'booking' && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5' />
                    Booking Settings
                  </CardTitle>
                  <CardDescription>Configure booking policies and fees</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='minBookingDuration'>Min Booking Duration (days)</Label>
                      <Input
                        id='minBookingDuration'
                        type='number'
                        value={settings.booking.minBookingDuration}
                        onChange={e =>
                          updateSetting('booking', 'minBookingDuration', parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='maxBookingDuration'>Max Booking Duration (days)</Label>
                      <Input
                        id='maxBookingDuration'
                        type='number'
                        value={settings.booking.maxBookingDuration}
                        onChange={e =>
                          updateSetting('booking', 'maxBookingDuration', parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bookingFee'>Platform Fee (%)</Label>
                    <Input
                      id='bookingFee'
                      type='number'
                      step='0.1'
                      value={settings.booking.bookingFee}
                      onChange={e =>
                        updateSetting('booking', 'bookingFee', parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='cancellationPolicy'>Cancellation Policy</Label>
                    <Textarea
                      id='cancellationPolicy'
                      value={settings.booking.cancellationPolicy}
                      onChange={e => updateSetting('booking', 'cancellationPolicy', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Auto-Approval</Label>
                      <p className='text-sm text-gray-500'>Automatically approve bookings</p>
                    </div>
                    <Switch
                      checked={settings.booking.autoApprovalEnabled}
                      onCheckedChange={checked =>
                        updateSetting('booking', 'autoApprovalEnabled', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'verification' && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='h-5 w-5' />
                    Verification Settings
                  </CardTitle>
                  <CardDescription>Configure provider verification process</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='verificationTimeout'>Verification Timeout (days)</Label>
                    <Input
                      id='verificationTimeout'
                      type='number'
                      value={settings.verification.verificationTimeout}
                      onChange={e =>
                        updateSetting(
                          'verification',
                          'verificationTimeout',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Required Documents</Label>
                    <div className='flex flex-wrap gap-2'>
                      {settings.verification.requiredDocuments.map((doc, index) => (
                        <Badge key={index} variant='outline'>
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Auto-Verify Providers</Label>
                      <p className='text-sm text-gray-500'>Automatically verify new providers</p>
                    </div>
                    <Switch
                      checked={settings.verification.autoVerifyProviders}
                      onCheckedChange={checked =>
                        updateSetting('verification', 'autoVerifyProviders', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Bell className='h-5 w-5' />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Email Notifications</Label>
                        <p className='text-sm text-gray-500'>Send email notifications to users</p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={checked =>
                          updateSetting('notifications', 'emailNotifications', checked)
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className='text-sm text-gray-500'>Send SMS notifications to users</p>
                      </div>
                      <Switch
                        checked={settings.notifications.smsNotifications}
                        onCheckedChange={checked =>
                          updateSetting('notifications', 'smsNotifications', checked)
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Push Notifications</Label>
                        <p className='text-sm text-gray-500'>
                          Send push notifications to mobile apps
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={checked =>
                          updateSetting('notifications', 'pushNotifications', checked)
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Admin Alerts</Label>
                        <p className='text-sm text-gray-500'>Send alerts to administrators</p>
                      </div>
                      <Switch
                        checked={settings.notifications.adminAlerts}
                        onCheckedChange={checked =>
                          updateSetting('notifications', 'adminAlerts', checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='h-5 w-5' />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Configure security policies</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='passwordMinLength'>Min Password Length</Label>
                      <Input
                        id='passwordMinLength'
                        type='number'
                        value={settings.security.passwordMinLength}
                        onChange={e =>
                          updateSetting('security', 'passwordMinLength', parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='sessionTimeout'>Session Timeout (minutes)</Label>
                      <Input
                        id='sessionTimeout'
                        type='number'
                        value={settings.security.sessionTimeout}
                        onChange={e =>
                          updateSetting('security', 'sessionTimeout', parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='maxLoginAttempts'>Max Login Attempts</Label>
                    <Input
                      id='maxLoginAttempts'
                      type='number'
                      value={settings.security.maxLoginAttempts}
                      onChange={e =>
                        updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Two-Factor Authentication Required</Label>
                      <p className='text-sm text-gray-500'>Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorRequired}
                      onCheckedChange={checked =>
                        updateSetting('security', 'twoFactorRequired', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
