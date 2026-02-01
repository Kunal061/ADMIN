import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Search, Edit, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storage } from '@/lib/storage';
import type { TripUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function UsersPage() {
  const { showToast } = useApp();
  const [tripUsers, setTripUsers] = useState<TripUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDobDay, setNewDobDay] = useState('');
  const [newDobMonth, setNewDobMonth] = useState('');
  const [newDobYear, setNewDobYear] = useState('');
  const [newGender, setNewGender] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState('');
  const [manageName, setManageName] = useState('');
  const [manageEmail, setManageEmail] = useState('');
  const [managePhone, setManagePhone] = useState('');
  const [manageDobDay, setManageDobDay] = useState('');
  const [manageDobMonth, setManageDobMonth] = useState('');
  const [manageDobYear, setManageDobYear] = useState('');
  const [manageGender, setManageGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEAR_START = 1920;

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateOfBirth = (dateString: string | undefined): string => {
    if (!dateString) return '—';
    // Check if it's in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    // If already in another format or invalid, return as is
    return dateString;
  };

  const API_BASE = 'http://localhost:3000/api/users';

  // Fetch users from MongoDB (testdb) via Express API
  const fetchUsersFromAPI = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('Failed to fetch users from API');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.users || []);

      // Transform API data (MongoDB: _id, firstName, lastName, dob) to TripUser format
      const transformedUsers: TripUser[] = list.map((user: any) => {
        // Handle both cases: either separate firstName/lastName or combined name
        const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
        const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
        const dob = user.dob || user.dateOfBirth;
        const dateOfBirth = typeof dob === 'string' ? dob.split('T')[0] : dob ? new Date(dob).toISOString().slice(0, 10) : undefined;
        return {
          id: (user._id ?? user.id).toString(),
          firstName,
          lastName,
          email: user.email,
          phone: user.phone || undefined,
          dateOfBirth,
          gender: user.gender || undefined,
        };
      });
      
      setTripUsers(transformedUsers);
      showToast('Users loaded from API successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setApiError(errorMsg);
      showToast('Failed to load users from API. Loading local data...');
      // Fallback to localStorage
      setTripUsers(storage.getTripUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersFromAPI();
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const refreshTripUsers = () => {
    fetchUsersFromAPI();
  };

  const handleAddUser = async () => {
    const email = newEmail.trim().toLowerCase();
    const trimmed = newName.trim();

    if (!email) {
      setError('Please enter an email address');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!trimmed) {
      setError('Please enter name');
      return;
    }

    const spaceIndex = trimmed.indexOf(' ');
    const firstName = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
    const lastName = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();

    const dateOfBirth = (newDobDay && newDobMonth && newDobYear)
      ? `${newDobYear}-${newDobMonth.padStart(2, '0')}-${newDobDay.padStart(2, '0')}`
      : undefined;

    const payload = {
      name: [firstName, lastName].filter(Boolean).join(' '),
      email,
      phone: newPhone.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: newGender.trim() || undefined,
    };

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to add user to API');
      }
      refreshTripUsers();
      showToast('User added successfully!');
    } catch {
      showToast('Failed to sync with API. Adding locally.');
      storage.addTripUser({
        firstName,
        lastName,
        email,
        phone: newPhone.trim() || undefined,
        dateOfBirth,
        gender: newGender.trim() || undefined,
      });
      refreshTripUsers();
    }

    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDobDay('');
    setNewDobMonth('');
    setNewDobYear('');
    setNewGender('');
    setError(null);
    setDialogOpen(false);
  };

  const handleDeleteUser = async (id: string, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName}?`)) return;
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete on API');
      refreshTripUsers();
      showToast('User removed successfully!');
    } catch {
      showToast('Failed to delete on API. Removing locally.');
      storage.deleteTripUser(id);
      refreshTripUsers();
    }
  };

  const resetManageDialog = () => {
    setManageDialogOpen(false);
    setManageUserId('');
    setManageName('');
    setManageEmail('');
    setManagePhone('');
    setManageDobDay('');
    setManageDobMonth('');
    setManageDobYear('');
    setManageGender('');
  };

  const handleSaveUser = async () => {
    if (!manageUserId) {
      resetManageDialog();
      return;
    }
    const trimmed = manageName.trim();
    const spaceIndex = trimmed.indexOf(' ');
    const firstName = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
    const lastName = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();
    const dateOfBirth = (manageDobDay && manageDobMonth && manageDobYear)
      ? `${manageDobYear}-${manageDobMonth.padStart(2, '0')}-${manageDobDay.padStart(2, '0')}`
      : undefined;
    const payload = {
      name: [firstName, lastName].filter(Boolean).join(' '),
      email: manageEmail.trim(),
      phone: managePhone.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: manageGender.trim() || undefined,
    };
    const updateData = {
      firstName,
      lastName,
      email: manageEmail.trim(),
      phone: managePhone.trim() || undefined,
      dateOfBirth,
      gender: manageGender.trim() || undefined,
    };
    try {
      const response = await fetch(`${API_BASE}/${manageUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update on API');
      refreshTripUsers();
      showToast('User updated successfully!');
      resetManageDialog();
    } catch {
      showToast('Failed to sync with API. Updating locally.');
      storage.updateTripUser(manageUserId, updateData);
      refreshTripUsers();
      resetManageDialog();
    }
  };

  return (
    <div className="space-y-5 font-sans w-full">
      {/* API Status Banner */}
      {apiError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-800 text-sm">⚠️ API Error: {apiError}</span>
            <span className="text-gray-600 text-xs">(Showing local data)</span>
          </div>
          <Button
            size="sm"
            onClick={fetchUsersFromAPI}
            disabled={loading}
            className="h-8 px-3 text-xs text-white hover:opacity-90"
            style={{ backgroundColor: '#06B3C4' }}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      )}

      {/* Search Box + Add User + Refresh Button */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Button
          onClick={fetchUsersFromAPI}
          disabled={loading}
          className="h-10 px-4 text-sm font-medium rounded-full shadow-md text-white hover:opacity-90"
          style={{ backgroundColor: '#06B3C4' }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Dialog open={dialogOpen}         onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setNewName('');
            setNewEmail('');
            setNewPhone('');
            setNewDobDay('');
            setNewDobMonth('');
            setNewDobYear('');
            setNewGender('');
            setError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 py-2.5 text-sm font-medium rounded-full shadow-md text-white [&_svg]:text-white hover:opacity-90"
              style={{ backgroundColor: '#06B3C4' }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-heading text-center">Add User</DialogTitle>
              <DialogDescription className="mt-1 text-center">
                Add a user you can later add as a participant to trips. They cannot access the admin panel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="user-name"
                  type="text"
                  placeholder="Enter full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="Enter your Email Address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone Number</Label>
                <Input
                  id="user-phone"
                  type="tel"
                  placeholder="Enter your Phone Number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-dob">Date of Birth</Label>
                <div className="flex gap-2">
                  <select
                    id="user-dob-day"
                    value={newDobDay}
                    onChange={(e) => setNewDobDay(e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                  <select
                    id="user-dob-month"
                    value={newDobMonth}
                    onChange={(e) => setNewDobMonth(e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Month</option>
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
                    ))}
                  </select>
                  <select
                    id="user-dob-year"
                    value={newDobYear}
                    onChange={(e) => setNewDobYear(e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: CURRENT_YEAR - YEAR_START + 1 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-gender">Gender</Label>
                <select
                  id="user-gender"
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  setNewName('');
                  setNewEmail('');
                  setNewPhone('');
                  setNewDobDay('');
                  setNewDobMonth('');
                  setNewDobYear('');
                  setNewGender('');
                  setError(null);
                }}
                className="h-9 px-4 text-sm text-white font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="h-9 px-4 text-sm text-white font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#06B3C4' }}></div>
            <p className="mt-4 text-gray-600">Loading users from API...</p>
          </div>
        ) : apiError ? (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm mb-2">⚠️ {apiError}</p>
            <p className="text-gray-500 text-sm">Showing local data instead.</p>
            <Button
              onClick={fetchUsersFromAPI}
              className="mt-4 text-white hover:opacity-90"
              style={{ backgroundColor: '#06B3C4' }}
            >
              Retry API
            </Button>
          </div>
        ) : (() => {
          const query = searchQuery.toLowerCase().trim();
          const filtered = !query
            ? tripUsers
            : tripUsers.filter((u) => {
                const searchable = [
                  u.firstName,
                  u.lastName,
                  u.email,
                  u.phone,
                  u.dateOfBirth,
                  u.gender,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();
                return searchable.includes(query);
              });
          
          // Pagination calculations
          const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          const paginatedUsers = filtered.slice(startIndex, endIndex);
          
          return filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">
                {searchQuery.trim() ? 'No users found matching your search.' : 'No users have been added yet.'}
              </p>
            </div>
          ) : (
          <>
          <div className="overflow-x-auto font-sans">
            <table className="w-full font-sans">
              <thead>
                <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Date of Birth
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Gender
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
                  return (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#EEF0F1' }}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {displayName || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {user.phone ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {formatDateOfBirth(user.dateOfBirth)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {user.gender ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-start">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setManageUserId(user.id);
                              setManageName([user.firstName, user.lastName].filter(Boolean).join(' '));
                              setManageEmail(user.email);
                              setManagePhone(user.phone ?? '');
                              const dob = user.dateOfBirth ?? '';
                              if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                                const [y, m, d] = dob.split('-');
                                setManageDobYear(y);
                                setManageDobMonth(m);
                                setManageDobDay(d.replace(/^0+/, '') || d);
                              } else {
                                setManageDobDay('');
                                setManageDobMonth('');
                                setManageDobYear('');
                              }
                              setManageGender(user.gender ?? '');
                              setManageDialogOpen(true);
                            }}
                            className="h-7 w-7 p-0 hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Edit className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, displayName)}
                            className="h-7 w-7 p-0 hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#EEF0F1' }}>
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = page === 1 || 
                                    page === totalPages || 
                                    (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                        (page === currentPage + 2 && currentPage < totalPages - 2);
                    
                    if (showEllipsis) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    
                    if (!showPage) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant="ghost"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 min-w-8 px-2 text-sm border transition-colors ${
                          currentPage === page
                            ? 'text-white font-semibold border-transparent hover:bg-[#06B3C4]'
                            : 'text-gray-700 bg-white border-gray-300 hover:border-[#06B3C4] hover:text-[#06B3C4] hover:bg-white'
                        }`}
                        style={
                          currentPage === page 
                            ? { backgroundColor: '#06B3C4' } 
                            : { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' }
                        }
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </>
          );
        })()}
      </div>

      {/* Edit User Dialog */}
      <Dialog
        open={manageDialogOpen}
        onOpenChange={(open) => {
          setManageDialogOpen(open);
          if (!open) {
            setManageUserId('');
            setManageName('');
            setManageEmail('');
            setManagePhone('');
            setManageDobDay('');
            setManageDobMonth('');
            setManageDobYear('');
            setManageGender('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="font-heading text-left">Edit User</DialogTitle>
            <DialogDescription className="mt-1 text-left">
              Edit the user&apos;s details. Email is shown for reference and cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="manage-name">Name</Label>
              <Input
                id="manage-name"
                type="text"
                value={manageName}
                onChange={(e) => setManageName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm text-gray-700">{manageEmail}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-phone">Phone Number</Label>
              <Input
                id="manage-phone"
                type="tel"
                value={managePhone}
                onChange={(e) => setManagePhone(e.target.value)}
                placeholder="Enter your Phone Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-dob-day">Date of Birth</Label>
              <div className="flex gap-2">
                <select
                  id="manage-dob-day"
                  value={manageDobDay}
                  onChange={(e) => setManageDobDay(e.target.value)}
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>{d}</option>
                  ))}
                </select>
                <select
                  id="manage-dob-month"
                  value={manageDobMonth}
                  onChange={(e) => setManageDobMonth(e.target.value)}
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Month</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
                  ))}
                </select>
                <select
                  id="manage-dob-year"
                  value={manageDobYear}
                  onChange={(e) => setManageDobYear(e.target.value)}
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Year</option>
                  {Array.from({ length: CURRENT_YEAR - YEAR_START + 1 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-gender">Gender</Label>
              <select
                id="manage-gender"
                value={manageGender}
                onChange={(e) => setManageGender(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              onClick={resetManageDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              onClick={handleSaveUser}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

