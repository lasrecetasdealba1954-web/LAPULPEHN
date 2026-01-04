import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { authApi } from '../lib/api';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToPush, requestNotificationPermission } from '../lib/serviceWorker';
import { notificationApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  userType: 'CUSTOMER' | 'PULPERIA';
  pulperia?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (userType?: 'CUSTOMER' | 'PULPERIA') => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  updateUser: (data: Partial<User>) => void;
  setupNotifications: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,

      login: async (userType) => {
        try {
          set({ isLoading: true, error: null });

          const firebaseUser = await signInWithGoogle();
          const idToken = await firebaseUser.getIdToken();

          const { data } = await authApi.login(idToken, userType);

          set({ user: data.user, isLoading: false });

          // Setup notifications after login
          get().setupNotifications();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await logOut();
          set({ user: null });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      checkAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const { data } = await authApi.getMe();
              set({ user: data, isLoading: false });

              // Setup notifications
              get().setupNotifications();
            } catch {
              set({ user: null, isLoading: false });
            }
          } else {
            set({ user: null, isLoading: false });
          }
        });
      },

      updateUser: (data) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      setupNotifications: async () => {
        try {
          const hasPermission = await requestNotificationPermission();
          if (!hasPermission) return;

          const subscription = await subscribeToPush();
          if (subscription) {
            const json = subscription.toJSON();
            await notificationApi.subscribe({
              endpoint: json.endpoint!,
              keys: {
                p256dh: json.keys!.p256dh,
                auth: json.keys!.auth,
              },
            });
          }
        } catch (error) {
          console.error('Failed to setup notifications:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
