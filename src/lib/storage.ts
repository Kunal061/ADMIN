import type { Trip, TripUser, StyleOption, MoodOption, User, RegisteredUserInfo } from '@/types';

const STORAGE_PREFIX = 'roamana_app_';
const USERS_KEY = 'roamana_users';
const USER_INFO_KEY = 'roamana_user_info';
const TRIP_USERS_KEY = 'roamana_trip_users';
const OTP_KEY_PREFIX = 'roamana_otp_';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface UserData {
    user: User;
    trips: Trip[];
    styles: StyleOption[];
    moods: MoodOption[];
}

export const defaultStyles: StyleOption[] = [];

export const defaultMoods: MoodOption[] = [];

/** 20 sample trip users (for Users Management and trip participants). */
const defaultTripUsers: TripUser[] = [
    { id: 'u1', firstName: 'Kunal', lastName: 'Rohilla', email: 'kunalr061@gmail.com', phone: '9212294947', dateOfBirth: '2004-04-26', gender: 'Male' },
    { id: 'u2', firstName: 'Samiksha', lastName: 'Sharma', email: 'samiksha@outlook.com', phone: '9191929454', dateOfBirth: '2000-01-31', gender: 'Female' },
    { id: 'u3', firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@gmail.com', phone: '9876543210', dateOfBirth: '1998-07-15', gender: 'Male' },
    { id: 'u4', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@yahoo.com', phone: '9123456789', dateOfBirth: '1995-11-22', gender: 'Female' },
    { id: 'u5', firstName: 'Rahul', lastName: 'Verma', email: 'rahul.verma@gmail.com', phone: '9988776655', dateOfBirth: '1992-03-08', gender: 'Male' },
    { id: 'u6', firstName: 'Ananya', lastName: 'Singh', email: 'ananya.singh@outlook.com', phone: '9876123456', dateOfBirth: '1999-09-14', gender: 'Female' },
    { id: 'u7', firstName: 'Vikram', lastName: 'Kumar', email: 'vikram.kumar@gmail.com', phone: '9765432109', dateOfBirth: '1988-12-01', gender: 'Male' },
    { id: 'u8', firstName: 'Isha', lastName: 'Reddy', email: 'isha.reddy@yahoo.com', phone: '9654321098', dateOfBirth: '2001-05-19', gender: 'Female' },
    { id: 'u9', firstName: 'Aditya', lastName: 'Nair', email: 'aditya.nair@gmail.com', phone: '9543210987', dateOfBirth: '1996-08-27', gender: 'Male' },
    { id: 'u10', firstName: 'Neha', lastName: 'Gupta', email: 'neha.gupta@outlook.com', phone: '9432109876', dateOfBirth: '1994-02-11', gender: 'Female' },
    { id: 'u11', firstName: 'Rohan', lastName: 'Joshi', email: 'rohan.joshi@gmail.com', phone: '9321098765', dateOfBirth: '1997-10-05', gender: 'Male' },
    { id: 'u12', firstName: 'Kavya', lastName: 'Iyer', email: 'kavya.iyer@yahoo.com', phone: '9210987654', dateOfBirth: '2002-01-30', gender: 'Female' },
    { id: 'u13', firstName: 'Siddharth', lastName: 'Desai', email: 'siddharth.desai@gmail.com', phone: '9109876543', dateOfBirth: '1991-06-17', gender: 'Male' },
    { id: 'u14', firstName: 'Divya', lastName: 'Menon', email: 'divya.menon@outlook.com', phone: '9098765432', dateOfBirth: '1993-04-23', gender: 'Female' },
    { id: 'u15', firstName: 'Amit', lastName: 'Shah', email: 'amit.shah@gmail.com', phone: '8987654321', dateOfBirth: '1989-11-09', gender: 'Male' },
    { id: 'u16', firstName: 'Pooja', lastName: 'Kapoor', email: 'pooja.kapoor@yahoo.com', phone: '8876543210', dateOfBirth: '2000-07-02', gender: 'Female' },
    { id: 'u17', firstName: 'Karan', lastName: 'Malhotra', email: 'karan.malhotra@gmail.com', phone: '8765432109', dateOfBirth: '1995-12-15', gender: 'Male' },
    { id: 'u18', firstName: 'Shreya', lastName: 'Bose', email: 'shreya.bose@outlook.com', phone: '8654321098', dateOfBirth: '1998-08-28', gender: 'Female' },
    { id: 'u19', firstName: 'Ravi', lastName: 'Chandra', email: 'ravi.chandra@gmail.com', phone: '8543210987', dateOfBirth: '1992-03-12', gender: 'Male' },
    { id: 'u20', firstName: 'Meera', lastName: 'Krishnan', email: 'meera.krishnan@yahoo.com', phone: '8432109876', dateOfBirth: '1996-09-06', gender: 'Female' },
];

const defaultTrips: Trip[] = [];

export const storage = {
    getUserKey: (email: string) => `${STORAGE_PREFIX}${email.toLowerCase()}`,

    // Get all registered users (emails)
    getRegisteredUsers: (): string[] => {
        try {
            const users = localStorage.getItem(USERS_KEY);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error reading registered users', error);
            return [];
        }
    },

    // Get registered user info (for login verification and display)
    getRegisteredUserInfo: (email: string): RegisteredUserInfo | null => {
        try {
            const raw = localStorage.getItem(USER_INFO_KEY);
            if (!raw) return null;
            const map: Record<string, RegisteredUserInfo> = JSON.parse(raw);
            const normalizedEmail = email.toLowerCase();
            return map[normalizedEmail] ?? null;
        } catch (error) {
            console.error('Error reading registered user info', error);
            return null;
        }
    },

    // Update registered user info (name, password, etc.) for an existing user
    updateRegisteredUserInfo: (email: string, partial: Partial<RegisteredUserInfo>): void => {
        const normalizedEmail = email.toLowerCase();
        let map: Record<string, RegisteredUserInfo> = {};
        try {
            const raw = localStorage.getItem(USER_INFO_KEY);
            if (raw) map = JSON.parse(raw);
        } catch {
            // ignore
        }
        const existing = map[normalizedEmail];
        if (existing) {
            map[normalizedEmail] = { ...existing, ...partial, email: normalizedEmail };
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(map));
        }
    },

    // Add a user to the registry
    registerUser: (email: string) => {
        const normalizedEmail = email.toLowerCase();
        const users = storage.getRegisteredUsers();
        if (!users.includes(normalizedEmail)) {
            localStorage.setItem(USERS_KEY, JSON.stringify([...users, normalizedEmail]));
        }
    },

    // Remove a user from the registry and clear their stored data
    unregisterUser: (email: string) => {
        const normalizedEmail = email.toLowerCase();
        const users = storage.getRegisteredUsers().filter(u => u !== normalizedEmail);
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Error updating registered users', error);
        }

        // Remove the user's stored data (if any)
        try {
            const key = storage.getUserKey(normalizedEmail);
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing user data', error);
        }
    },

    // Initialize or Load User Data
    loadUserData: (email: string): UserData => {
        const normalizedEmail = email.toLowerCase();
        const key = storage.getUserKey(normalizedEmail);
        const stored = localStorage.getItem(key);

        if (stored) {
            try {
                const parsed = JSON.parse(stored) as UserData;
                const tripsValid = Array.isArray(parsed.trips);
                parsed.trips = tripsValid ? parsed.trips : [];
                if (!tripsValid) {
                    localStorage.setItem(key, JSON.stringify(parsed));
                }
                return parsed;
            } catch (error) {
                console.error('Error parsing user data', error);
            }
        }

        // Default data for new user
        const newUser: User = {
            id: Date.now().toString(),
            name: normalizedEmail.split('@')[0], // Default name from email
            email: normalizedEmail,
            profilePhoto: null,
            emergencyContact: '',
        };

        const initialData: UserData = {
            user: newUser,
            trips: defaultTrips,
            styles: defaultStyles,
            moods: defaultMoods,
        };

        // Save initial state immediately
        localStorage.setItem(key, JSON.stringify(initialData));
        storage.registerUser(normalizedEmail);

        return initialData;
    },

    saveUserData: (email: string, data: Partial<UserData>) => {
        const normalizedEmail = email.toLowerCase();
        const key = storage.getUserKey(normalizedEmail);
        const current = localStorage.getItem(key);
        let newData: UserData;

        if (current) {
            const parsed = JSON.parse(current);
            newData = { ...parsed, ...data };
        } else {
            // Should not usually verify here if app flow is correct
            newData = data as UserData;
        }

        localStorage.setItem(key, JSON.stringify(newData));
    },

    // Persist the LAST logged in user to auto-login on refresh
    setLastActiveUser: (email: string | null) => {
        if (email) {
            localStorage.setItem(`${STORAGE_PREFIX}last_user`, email.toLowerCase());
        } else {
            localStorage.removeItem(`${STORAGE_PREFIX}last_user`);
        }
    },

    getLastActiveUser: (): string | null => {
        return localStorage.getItem(`${STORAGE_PREFIX}last_user`);
    },

    /** Ensures default admin user exists so login with admin@roamana.com / AdminRoamana works. */
    ensureDefaultAdminUser: () => {
        const defaultEmail = 'admin@roamana.com'.toLowerCase();
        const defaultPassword = 'AdminRoamana';
        storage.registerUser(defaultEmail);
        let map: Record<string, RegisteredUserInfo> = {};
        try {
            const raw = localStorage.getItem(USER_INFO_KEY);
            if (raw) map = JSON.parse(raw);
        } catch {
            // ignore
        }
        if (!map[defaultEmail]) {
            map[defaultEmail] = {
                email: defaultEmail,
                firstName: 'Admin',
                lastName: 'Roamana',
                name: 'Admin Roamana',
                password: defaultPassword,
            };
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(map));
        }
    },

    getTripUsers: (): TripUser[] => {
        try {
            const raw = localStorage.getItem(TRIP_USERS_KEY);
            if (!raw) {
                localStorage.setItem(TRIP_USERS_KEY, JSON.stringify(defaultTripUsers));
                return defaultTripUsers;
            }
            const list = JSON.parse(raw) as TripUser[];
            if (list.length === 0) {
                localStorage.setItem(TRIP_USERS_KEY, JSON.stringify(defaultTripUsers));
                return defaultTripUsers;
            }
            return list;
        } catch {
            return defaultTripUsers;
        }
    },

    addTripUser: (user: Omit<TripUser, 'id'>): TripUser => {
        const newUser: TripUser = {
            ...user,
            id: Date.now().toString(),
        };
        const list = storage.getTripUsers();
        list.push(newUser);
        localStorage.setItem(TRIP_USERS_KEY, JSON.stringify(list));
        return newUser;
    },

    updateTripUser: (id: string, partial: Partial<TripUser>): void => {
        const list = storage.getTripUsers();
        const idx = list.findIndex(u => u.id === id);
        if (idx === -1) return;
        list[idx] = { ...list[idx], ...partial };
        localStorage.setItem(TRIP_USERS_KEY, JSON.stringify(list));
    },

    deleteTripUser: (id: string): void => {
        const list = storage.getTripUsers().filter(u => u.id !== id);
        localStorage.setItem(TRIP_USERS_KEY, JSON.stringify(list));
    },

    /** Forgot password: request OTP for a registered email. OTP is stored with expiry; returns otp for dev display (remove in production). */
    requestPasswordResetOtp(email: string): { success: boolean; otp?: string; error?: string } {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return { success: false, error: 'Please enter your email.' };
        }
        const users = storage.getRegisteredUsers();
        if (!users.includes(normalizedEmail)) {
            return { success: false, error: 'No account found for this email.' };
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const payload = { code, expiresAt: Date.now() + OTP_EXPIRY_MS };
        try {
            localStorage.setItem(OTP_KEY_PREFIX + normalizedEmail, JSON.stringify(payload));
        } catch (e) {
            console.error('Error storing OTP', e);
            return { success: false, error: 'Could not send OTP. Please try again.' };
        }
        return { success: true, otp: code };
    },

    /** Forgot password: verify OTP only (no password change, OTP left for later reset). */
    verifyOtp(email: string, otp: string): { success: boolean; error?: string } {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !otp.trim()) {
            return { success: false, error: 'Email and OTP are required.' };
        }
        let stored: { code: string; expiresAt: number };
        try {
            const raw = localStorage.getItem(OTP_KEY_PREFIX + normalizedEmail);
            if (!raw) {
                return { success: false, error: 'OTP expired or invalid. Please request a new one.' };
            }
            stored = JSON.parse(raw);
        } catch {
            return { success: false, error: 'OTP expired or invalid. Please request a new one.' };
        }
        if (Date.now() > stored.expiresAt) {
            return { success: false, error: 'OTP has expired. Please request a new one.' };
        }
        if (stored.code !== otp.trim()) {
            return { success: false, error: 'Invalid OTP.' };
        }
        return { success: true };
    },

    /** Forgot password: verify OTP and set new password. */
    verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): { success: boolean; error?: string } {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !otp.trim()) {
            return { success: false, error: 'Email and OTP are required.' };
        }
        if (newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters.' };
        }
        let stored: { code: string; expiresAt: number };
        try {
            const raw = localStorage.getItem(OTP_KEY_PREFIX + normalizedEmail);
            if (!raw) {
                return { success: false, error: 'OTP expired or invalid. Please request a new one.' };
            }
            stored = JSON.parse(raw);
        } catch {
            return { success: false, error: 'OTP expired or invalid. Please request a new one.' };
        }
        if (Date.now() > stored.expiresAt) {
            localStorage.removeItem(OTP_KEY_PREFIX + normalizedEmail);
            return { success: false, error: 'OTP has expired. Please request a new one.' };
        }
        if (stored.code !== otp.trim()) {
            return { success: false, error: 'Invalid OTP.' };
        }
        storage.updateRegisteredUserInfo(normalizedEmail, { password: newPassword });
        localStorage.removeItem(OTP_KEY_PREFIX + normalizedEmail);
        return { success: true };
    },
};
