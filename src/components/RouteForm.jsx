import { useState, useEffect } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { Plus, Trash, MapPin, Calendar } from 'lucide-react';

const RouteForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        route_id: '',
        route_name: '',
        start_point: '',
        end_point: '',
        stops: []
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                stops: initialData.stops || []
            });
        } else {
            setFormData(prev => ({ ...prev, route_id: 'AUTO-GENERATE' }));
        }
    }, [initialData]);

    const handleAddStop = () => {
        setFormData({
            ...formData,
            stops: [...formData.stops, {
                stop_name: '',
                latitude: 0,
                longitude: 0,
                expected_time: '',
                stop_order: formData.stops.length + 1
            }]
        });
    };

    const handleRemoveStop = (index) => {
        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData({ ...formData, stops: newStops });
    };

    const handleStopChange = (index, field, value) => {
        const newStops = [...formData.stops];
        newStops[index][field] = value;
        setFormData({ ...formData, stops: newStops });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.route_name || !formData.start_point || !formData.end_point) {
            alert('Please fill in Route Name, Starting Point, and Ending Point.');
            return;
        }

        const validStops = formData.stops.filter(s => s.stop_name && s.stop_name.trim() !== '');
        if (validStops.length === 0) {
            alert('At least one valid stop is required.');
            return;
        }

        const submissionData = {
            ...formData,
            stops: validStops.map((s, idx) => ({ ...s, stop_order: idx + 1 }))
        };

        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Route ID"
                    required
                    disabled={!initialData}
                    value={formData.route_id}
                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                    placeholder="Auto-generated (RT-2026-001)"
                    className={!initialData ? "bg-slate-50 opacity-70" : ""}
                />
                <Input
                    label="Route Name"
                    required
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                    placeholder="e.g. North Delhi Express"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Starting Point"
                    required
                    value={formData.start_point}
                    onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
                    placeholder="e.g. Rohini Sec-3"
                />
                <Input
                    label="Ending Point"
                    required
                    value={formData.end_point}
                    onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
                    placeholder="e.g. School Main Gate"
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center">
                        <MapPin size={16} className="mr-2 text-primary" />
                        Stops & Waypoints
                    </h4>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddStop} className="text-primary hover:bg-primary/5">
                        <Plus size={16} className="mr-1" /> Add Stop
                    </Button>
                </div>

                <div className="space-y-3">
                    {formData.stops.map((stop, index) => (
                        <div key={index} className="bg-slate-50 p-5 rounded-2xl relative group animate-in fade-in slide-in-from-top-2 duration-300 border border-slate-100/50">
                            <button
                                type="button"
                                onClick={() => handleRemoveStop(index)}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-md text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 hover:bg-red-50"
                            >
                                <Trash size={14} />
                            </button>
                            <div className="grid grid-cols-12 gap-4 items-end">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block flex items-center uppercase tracking-wider">
                                        <MapPin size={10} className="mr-1.5" /> Stop Name
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field !py-2.5 !text-[13px]"
                                        value={stop.stop_name}
                                        onChange={(e) => handleStopChange(index, 'stop_name', e.target.value)}
                                        placeholder="e.g. Sector 14 Cross"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block flex items-center uppercase tracking-wider">
                                        <Calendar size={10} className="mr-1.5" /> Arrival
                                    </label>
                                    <input
                                        type="time"
                                        className="input-field !py-2.5 !text-[13px] font-semibold"
                                        value={stop.expected_time || ''}
                                        onChange={(e) => handleStopChange(index, 'expected_time', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Lat</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="input-field !py-2.5 !text-[12px] !px-2"
                                        value={stop.latitude}
                                        onChange={(e) => handleStopChange(index, 'latitude', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Lng</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="input-field !py-2.5 !text-[12px] !px-2"
                                        value={stop.longitude}
                                        onChange={(e) => handleStopChange(index, 'longitude', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {formData.stops.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                            No stops added yet. Click 'Add Stop' to begin.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>{initialData ? 'Update Route' : 'Create Route'}</Button>
            </div>
        </form>
    );
};

export default RouteForm;
