import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { User, Trip, StyleOption, MoodOption, AuthState } from '@/types';
import { storage, defaultStyles, defaultMoods } from '@/lib/storage';
import { loginWithCredentials } from '@/lib/authApi';

interface AppContextType {
  // Auth
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // User
  currentUser: User;
  updateUser: (user: Partial<User>) => void;
  updateProfilePhoto: (photo: string) => void;

  // Trips
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addItinerary: (tripId: string, day: number, title: string, description?: string) => void;
  addActivity: (tripId: string, dayId: string, activity: Omit<Trip['itinerary'][0]['activities'][0], 'id'>) => void;
  /** Reload trips from storage (seeds 20 sample trips if needed). Call when Trip page is shown and trips are empty. */
  refreshTripsFromStorage: () => void;
  /** Set trips from API response (overrides current list). */
  setTripsFromApi: (nextTrips: Trip[]) => void;

  // Styles
  styles: StyleOption[];
  addStyle: (style: Omit<StyleOption, 'id'>) => void;
  updateStyle: (id: string, style: Partial<StyleOption>) => void;
  deleteStyle: (id: string) => void;

  // Moods
  moods: MoodOption[];
  toggleMood: (id: string) => void;
  addMood: (mood: Omit<MoodOption, 'id'>) => void;
  updateMood: (id: string, mood: Partial<MoodOption>) => void;
  deleteMood: (id: string) => void;

  // Toast
  toast: { message: string; variant: 'success' | 'error' } | null;
  showToast: (message: string, variant?: 'success' | 'error') => void;
}

const defaultUser: User = {
  id: '1',
  name: 'Guest User',
  email: 'guest@example.com',
  profilePhoto: null,
  emergencyContact: '',
};

function mergeStyles(defaults: StyleOption[], userStyles: StyleOption[] | undefined): StyleOption[] {
  const list = userStyles || [];
  const merged = defaults.map((defaultStyle) => {
    const existing = list.find((s) => s.id === defaultStyle.id);
    return {
      ...defaultStyle,
      ...(existing || {}),
      image: existing?.image ?? defaultStyle.image,
    };
  });
  const custom = list.filter((s) => !defaults.some((d) => d.id === s.id));
  return [...merged, ...custom];
}

