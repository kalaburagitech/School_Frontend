import React, { useState, useEffect } from "react";
import {
    Zap,
    MapPin,
    Phone,
    AlertTriangle,
    Clock,
    Navigation,
    AlertCircle,
    Truck,
    Map as MapIcon,
    ChevronRight,
    Circle,
    CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { socket } from '../context/AuthContext';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

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
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

// Custom Stop Icon
const stopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448400.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

export default function LiveTracking() {
    const { theme } = useTheme();
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [busLocations, setBusLocations] = useState({});
    const [loading, setLoading] = useState(true);
    const [showRoute, setShowRoute] = useState(false);

    useEffect(() => {
        fetchBuses();

        socket.on('locationReceived', (data) => {
            setBusLocations(prev => ({
                ...prev,
                [data.busId]: {
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
            if (data.length > 0) {
                setSelectedBus(data[0]);
            }

            // Join rooms for all buses
            data.forEach(bus => {
                socket.emit('joinBusRoom', bus._id);

                // Initial tracking data from API
                if (bus.tracking) {
                    setBusLocations(prev => ({
                        ...prev,
                        [bus._id]: {
                            lat: bus.tracking.current_latitude,
                            lng: bus.tracking.current_longitude,
                            speed: bus.tracking.current_speed,
                            timestamp: bus.tracking.last_updated
                        }
                    }));
                }
            });

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch buses', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "On Route":
            case "In Transit":
                return "bg-blue-100 text-blue-800";
            case "Active":
            case "At School":
                return "bg-green-100 text-green-800";
            case "Maintenance":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "On Route":
            case "In Transit":
                return <Navigation className="w-4 h-4" />;
            case "Active":
            case "At School":
                return <MapPin className="w-4 h-4" />;
            case "Maintenance":
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Zap className="w-4 h-4" />;
        }
    };

    const handleSimulateUpdate = () => {
        if (selectedBus) {
            socket.emit('updateLocation', {
                busId: selectedBus._id,
                latitude: 12.9716 + (Math.random() * 0.01),
                longitude: 77.5946 + (Math.random() * 0.01),
                speed: Math.floor(Math.random() * 60)
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground animate-pulse text-lg">Loading Live Tracking Data...</p>
            </div>
        );
    }

    const selectedLoc = selectedBus ? busLocations[selectedBus._id] : null;
    const mapCenter = selectedLoc ? [selectedLoc.lat, selectedLoc.lng] : [12.9716, 77.5946];
    const routePolyline = selectedBus?.route_id?.stops?.map(s => [s.latitude, s.longitude]) || [];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Bus Tracking</h1>
                    <p className="text-muted-foreground mt-2">
                        Real-time GPS tracking for school buses
                    </p>
                </div>
                <button
                    onClick={handleSimulateUpdate}
                    className="text-xs px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground border border-border transition-all flex items-center gap-2"
                >
                    <Zap size={14} className="text-amber-500" />
                    Simulate Movement (Dev)
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Bus List */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Active Fleet</h2>
                    <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {buses.map((bus) => (
                            <div
                                key={bus._id}
                                onClick={() => { setSelectedBus(bus); setShowRoute(false); }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${selectedBus?._id === bus._id
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-[1.02]"
                                        : "border-border hover:border-primary/30 bg-card hover:translate-x-1"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg uppercase tracking-tight">
                                            {bus.vehicle_number}
                                        </h3>
                                        <p className="text-xs text-muted-foreground italic">
                                            {bus.route_id?.route_name || 'No route assigned'}
                                        </p>
                                    </div>
                                    <Badge className={clsx("shadow-sm", getStatusColor(bus.status))}>
                                        {getStatusIcon(bus.status)}
                                        <span className="ml-1.5">{bus.status}</span>
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Truck size={14} className="text-slate-400" />
                                        {bus.current_occupancy || 0}/{bus.total_capacity} Students
                                    </span>
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        {busLocations[bus._id] ? (
                                            <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live
                                            </>
                                        ) : (
                                            <span className="opacity-50 italic">Offline</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map and Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Live Map */}
                    <Card className="overflow-hidden shadow-premium">
                        <CardHeader className="bg-muted/10 border-b border-border/50">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapIcon className="w-4 h-4 text-primary" />
                                    Live Map View
                                </div>
                                {selectedBus && (
                                    <button
                                        onClick={() => setShowRoute(!showRoute)}
                                        className={clsx(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all",
                                            showRoute ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {showRoute ? "Hide Route" : "Show Route"}
                                    </button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="w-full h-96 relative z-0">
                                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url={theme === 'dark'
                                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        }
                                    />

                                    {/* Route Polyline */}
                                    {showRoute && routePolyline.length > 0 && (
                                        <>
                                            <Polyline positions={routePolyline} color="#6366f1" weight={4} opacity={0.6} dashArray="10, 10" />
                                            {selectedBus.route_id.stops.map((stop, idx) => (
                                                <Marker
                                                    key={`stop-${idx}`}
                                                    position={[stop.latitude, stop.longitude]}
                                                    icon={stopIcon}
                                                >
                                                    <Popup>
                                                        <div className="text-xs">
                                                            <p className="font-bold text-indigo-600">{stop.stop_name}</p>
                                                            <p className="text-slate-400 mt-1">Stop Order: {stop.stop_order}</p>
                                                            <p className="text-slate-400 italic">Expected: {stop.expected_time}</p>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            ))}
                                        </>
                                    )}

                                    {/* Bus Markers */}
                                    {buses.map(bus => {
                                        const loc = busLocations[bus._id];
                                        if (!loc) return null;

                                        return (
                                            <Marker
                                                key={bus._id}
                                                position={[loc.lat, loc.lng]}
                                                icon={busIcon}
                                            >
                                                <Popup>
                                                    <div className="p-1">
                                                        <h3 className="font-bold text-sm">{bus.vehicle_number}</h3>
                                                        <p className="text-xs text-slate-500">{bus.route_id?.route_name}</p>
                                                        <p className="text-[10px] mt-1 text-slate-400">
                                                            Updated: {new Date(loc.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </MapContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Bus Details */}
                    {selectedBus && (
                        <Card className="shadow-premium transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black tracking-tight">{selectedBus.vehicle_number}</span>
                                            <span className="text-xs text-muted-foreground font-medium italic -mt-1">{selectedBus.route_id?.route_name}</span>
                                        </div>
                                        <Badge className={clsx("ml-2 shadow-sm", getStatusColor(selectedBus.status))}>
                                            {selectedBus.status}
                                        </Badge>
                                    </CardTitle>
                                    <button
                                        className="h-10 px-6 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                                        onClick={() => setShowRoute(!showRoute)}
                                    >
                                        <Navigation size={16} />
                                        View Route
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Driver Info */}
                                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
                                        Operator Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Full Name</span>
                                            <span className="font-bold text-foreground">
                                                {selectedBus.driver_id?.full_name || 'Not assigned'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 border-t border-border/50 pt-4 mt-4">
                                            <span className="text-sm font-medium text-slate-500 flex-1">Phone Number</span>
                                            {selectedBus.driver_id?.phone && (
                                                <a
                                                    href={`tel:${selectedBus.driver_id.phone}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition text-sm font-bold shadow-md shadow-emerald-500/20"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    Call Manager
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            Live Coordinates
                                        </p>
                                        <p className="text-lg font-black text-foreground font-mono tabular-nums">
                                            {selectedLoc ? `${selectedLoc.lat.toFixed(6)}, ${selectedLoc.lng.toFixed(6)}` : "Position Unknown"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-primary font-bold">
                                            <MapPin size={12} />
                                            {selectedBus.route_id?.start_point} <ChevronRight size={10} /> {selectedBus.route_id?.end_point}
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            Velocity
                                        </p>
                                        <p className="text-lg font-black text-foreground">
                                            {selectedLoc ? `${selectedLoc.speed} KM/H` : "0 KM/H"}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Clock className="w-3 h-3 text-primary" />
                                            TS: {selectedLoc ? new Date(selectedLoc.timestamp).toLocaleTimeString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            Passenger Occupancy
                                        </p>
                                        <div className="flex items-end justify-between mb-2">
                                            <p className="text-lg font-black text-foreground">
                                                {selectedBus.current_occupancy || 0}/{selectedBus.total_capacity} Students
                                            </p>
                                            <span className="text-[10px] font-black text-primary">
                                                {Math.round(((selectedBus.current_occupancy || 0) / selectedBus.total_capacity) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/20">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${((selectedBus.current_occupancy || 0) / selectedBus.total_capacity) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            Fleet Asset ID
                                        </p>
                                        <p className="text-lg font-black text-foreground uppercase tracking-widest">
                                            {selectedBus.bus_id}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
                                            <Badge variant="outline" className="text-[9px] uppercase border-slate-200">{selectedBus.model || 'V-Classic'}</Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Stops List */}
                                {selectedBus.route_id?.stops?.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Navigation size={14} className="text-primary" />
                                            Stops & Estimated Schedule
                                        </h3>
                                        <div className="space-y-0 pl-1 border-l-2 border-indigo-100 dark:border-white/5 ml-3">
                                            {selectedBus.route_id.stops.sort((a, b) => a.stop_order - b.stop_order).map((stop, idx) => (
                                                <div key={idx} className="relative pb-6 last:pb-0 pl-8 group">
                                                    <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary shadow-sm z-10 group-hover:scale-125 transition-transform" />
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 p-4 bg-muted/20 hover:bg-primary/5 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{idx === 0 ? "Start" : idx === selectedBus.route_id.stops.length - 1 ? "End" : `Stop ${stop.stop_order}`}</span>
                                                                <p className="text-sm font-black text-foreground">{stop.stop_name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                <span className="flex items-center gap-1"><Clock size={10} /> ETA: {stop.expected_time}</span>
                                                                <span className="flex items-center gap-1"><MapPin size={10} /> {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</span>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 mt-2 md:mt-0 flex items-center gap-1.5">
                                                            <CheckCircle2 size={10} /> Active
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* All Buses Summary */}
            <Card className="shadow-premium">
                <CardHeader className="bg-muted/10">
                    <CardTitle className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-primary" />
                        Master Fleet Inventory
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Fleet #</th>
                                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Assigned Route</th>
                                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Current Status</th>
                                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Velocity</th>
                                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Current Occupancy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {buses.map((bus) => {
                                    const loc = busLocations[bus._id];
                                    return (
                                        <tr
                                            key={bus._id}
                                            className="hover:bg-primary/5 transition-all cursor-pointer group"
                                            onClick={() => { setSelectedBus(bus); setShowRoute(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        >
                                            <td className="py-5 px-6 font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {bus.vehicle_number}
                                            </td>
                                            <td className="py-5 px-6 text-slate-500 font-medium">
                                                {bus.route_id?.route_name || 'NOT ASSIGNED'}
                                            </td>
                                            <td className="py-5 px-6">
                                                <Badge className={clsx("shadow-sm", getStatusColor(bus.status))}>
                                                    {bus.status}
                                                </Badge>
                                            </td>
                                            <td className="py-5 px-6 text-slate-900 dark:text-slate-100 font-mono font-bold">
                                                {loc ? `${loc.speed} KM/H` : '---'}
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                        <span>{bus.current_occupancy || 0} SEATS USED</span>
                                                        <span>{bus.total_capacity} TOTAL</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${((bus.current_occupancy || 0) / bus.total_capacity) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
