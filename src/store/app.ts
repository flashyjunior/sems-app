import { create } from 'zustand';
import type {
  User,
  DispenseRecord,
  SyncStatus,
  AlertMessage,
  PatientInput,
  DoseCalculation,
} from '@/types';
import { authService } from '@/services/auth';
import { syncService } from '@/services/sync';

interface SyncConfig {
  enabled: boolean;
  intervalSeconds: number;
  lastSyncTime?: number;
  isSyncing: boolean;
  syncStats?: {
    unsyncedCount: number;
    lastSuccessfulSync?: number;
  };
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;

  // Dispense workflow
  currentPatient: PatientInput | null;
  setCurrentPatient: (patient: PatientInput) => void;
  currentDose: DoseCalculation | null;
  setCurrentDose: (dose: DoseCalculation) => void;
  clearWorkflow: () => void;

  // Sync status
  syncStatus: SyncStatus | null;
  setSyncStatus: (status: SyncStatus) => void;

  // Sync configuration
  syncConfig: SyncConfig;
  setSyncConfig: (config: Partial<SyncConfig>) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  updateSyncStats: (stats: any) => void;

  // Alerts
  alerts: AlertMessage[];
  addAlert: (alert: AlertMessage) => void;
  removeAlert: (alertId: string) => void;

  // Recent dispenses
  recentDispenses: DispenseRecord[];
  addRecentDispense: (record: DispenseRecord) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,

  login: async (username: string, pin: string) => {
    const user = await authService.login(username, pin);
    if (user) {
      set({ user, isAuthenticated: true });
    } else {
      throw new Error('Login failed');
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Dispense workflow
  currentPatient: null,
  setCurrentPatient: (patient) => set({ currentPatient: patient }),

  currentDose: null,
  setCurrentDose: (dose) => set({ currentDose: dose }),

  clearWorkflow: () =>
    set({ currentPatient: null, currentDose: null }),

  // Sync
  syncStatus: null,
  setSyncStatus: (status) => set({ syncStatus: status }),

  // Sync configuration
  syncConfig: {
    enabled: true,
    intervalSeconds: 300, // 5 minutes default
    isSyncing: false,
  },
  
  setSyncConfig: (config) =>
    set((state) => ({
      syncConfig: { ...state.syncConfig, ...config },
    })),

  setSyncInProgress: (inProgress) =>
    set((state) => ({
      syncConfig: { ...state.syncConfig, isSyncing: inProgress },
    })),

  updateSyncStats: (stats) =>
    set((state) => ({
      syncConfig: {
        ...state.syncConfig,
        syncStats: stats,
        lastSyncTime: Date.now(),
      },
    })),

  // Alerts
  alerts: [],
  addAlert: (alert) => {
    set((state) => ({
      alerts: [...state.alerts, alert],
    }));
  },

  removeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  // Recent dispenses
  recentDispenses: [],
  addRecentDispense: (record) => {
    set((state) => ({
      recentDispenses: [record, ...state.recentDispenses].slice(0, 10),
    }));
  },
}));

// Initialize sync status listener
if (typeof window !== 'undefined') {
  syncService.onStatusChange((status) => {
    useAppStore.setState({ syncStatus: status });
  });

  // Initialize with current session
  const session = authService.getSession();
  if (session?.user) {
    useAppStore.setState({ user: session.user, isAuthenticated: true });
  }
}