function mergeMoods(defaults: MoodOption[], userMoods: MoodOption[] | undefined): MoodOption[] {
  const list = userMoods || [];
  const merged = defaults.map((defaultMood) => {
    const existing = list.find((m) => m.id === defaultMood.id);
    return {
      ...defaultMood,
      isActive: existing?.isActive ?? defaultMood.isActive,
      image: existing?.image ?? defaultMood.image,
      moodImage: existing?.moodImage ?? defaultMood.moodImage,
    };
  });
  const custom = list.filter((m) => !defaults.some((d) => d.id === m.id));
  return [...merged, ...custom];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  // Initialize with empty/defaults, but these will be overwritten on load
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [styles, setStyles] = useState<StyleOption[]>(defaultStyles);
  const [moods, setMoods] = useState<MoodOption[]>(defaultMoods);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, variant });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  // Load last active user on mount
  useEffect(() => {
    const lastUserEmail = storage.getLastActiveUser();
    if (lastUserEmail) {
      const userData = storage.loadUserData(lastUserEmail);
      if (userData) {
        const mergedStyles = mergeStyles(defaultStyles, Array.isArray(userData.styles) ? userData.styles : undefined);
        const mergedMoods = mergeMoods(defaultMoods, Array.isArray(userData.moods) ? userData.moods : undefined);

        setAuth({
          isAuthenticated: true,
          user: userData.user,
        });
        setCurrentUser(userData.user);
        setTrips(userData.trips);
        setStyles(mergedStyles);
        setMoods(mergedMoods);
      }
    }
  }, []);

  // Persist changes whenever relevant state changes, BUT only if authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.email) {
      try {
        storage.saveUserData(auth.user.email, {
          user: currentUser,
          trips,
          styles,
          moods,
        });
      } catch (e) {
        console.error('Failed to save user data', e);
      }
    }
  }, [auth.isAuthenticated, auth.user, currentUser, trips, styles, moods]);

  // Persists moods/styles to localStorage so new and updated rows survive logout/login.
  const persistUserData = (data: Partial<{ styles: StyleOption[]; moods: MoodOption[] }>) => {
    if (auth.isAuthenticated && auth.user?.email) {
      try {
        storage.saveUserData(auth.user.email, {
          user: currentUser,
          trips,
          styles,
          moods,
          ...data,
        });
      } catch (e) {
        console.error('Failed to save user data', e);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Attempting login for:', email);
    
    const result = await loginWithCredentials(email, password);
    
    if (result.success && result.user) {
      console.log('✅ Login successful via API');
      
      const userData = {
        id: result.user.cognitoId || result.user.id || '1',
        name: result.user.fullName || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
        email: result.user.emailAddress || result.user.email || email,
        profilePhoto: result.user.profilePicture || null,
        emergencyContact: result.user.mobileNo || '',
      };
      
      // Load or create user data in localStorage (for trips, styles, moods)
      const storedData = storage.loadUserData(userData.email);
      const mergedStyles = mergeStyles(defaultStyles, Array.isArray(storedData.styles) ? storedData.styles : undefined);
      const mergedMoods = mergeMoods(defaultMoods, Array.isArray(storedData.moods) ? storedData.moods : undefined);
      
      // Update stored user with latest data from API
      storage.saveUserData(userData.email, {
        user: userData,
        trips: storedData.trips,
        styles: mergedStyles,
        moods: mergedMoods,
      });
      
      setAuth({ isAuthenticated: true, user: userData });
      setCurrentUser(userData);
      setTrips(storedData.trips);
      setStyles(mergedStyles);
      setMoods(mergedMoods);

      if (result.token) {
        try {
          localStorage.setItem('roamana_api_token', result.token);
        } catch (e) {
          console.error('Failed to persist API token', e);
        }
      }
      
      storage.setLastActiveUser(userData.email);
      showToast('Welcome back!', 'success');
      return true;
    }
    
    console.log('❌ Login failed:', result.message);
    return false;
  };

  const logout = () => {
    if (auth.isAuthenticated && auth.user?.email) {
      try {
        const current = storage.loadUserData(auth.user.email);
        const storedMoodsLength = Array.isArray(current.moods) ? current.moods.length : 0;
        const storedStylesLength = Array.isArray(current.styles) ? current.styles.length : 0;
        const moodsToSave =
          moods.length >= storedMoodsLength
            ? moods
            : (Array.isArray(current.moods) ? current.moods : defaultMoods);
        const stylesToSave =
          styles.length >= storedStylesLength
            ? styles
            : (Array.isArray(current.styles) ? current.styles : defaultStyles);
        storage.saveUserData(auth.user.email, {
          ...current,
          user: currentUser,
          trips,
          moods: moodsToSave,
          styles: stylesToSave,
        });
      } catch (e) {
        console.error('Failed to save user data before logout', e);
      }
    }
    setAuth({
      isAuthenticated: false,
      user: null,
    });
    try {
      localStorage.removeItem('roamana_api_token');
    } catch (e) {
      console.error('Failed to clear API token', e);
    }
    storage.setLastActiveUser(null);
    setCurrentUser(defaultUser);
    setTrips([]);
    setStyles(defaultStyles);
    setMoods(defaultMoods);
  };

  const updateUser = (userData: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
    if (userData.name !== undefined && auth.user?.email) {
      const trimmed = userData.name.trim();
      storage.updateRegisteredUserInfo(auth.user.email, {
        name: trimmed,
        firstName: trimmed,
        lastName: '',
      });
    }
    setAuth(prev => prev.user ? { ...prev, user: { ...prev.user, ...userData } } : prev);
  };

  const updateProfilePhoto = (photo: string) => {
    setCurrentUser(prev => ({ ...prev, profilePhoto: photo }));
  };

  const addTrip = (trip: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
      itinerary: trip.itinerary || [],
    };
    setTrips(prev => [...prev, newTrip]);
  };

  const updateTrip = (id: string, tripData: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(trip => (trip.id === id ? { ...trip, ...tripData } : trip))
    );
  };

  const deleteTrip = (id: string) => {
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentTrips = Array.isArray(current.trips) ? current.trips : [];
        const next = currentTrips.filter(t => t.id !== id);
        storage.saveUserData(email, { ...current, trips: next });
      } catch (e) {
        console.error('Failed to persist trip delete', e);
      }
    }
    setTrips(prev => prev.filter(trip => trip.id !== id));
  };

  const addItinerary = (tripId: string, day: number, title: string, description?: string) => {
    setTrips(prev =>
      prev.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            itinerary: [
              ...trip.itinerary,
              {
                id: Date.now().toString(),
                day,
                title,
                description,
                activities: [],
              },
            ],
          };
        }
        return trip;
      })
    );
  };

  const addActivity = (
    tripId: string,
    dayId: string,
    activity: Omit<Trip['itinerary'][0]['activities'][0], 'id'>
  ) => {
    setTrips(prev =>
      prev.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            itinerary: trip.itinerary.map(day => {
              if (day.id === dayId) {
                return {
                  ...day,
                  activities: [
                    ...day.activities,
                    { ...activity, id: Date.now().toString() },
                  ],
                };
              }
              return day;
            }),
          };
        }
        return trip;
      })
    );
  };

  const addStyle = (style: Omit<StyleOption, 'id'>) => {
    const newStyle: StyleOption = {
      ...style,
      id: `style-${Date.now()}`,
    };
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentStyles = Array.isArray(current.styles) ? current.styles : defaultStyles;
        const next = [...currentStyles, newStyle];
        storage.saveUserData(email, { ...current, styles: next });
      } catch (e) {
        console.error('Failed to persist styles', e);
      }
    }
    setStyles(prev => [...prev, newStyle]);
  };

  const updateStyle = (id: string, style: Partial<StyleOption>) => {
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentStyles = Array.isArray(current.styles) ? current.styles : defaultStyles;
        const next = currentStyles.map(s =>
          s.id === id ? { ...s, ...style } : s
        );
        storage.saveUserData(email, { ...current, styles: next });
      } catch (e) {
        console.error('Failed to persist styles', e);
      }
    }
    setStyles(prev =>
      prev.map(s => s.id === id ? { ...s, ...style } : s)
    );
  };

  const deleteStyle = (id: string) => {
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentStyles = Array.isArray(current.styles) ? current.styles : defaultStyles;
        const next = currentStyles.filter(s => s.id !== id);
        storage.saveUserData(email, { ...current, styles: next });
      } catch (e) {
        console.error('Failed to persist styles', e);
      }
    }
    setStyles(prev => prev.filter(s => s.id !== id));
  };

  const toggleMood = (id: string) => {
    setMoods(prev =>
      {
        const next = prev.map(mood =>
          mood.id === id ? { ...mood, isActive: !mood.isActive } : mood
        );
        persistUserData({ moods: next });
        return next;
      }
    );
  };

  const addMood = (mood: Omit<MoodOption, 'id'>) => {
    const newMood: MoodOption = {
      ...mood,
      id: `mood-${Date.now()}`,
    };
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentMoods = Array.isArray(current.moods) ? current.moods : defaultMoods;
        const next = [...currentMoods, newMood];
        storage.saveUserData(email, { ...current, moods: next });
      } catch (e) {
        console.error('Failed to persist moods', e);
      }
    }
    setMoods(prev => [...prev, newMood]);
  };

  const updateMood = (id: string, mood: Partial<MoodOption>) => {
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentMoods = Array.isArray(current.moods) ? current.moods : defaultMoods;
        const next = currentMoods.map(m =>
          m.id === id ? { ...m, ...mood } : m
        );
        storage.saveUserData(email, { ...current, moods: next });
      } catch (e) {
        console.error('Failed to persist moods', e);
      }
    }
    setMoods(prev =>
      prev.map(m => m.id === id ? { ...m, ...mood } : m)
    );
  };

  const deleteMood = (id: string) => {
    const email = auth.user?.email;
    if (email) {
      try {
        const current = storage.loadUserData(email);
        const currentMoods = Array.isArray(current.moods) ? current.moods : defaultMoods;
        const next = currentMoods.filter(m => m.id !== id);
        storage.saveUserData(email, { ...current, moods: next });
      } catch (e) {
        console.error('Failed to persist moods', e);
      }
    }
    setMoods(prev => prev.filter(m => m.id !== id));
  };

  const refreshTripsFromStorage = useCallback(() => {
    const email = auth.user?.email;
    if (email) {
      const userData = storage.loadUserData(email);
      setTrips(userData.trips);
    }
  }, [auth.user?.email]);

  const setTripsFromApi = (nextTrips: Trip[]) => {
    setTrips(nextTrips);
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        login,
        logout,
        currentUser,
        updateUser,
        updateProfilePhoto,
        trips,
        addTrip,
        updateTrip,
        deleteTrip,
        addItinerary,
        addActivity,
        refreshTripsFromStorage,
  setTripsFromApi,
        styles,
        addStyle,
        updateStyle,
        deleteStyle,
        moods,
        toggleMood,
        addMood,
        updateMood,
        deleteMood,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

