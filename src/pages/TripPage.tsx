import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Plus,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storage } from '@/lib/storage';
import { apiClient, getApiBaseUrl } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Trip, TripUser } from '@/types';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const getNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const normalizeDateInput = (value?: string): string => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
};

const normalizeTripType = (value?: string): Trip['type'] => {
  if (!value) return 'public';
  const normalized = value.toLowerCase().replace(/\s+/g, '-');
  if (normalized === 'invite-only' || normalized === 'inviteonly' || normalized === 'invite') return 'invite-only';
  if (normalized === 'private') return 'private';
  return 'public';
};

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.message === 'string') return dataObj.message;
      if (dataObj.error && typeof dataObj.error === 'object') {
        const errorObj = dataObj.error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') return errorObj.message;
      }
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

const normalizeApiItinerary = (apiItinerary: unknown): Trip['itinerary'] => {
  if (Array.isArray(apiItinerary)) {
    return apiItinerary.map((day, index) => {
      const dayObj = asRecord(day);
      const activitiesRaw = Array.isArray(dayObj.activities) ? dayObj.activities : [];

      return {
        id: getString(dayObj.id ?? dayObj._id, `day-${index + 1}`),
        day: getNumber(dayObj.day ?? dayObj.dayNumber, index + 1),
        title: getString(dayObj.title ?? dayObj.name, `Day ${index + 1}`),
        description: getString(dayObj.description ?? dayObj.itinerary, ''),
        activities: activitiesRaw.map((activity, activityIndex) => {
          const activityObj = asRecord(activity);
          return {
            id: getString(activityObj.id ?? activityObj._id, `activity-${index + 1}-${activityIndex}`),
            time: getString(activityObj.time ?? activityObj.startTime, ''),
            title: getString(activityObj.title ?? activityObj.name, ''),
            description: getString(activityObj.description, ''),
            location: getString(activityObj.location ?? activityObj.address, ''),
          };
        }),
      };
    });
  }

  if (apiItinerary && typeof apiItinerary === 'object') {
    return Object.entries(apiItinerary).map(([dayKey, value], index) => {
      const dayNumber = getNumber(dayKey, index + 1);
      const entry = asRecord(value);
      return {
        id: `day-${dayNumber}`,
        day: dayNumber,
        title: getString(entry.title, `Day ${dayNumber}`),
        description: getString(entry.itinerary ?? entry.description, ''),
        activities: [],
      };
    });
  }

  return [];
};

const normalizeApiPlaces = (apiTrip: unknown): Trip['places'] => {
  const trip = asRecord(apiTrip);
  if (Array.isArray(trip.places)) {
    return trip.places.map((place, index) => {
      const placeObj = asRecord(place);
      return {
        id: getString(placeObj.id ?? placeObj._id, `place-${index + 1}`),
        name: getString(placeObj.name ?? placeObj.title, ''),
        image: getString(placeObj.image ?? placeObj.photoUrl, ''),
        mapLink: getString(placeObj.mapLink ?? placeObj.link, '') || undefined,
      };
    });
  }

  if (Array.isArray(trip.locations)) {
    return trip.locations.map((location, index) => {
      const locationObj = asRecord(location);
      return {
        id: getString(locationObj.id ?? locationObj._id, `location-${index + 1}`),
        name: getString(locationObj.name ?? locationObj.address, ''),
        image: getString(locationObj.photoUrl ?? locationObj.image, ''),
        mapLink: getString(locationObj.mapLink ?? locationObj.link, '') || undefined,
      };
    });
  }

  return [];
};

const mapTripFromApi = (apiTrip: unknown, index: number): Trip => {
  const trip = asRecord(apiTrip);
  const overview = asRecord(trip.overview);
  const journal = asRecord(trip.journal);
  const mood = asRecord(trip.mood);
  const style = asRecord(trip.style);
  const locations = Array.isArray(trip.locations) ? trip.locations : [];
  const primaryLocation = asRecord(locations[0]);

  const destination =
    getString(trip.destination) ||
    getString(primaryLocation.address) ||
    getString(primaryLocation.name) ||
    getString(overview.summary);

  const statusRaw = getString(trip.status);
  const isDraft = trip.isDraft === true;

  return {
    id: getString(trip._id ?? trip.id ?? trip.tripId, `api-trip-${index + 1}`),
    title: getString(trip.tripName ?? trip.title ?? trip.name ?? overview.name, ''),
    description: getString(trip.description ?? overview.summary ?? overview.notes, ''),
    destination,
    startDate: getString(trip.startDate ?? trip.start_date ?? trip.start, ''),
    endDate: getString(trip.endDate ?? trip.end_date ?? trip.end, ''),
    coverImage: getString(trip.coverImage ?? trip.wallpaper ?? journal.wallpaper, ''),
    type: getString(trip.type ?? overview.type, 'public'),
    isFeatured: Boolean(trip.isFeatured),
    overviewType: getString(overview.type, ''),
    overviewNotes: getString(overview.notes, ''),
    itinerary: normalizeApiItinerary(trip.itinerary ?? trip.dayWiseItinerary),
    moods: Array.isArray(mood.moods) ? mood.moods.map(item => getString(item, '')).filter(Boolean) : undefined,
    styles: Array.isArray(style.styles) ? style.styles.map(item => getString(item, '')).filter(Boolean) : undefined,
    places: normalizeApiPlaces(trip),
    status: statusRaw
      ? statusRaw === 'Inactive'
        ? 'Inactive'
        : 'Active'
      : isDraft
        ? 'Inactive'
        : 'Active',
    participantIds: Array.isArray(trip.members)
      ? trip.members
          .map(member => {
            const memberObj = asRecord(member);
            return getString(memberObj.id ?? memberObj._id ?? memberObj.userId ?? member, '');
          })
          .filter(Boolean)
      : undefined,
    rating: typeof trip.rating === 'number' ? trip.rating : undefined,
    price: typeof trip.price === 'number' ? trip.price : undefined,
    createdAt: getString(trip.createdAt ?? trip.created_at, '') || undefined,
  };
};

