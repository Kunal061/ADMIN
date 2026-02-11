import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Search, Edit, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
import { apiClient, getApiBaseUrl } from '@/lib/apiClient';

export function UsersPage() {
  const { showToast } = useApp();
  const [tripUsers, setTripUsers] = useState<TripUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDobDay, setNewDobDay] = useState('');
  const [newDobMonth, setNewDobMonth] = useState('');
  const [newDobYear, setNewDobYear] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [moods, setMoods] = useState<any[]>([]);
  const [moodsLoading, setMoodsLoading] = useState(false);
  const [moodsError, setMoodsError] = useState<string | null>(null);
  const [selectedMoodIds, setSelectedMoodIds] = useState<string[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [stylesError, setStylesError] = useState<string | null>(null);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyRelationship, setNewEmergencyRelationship] = useState('');
  const [newEmergencyContactNo, setNewEmergencyContactNo] = useState('');
  const [newEmergencyEmail, setNewEmergencyEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState('');
  const [manageFirstName, setManageFirstName] = useState('');
  const [manageLastName, setManageLastName] = useState('');
  const [manageEmail, setManageEmail] = useState('');
  const [managePhone, setManagePhone] = useState('');
  const [manageDobDay, setManageDobDay] = useState('');
  const [manageDobMonth, setManageDobMonth] = useState('');
  const [manageDobYear, setManageDobYear] = useState('');
  const [manageGender, setManageGender] = useState('');
  const [manageEmergencyName, setManageEmergencyName] = useState('');
  const [manageEmergencyRelationship, setManageEmergencyRelationship] = useState('');
  const [manageEmergencyContactNo, setManageEmergencyContactNo] = useState('');
  const [manageEmergencyEmail, setManageEmergencyEmail] = useState('');
  const [manageSelectedMoodIds, setManageSelectedMoodIds] = useState<string[]>([]);
  const [manageSelectedStyleIds, setManageSelectedStyleIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState('');
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEAR_START = 1920;

  const normalizeIdList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>;
          return String(record.id || record._id || '');
        }
        return '';
      })
      .filter(Boolean);
  };

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

  const API_BASE_URL = getApiBaseUrl();
  if (!API_BASE_URL) {
    console.error('❌ API configuration missing! Please check .env.local file.');
  }

  // Fetch users from external API
  const fetchUsersFromAPI = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.get('/admin/users');
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to fetch users from API');
      }
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : (data?.data?.data || data?.data || data?.users || []);

      // Transform API data (MongoDB: _id, firstName, lastName, dob) to TripUser format
      const transformedUsers: TripUser[] = list.map((user: any) => {
        // Handle both cases: either separate firstName/lastName or combined name
        const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
        const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
        const dob = user.dob || user.dateOfBirth;
        const dateOfBirth = typeof dob === 'string' ? dob.split('T')[0] : dob ? new Date(dob).toISOString().slice(0, 10) : undefined;
        const emergency = user.emergency ?? {
          contactName: user.emergencyContactName || user.emergencyName,
          relationship: user.emergencyRelationship,
          contactNo: user.emergencyContactNo || user.emergencyContactNumber,
          email: user.emergencyEmail,
        };
        return {
          id: (user._id ?? user.id).toString(),
          firstName,
          lastName,
          email: user.emailAddress || user.email,
          phone: user.mobileNo || user.phone || undefined,
          dateOfBirth,
          gender: user.gender || undefined,
          mood: normalizeIdList(user.mood),
          style: normalizeIdList(user.style),
          emergency: emergency && (emergency.contactName || emergency.relationship || emergency.contactNo || emergency.email)
            ? emergency
            : undefined,
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

  const mapApiMood = (mood: any) => ({
    id: mood.id || mood._id,
    name: mood.moodName || mood.name || '',
    icon: mood.icon || mood.image || '',
    color: mood.color || '#06B3C4',
  });

  const mapApiStyle = (style: any) => ({
    id: String(style.id || style._id),
    name: style.styleName || style.name || '',
    icon: style.icon || style.image || '',
    color: style.color || '#06B3C4',
  });

  const fetchMoodsFromAPI = async () => {
    setMoodsLoading(true);
    setMoodsError(null);
    try {
      const response = await apiClient.get('/moods/get-all-moods');
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to fetch moods');
      }
      const list = data?.data?.data || data?.data || data || [];
      const transformed = Array.isArray(list) ? list.map(mapApiMood) : [];
      setMoods(transformed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch moods';
      setMoodsError(message);
      showToast(message, 'error');
    } finally {
      setMoodsLoading(false);
    }
  };

  const fetchStylesFromAPI = async () => {
    setStylesLoading(true);
    setStylesError(null);
    try {
      const response = await apiClient.get('/styles/get-all-styles');
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to fetch styles');
      }
      const list = data?.data?.data || data?.data || data || [];
      const transformed = Array.isArray(list) ? list.map(mapApiStyle) : [];
      setStyles(transformed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch styles';
      setStylesError(message);
      showToast(message, 'error');
    } finally {
      setStylesLoading(false);
    }
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Load moods for selection in Add User dialog
  useEffect(() => {
    fetchMoodsFromAPI();
    fetchStylesFromAPI();
  }, []);

  const refreshTripUsers = () => {
    fetchUsersFromAPI();
  };

  const handleAddUser = async () => {
    const email = newEmail.trim().toLowerCase();
    const trimmedFirstName = newFirstName.trim();
    const trimmedLastName = newLastName.trim();

    if (!email) {
      setError('Please enter an email address');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!trimmedFirstName) {
      setError('Please enter first name');
      return;
    }
    if (!trimmedLastName) {
      setError('Please enter last name');
      return;
    }
    if (!newPassword.trim()) {
      setError('Please enter a password');
      return;
    }
    if (!newGender.trim()) {
      setError('Please select a gender option');
      return;
    }

    const mood = selectedMoodIds;
    const style = selectedStyleIds;

    const dateOfBirth = (newDobDay && newDobMonth && newDobYear)
      ? `${newDobYear}-${newDobMonth.padStart(2, '0')}-${newDobDay.padStart(2, '0')}`
      : undefined;

    const normalizeGenderValue = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const lowered = trimmed.toLowerCase();
      if (lowered.includes('prefer')) return 'other';
      if (lowered === 'male' || lowered === 'female' || lowered === 'other') return lowered;
      return lowered;
    };
    const normalizedGender = normalizeGenderValue(newGender);
  const trimmedPhone = newPhone.trim();
    const payload: Record<string, unknown> = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      emailAddress: email,
      mobileNo: trimmedPhone || undefined,
      dob: dateOfBirth || undefined,
  gender: normalizedGender,
      password: newPassword.trim(),
    };
    if (mood.length) payload.mood = mood;
    if (style.length) payload.style = style;
    const emergency = {
      contactName: newEmergencyName.trim() || undefined,
      relationship: newEmergencyRelationship.trim() || undefined,
      contactNo: newEmergencyContactNo.trim() || undefined,
      email: newEmergencyEmail.trim() || undefined,
    };
    if (emergency.contactName || emergency.relationship || emergency.contactNo || emergency.email) {
      payload.emergency = emergency;
    }

    try {
      const response = await apiClient.post('/admin/users', payload);
      const responseData = response.data;
      if (response.status < 200 || response.status >= 300) {
        const message = responseData?.message || responseData?.error || 'Failed to add user to API';
        throw new Error(message);
      }
  refreshTripUsers();
  showToast('User added successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add user to API';
      showToast(message, 'error');
      showToast('Adding user locally instead.');
      storage.addTripUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email,
        phone: trimmedPhone || undefined,
        dateOfBirth,
        gender: newGender.trim() || undefined,
        mood: mood.length ? mood : undefined,
        style: style.length ? style : undefined,
        emergency: emergency.contactName || emergency.relationship || emergency.contactNo || emergency.email
          ? emergency
          : undefined,
      });
      refreshTripUsers();
    }

    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPhone('');
    setNewDobDay('');
    setNewDobMonth('');
    setNewDobYear('');
    setNewGender('');
    setNewPassword('');
  setSelectedMoodIds([]);
  setSelectedStyleIds([]);
    setNewEmergencyName('');
    setNewEmergencyRelationship('');
    setNewEmergencyContactNo('');
    setNewEmergencyEmail('');
    setError(null);
    setDialogOpen(false);
  };

  const handleDeleteUser = async (id: string) => {
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      if (response.status < 200 || response.status >= 300) throw new Error('Failed to delete on API');
      refreshTripUsers();
      showToast('User removed successfully!');
    } catch {
      showToast('Failed to delete on API. Removing locally.');
      storage.deleteTripUser(id);
      refreshTripUsers();
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteUserId('');
      setDeleteUserName('');
    }
  };

  const handleRequestDelete = (id: string, displayName: string) => {
    setDeleteUserId(id);
    setDeleteUserName(displayName);
    setDeleteDialogOpen(true);
  };

  const resetManageDialog = () => {
  setManageDialogOpen(false);
  setManageUserId('');
  setManageFirstName('');
  setManageLastName('');
  setManageEmail('');
  setManagePhone('');
  setManageDobDay('');
  setManageDobMonth('');
  setManageDobYear('');
  setManageGender('');
  setManageEmergencyName('');
  setManageEmergencyRelationship('');
  setManageEmergencyContactNo('');
  setManageEmergencyEmail('');
  setManageSelectedMoodIds([]);
  setManageSelectedStyleIds([]);
  };

  const handleSaveUser = async () => {
    if (!manageUserId) {
      resetManageDialog();
      return;
    }
  const trimmedFirstName = manageFirstName.trim();
  const trimmedLastName = manageLastName.trim();
    const dateOfBirth = manageDobYear && manageDobMonth && manageDobDay
      ? `${manageDobYear}-${manageDobMonth.padStart(2, '0')}-${manageDobDay.padStart(2, '0')}`
      : undefined;
    const normalizeGenderValue = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const lowered = trimmed.toLowerCase();
      if (lowered.includes('prefer')) return 'other';
      if (lowered === 'male' || lowered === 'female' || lowered === 'other') return lowered;
      return lowered;
    };
    const normalizedGender = normalizeGenderValue(manageGender) || undefined;
    const payload: Record<string, unknown> = {
      mood: manageSelectedMoodIds,
      style: manageSelectedStyleIds,
    };
    const updateData: Record<string, unknown> = {
      mood: manageSelectedMoodIds,
      style: manageSelectedStyleIds,
    };
    if (trimmedFirstName) {
      payload.firstName = trimmedFirstName;
      updateData.firstName = trimmedFirstName;
    }
    if (trimmedLastName) {
      payload.lastName = trimmedLastName;
      updateData.lastName = trimmedLastName;
    }
    if (dateOfBirth) {
      payload.dob = dateOfBirth;
      updateData.dateOfBirth = dateOfBirth;
    }
    if (normalizedGender) {
      payload.gender = normalizedGender;
      updateData.gender = normalizedGender;
    }
    const emergency = {
      contactName: manageEmergencyName.trim() || undefined,
      relationship: manageEmergencyRelationship.trim() || undefined,
      contactNo: manageEmergencyContactNo.trim() || undefined,
      email: manageEmergencyEmail.trim() || undefined,
    };
    if (emergency.contactName || emergency.relationship || emergency.contactNo || emergency.email) {
      payload.emergency = emergency;
      updateData.emergency = emergency;
    }
    try {
      const response = await apiClient.put(`/admin/users/${manageUserId}`, payload);
      if (response.status < 200 || response.status >= 300) throw new Error('Failed to update on API');
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

      {/* Search Box + Add User */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Dialog open={dialogOpen}         onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) {
            fetchStylesFromAPI();
          }
          if (!open) {
            setNewFirstName('');
            setNewLastName('');
            setNewEmail('');
            setNewPhone('');
            setNewDobDay('');
            setNewDobMonth('');
            setNewDobYear('');
            setNewGender('');
            setNewPassword('');
            setSelectedMoodIds([]);
            setSelectedStyleIds([]);
            setNewEmergencyName('');
            setNewEmergencyRelationship('');
            setNewEmergencyContactNo('');
            setNewEmergencyEmail('');
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
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center sm:text-center px-2">
              <DialogTitle className="font-heading text-center">Add User</DialogTitle>
              <DialogDescription className="mt-1 text-center">
                Add a user you can later add as a participant to trips. They cannot access the admin panel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 px-2">
              <div className="space-y-2">
                <Label htmlFor="user-first-name">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="user-first-name"
                  type="text"
                  placeholder="Enter first name"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="user-last-name"
                  type="text"
                  placeholder="Enter last name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
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
                <Label htmlFor="user-password">Password <span className="text-red-500">*</span></Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <div className="space-y-2">
                <Label>Select Moods</Label>
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {moodsLoading && <span className="text-sm text-gray-500">Loading moods...</span>}
                  {!moodsLoading && moodsError && (
                    <span className="text-sm text-red-500">{moodsError}</span>
                  )}
                  {!moodsLoading && !moodsError && moods.length === 0 && (
                    <span className="text-sm text-gray-500">No moods available</span>
                  )}
                  {!moodsLoading && moods.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-full">
                      {moods.map((mood) => {
                        const selected = selectedMoodIds.includes(mood.id);
                        return (
                          <button
                            type="button"
                            key={mood.id}
                            onClick={() => {
                              setSelectedMoodIds((prev) =>
                                prev.includes(mood.id)
                                  ? prev.filter((id) => id !== mood.id)
                                  : [...prev, mood.id]
                              );
                            }}
                            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition-colors ${selected ? 'text-white' : 'text-[#06B3C4]'}`}
                            style={selected
                              ? {
                                  backgroundColor: '#06B3C4',
                                  borderColor: '#06B3C4',
                                  borderStyle: 'solid',
                                  borderWidth: '1px',
                                }
                              : {
                                  backgroundColor: '#ffffff',
                                  borderColor: '#06B3C4',
                                  borderStyle: 'dashed',
                                  borderWidth: '1px',
                                }
                            }
                          >
                            {mood.icon ? (
                              <img
                                src={mood.icon}
                                alt={mood.name}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="h-6 w-6 rounded-full"
                                style={{ backgroundColor: mood.color || '#06B3C4' }}
                              />
                            )}
                            <span className="whitespace-nowrap">{mood.name || 'Mood'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Styles</Label>
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {stylesLoading && <span className="text-sm text-gray-500">Loading styles...</span>}
                  {!stylesLoading && stylesError && (
                    <span className="text-sm text-red-500">{stylesError}</span>
                  )}
                  {!stylesLoading && !stylesError && styles.length === 0 && (
                    <span className="text-sm text-gray-500">No styles available</span>
                  )}
                  {!stylesLoading && styles.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-full">
                      {styles.map((style) => {
                        const selected = selectedStyleIds.includes(style.id);
                        return (
                          <button
                            type="button"
                            key={style.id}
                            onClick={() => {
                              setSelectedStyleIds((prev) =>
                                prev.includes(style.id)
                                  ? prev.filter((id) => id !== style.id)
                                  : [...prev, style.id]
                              );
                            }}
                            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition-colors ${selected ? 'text-white' : 'text-[#06B3C4]'}`}
                            style={selected
                              ? {
                                  backgroundColor: '#06B3C4',
                                  borderColor: '#06B3C4',
                                  borderStyle: 'solid',
                                  borderWidth: '1px',
                                }
                              : {
                                  backgroundColor: '#ffffff',
                                  borderColor: '#06B3C4',
                                  borderStyle: 'dashed',
                                  borderWidth: '1px',
                                }
                            }
                          >
                            {style.icon ? (
                              <img
                                src={style.icon}
                                alt={style.name}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="h-6 w-6 rounded-full"
                                style={{ backgroundColor: style.color || '#06B3C4' }}
                              />
                            )}
                            <span className="whitespace-nowrap">{style.name || 'Style'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4">
                <div className="text-sm font-semibold text-gray-700 tracking-wide text-center">
                  EMERGENCY DETAILS
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-name">Emergency Contact Name</Label>
                  <Input
                    id="emergency-name"
                    type="text"
                    placeholder="Contact name"
                    value={newEmergencyName}
                    onChange={(e) => setNewEmergencyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-relationship">Emergency Relationship</Label>
                  <Input
                    id="emergency-relationship"
                    type="text"
                    placeholder="Relationship"
                    value={newEmergencyRelationship}
                    onChange={(e) => setNewEmergencyRelationship(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-contact">Emergency Contact Number</Label>
                  <Input
                    id="emergency-contact"
                    type="tel"
                    placeholder="Contact number"
                    value={newEmergencyContactNo}
                    onChange={(e) => setNewEmergencyContactNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-email">Emergency Email</Label>
                  <Input
                    id="emergency-email"
                    type="email"
                    placeholder="contact@email.com"
                    value={newEmergencyEmail}
                    onChange={(e) => setNewEmergencyEmail(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <DialogFooter className="flex justify-end gap-1.5 mt-4">
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  setNewFirstName('');
                  setNewLastName('');
                  setNewEmail('');
                  setNewPhone('');
                  setNewDobDay('');
                  setNewDobMonth('');
                  setNewDobYear('');
                  setNewGender('');
                  setNewPassword('');
                  setSelectedMoodIds([]);
                  setSelectedStyleIds([]);
                  setNewEmergencyName('');
                  setNewEmergencyRelationship('');
                  setNewEmergencyContactNo('');
                  setNewEmergencyEmail('');
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
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
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
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setManageUserId(user.id);
                              setManageFirstName(user.firstName || '');
                              setManageLastName(user.lastName || '');
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
                              const emergency = (user as TripUser).emergency ?? (user as { emergency?: { contactName?: string; relationship?: string; contactNo?: string; email?: string } }).emergency ?? {};
                              setManageEmergencyName(emergency.contactName ?? '');
                              setManageEmergencyRelationship(emergency.relationship ?? '');
                              setManageEmergencyContactNo(emergency.contactNo ?? '');
                              setManageEmergencyEmail(emergency.email ?? '');
                              setManageSelectedMoodIds(user.mood ?? []);
                              setManageSelectedStyleIds(user.style ?? []);
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
                            onClick={() => handleRequestDelete(user.id, displayName)}
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
            setManageFirstName('');
            setManageLastName('');
            setManageEmail('');
            setManagePhone('');
            setManageDobDay('');
            setManageDobMonth('');
            setManageDobYear('');
            setManageGender('');
            setManageEmergencyName('');
            setManageEmergencyRelationship('');
            setManageEmergencyContactNo('');
            setManageEmergencyEmail('');
            setManageSelectedMoodIds([]);
            setManageSelectedStyleIds([]);
          }
        }}
      >
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="font-heading text-left">Edit User</DialogTitle>
            <DialogDescription className="mt-1 text-left">
              Edit the user&apos;s details. Email is shown for reference and cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="manage-first-name">First Name</Label>
              <Input
                id="manage-first-name"
                type="text"
                placeholder="Enter first name"
                value={manageFirstName}
                onChange={(e) => setManageFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manage-last-name">Last Name</Label>
              <Input
                id="manage-last-name"
                type="text"
                placeholder="Enter last name"
                value={manageLastName}
                onChange={(e) => setManageLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm text-gray-700">{manageEmail}</p>
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <p className="text-sm text-gray-700">{managePhone || '—'}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="manage-dob">Date of Birth</Label>
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
            <div className="space-y-1">
              <Label htmlFor="manage-gender">Gender</Label>
              <select
                id="manage-gender"
                value={manageGender}
                onChange={(e) => setManageGender(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Best for Mood</Label>
              <div className="flex flex-wrap items-center gap-2 pb-2">
                {moodsLoading && <span className="text-sm text-gray-500">Loading moods...</span>}
                {!moodsLoading && moodsError && (
                  <span className="text-sm text-red-500">{moodsError}</span>
                )}
                {!moodsLoading && !moodsError && moods.length === 0 && (
                  <span className="text-sm text-gray-500">No moods available</span>
                )}
                {!moodsLoading && moods.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {moods.map((mood) => {
                      const selected = manageSelectedMoodIds.includes(mood.id);
                      return (
                        <button
                          type="button"
                          key={mood.id}
                          onClick={() => {
                            setManageSelectedMoodIds((prev) =>
                              prev.includes(mood.id)
                                ? prev.filter((id) => id !== mood.id)
                                : [...prev, mood.id]
                            );
                          }}
                          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition-colors ${selected ? 'text-white' : 'text-[#06B3C4]'}`}
                          style={{
                            backgroundColor: selected ? '#06B3C4' : '#FFFFFF',
                            borderColor: '#06B3C4',
                          }}
                        >
                          {mood.icon ? (
                            <img
                              src={mood.icon}
                              alt={mood.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: mood.color || '#06B3C4' }}
                            />
                          )}
                          <span className="whitespace-nowrap">{mood.name || 'Mood'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Best for Style</Label>
              <div className="flex flex-wrap items-center gap-2 pb-2">
                {stylesLoading && <span className="text-sm text-gray-500">Loading styles...</span>}
                {!stylesLoading && stylesError && (
                  <span className="text-sm text-red-500">{stylesError}</span>
                )}
                {!stylesLoading && !stylesError && styles.length === 0 && (
                  <span className="text-sm text-gray-500">No styles available</span>
                )}
                {!stylesLoading && styles.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {styles.map((style) => {
                      const selected = manageSelectedStyleIds.includes(style.id);
                      return (
                        <button
                          type="button"
                          key={style.id}
                          onClick={() => {
                            setManageSelectedStyleIds((prev) =>
                              prev.includes(style.id)
                                ? prev.filter((id) => id !== style.id)
                                : [...prev, style.id]
                            );
                          }}
                          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition-colors ${selected ? 'text-white' : 'text-[#06B3C4]'}`}
                          style={{
                            backgroundColor: selected ? '#06B3C4' : '#FFFFFF',
                            borderColor: '#06B3C4',
                          }}
                        >
                          {style.icon ? (
                            <img
                              src={style.icon}
                              alt={style.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: style.color || '#06B3C4' }}
                            />
                          )}
                          <span className="whitespace-nowrap">{style.name || 'Style'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-4">
              <div className="text-sm font-semibold text-gray-700 tracking-wide text-center">
                EMERGENCY DETAILS
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-emergency-name">Emergency Contact Name</Label>
                <Input
                  id="manage-emergency-name"
                  type="text"
                  placeholder="Contact name"
                  value={manageEmergencyName}
                  onChange={(e) => setManageEmergencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-emergency-relationship">Emergency Relationship</Label>
                <Input
                  id="manage-emergency-relationship"
                  type="text"
                  placeholder="Relationship"
                  value={manageEmergencyRelationship}
                  onChange={(e) => setManageEmergencyRelationship(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-emergency-contact">Emergency Contact Number</Label>
                <Input
                  id="manage-emergency-contact"
                  type="tel"
                  placeholder="Contact number"
                  value={manageEmergencyContactNo}
                  onChange={(e) => setManageEmergencyContactNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-emergency-email">Emergency Email</Label>
                <Input
                  id="manage-emergency-email"
                  type="email"
                  placeholder="contact@email.com"
                  value={manageEmergencyEmail}
                  onChange={(e) => setManageEmergencyEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-1.5 mt-4">
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

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteDialogOpen(false);
            setDeleteUserId('');
            setDeleteUserName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-[#06B3C4]">{deleteUserName || 'this user'}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              onClick={() => {
                if (!deleteLoading) {
                  setDeleteDialogOpen(false);
                  setDeleteUserId('');
                  setDeleteUserName('');
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              disabled={!deleteUserId || deleteLoading}
              onClick={() => {
                if (!deleteUserId) return;
                handleDeleteUser(deleteUserId);
              }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

