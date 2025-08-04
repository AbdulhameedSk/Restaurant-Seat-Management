export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'restaurant' | 'subadmin' | 'user';
  phone?: string;
  restaurant?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Restaurant {
  _id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  images: {
    url: string;
    publicId: string;
    caption: string;
  }[];
  cuisine: string[];
  priceRange: 'budget' | 'moderate' | 'expensive' | 'luxury';
  seats: Seat[];
  totalSeats: number;
  operatingHours: {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
  };
  amenities: string[];
  rating: {
    average: number;
    count: number;
  };
  isActive: boolean;
  owner: string;
  subAdmins: string[];
  layout: {
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Seat {
  _id: string;
  seatNumber: string;
  seatType: 'table-2' | 'table-4' | 'table-6' | 'bar' | 'counter';
  isAvailable: boolean;
  position: {
    x: number;
    y: number;
  };
}

export interface Booking {
  _id: string;
  bookingId: string;
  user: User;
  restaurant: Restaurant;
  seatNumber: string;
  seatType: string;
  partySize: number;
  bookingDate: Date;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no-show';
  arrivalDeadline: Date;
  actualArrivalTime?: Date;
  verified: boolean;
  verifiedBy?: string;
  verificationTime?: Date;
  specialRequests?: string;
  contactPhone: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  cancelReason?: string;
  notes?: string;
  isWalkIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  registerRestaurantOwner: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  token?: string;
  user?: User;
}

export interface SocketContextType {
  socket: any;
  onlineUsers: string[];
  joinRestaurant: (restaurantId: string) => void;
  leaveRestaurant: (restaurantId: string) => void;
} 