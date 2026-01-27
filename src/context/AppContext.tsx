import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Trip, StyleOption, MoodOption, AuthState } from '@/types';

interface AppContextType {
  // Auth
  auth: AuthState;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // User
  currentUser: User;
  updateUser: (user: Partial<User>) => void;
  updateProfilePhoto: (photo: string) => void;
  
  // Trips
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'itinerary'>) => void;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addItinerary: (tripId: string, day: number, title: string) => void;
  addActivity: (tripId: string, dayId: string, activity: Omit<Trip['itinerary'][0]['activities'][0], 'id'>) => void;
  
  // Styles
  styles: StyleOption[];
  toggleStyle: (id: string) => void;
  
  // Moods
  moods: MoodOption[];
  toggleMood: (id: string) => void;
}

const defaultUser: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  profilePhoto: null,
  emergencyContact: '+1 234 567 8900',
};

const defaultStyles: StyleOption[] = [
  { id: '1', name: 'CALM', description: 'Peaceful and relaxing experiences', icon: '🧘', isActive: true },
  { id: '2', name: 'WOMEN FRIENDLY', description: 'Safe and inclusive for women travelers', icon: '👩', isActive: true },
  { id: '3', name: 'BUDGET ROAMER', description: 'Affordable travel options', icon: '💰', isActive: false },
  { id: '4', name: 'NATURE FRIENDLY', description: 'Eco-conscious and sustainable', icon: '🌿', isActive: true },
];

const defaultMoods: MoodOption[] = [
  { id: '1', name: 'ADVENTUROUS', description: 'Thrill-seeking experiences', emoji: '🏔️', color: '#3B82F6', isActive: true },
  { id: '2', name: 'CHILL', description: 'Laid-back and relaxed vibes', emoji: '😎', color: '#06B6D4', isActive: true },
  { id: '3', name: 'CURIOUS', description: 'Discovery and learning', emoji: '🔍', color: '#0EA5E9', isActive: false },
  { id: '4', name: 'SOCIAL', description: 'Meet new people', emoji: '🎉', color: '#2563EB', isActive: true },
  { id: '5', name: 'SOULFUL', description: 'Spiritual and meaningful', emoji: '✨', color: '#0891B2', isActive: false },
  { id: '6', name: 'FOODIE', description: 'Culinary adventures', emoji: '🍜', color: '#1D4ED8', isActive: true },
];

const defaultTrips: Trip[] = [
  {
    id: '1',
    title: 'Himalayan Adventure',
    description: 'Explore the majestic Himalayas with breathtaking views and cultural experiences.',
    destination: 'Manali, India',
    startDate: '2026-03-15',
    endDate: '2026-03-22',
    coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    itinerary: [
      {
        id: 'd1',
        day: 1,
        title: 'Arrival & Acclimatization',
        activities: [
          { id: 'a1', time: '10:00 AM', title: 'Airport Pickup', description: 'Pick up from Kullu Airport', location: 'Kullu Airport' },
          { id: 'a2', time: '02:00 PM', title: 'Hotel Check-in', description: 'Check in and rest', location: 'Mountain View Resort' },
        ],
      },
    ],
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [trips, setTrips] = useState<Trip[]>(defaultTrips);
  const [styles, setStyles] = useState<StyleOption[]>(defaultStyles);
  const [moods, setMoods] = useState<MoodOption[]>(defaultMoods);

  const login = (email: string, password: string): boolean => {
    // Simple validation - in real app, this would be an API call
    if (email && password.length >= 6) {
      setAuth({
        isAuthenticated: true,
        user: currentUser,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
    });
  };

  const updateUser = (userData: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  const updateProfilePhoto = (photo: string) => {
    setCurrentUser(prev => ({ ...prev, profilePhoto: photo }));
  };

  const addTrip = (trip: Omit<Trip, 'id' | 'itinerary'>) => {
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
      itinerary: [],
    };
    setTrips(prev => [...prev, newTrip]);
  };

  const updateTrip = (id: string, tripData: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(trip => (trip.id === id ? { ...trip, ...tripData } : trip))
    );
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== id));
  };

  const addItinerary = (tripId: string, day: number, title: string) => {
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

  const toggleStyle = (id: string) => {
    setStyles(prev =>
      prev.map(style =>
        style.id === id ? { ...style, isActive: !style.isActive } : style
      )
    );
  };

  const toggleMood = (id: string) => {
    setMoods(prev =>
      prev.map(mood =>
        mood.id === id ? { ...mood, isActive: !mood.isActive } : mood
      )
    );
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
        styles,
        toggleStyle,
        moods,
        toggleMood,
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
