import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// Custom Marker Icons based on status
const createBusIcon = (status, selected = false) => {
    const color = status === 'late' || status === 'delayed' ? '#ef4444' : (status === 'ontime' ? '#10b981' : '#4f46e5');
    const border = selected ? '#ffffff' : 'transparent';
    const shadow = selected ? '0 0 15px rgba(79, 70, 229, 0.5)' : 'none';

    const html = `
        <div style="
            background: ${color};
            width: ${selected ? '45px' : '35px'};
            height: ${selected ? '45px' : '35px'};
            border-radius: 12px;
            border: 2px solid ${border};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: ${shadow};
            position: relative;
            transform-origin: bottom center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ">
            <svg viewBox="0 0 24 24" width="${selected ? '22' : '18'}" height="${selected ? '22' : '18'}" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.035-2.608A1 1 0 0 0 17.006 10H15"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
            </svg>
            <div style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${color};
            "></div>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-bus-icon',
        iconSize: [selected ? 45 : 35, selected ? 45 : 35],
        iconAnchor: [selected ? 22 : 17, selected ? 45 : 35],
    });
};

const MapController = ({ selectedBus }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedBus) {
            map.flyTo([selectedBus.lat, selectedBus.lng], 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [selectedBus, map]);
    return null;
};

const MapComponent = ({ buses, selectedBus }) => {
    const { theme } = useTheme();
    const defaultPosition = [28.6139, 77.2090];

    // Map themes
    const url = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    return (
        <MapContainer
            center={defaultPosition}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={url}
            />

            <MapController selectedBus={selectedBus} />

            {buses.map((bus) => (
                <Marker
                    key={bus.bus_id}
                    position={[bus.lat, bus.lng]}
                    icon={createBusIcon(bus.status, selectedBus?.bus_id === bus.bus_id)}
                >
                    <Popup className="premium-popup">
                        <div className="p-1">
                            <h3 className="font-bold text-slate-800">{bus.vehicle_number}</h3>
                            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                <span>{bus.speed} km/h</span>
                                <span>•</span>
                                <span>{bus.status}</span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
