export type MovieStatus = 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';

export interface Movie {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
  trailerUrl?: string;
  status: MovieStatus;
  director?: string;
  actors?: string;
  language?: string;
  subtitleLanguage?: string;
  country?: string;
  ageRating?: string;
  ratingImdb?: number;
}

export interface Cinema {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface Room {
  id: string;
  cinemaId: string;
  cinemaName: string;
  name: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl?: string;
  roomId: string;
  roomName: string;
  cinemaId: string;
  cinemaName: string;
  cinemaAddress?: string;
  cinemaCity?: string;
  startTime: string;
  endTime: string;
  basePrice?: number;
  status: string;
}

export interface SeatMapItem {
  seatStatusId?: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'NORMAL' | 'VIP' | 'COUPLE';
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED';
  rowIndex: number;
  colIndex: number;
  price: number;
  priceMultiplier?: number;
}

export interface HoldSeatRequest {
  showtimeId: string;
  seatIds: string[];
}

export interface HoldSeatResponse {
  showtimeId: string;
  heldSeatIds: string[];
  holdUntil: string;
  estimatedTotalPrice: number;
  message: string;
}

export interface CreateBookingRequest {
  showtimeId: string;
  seatIds: string[];
  promotionCode?: string;
}

export interface BookingDetailResponse {
  id: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType?: 'NORMAL' | 'VIP' | 'COUPLE';
  priceAtBooking: number;
  ticketId?: string;
  ticketStatus?: TicketStatus;
  ticketCheckInTime?: string;
  ticketQrCode?: string;
  ticketQrImage?: string;
}

export interface BookingResponse {
  id: string;
  secureToken: string;
  status: string;
  customerId?: string;
  customerUsername?: string;
  customerName?: string;
  customerEmail?: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  cinemaAddress?: string;
  cinemaCity?: string;
  roomName: string;
  startTime: string;
  paymentExpiresAt?: string;
  totalPrice: number;
  discountAmount: number;
  promotionCode?: string;
  bookingDetails: BookingDetailResponse[];
  createdAt: string;
}

export interface PaymentInitiateRequest {
  bookingId: string;
  method: 'VNPAY' | 'MOMO' | 'CREDIT_CARD';
  amount: number;
}

// ── Ticket ────────────────────────────────────────────────────
export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED';

export interface TicketResponse {
  id: string;
  qrCode: string;
  qrImage?: string;
  status: TicketStatus;
  checkInTime?: string;
  createdAt: string;
  bookingDetailId: string;
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;
  startTime?: string;
  rowLabel?: string;
  seatNumber?: number;
}

// ── User Profile ───────────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  dob?: string;
  isActive: boolean;
  roles?: string[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  avatarUrl?: string;
}

// ── Analytics ─────────────────────────────────────────────────
export interface DashboardSummaryResponse {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalMovies: number;
  totalTickets: number;
  totalShowtimes: number;
  pendingBookings: number;
  expiredBookings?: number;
  upcomingShowtimes: number;
}

export interface RevenueByPeriodResponse {
  period: string;
  revenue: number;
  bookingCount: number;
  totalBookings?: number;
  totalTickets?: number;
}

export interface TopMovieRevenueResponse {
  movieId: string;
  movieTitle: string;
  title?: string;
  posterUrl?: string;
  totalRevenue: number;
  revenue?: number;
  totalBookings: number;
  totalTicketsSold?: number;
}

export interface ShowtimeStatsResponse {
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startTime: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyRate: number;
  revenue: number;
}