export function TripPage() {
  const { auth, trips, addTrip, deleteTrip, updateTrip, moods, styles, refreshTripsFromStorage, setTripsFromApi, showToast } = useApp();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [editTripDialogOpen, setEditTripDialogOpen] = useState(false);
  const [createTripStep, setCreateTripStep] = useState<number>(1);
  const [editTripStep, setEditTripStep] = useState<number>(1);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editParticipantSearchQuery, setEditParticipantSearchQuery] = useState('');
  const [newTripParticipantSearchQuery, setNewTripParticipantSearchQuery] = useState('');
  const [deleteTripDialogOpen, setDeleteTripDialogOpen] = useState(false);
  const [deleteTripTarget, setDeleteTripTarget] = useState<Trip | null>(null);
  const [deleteTripLoading, setDeleteTripLoading] = useState(false);
  const [createTripStepLoading, setCreateTripStepLoading] = useState(false);
  const [createTripId, setCreateTripId] = useState<string | null>(null);
  const [createCoverFile, setCreateCoverFile] = useState<File | null>(null);
  const [createCoverUploadLoading, setCreateCoverUploadLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const hasRefreshedTripsRef = useRef(false);
  const hasFetchedTripsFromApiRef = useRef(false);
  const isStyleActive = useCallback((style?: { isActive?: boolean } | null) => style?.isActive !== false, []);
  const [apiMoods, setApiMoods] = useState<typeof moods>([]);
  const [apiStyles, setApiStyles] = useState<typeof styles>([]);
  const [apiTripUsers, setApiTripUsers] = useState<TripUser[]>([]);
  const moodOptions = apiMoods.length > 0 ? apiMoods : moods;
  const styleOptions = apiStyles.length > 0 ? apiStyles : styles;

  const API_BASE_URL = getApiBaseUrl();
  const shouldUseApi = Boolean(API_BASE_URL);
  const isObjectId = useCallback((value: string) => /^[a-f\d]{24}$/i.test(value), []);

  // Memoized function to fetch trips from API
  const fetchTripsFromApi = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiClient.get('/admin/trips', {
        signal,
      });
      const data = response.data;

      if (data?.status && data.status !== 'success') {
        throw new Error(data?.message || 'Trips request returned a non-success status');
      }

      const list = data?.data?.data || data?.data || data || [];
      const normalizedTrips = Array.isArray(list) ? list.map(mapTripFromApi) : [];
      setTripsFromApi(normalizedTrips);
    } catch (err) {
      if ((err as Error).name === 'AbortError' || axios.isCancel(err) || (err as Error).name === 'CanceledError') return;
      throw err;
    }
  }, [setTripsFromApi]);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();

    const fetchTripUsers = async () => {
      try {
        const response = await apiClient.get('/admin/users', {
          signal: controller.signal,
        });
        const data = response.data;

        const list = data?.data?.data || data?.data || data || [];
        const mapped = Array.isArray(list)
          ? list.map((user: unknown) => {
              const userRecord = user && typeof user === 'object' ? (user as Record<string, unknown>) : {};
              const id = String(userRecord.id || userRecord._id || '');
              const firstName = String(userRecord.firstName || '').trim();
              const lastName = String(userRecord.lastName || '').trim();
              const fullName = String(userRecord.fullName || '').trim();
              const nameParts = fullName ? fullName.split(' ') : [];
              const resolvedFirstName = firstName || nameParts[0] || '';
              const resolvedLastName = lastName || nameParts.slice(1).join(' ') || '';

              return {
                id,
                firstName: resolvedFirstName,
                lastName: resolvedLastName,
                email: String(userRecord.emailAddress || userRecord.email || ''),
                phone: typeof userRecord.mobileNo === 'string' ? userRecord.mobileNo : undefined,
                dateOfBirth: typeof userRecord.dob === 'string' ? userRecord.dob : undefined,
                gender: typeof userRecord.gender === 'string' ? userRecord.gender : undefined,
              } as TripUser;
            })
            .filter(user => user.id)
          : [];

        setApiTripUsers(mapped);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    };

    fetchTripUsers();

    return () => controller.abort();
  }, [API_BASE_URL]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, trips.length]);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();

    const fetchMoodsAndStyles = async () => {
      try {
        const [moodsResponse, stylesResponse] = await Promise.all([
          apiClient.get('/moods/get-all-moods', { signal: controller.signal }),
          apiClient.get('/styles/get-all-styles', { signal: controller.signal }),
        ]);

        const moodsData = moodsResponse.data;
        const stylesData = stylesResponse.data;

        if (moodsResponse.status >= 200 && moodsResponse.status < 300) {
          const list = moodsData?.data?.data || moodsData?.data || moodsData || [];
          const transformed = Array.isArray(list)
            ? list.map((mood: any) => ({
                id: String(mood.id || mood._id),
                name: mood.moodName || mood.name || '',
                description: mood.description || '',
                icon: mood.icon || mood.image || '',
                image: mood.image || mood.icon || undefined,
                isActive: mood.isActive ?? true,
                moodImage: mood.moodImage || undefined,
              }))
            : [];
          setApiMoods(transformed);
        }

        if (stylesResponse.status >= 200 && stylesResponse.status < 300) {
          const list = stylesData?.data?.data || stylesData?.data || stylesData || [];
          const transformed = Array.isArray(list)
            ? list.map((style: any) => ({
                id: String(style.id || style._id),
                name: style.styleName || style.name || '',
                icon: style.icon || style.image || undefined,
                image: style.image || style.icon || undefined,
                isActive: style.isActive ?? true,
              }))
            : [];
          setApiStyles(transformed);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Silent fallback to context data
      }
    };

    fetchMoodsAndStyles();

    return () => controller.abort();
  }, [API_BASE_URL]);

  // Initial fetch of trips from API on mount
  useEffect(() => {
    if (!shouldUseApi || hasFetchedTripsFromApiRef.current) {
      return;
    }

    const controller = new AbortController();

    fetchTripsFromApi(controller.signal)
      .then(() => {
        showToast('Trips loaded from API successfully!');
        hasRefreshedTripsRef.current = true;
        hasFetchedTripsFromApiRef.current = true;
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError' || axios.isCancel(err) || (err as Error).name === 'CanceledError') return;
        const message = err instanceof Error ? err.message : 'Failed to load trips from API';
        showToast(`${message}. Loading local data...`, 'error');
        refreshTripsFromStorage();
        hasRefreshedTripsRef.current = true;
        hasFetchedTripsFromApiRef.current = true;
      });

    return () => controller.abort();
  }, [shouldUseApi, fetchTripsFromApi, showToast, refreshTripsFromStorage]);

  // Auto-refresh trips every 2 seconds when using API
  useEffect(() => {
    if (!shouldUseApi || !hasFetchedTripsFromApiRef.current) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTripsFromApi();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [shouldUseApi, fetchTripsFromApi]);

  // When Trip page is shown and trips are empty, reload from storage (seeds 20 sample trips if needed)
  useEffect(() => {
    if (shouldUseApi) return;
    if (auth.isAuthenticated && auth.user?.email && trips.length === 0 && !hasRefreshedTripsRef.current) {
      hasRefreshedTripsRef.current = true;
      refreshTripsFromStorage();
    }
    if (trips.length > 0) {
      hasRefreshedTripsRef.current = true;
    }
  }, [auth.isAuthenticated, auth.user?.email, trips.length, refreshTripsFromStorage, shouldUseApi]);

  // Keep selectedTrip in sync with trips state
  useEffect(() => {
    if (selectedTrip) {
      const updatedTrip = trips.find(t => t.id === selectedTrip.id);
      if (updatedTrip) {
        setSelectedTrip(updatedTrip);
      } else {
        setSelectedTrip(null); // Trip was deleted
      }
    }
  }, [trips]);

  // Clean up selectedMoods to remove any inactive moods
  useEffect(() => {
    setSelectedMoods(prev => {
      const next = prev.filter(moodId => {
        const mood = moodOptions.find(m => m.id === moodId);
        return mood && mood.isActive;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [moodOptions]);

  // Clean up selectedStyles to remove any inactive styles
  useEffect(() => {
    setSelectedStyles(prev => {
      const next = prev.filter(styleId => {
        const style = styleOptions.find(s => s.id === styleId);
        return isStyleActive(style);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [styleOptions, isStyleActive]);

  // Clean up editingSelectedMoods to remove any inactive moods
  useEffect(() => {
    setEditingSelectedMoods(prev => {
      const next = prev.filter(moodId => {
        const mood = moodOptions.find(m => m.id === moodId);
        return mood && mood.isActive;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [moodOptions]);

  // New trip form state
  const [newTrip, setNewTrip] = useState<{
    title: string;
    description: string;
    destination: string;
    startDate: string;
    endDate: string;
    coverImage: string;
    status: 'Active' | 'Inactive';
    participantIds: string[];
    type: 'public' | 'private' | 'invite-only';
    isFeatured: boolean;
    overviewType: string;
    overviewNotes: string;
  }>({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    coverImage: '',
    status: 'Active',
    participantIds: [],
    type: 'public',
    isFeatured: false,
    overviewType: '',
    overviewNotes: '',
  });

  // Day-wise itinerary state for new trip
  const [dayWiseItinerary, setDayWiseItinerary] = useState<
    { id: string; day: number; description: string }[]
  >([]);

  // Day-wise itinerary state for editing existing trip
  const [editingDayWiseItinerary, setEditingDayWiseItinerary] = useState<
    { id: string; day: number; description: string }[]
  >([]);
  
  // Mood selection state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  
  // Style selection state
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [editingSelectedStyles, setEditingSelectedStyles] = useState<string[]>([]);
  const [editingSelectedMoods, setEditingSelectedMoods] = useState<string[]>([]);
  
  // Places state
  const [places, setPlaces] = useState<Array<{ name: string; image: string; mapLink?: string }>>([]);

  // Cover image upload state
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  // Handle cover image upload (convert to data URL for persistence)
  const handleCoverImageUpload = (file: File | null) => {
    if (!file) return;
    setCreateCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setNewTrip(prev => ({ ...prev, coverImage: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearCoverImage = () => {
    setNewTrip(prev => ({ ...prev, coverImage: '' }));
    setCreateCoverFile(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleEditCoverImageUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setEditingTrip(prev => (prev ? { ...prev, coverImage: result } : null));
        setEditCoverFile(file);
      }
    };
    reader.onerror = () => {
      alert('Image could not be loaded. Try a smaller or different image.');
    };
    reader.readAsDataURL(file);
  };


  // Helper to compute number of days between two dates (inclusive)
  const getDaysCount = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Keep dayWiseItinerary in sync with newTrip date range
  useEffect(() => {
    const daysCount = getDaysCount(newTrip.startDate, newTrip.endDate);
    if (!daysCount) {
      setDayWiseItinerary([]);
      return;
    }

    setDayWiseItinerary(prev => {
      const next: { id: string; day: number; description: string }[] = [];
      for (let day = 1; day <= daysCount; day++) {
        const existing = prev.find(d => d.day === day);
        next.push(
          existing ?? {
            id: `new-day-${day}-${Date.now()}`,
            day,
            description: '',
          }
        );
      }
      return next;
    });
  }, [newTrip.startDate, newTrip.endDate]);

  const handleCreateTrip = async () => {
    // Validate required fields
    if (!newTrip.title.trim()) {
      showToast('Please enter a trip title', 'error');
      return;
    }
    if (!newTrip.destination.trim()) {
      showToast('Please enter a destination', 'error');
      return;
    }
    if (!newTrip.startDate) {
      showToast('Please select a start date', 'error');
      return;
    }
    if (!newTrip.endDate) {
      showToast('Please select an end date', 'error');
      return;
    }
    
    // Validate date order
    if (new Date(newTrip.endDate) < new Date(newTrip.startDate)) {
      showToast('End date must be after the start date.', 'error');
      return;
    }

    // Create itinerary from day-wise descriptions
    const formattedItinerary = dayWiseItinerary.map((day, index) => ({
      id: `day-${Date.now()}-${index}`,
      day: day.day,
      title: `Day ${day.day}`,
      description: day.description.trim() || undefined,
      activities: [],
    }));

    // Format places
    const formattedPlaces = places.map((place, index) => ({
      id: `place-${Date.now()}-${index}`,
      name: place.name,
      image: place.image,
    }));

    // Add the trip with itinerary, moods, styles, and places
    // Filter selected moods to only include active ones
    const activeSelectedMoods = selectedMoods.filter(moodId => {
      const mood = moodOptions.find(m => m.id === moodId);
      return mood && mood.isActive !== false;
    });
    
    // Filter selected styles to only include active ones
    const activeSelectedStyles = selectedStyles.filter(styleId => {
      const style = styleOptions.find(s => s.id === styleId);
      return isStyleActive(style);
    });

    const moodNames = activeSelectedMoods
      .map(id => moodOptions.find(m => m.id === id)?.name)
      .filter(Boolean) as string[];

    const memberIds = (newTrip.participantIds ?? []).filter(isObjectId);
    const apiPayload = {
      tripName: newTrip.title.trim(),
      type: newTrip.type,
      startDate: newTrip.startDate ? new Date(newTrip.startDate).toISOString() : undefined,
      endDate: newTrip.endDate ? new Date(newTrip.endDate).toISOString() : undefined,
      isFeatured: newTrip.isFeatured,
      members: memberIds,
      mood: {
        moods: moodNames,
        badges: activeSelectedMoods,
      },
      itinerary: formattedItinerary.reduce<Record<string, { title: string; itinerary: string }>>(
        (acc, day) => {
          acc[String(day.day)] = {
            title: day.title,
            itinerary: day.description || '',
          };
          return acc;
        },
        {}
      ),
      locations: formattedPlaces.map(place => ({
        placeId: place.id,
        name: place.name,
        country: '',
        latitude: undefined,
        longitude: undefined,
        photoUrl: place.image,
        address: place.name,
      })),
      overview: {
        name: newTrip.title.trim(),
        type: newTrip.overviewType.trim() || newTrip.destination.trim() || 'adventure',
        summary: newTrip.description?.trim() || newTrip.destination.trim(),
        notes: newTrip.overviewNotes.trim(),
      },
    };

    if (API_BASE_URL) {
      if (!createTripId) {
        showToast('Please complete step 1 before creating the trip.', 'error');
        return;
      }

      try {
        const response = await apiClient.put(`/admin/trips/${createTripId}`, apiPayload);
        const data = response.data;
        if (response.status < 200 || response.status >= 300) {
          throw new Error(data?.message || 'Failed to update trip');
        }
        showToast('Trip updated in API successfully!');
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Failed to update trip in API'), 'error');
        return;
      }
    }

    addTrip({
      ...newTrip,
      itinerary: formattedItinerary,
      moods: activeSelectedMoods,
      styles: activeSelectedStyles,
      places: formattedPlaces,
      participantIds: newTrip.participantIds ?? [],
      createdAt: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
    });
    showToast('Trip added successfully!');

    // Reset form
    setNewTrip({
      title: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      coverImage: '',
      status: 'Active',
      participantIds: [],
      type: 'public',
      isFeatured: false,
      overviewType: '',
      overviewNotes: '',
    });
    setNewTripParticipantSearchQuery('');
    setDayWiseItinerary([]);
    setSelectedMoods([]);
    setSelectedStyles([]);
    setPlaces([]);
    setCreateTripId(null);
    setCreateCoverFile(null);
    setCreateCoverUploadLoading(false);

    // Close dialog
    setTripDialogOpen(false);
  };

  const handleCreateTripStepContinue = async () => {
    if (createTripStep !== 1) {
      if (createTripStep === 2) {
        if (API_BASE_URL && createCoverFile) {
          if (!createTripId) {
            showToast('Please complete step 1 before uploading a cover image.', 'error');
            return;
          }

          const formData = new FormData();
          formData.append('wallpaper', createCoverFile);

          try {
            setCreateCoverUploadLoading(true);
            const response = await apiClient.put(`/admin/trips/${createTripId}`, formData);
            const data = response.data;
            if (response.status < 200 || response.status >= 300) {
              throw new Error(data?.message || 'Failed to upload trip image');
            }
            showToast('Trip image uploaded successfully!');
          } catch (err) {
            showToast(getApiErrorMessage(err, 'Failed to upload trip image'), 'error');
            return;
          } finally {
            setCreateCoverUploadLoading(false);
          }
        }
      }

      setCreateTripStep((step) => Math.min(3, step + 1));
      return;
    }

    if (!newTrip.title.trim()) {
      showToast('Please enter a trip title', 'error');
      return;
    }
    if (!newTrip.destination.trim()) {
      showToast('Please enter a destination', 'error');
      return;
    }
    if (!newTrip.startDate) {
      showToast('Please select a start date', 'error');
      return;
    }
    if (!newTrip.endDate) {
      showToast('Please select an end date', 'error');
      return;
    }
    
    // Validate date order
    if (new Date(newTrip.endDate) < new Date(newTrip.startDate)) {
      showToast('End date must be after the start date.', 'error');
      return;
    }

    if (API_BASE_URL) {
      const memberIds = (newTrip.participantIds ?? []).filter(isObjectId);
      const apiPayload = {
        tripName: newTrip.title.trim(),
        type: newTrip.type,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        isFeatured: newTrip.isFeatured,
        members: memberIds,
      };

      try {
        setCreateTripStepLoading(true);
        const response = await apiClient.post('/admin/trips', apiPayload);
        const data = response.data;
        if (response.status < 200 || response.status >= 300) {
          throw new Error(data?.message || 'Failed to create trip');
        }
        const createdTrip = data?.data?.data || data?.data || data;
        const createdTripId = createdTrip?._id || createdTrip?.id || null;
        if (createdTripId) {
          setCreateTripId(String(createdTripId));
        }
        showToast('Trip created in API successfully!');
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Failed to create trip in API'), 'error');
        setCreateTripStepLoading(false);
        return;
      } finally {
        setCreateTripStepLoading(false);
      }
    }

    setCreateTripStep((step) => Math.min(3, step + 1));
  };


  const getDateForTripDay = (trip: Trip, dayNumber: number): string | null => {
    if (!trip.startDate) return null;
    const start = new Date(trip.startDate);
    if (isNaN(start.getTime())) return null;
    const d = new Date(start);
    d.setDate(start.getDate() + (dayNumber - 1));
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip({
      ...trip,
      participantIds: trip.participantIds ?? [],
      type: normalizeTripType(trip.type),
      isFeatured: trip.isFeatured ?? false,
      overviewType: trip.overviewType ?? '',
      overviewNotes: trip.overviewNotes ?? '',
      description: trip.description ?? '',
      destination: trip.destination ?? '',
      startDate: normalizeDateInput(trip.startDate),
      endDate: normalizeDateInput(trip.endDate),
    });
    setEditingSelectedStyles(trip.styles ?? []);
    setEditingSelectedMoods(trip.moods ?? []);
    setEditCoverFile(null);
    setEditTripStep(1);
    setEditTripDialogOpen(true);
  };

  // Initialize and keep editingDayWiseItinerary in sync when editingTrip or its dates change
  useEffect(() => {
    if (!editingTrip) {
      setEditingDayWiseItinerary([]);
      return;
    }

    const daysCount = getDaysCount(editingTrip.startDate, editingTrip.endDate);
    if (!daysCount) {
      // If no valid dates but itinerary exists, fall back to existing entries
      if (editingTrip.itinerary && editingTrip.itinerary.length > 0) {
        setEditingDayWiseItinerary(
          editingTrip.itinerary.map(day => ({
            id: day.id,
            day: day.day,
            description: day.description || '',
          }))
        );
      } else {
        setEditingDayWiseItinerary([]);
      }
      return;
    }

    // Detect legacy \"Full Itinerary\" single-day data
    const isLegacyFullItinerary =
      editingTrip.itinerary &&
      editingTrip.itinerary.length === 1 &&
      editingTrip.itinerary[0].title === 'Full Itinerary';

    setEditingDayWiseItinerary(prev => {
      const source =
        prev.length > 0
          ? prev
          : (editingTrip.itinerary || []).map(day => ({
              id: day.id,
              day: day.day,
              description: day.description || '',
            }));

      const next: { id: string; day: number; description: string }[] = [];
      for (let day = 1; day <= daysCount; day++) {
        let existing = source.find(d => d.day === day);

        // For legacy data, put full itinerary text in Day 1 only
        if (!existing && isLegacyFullItinerary && day === 1) {
          existing = {
            id: editingTrip.itinerary[0].id,
            day: 1,
            description: editingTrip.itinerary[0].description || '',
          };
        }

        next.push(
          existing ?? {
            id: `edit-day-${day}-${Date.now()}`,
            day,
            description: '',
          }
        );
      }
      return next;
    });
  }, [editingTrip?.id, editingTrip?.startDate, editingTrip?.endDate]);

  // Sync editingSelectedStyles when editingTrip changes
  useEffect(() => {
    if (editingTrip) {
      setEditingSelectedStyles(editingTrip.styles ?? []);
    } else {
      setEditingSelectedStyles([]);
    }
  }, [editingTrip?.id, editingTrip?.styles]);

  // Sync editingSelectedMoods when editingTrip changes
  useEffect(() => {
    if (editingTrip) {
      setEditingSelectedMoods(editingTrip.moods ?? []);
    } else {
      setEditingSelectedMoods([]);
    }
  }, [editingTrip?.id, editingTrip?.moods]);

  const handleUpdateTrip = async () => {
    if (!editingTrip) return;
    
    // Validate date order
    if (editingTrip.startDate && editingTrip.endDate && new Date(editingTrip.endDate) < new Date(editingTrip.startDate)) {
      showToast('End date must be after the start date.', 'error');
      return;
    }

    let nextItinerary = editingTrip.itinerary || [];

    if (editingDayWiseItinerary.length > 0) {
      nextItinerary = editingDayWiseItinerary.map((day, index) => {
        const existingDay = editingTrip.itinerary?.find(d => d.day === day.day);
        return {
          id: existingDay?.id || `day-${editingTrip.id}-${day.day}-${index}-${Date.now()}`,
          day: day.day,
          title: `Day ${day.day}`,
          description: day.description.trim() || existingDay?.description,
          activities: existingDay?.activities || [],
        };
      });
    }

    // Filter editingSelectedStyles to only include active ones
    const activeEditingSelectedStyles = editingSelectedStyles.filter(styleId => {
      const style = styleOptions.find(s => s.id === styleId);
      return isStyleActive(style);
    });

    // Filter editingSelectedMoods to only include active ones
    const activeEditingSelectedMoods = editingSelectedMoods.filter(moodId => {
      const mood = moodOptions.find(m => m.id === moodId);
      return mood && mood.isActive;
    });

    const moodNames = activeEditingSelectedMoods
      .map(id => moodOptions.find(m => m.id === id)?.name)
      .filter(Boolean) as string[];

    const memberIds = (editingTrip.participantIds ?? []).filter(isObjectId);
    const formattedPlaces = (editingTrip.places ?? []).map(place => ({
      placeId: place.id,
      name: place.name,
      country: '',
      latitude: undefined,
      longitude: undefined,
      photoUrl: place.image,
      address: place.name,
    }));

    const apiPayload = {
      tripName: editingTrip.title.trim(),
      type: editingTrip.type ?? 'public',
      startDate: editingTrip.startDate ? new Date(editingTrip.startDate).toISOString() : undefined,
      endDate: editingTrip.endDate ? new Date(editingTrip.endDate).toISOString() : undefined,
      isFeatured: editingTrip.isFeatured ?? false,
      members: memberIds,
      mood: {
        moods: moodNames,
        badges: activeEditingSelectedMoods,
      },
      itinerary: nextItinerary.reduce<Record<string, { title: string; itinerary: string }>>(
        (acc, day) => {
          acc[String(day.day)] = {
            title: day.title,
            itinerary: day.description || '',
          };
          return acc;
        },
        {}
      ),
      locations: formattedPlaces,
      overview: {
        name: editingTrip.title.trim(),
        type: (editingTrip.overviewType ?? '').trim() || editingTrip.destination.trim() || 'adventure',
        summary: editingTrip.description?.trim() || editingTrip.destination.trim(),
        notes: (editingTrip.overviewNotes ?? '').trim(),
      },
    };

    if (API_BASE_URL && isObjectId(editingTrip.id)) {
      try {
        if (editCoverFile) {
          const formData = new FormData();
          formData.append('wallpaper', editCoverFile);

          const response = await apiClient.put(`/admin/trips/${editingTrip.id}`, formData);
          const data = response.data;
          if (response.status < 200 || response.status >= 300) {
            throw new Error(data?.message || 'Failed to update trip wallpaper');
          }
        }

        const response = await apiClient.put(`/admin/trips/${editingTrip.id}`, apiPayload);
        const data = response.data;
        if (response.status < 200 || response.status >= 300) {
          throw new Error(data?.message || 'Failed to update trip');
        }
        showToast('Trip updated in API successfully!');
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Failed to update trip in API'), 'error');
        return;
      }
    }

    updateTrip(editingTrip.id, {
      ...editingTrip,
      itinerary: nextItinerary,
      participantIds: editingTrip.participantIds ?? [],
      moods: activeEditingSelectedMoods,
      styles: activeEditingSelectedStyles,
    });
    showToast('Trip updated successfully!');
    setEditTripDialogOpen(false);
    setEditingTrip(null);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    setDeleteTripLoading(true);
    if (API_BASE_URL && isObjectId(trip.id)) {
      try {
        const response = await apiClient.delete(`/admin/trips/${trip.id}`);
        const data = response.data;
        if (response.status < 200 || response.status >= 300) {
          throw new Error(data?.message || 'Failed to delete trip');
        }
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Failed to delete trip'), 'error');
        setDeleteTripLoading(false);
        return;
      }
    }

    deleteTrip(trip.id);
    showToast('Trip deleted successfully!');
    if (editingTrip?.id === trip.id) {
      setEditingTrip(null);
      setEditTripDialogOpen(false);
    }
    setDeleteTripLoading(false);
    setDeleteTripDialogOpen(false);
    setDeleteTripTarget(null);
  };

  const handleRequestDeleteTrip = (trip: Trip) => {
    setDeleteTripTarget(trip);
    setDeleteTripDialogOpen(true);
  };

  return (
    <div className="space-y-5 font-sans w-full">
      <Dialog
        open={tripDialogOpen}
        onOpenChange={(open) => {
          setTripDialogOpen(open);
          if (open) {
            setCreateTripStep(1);
            setCreateTripId(null);
            setCreateCoverFile(null);
            setCreateCoverUploadLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Trip</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new trip.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Step {createTripStep} of 3</span>
            </div>

            {createTripStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-title">
                    Trip Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trip-title"
                    value={newTrip.title}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Mountain Adventure"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-destination">
                    Destination <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trip-destination"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="e.g., Swiss Alps"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-description">Description (Optional)</Label>
                  <Textarea
                    id="trip-description"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the trip..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trip-start">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trip-start"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trip-end">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trip-end"
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trip-type">Type</Label>
                    <select
                      id="trip-type"
                      value={newTrip.type}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, type: e.target.value as 'public' | 'private' | 'invite-only' }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="invite-only">Invite Only</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm">Featured</Label>
                    <div className="flex items-center gap-3 h-10">
                      <input
                        id="trip-featured"
                        type="checkbox"
                        checked={newTrip.isFeatured}
                        onChange={(e) => setNewTrip(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="h-4 w-4 rounded border border-gray-300 bg-white checked:bg-white checked:border-gray-300 accent-[#06B3C4]"
                      />
                      <Label htmlFor="trip-featured" className="text-sm text-gray-600">Mark as featured</Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overview-type">Overview Type</Label>
                    <Input
                      id="overview-type"
                      value={newTrip.overviewType}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, overviewType: e.target.value }))}
                      placeholder="e.g., adventure"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overview-notes">Overview Notes</Label>
                    <Input
                      id="overview-notes"
                      value={newTrip.overviewNotes}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, overviewNotes: e.target.value }))}
                      placeholder="Visa info, tips, etc."
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-base font-semibold">Participants</Label>
                  <p className="text-xs text-gray-500">Select users to add to this trip (from the Users page).</p>
                  <Input
                    type="text"
                    placeholder="Search for Participants"
                    value={newTripParticipantSearchQuery}
                    onChange={(e) => setNewTripParticipantSearchQuery(e.target.value)}
                    className="rounded-md border border-input"
                  />
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto py-2">
                    {(() => {
                      const users = apiTripUsers.length > 0 ? apiTripUsers : storage.getTripUsers();
                      if (users.length === 0) {
                        return <p className="text-sm text-gray-500">No users yet. Add users on the Users page first.</p>;
                      }
                      const q = newTripParticipantSearchQuery.trim().toLowerCase();
                      const filtered = q
                        ? users.filter((u) => {
                            const full = `${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.toLowerCase();
                            return full.includes(q);
                          })
                        : users;
                      if (filtered.length === 0) {
                        return <p className="text-sm text-gray-500">No participants match your search.</p>;
                      }
                      return filtered.map((u) => {
                        const isSelected = (newTrip.participantIds ?? []).includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-[#06B3C4] bg-[#06B3C4] text-white hover:bg-[#05a0af] hover:border-[#05a0af]'
                                : 'border-input bg-background hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setNewTrip(prev => ({
                                  ...prev,
                                  participantIds: isSelected
                                    ? (prev.participantIds ?? []).filter(id => id !== u.id)
                                    : [...(prev.participantIds ?? []), u.id],
                                }));
                              }}
                              className={`rounded border-input accent-[#06B3C4] ${!isSelected ? 'opacity-0' : ''}`}
                            />
                            <span>{u.firstName} {u.lastName}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {createTripStep === 2 && (
              <div className="py-8">
                <input
                  id="trip-image"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverImageUpload(e.target.files?.[0] || null)}
                />
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <div className="aspect-square w-full overflow-hidden rounded-3xl bg-[#A9C6F4] flex items-center justify-center shadow-sm">
                      {newTrip.coverImage ? (
                        <img
                          src={newTrip.coverImage}
                          alt="Trip cover"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-7xl font-semibold">
                          {(newTrip.title?.trim()?.charAt(0) || 'A').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        className="text-white border-0 hover:opacity-90 rounded-full px-5"
                        style={{ backgroundColor: '#06B3C4' }}
                        onClick={() => coverInputRef.current?.click()}
                        disabled={createCoverUploadLoading}
                      >
                        {createCoverUploadLoading ? 'Uploading...' : newTrip.coverImage ? 'Replace Photo' : 'Upload Photo'}
                      </Button>
                      {newTrip.coverImage ? (
                        <button
                          type="button"
                          onClick={handleClearCoverImage}
                          className="h-10 w-10 rounded-full text-white flex items-center justify-center hover:opacity-90"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {createTripStep === 3 && (
              <div className="space-y-4 py-4">
                {/* Itinerary Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Itinerary</Label>
                  </div>
                  {dayWiseItinerary.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Select a start and end date to generate day-wise itinerary fields.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dayWiseItinerary.map((day) => {
                        const getDisplayDate = () => {
                          if (!newTrip.startDate) return null;
                          const start = new Date(newTrip.startDate);
                          if (isNaN(start.getTime())) return null;
                          const d = new Date(start);
                          d.setDate(start.getDate() + (day.day - 1));
                          return d.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        };

                        const displayDate = getDisplayDate();

                        return (
                          <div key={day.id} className="space-y-2">
                            <div className="flex items-baseline justify-between">
                              <p className="font-semibold text-gray-900 font-heading">
                                Day {day.day}
                                {displayDate ? (
                                  <span className="ml-2 text-sm font-normal text-gray-500">
                                    {displayDate}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <Textarea
                              value={day.description}
                              onChange={(e) =>
                                setDayWiseItinerary((prev) =>
                                  prev.map((d) =>
                                    d.day === day.day ? { ...d, description: e.target.value } : d
                                  )
                                )
                              }
                              placeholder={`Enter itinerary details for Day ${day.day}...`}
                              rows={4}
                              className="resize-y"
                            />
                          </div>
                        );
                      })}
                      <p className="text-xs text-gray-500">
                        Days are generated automatically based on the selected start and end dates.
                        Updating the dates will update the days while keeping existing text where possible.
                      </p>
                    </div>
                  )}
                </div>
                {/* Mood Selection Section */}
                <div className="space-y-4 pt-2">
                  <Label className="text-base font-semibold">Best for Mood</Label>
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.filter(mood => mood.isActive).length === 0 ? (
                      <p className="text-sm text-gray-500">No moods available yet.</p>
                    ) : (
                      moodOptions
                        .filter(mood => mood.isActive)
                        .map((mood) => {
                          const isSelected = selectedMoods.includes(mood.id);
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() => {
                                setSelectedMoods(prev =>
                                  prev.includes(mood.id)
                                    ? prev.filter(id => id !== mood.id)
                                    : [...prev, mood.id]
                                );
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed flex items-center gap-2 transition-colors ${
                                isSelected ? 'text-white' : 'text-[#06B3C4]'
                              }`}
                              style={isSelected
                                ? {
                                    backgroundColor: '#06B3C4',
                                    borderColor: '#06B3C4',
                                    borderStyle: 'dashed',
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
                              {mood.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={mood.image}
                                    alt={mood.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : mood.icon ? (
                                <span>{mood.icon}</span>
                              ) : null}
                              <span>{mood.name}</span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Style Selection Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Best for Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.filter(isStyleActive).length === 0 ? (
                      <p className="text-sm text-gray-500">No styles available yet.</p>
                    ) : (
                      styleOptions
                        .filter(isStyleActive)
                        .map((style) => {
                          const isSelected = selectedStyles.includes(style.id);
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setSelectedStyles(prev =>
                                  prev.includes(style.id)
                                    ? prev.filter(id => id !== style.id)
                                    : [...prev, style.id]
                                );
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed flex items-center gap-2 transition-colors ${
                                isSelected ? 'text-white' : 'text-[#06B3C4]'
                              }`}
                              style={isSelected
                                ? {
                                    backgroundColor: '#06B3C4',
                                    borderColor: '#06B3C4',
                                    borderStyle: 'dashed',
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
                              {style.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={style.image}
                                    alt={style.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : style.icon ? (
                                <span>{style.icon}</span>
                              ) : null}
                              <span>{style.name}</span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setTripDialogOpen(false)}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              {createTripStep > 1 && (
                <Button
                  type="button"
                  onClick={() => setCreateTripStep((step) => Math.max(1, step - 1))}
                  className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  Back
                </Button>
              )}
              {createTripStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleCreateTripStepContinue}
                  disabled={createTripStepLoading || createCoverUploadLoading}
                  className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  {createTripStepLoading || createCoverUploadLoading ? 'Saving...' : 'Continue'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateTrip}
                  className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  Create Trip
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Search Box + Add New */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search trips by title or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-full rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Dialog
          open={tripDialogOpen}
          onOpenChange={(open) => {
            setTripDialogOpen(open);
            if (open) {
              setCreateTripStep(1);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {(() => {
          const filteredTrips = trips.filter((trip) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
              trip.title.toLowerCase().includes(query) ||
              trip.destination.toLowerCase().includes(query) ||
              trip.description?.toLowerCase().includes(query)
            );
          });

          const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE) || 1;
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

          return filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchQuery ? 'No trips found matching your search.' : 'No trips created yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="lg:hidden space-y-3 p-4">
                {paginatedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#EEF0F1' }}
                  >
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {trip.coverImage ? (
                        <img
                          src={trip.coverImage}
                          alt={trip.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <MapPin className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{trip.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' - '}
                        {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        trip.type === 'private'
                          ? 'bg-purple-100 text-purple-800'
                          : trip.type === 'invite-only'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {trip.type || 'public'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleEditTrip(trip)}
                        className="h-8 w-8 p-0 hover:opacity-90 border-0"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestDeleteTrip(trip)}
                        className="h-8 w-8 p-0 hover:opacity-90 border-0"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Start Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">End Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Cover Image</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#EEF0F1' }}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {trip.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {new Date(trip.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {new Date(trip.endDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          trip.type === 'private' 
                            ? 'bg-purple-100 text-purple-800' 
                            : trip.type === 'invite-only'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {trip.type || 'public'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {trip.coverImage ? (
                          <img
                            src={trip.coverImage}
                            alt={trip.title}
                            className="w-14 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleEditTrip(trip)}
                            className="h-7 w-7 p-0 hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Edit className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRequestDeleteTrip(trip)}
                            className="h-7 w-7 p-0 hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div
                  className="px-4 py-3 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: '#EEF0F1' }}
                >
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length} trips
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
                        const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        const showEllipsis = (page === currentPage - 2 && currentPage > 3) || (page === currentPage + 2 && currentPage < totalPages - 2);
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

      {/* Trip Details Dialog - Show when trip is selected */}
      {selectedTrip && (
        <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{selectedTrip.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Trip Header Image */}
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={selectedTrip.coverImage}
                  alt={selectedTrip.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl font-bold text-white font-heading mb-2">{selectedTrip.title}</h2>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedTrip.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {selectedTrip.startDate} - {selectedTrip.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trip Summary */}
              {selectedTrip.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-2">Trip Summary</h3>
                  <p className="text-gray-600">{selectedTrip.description}</p>
                </div>
              )}

              {/* Best for Mood */}
              {selectedTrip.moods && selectedTrip.moods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">
                    Best for <span className="text-yellow-500">Mood</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrip.moods.map((moodId) => {
                      const mood = moods.find(m => m.id === moodId);
                      if (!mood) return null;
                      return (
                        <div
                          key={moodId}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white border border-dashed flex items-center gap-2"
                          style={{
                            backgroundColor: '#06B3C4',
                            borderColor: '#06B3C4',
                            borderStyle: 'dashed',
                            borderWidth: '1px',
                          }}
                        >
                          {mood.image ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                              <img
                                src={mood.image}
                                alt={mood.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </span>
                          ) : mood.icon ? (
                            <span>{mood.icon}</span>
                          ) : null}
                          <span>{mood.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Best for Style */}
              {selectedTrip.styles && selectedTrip.styles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">
                    Best for <span className="text-yellow-500">Style</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrip.styles.map((styleId) => {
                      const style = styles.find(s => s.id === styleId);
                      if (!style) return null;
                      return (
                        <div
                          key={styleId}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white border border-dashed flex items-center gap-2"
                          style={{
                            backgroundColor: '#06B3C4',
                            borderColor: '#06B3C4',
                            borderStyle: 'dashed',
                            borderWidth: '1px',
                          }}
                        >
                          {style.image ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                              <img
                                src={style.image}
                                alt={style.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </span>
                          ) : style.icon ? (
                            <span>{style.icon}</span>
                          ) : null}
                          <span>{style.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedTrip.participantIds && selectedTrip.participantIds.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-2">Participants</h3>
                  <p className="text-sm text-gray-600">
                    {selectedTrip.participantIds
                      .map(id => {
                        const u = storage.getTripUsers().find(tu => tu.id === id);
                        return u ? `${u.firstName} ${u.lastName}` : null;
                      })
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              )}

              {/* Itinerary */}
              {selectedTrip.itinerary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">Itinerary</h3>
                  <div className="space-y-3">
                    {selectedTrip.itinerary.map((day) => {
                      const isLegacyFullItinerary =
                        selectedTrip.itinerary.length === 1 && day.title === 'Full Itinerary';
                      const displayDate = getDateForTripDay(selectedTrip, day.day);

                      return (
                        <div
                          key={day.id}
                          className="border rounded-lg overflow-hidden"
                          style={{ borderColor: '#EEF0F1' }}
                        >
                          <div
                            className="w-full flex items-center text-white p-6"
                            style={{ background: 'linear-gradient(to right, #0285BF, #03A9F4)' }}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <span
                                className="w-10 h-10 text-sm flex items-center justify-center bg-white rounded-full font-semibold shrink-0"
                                style={{ color: '#0285BF' }}
                              >
                                {day.day}
                              </span>
                              <div className="flex-1 text-left">
                                <span className="text-lg font-bold text-white font-heading block">
                                  {isLegacyFullItinerary ? 'Full Itinerary' : `Day ${day.day}`}
                                  {displayDate && (
                                    <span className="ml-2 text-xs font-normal text-white/80">
                                      {displayDate}
                                    </span>
                                  )}
                                </span>
                                {day.description && (
                                  <span className="text-sm mt-2 text-white/80 block whitespace-pre-wrap">
                                    {day.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Places */}
              {selectedTrip.places && selectedTrip.places.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">Places you'll be visiting</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTrip.places.map((place) => (
                      <div key={place.id} className="border rounded-lg overflow-hidden shadow-sm" style={{ borderColor: '#EEF0F1' }}>
                        <div className="relative h-48">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 font-heading mb-2">{place.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
      <Button
        onClick={() => setSelectedTrip(null)}
        className="text-white hover:opacity-90 border-0 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#03A9F4' }}
      >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Trip Dialog */}
      {editingTrip && (
        <Dialog
          open={editTripDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (editCoverInputRef.current) editCoverInputRef.current.value = '';
              setEditParticipantSearchQuery('');
              setEditCoverFile(null);
              setEditTripStep(1);
            }
            if (open) {
              setEditTripStep(1);
            }
            setEditTripDialogOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Trip</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Step {editTripStep} of 3</span>
            </div>

            {editTripStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-trip-title">Trip Title</Label>
                  <Input
                    id="edit-trip-title"
                    value={editingTrip.title}
                    onChange={(e) => setEditingTrip({ ...editingTrip, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-trip-destination">Destination</Label>
                  <Input
                    id="edit-trip-destination"
                    value={editingTrip.destination}
                    onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                    placeholder="Destination"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-trip-description">Description</Label>
                  <Textarea
                    id="edit-trip-description"
                    value={editingTrip.description}
                    onChange={(e) => setEditingTrip({ ...editingTrip, description: e.target.value })}
                    placeholder="Describe the trip..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-trip-start">Start Date</Label>
                    <Input
                      id="edit-trip-start"
                      type="date"
                      value={editingTrip.startDate}
                      onChange={(e) => setEditingTrip({ ...editingTrip, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-trip-end">End Date</Label>
                    <Input
                      id="edit-trip-end"
                      type="date"
                      value={editingTrip.endDate}
                      onChange={(e) => setEditingTrip({ ...editingTrip, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-trip-type">Type</Label>
                    <select
                      id="edit-trip-type"
                      value={editingTrip.type ?? 'public'}
                      onChange={(e) => setEditingTrip({ ...editingTrip, type: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="invite-only">Invite Only</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm">Featured</Label>
                    <div className="flex items-center gap-3 h-10">
                      <input
                        id="edit-trip-featured"
                        type="checkbox"
                        checked={Boolean(editingTrip.isFeatured)}
                        onChange={(e) => setEditingTrip({ ...editingTrip, isFeatured: e.target.checked })}
                        className="h-4 w-4 rounded border border-gray-300 bg-white checked:bg-white checked:border-gray-300 accent-[#06B3C4]"
                      />
                      <Label htmlFor="edit-trip-featured" className="text-sm text-gray-600">Mark as featured</Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-overview-type">Overview Type</Label>
                    <Input
                      id="edit-overview-type"
                      value={editingTrip.overviewType ?? ''}
                      onChange={(e) => setEditingTrip({ ...editingTrip, overviewType: e.target.value })}
                      placeholder="e.g., adventure"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-overview-notes">Overview Notes</Label>
                    <Input
                      id="edit-overview-notes"
                      value={editingTrip.overviewNotes ?? ''}
                      onChange={(e) => setEditingTrip({ ...editingTrip, overviewNotes: e.target.value })}
                      placeholder="Visa info, tips, etc."
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-base font-semibold">Participants</Label>
                  <p className="text-xs text-gray-500">Select users to add to this trip.</p>
                  <Input
                    type="text"
                    placeholder="Search for Participants"
                    value={editParticipantSearchQuery}
                    onChange={(e) => setEditParticipantSearchQuery(e.target.value)}
                    className="rounded-md border border-input"
                  />
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto py-2">
                    {(() => {
                      const users = apiTripUsers.length > 0 ? apiTripUsers : storage.getTripUsers();
                      if (users.length === 0) {
                        return <p className="text-sm text-gray-500">No users yet. Add users on the Users page first.</p>;
                      }
                      const q = editParticipantSearchQuery.trim().toLowerCase();
                      const filtered = q
                        ? users.filter((u) => {
                            const full = `${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.toLowerCase();
                            return full.includes(q);
                          })
                        : users;
                      if (filtered.length === 0) {
                        return <p className="text-sm text-gray-500">No participants match your search.</p>;
                      }
                      return filtered.map((u) => {
                        const participantIds = editingTrip.participantIds ?? [];
                        const isSelected = participantIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-[#06B3C4] bg-[#06B3C4] text-white hover:bg-[#05a0af] hover:border-[#05a0af]'
                                : 'border-input bg-background hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setEditingTrip(prev => prev ? {
                                  ...prev,
                                  participantIds: isSelected
                                    ? (prev.participantIds ?? []).filter(id => id !== u.id)
                                    : [...(prev.participantIds ?? []), u.id],
                                } : null);
                              }}
                              className={`rounded border-input accent-[#06B3C4] ${!isSelected ? 'opacity-0' : ''}`}
                            />
                            <span>{u.firstName} {u.lastName}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {editTripStep === 2 && (
              <div className="py-8">
                <input
                  id="edit-trip-cover-image"
                  ref={editCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleEditCoverImageUpload(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <div className="aspect-square w-full overflow-hidden rounded-3xl bg-[#A9C6F4] flex items-center justify-center shadow-sm">
                      {editingTrip.coverImage ? (
                        <img
                          src={editingTrip.coverImage}
                          alt="Trip cover"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-7xl font-semibold">
                          {(editingTrip.title?.trim()?.charAt(0) || 'A').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        className="text-white border-0 hover:opacity-90 rounded-full px-5"
                        style={{ backgroundColor: '#06B3C4' }}
                        onClick={() => editCoverInputRef.current?.click()}
                      >
                        {editingTrip.coverImage ? 'Replace Photo' : 'Upload Photo'}
                      </Button>
                      {editingTrip.coverImage ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTrip({ ...editingTrip, coverImage: '' });
                            setEditCoverFile(null);
                            if (editCoverInputRef.current) editCoverInputRef.current.value = '';
                          }}
                          className="h-10 w-10 rounded-full text-white flex items-center justify-center hover:opacity-90"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editTripStep === 3 && (
              <div className="space-y-4 py-4">
                {/* Edit Itinerary Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Itinerary</Label>
                  </div>
                  {editingDayWiseItinerary.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      This trip has no date range or itinerary days configured yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {editingDayWiseItinerary.map((day) => {
                        const getDisplayDate = () => {
                          if (!editingTrip.startDate) return null;
                          const start = new Date(editingTrip.startDate);
                          if (isNaN(start.getTime())) return null;
                          const d = new Date(start);
                          d.setDate(start.getDate() + (day.day - 1));
                          return d.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        };

                        const displayDate = getDisplayDate();

                        return (
                          <div key={day.id} className="space-y-2">
                            <div className="flex items-baseline justify-between">
                              <p className="font-semibold text-gray-900 font-heading">
                                Day {day.day}
                                {displayDate ? (
                                  <span className="ml-2 text-sm font-normal text-gray-500">
                                    {displayDate}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <Textarea
                              value={day.description}
                              onChange={(e) =>
                                setEditingDayWiseItinerary((prev) =>
                                  prev.map((d) =>
                                    d.day === day.day ? { ...d, description: e.target.value } : d
                                  )
                                )
                              }
                              placeholder={`Enter itinerary details for Day ${day.day}...`}
                              rows={4}
                              className="resize-y"
                            />
                          </div>
                        );
                      })}
                      <p className="text-xs text-gray-500">
                        Days are based on the trip start and end dates. Updating the dates will
                        update the number of days while keeping existing text where possible.
                      </p>
                    </div>
                  )}
                </div>
                {/* Best for Mood */}
                <div className="space-y-4 pt-2">
                  <Label className="text-base font-semibold">Best for Mood</Label>
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.filter(mood => mood.isActive).length === 0 ? (
                      <p className="text-sm text-gray-500">No moods available yet.</p>
                    ) : (
                      moodOptions
                        .filter(mood => mood.isActive)
                        .map((mood) => {
                          const isSelected = editingSelectedMoods.includes(mood.id);
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() => {
                                setEditingSelectedMoods(prev =>
                                  prev.includes(mood.id)
                                    ? prev.filter(id => id !== mood.id)
                                    : [...prev, mood.id]
                                );
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed flex items-center gap-2 transition-colors ${
                                isSelected ? 'text-white' : 'text-[#06B3C4]'
                              }`}
                              style={isSelected
                                ? {
                                    backgroundColor: '#06B3C4',
                                    borderColor: '#06B3C4',
                                    borderStyle: 'dashed',
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
                              {mood.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={mood.image}
                                    alt={mood.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : mood.icon ? (
                                <span>{mood.icon}</span>
                              ) : null}
                              <span>{mood.name}</span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Style Selection Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Best for Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.filter(isStyleActive).length === 0 ? (
                      <p className="text-sm text-gray-500">No styles available yet.</p>
                    ) : (
                      styleOptions
                        .filter(isStyleActive)
                        .map((style) => {
                          const isSelected = editingSelectedStyles.includes(style.id);
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setEditingSelectedStyles(prev =>
                                  prev.includes(style.id)
                                    ? prev.filter(id => id !== style.id)
                                    : [...prev, style.id]
                                );
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed flex items-center gap-2 transition-colors ${
                                isSelected ? 'text-white' : 'text-[#06B3C4]'
                              }`}
                              style={isSelected
                                ? {
                                    backgroundColor: '#06B3C4',
                                    borderColor: '#06B3C4',
                                    borderStyle: 'dashed',
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
                              {style.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={style.image}
                                    alt={style.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : style.icon ? (
                                <span>{style.icon}</span>
                              ) : null}
                              <span>{style.name}</span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setEditTripDialogOpen(false);
                  setEditingTrip(null);
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              {editTripStep > 1 && (
                <Button
                  type="button"
                  onClick={() => setEditTripStep((step) => Math.max(1, step - 1))}
                  className="text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  Back
                </Button>
              )}
              {editTripStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setEditTripStep((step) => Math.min(3, step + 1))}
                  className="text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleUpdateTrip}
                  className="text-white hover:opacity-90 border-0 font-medium"
                  style={{ backgroundColor: '#06B3C4' }}
                >
                  Update Trip
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={deleteTripDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteTripLoading) {
            setDeleteTripDialogOpen(false);
            setDeleteTripTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-[#06B3C4]">{deleteTripTarget?.title || 'this trip'}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              onClick={() => {
                if (!deleteTripLoading) {
                  setDeleteTripDialogOpen(false);
                  setDeleteTripTarget(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              disabled={!deleteTripTarget || deleteTripLoading}
              onClick={() => {
                if (!deleteTripTarget) return;
                handleDeleteTrip(deleteTripTarget);
              }}
            >
              {deleteTripLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
