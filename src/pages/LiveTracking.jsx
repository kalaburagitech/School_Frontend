import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { Truck, Navigation, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { socket } from '../context/AuthContext';

// Fix Leaflet marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom Bus Icon
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Replace with local asset if available
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

const LiveTracking = () => {
    const { theme } = useTheme();
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [busLocations, setBusLocations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBuses();

        // Listen for updates
        socket.on('locationReceived', (data) => {
            setBusLocations(prev => ({
                ...prev,
                [data.busId]: { // Note: Backend needs to send busId in the payload if room logic is generic
                    lat: data.latitude,
                    lng: data.longitude,
                    speed: data.speed,
                    timestamp: data.timestamp
                }
            }));
        });

        return () => {
            socket.off('locationReceived');
        };
    }, []);

    const fetchBuses = async () => {
        try {
            const { data } = await api.get('/buses');
            setBuses(data);

            // Join rooms for all buses (Admin view)
            data.forEach(bus => {
                socket.emit('joinBusRoom', bus._id);
            });

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch buses', error);
            setLoading(false);
        }
    };

    // Center map on selected bus or default to School Location (Bangalore demo coords)
    const mapCenter = selectedBus && busLocations[selectedBus._id]
        ? [busLocations[selectedBus._id].lat, busLocations[selectedBus._id].lng]
        : [12.9716, 77.5946];

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
            {/* Sidebar Bus List */}
            <div className={clsx(
                "w-full md:w-80 rounded-2xl border p-4 flex flex-col gap-4 overflow-y-auto",
                theme === 'dark' ? "bg-slate-800/50 border-white/5" : "bg-white border-slate-200"
            )}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="text-blue-500" />
                    Live Fleet
                </h2>

                {loading ? (
                    <div className="text-center py-4">Loading fleet...</div>
                ) : (
                    buses.map(bus => (
                        <div
                            key={bus._id}
                            onClick={() => setSelectedBus(bus)}
                            className={clsx(
                                "p-4 rounded-xl border cursor-pointer transition-all",
                                selectedBus?._id === bus._id
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25"
                                    : theme === 'dark'
                                        ? "bg-slate-700/50 border-white/5 hover:bg-slate-700"
                                        : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">{bus.vehicle_number}</h3>
                                {busLocations[bus._id] ? (
                                    <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Option Live
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400">Offline</span>
                                )}
                            </div>
                            <div className={clsx("text-sm", selectedBus?._id === bus._id ? "text-blue-100" : "text-slate-500")}>
                                {bus.route_id?.route_name || 'No Route Assigned'}
                            </div>
                            {busLocations[bus._id] && (
                                <div className="mt-3 text-xs flex gap-3 opacity-90">
                                    <span className="flex items-center gap-1">
                                        <Navigation size={12} />
                                        {busLocations[bus._id].speed || 0} km/h
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Map Area */}
            <div className={clsx(
                "flex-1 rounded-2xl border overflow-hidden relative",
                theme === 'dark' ? "border-white/5" : "border-slate-200"
            )}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={theme === 'dark'
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                    />

                    {buses.map(bus => {
                        const loc = busLocations[bus._id];
                        if (!loc) return null;

                        return (
                            <Marker
                                key={bus._id}
                                position={[loc.lat, loc.lng]}
                                icon={busIcon}
                            >
                                <Popup className="premium-popup">
                                    <div className="p-2">
                                        <h3 className="font-bold">{bus.vehicle_number}</h3>
                                        <p className="text-sm text-slate-500">{bus.route_id?.route_name}</p>
                                        <p className="text-xs mt-2 text-slate-400">
                                            Last update: {new Date(loc.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Simulation Control (For Demo) */}
                <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl z-[1000]">
                    <button
                        onClick={() => {
                            // Simulate movement for first bus
                            const bus = buses[0];
                            if (bus) {
                                socket.emit('updateLocation', {
                                    busId: bus._id,
                                    latitude: 12.9716 + (Math.random() * 0.01),
                                    longitude: 77.5946 + (Math.random() * 0.01),
                                    speed: Math.floor(Math.random() * 60)
                                });
                            }
                        }}
                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Simulate Movement
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">Dev Mode</p>
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
