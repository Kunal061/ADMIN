// Types for the Admin Panel

export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  emergencyContact: string;
}

/** Trip user (can be added as participant to trips; cannot access admin panel). */
export interface TripUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
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
  moods?: string[]; // Array of mood IDs
  styles?: string[]; // Array of style IDs
  places?: Place[];
  status?: 'Active' | 'Inactive';
  participantIds?: string[]; // TripUser ids
  rating?: number;
  price?: number;
  createdAt?: string;
}

export interface Place {
  id: string;
  name: string;
  image: string;
  mapLink?: string;
}

export interface DayItinerary {
  id: string;
  day: number;
  title: string;
  description?: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
}

export interface StyleImage {
  image: string;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  isActive: boolean;
  styleImage?: StyleImage;
}

export interface MoodImage {
  image: string;
}

export interface MoodOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  isActive: boolean;
  moodImage?: MoodImage;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

/** Admin-registered user info (stored in roamana_user_info). */
export interface RegisteredUserInfo {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  password?: string;
}
