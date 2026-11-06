"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type PuntoMappa = {
  slug: string;
  nome: string;
  lat: number;
  lng: number;
};

const ROMA: L.LatLngTuple = [41.8967, 12.4822];

function icona(selezionato: boolean) {
  const [w, h] = selezionato ? [40, 47] : [28, 33];
  const fill = selezionato ? "#ec8b36" : "#5f746e";
  return L.divIcon({
    className: "cir-pin",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    html: `<svg viewBox="0 0 24 28" width="${w}" height="${h}" aria-hidden="true"><path d="M12 27s-10-8.6-10-15.5a10 10 0 0 1 20 0C22 18.4 12 27 12 27Z" fill="${fill}" stroke="#fdfaf5" stroke-width="1.8"/><circle cx="12" cy="11.5" r="3.6" fill="#fdfaf5"/></svg>`,
  });
}

/**
 * Mappa OpenStreetMap delle moschee (Leaflet, nessuna chiave API).
 * Riceve solo le moschee con indirizzo pubblico. Lo zoom con la rotellina è
 * spento finché non si clicca sulla mappa, così la pagina scorre normalmente.
 */
export default function MappaMoschee({
  punti,
  selezionato,
  onSeleziona,
  visibile = true,
  etichetta,
}: {
  punti: PuntoMappa[];
  selezionato: string | null;
  onSeleziona: (slug: string) => void;
  visibile?: boolean;
  etichetta: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelRef = useRef(onSeleziona);
  useEffect(() => {
    onSelRef.current = onSeleziona;
  }, [onSeleziona]);

  // Crea la mappa una volta sola.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: ROMA,
      zoom: 11,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // Allinea i segnaposto all'elenco filtrato.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const vivi = new Set(punti.map((p) => p.slug));
    for (const [slug, m] of markers) {
      if (!vivi.has(slug)) {
        m.remove();
        markers.delete(slug);
      }
    }
    for (const p of punti) {
      if (markers.has(p.slug)) continue;
      const m = L.marker([p.lat, p.lng], {
        icon: icona(false),
        title: p.nome,
        alt: p.nome,
        keyboard: true,
      })
        .on("click", () => onSelRef.current(p.slug))
        .addTo(map);
      markers.set(p.slug, m);
    }
    if (punti.length > 0) {
      const bounds = L.latLngBounds(
        punti.map((p) => [p.lat, p.lng] as L.LatLngTuple),
      );
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [punti]);

  // Evidenzia il segnaposto scelto e lo porta in vista.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [slug, m] of markersRef.current) {
      const sel = slug === selezionato;
      m.setIcon(icona(sel));
      m.setZIndexOffset(sel ? 1000 : 0);
    }
    const m = selezionato ? markersRef.current.get(selezionato) : undefined;
    if (m) map.panTo(m.getLatLng(), { animate: true });
  }, [selezionato, punti]);

  // Quando la mappa diventa visibile (telefono), Leaflet deve rimisurarsi.
  useEffect(() => {
    if (visibile) setTimeout(() => mapRef.current?.invalidateSize(), 0);
  }, [visibile]);

  return (
    <div
      ref={elRef}
      role="region"
      aria-label={etichetta}
      className="h-full w-full"
    />
  );
}
