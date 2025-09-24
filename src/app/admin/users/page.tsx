'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Filter, MoreHorizontal, Shield, Ban, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'seeker' | 'provider' | 'admin';
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?role=${roleFilter}&search=${searchTerm}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'verify') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setMessage(`User ${action}d successfully`);
        fetchUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const result = await response.json();
        setError(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      setError('Network error. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'provider':
        return 'bg-blue-100 text-blue-800';
      case 'seeker':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title='User Management'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='User Management'>
      {message && (
        <div className='mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
          {message}
        </div>
      )}

      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search users by name or email...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='flex gap-2'>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Roles</option>
            <option value='seeker'>Seekers</option>
            <option value='provider'>Providers</option>
            <option value='admin'>Admins</option>
          </select>
          <Button onClick={fetchUsers} variant='outline'>
            <Filter className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage all platform users, their roles, and account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left py-3 px-4 font-medium text-gray-900'>User</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-900'>Role</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-900'>Status</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-900'>Joined</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-900'>Last Login</th>
                  <th className='text-right py-3 px-4 font-medium text-gray-900'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className='border-b hover:bg-gray-50'>
                    <td className='py-4 px-4'>
                      <div>
                        <div className='font-medium text-gray-900 flex items-center'>
                          {user.name}
                          {user.isVerified && <Shield className='w-4 h-4 text-green-500 ml-2' />}
                        </div>
                        <div className='text-sm text-gray-500 flex items-center mt-1'>
                          <Mail className='w-3 h-3 mr-1' />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className='text-sm text-gray-500 flex items-center'>
                            <Phone className='w-3 h-3 mr-1' />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='py-4 px-4'>
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td className='py-4 px-4'>
                      <Badge className={getStatusBadgeColor(user.isActive)}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className='py-4 px-4 text-sm text-gray-500'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='py-4 px-4 text-sm text-gray-500'>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className='py-4 px-4 text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {user.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user._id, 'deactivate')}
                              className='text-red-600'
                            >
                              <Ban className='w-4 h-4 mr-2' />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user._id, 'activate')}
                              className='text-green-600'
                            >
                              <Shield className='w-4 h-4 mr-2' />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {!user.isVerified && (
                            <DropdownMenuItem onClick={() => handleUserAction(user._id, 'verify')}>
                              <Shield className='w-4 h-4 mr-2' />
                              Verify User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <p>No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
