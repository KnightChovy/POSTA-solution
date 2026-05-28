export interface Post {
  _id?: string;
  title: string;
  content: string;
  totalSatellites?: number;
  postedSatellites?: string[];
  errorSatellites?: string[];
  successfulRate?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<response | undefined>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}
