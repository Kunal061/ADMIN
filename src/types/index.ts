// Types for the Admin Panel

export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  emergencyContact: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  itinerary: DayItinerary[];
}

export interface DayItinerary {
  id: string;
  day: number;
  title: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export interface MoodOption {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
