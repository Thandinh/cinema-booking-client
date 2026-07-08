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
  startTime: string;
  endTime: string;
  basePrice?: number;
  status: string;
}

export interface SeatMapItem {
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'NORMAL' | 'VIP' | 'COUPLE';
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED';
  rowIndex: number;
  colIndex: number;
  price: number;          // Giá đã tính sẵn = basePrice * priceMultiplier
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
  priceAtBooking: number;
}

export interface BookingResponse {
  id: string;
  secureToken: string;
  status: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startTime: string;
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
