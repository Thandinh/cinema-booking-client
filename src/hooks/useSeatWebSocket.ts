import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';

// ──────────────────────────────────────────────────────────────────────────────
// Types khớp 100% với SeatStatusEvent.java của Spring Boot backend
// ──────────────────────────────────────────────────────────────────────────────
export type WsSeatStatus = 'AVAILABLE' | 'HOLD' | 'BOOKED';

export interface SeatStatusEvent {
  showtimeId: string;
  seatId: string;
  status: WsSeatStatus;
  heldByUserId?: string;   // chỉ có khi status = HOLD
  holdUntil?: string;      // ISO datetime, chỉ có khi status = HOLD
  eventTime: string;       // ISO datetime server phát event
}

interface Options {
  /** ID suất chiếu để subscribe đúng topic */
  showtimeId: string | undefined;
  /** Callback nhận event khi ghế thay đổi trạng thái */
  onSeatUpdate: (event: SeatStatusEvent) => void;
  /** ID user hiện tại — để phân biệt ghế mình giữ vs ghế người khác giữ */
  currentUserId?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Xây dựng WebSocket URL theo protocol (ws:// hoặc wss://)
// Backend expose endpoint native WS tại /ws-native (không dùng SockJS)
// Vite proxy '/ws-native' → 'http://localhost:8080' với ws: true
// ──────────────────────────────────────────────────────────────────────────────
function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws-native`;
}

/**
 * Hook quản lý kết nối WebSocket STOMP tới Spring Boot.
 *
 * - Dùng native WebSocket (không cần sockjs-client), tương thích mọi browser hiện đại
 * - Tự reconnect với reconnectDelay sau khi mất kết nối
 * - Tự cleanup khi component unmount hoặc showtimeId thay đổi
 * - Không re-render component — mọi update đều qua callback
 *
 * @example
 * useSeatWebSocket({
 *   showtimeId,
 *   onSeatUpdate: (evt) => setSeatMap(prev => updateSeat(prev, evt)),
 *   currentUserId: user?.id,
 * });
 */
export function useSeatWebSocket({ showtimeId, onSeatUpdate, currentUserId }: Options) {
  const clientRef = useRef<Client | null>(null);

  // Stable reference cho callback — tránh re-subscribe khi hàm thay đổi reference
  const callbackRef = useRef(onSeatUpdate);
  callbackRef.current = onSeatUpdate;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Connection status — dùng ref để tránh trigger re-render không cần thiết
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!showtimeId) return;

    const client = new Client({
      // Native WebSocket — không cần sockjs-client, không bị lỗi `global is not defined`
      brokerURL: buildWsUrl(),

      // Tự reconnect sau 3 giây nếu mất kết nối
      reconnectDelay: 3000,

      onConnect: () => {
        isConnectedRef.current = true;

        // Subscribe đúng topic của suất chiếu này
        client.subscribe(`/topic/seatmap/${showtimeId}`, (message: IMessage) => {
          try {
            const event: SeatStatusEvent = JSON.parse(message.body);
            callbackRef.current(event);
          } catch (err) {
            console.error('[WS] Failed to parse seat event:', err);
          }
        });
      },

      onDisconnect: () => {
        isConnectedRef.current = false;
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
        isConnectedRef.current = false;
      },

      onWebSocketError: (event) => {
        console.warn('[WS] WebSocket error — sẽ thử kết nối lại sau 3s', event);
        isConnectedRef.current = false;
      },
    });

    client.activate();
    clientRef.current = client;
  }, [showtimeId]);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      clientRef.current = null;
      isConnectedRef.current = false;
    };
  }, [connect]);

  return { isConnectedRef };
}
