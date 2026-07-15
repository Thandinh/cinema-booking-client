import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, CalendarDays, Loader2, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cinemaApi, type CinemaMapItem } from '../../api/cinemaApi';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const CinemaMapPage = () => {
  const [searchParams] = useSearchParams();
  const requestedCinemaId = searchParams.get('cinemaId');
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [cinemas, setCinemas] = useState<CinemaMapItem[]>([]);
  const [selected, setSelected] = useState<CinemaMapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCinemas = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return cinemas;
    return cinemas.filter(cinema =>
      [cinema.name, cinema.address, cinema.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [cinemas, search]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([10.776889, 106.700806], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    cinemaApi.getMapData()
      .then(response => {
        const data = response.data.result ?? [];
        setCinemas(data);
        const requestedCinema = requestedCinemaId
          ? data.find(cinema => cinema.id === requestedCinemaId)
          : null;
        setSelected(requestedCinema ?? data[0] ?? null);

        if (!mapRef.current) return;

        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        data.forEach(cinema => {
          if (!cinema.latitude || !cinema.longitude) return;

          const customIcon = L.divIcon({
            html: '<div style="background:#0f172a;border:2px solid #fff;border-radius:999px;width:18px;height:18px;box-shadow:0 8px 18px rgba(15,23,42,.22)"></div>',
            className: '',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          const marker = L.marker([cinema.latitude, cinema.longitude], { icon: customIcon })
            .addTo(mapRef.current!)
            .bindPopup(`
              <div style="min-width:190px">
                <div style="font-weight:800;color:#111827;font-size:14px">${cinema.name}</div>
                <div style="color:#475569;font-size:12px;margin-top:5px;line-height:1.45">${cinema.address || ''}</div>
                <div style="color:#475569;font-weight:700;font-size:12px;margin-top:5px">${cinema.city || ''}</div>
              </div>
            `);

          marker.on('click', () => setSelected(cinema));
          markersRef.current[cinema.id] = marker;
        });

        const validPoints = data.filter(item => item.latitude && item.longitude);
        if (requestedCinema?.latitude && requestedCinema.longitude) {
          mapRef.current.flyTo([requestedCinema.latitude, requestedCinema.longitude], 15, { duration: 0.8 });
          markersRef.current[requestedCinema.id]?.openPopup();
        } else if (validPoints.length > 1) {
          const bounds = L.latLngBounds(validPoints.map(item => [item.latitude, item.longitude]));
          mapRef.current.fitBounds(bounds, { padding: [36, 36] });
        }
      })
      .finally(() => setLoading(false));
  }, [requestedCinemaId]);

  const flyTo = (cinema: CinemaMapItem) => {
    setSelected(cinema);
    if (mapRef.current && cinema.latitude && cinema.longitude) {
      mapRef.current.flyTo([cinema.latitude, cinema.longitude], 15, { duration: 0.8 });
      markersRef.current[cinema.id]?.openPopup();
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.flyTo([latitude, longitude], 14, { duration: 0.8 });
        L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#10b981',
          color: '#ecfdf5',
          fillOpacity: 0.9,
          weight: 3,
        })
          .addTo(mapRef.current!)
          .bindPopup('Vị trí của bạn')
          .openPopup();

        cinemaApi.getNearest(latitude, longitude, 3).then(response => {
          const nearest = response.data.result ?? [];
          if (nearest.length > 0) setSelected(nearest[0]);
        });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  return (
    <>
      <Helmet>
        <title>Rạp chiếu - Cinema Booking</title>
      </Helmet>

      <div className="page-container py-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="badge-brand w-fit">
              <MapPin size={14} />
              Rạp chiếu
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Tìm rạp và xem lịch chiếu
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 cinema-muted">
              Chọn rạp trên bản đồ hoặc danh sách để xem các suất chiếu đang mở bán.
            </p>
          </div>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="btn-primary"
          >
            {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
            Gần tôi
          </button>
        </div>

        <div className="grid min-h-[650px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 lg:grid-cols-[360px_1fr]">
          <aside className="flex min-h-[360px] flex-col border-b border-slate-200 dark:border-white/10 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-4 dark:border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Tìm rạp hoặc địa chỉ..."
                  className="cinema-input pl-10"
                />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
                {loading ? 'Đang tải...' : `${filteredCinemas.length} rạp chiếu`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(item => (
                    <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-neutral-800" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCinemas.map(cinema => (
                    <button
                      key={cinema.id}
                      type="button"
                      onClick={() => flyTo(cinema)}
                      className={`w-full rounded-lg p-4 text-left transition-colors ${
                        selected?.id === cinema.id
                          ? 'bg-slate-100 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          <Building2 size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
                            {cinema.name}
                          </span>
                          <span className="mt-1 line-clamp-2 text-xs leading-5 cinema-muted">
                            {cinema.address}
                          </span>
                          <span className="mt-1 block text-xs font-black text-slate-500 dark:text-neutral-500">
                            {cinema.city}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="relative min-h-[420px]">
            <div ref={mapContainerRef} className="h-full min-h-[420px] w-full" />
            {selected && (
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur dark:bg-neutral-950/95 dark:ring-white/10 sm:left-auto sm:w-96">
                <p className="font-black text-slate-950 dark:text-white">{selected.name}</p>
                <p className="mt-1 text-sm leading-6 cinema-muted">{selected.address}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link to={`/cinemas/${selected.id}`} className="btn-primary">
                    <CalendarDays size={16} />
                    Lịch chiếu
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Navigation size={16} />
                    Chỉ đường
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CinemaMapPage;
