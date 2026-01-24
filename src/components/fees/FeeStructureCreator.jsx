import { useState } from 'react';
import {
    Plus, Trash2, Save, Copy, Layers, DollarSign,
    Calendar, Users, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import Button from '../ui/Button';
import clsx from 'clsx';
import api from '../../utils/api';

const FeeStructureCreator = ({ onClose, onSuccess }) => {
    const [structureName, setStructureName] = useState('');
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [grade, setGrade] = useState('');
    const [section, setSection] = useState('');
    const [applyTo, setApplyTo] = useState('all'); // 'all', 'selected'
    const [selectedStudents, setSelectedStudents] = useState([]);

    const [feeComponents, setFeeComponents] = useState([
        {
            id: 1,
            name: 'Tuition Fee',
            type: 'monthly',
            amount: 5000,
            dueDay: 5,
            lateFeePerDay: 50,
            concessionRules: ['sibling', 'early_bird'],
            applicableTo: 'all'
        }
    ]);

    const [oneTimeFees, setOneTimeFees] = useState([
        { id: 1, name: 'Admission Fee', amount: 15000, refundable: false },
        { id: 2, name: 'Registration Fee', amount: 5000, refundable: false },
        { id: 3, name: 'Caution Deposit', amount: 10000, refundable: true }
    ]);

    const [concessionSchemes, setConcessionSchemes] = useState([
        { id: 1, name: 'Sibling Discount', type: 'percentage', value: 10, criteria: 'has_sibling' },
        { id: 2, name: 'Early Bird Discount', type: 'percentage', value: 5, criteria: 'paid_before_1st' }
    ]);

    const [lateFeeRules, setLateFeeRules] = useState({
        gracePeriodDays: 5,
        lateFeePerDay: 50,
        maxLateFeePercentage: 20,
        actions: [
            { daysOverdue: 10, action: 'restrict_portal' },
            { daysOverdue: 15, action: 'restrict_exams' },
            { daysOverdue: 30, action: 'legal_notice' }
        ]
    });

    const [activeTab, setActiveTab] = useState('components');

    const addFeeComponent = () => {
        setFeeComponents([
            ...feeComponents,
            {
                id: Date.now(),
                name: '',
                type: 'monthly',
                amount: 0,
                dueDay: 5,
                lateFeePerDay: 0,
                concessionRules: [],
                applicableTo: 'all'
            }
        ]);
    };

    const addOneTimeFee = () => {
        setOneTimeFees([
            ...oneTimeFees,
            {
                id: Date.now(),
                name: '',
                amount: 0,
                refundable: false
            }
        ]);
    };

    const addConcessionScheme = () => {
        setConcessionSchemes([
            ...concessionSchemes,
            {
                id: Date.now(),
                name: '',
                type: 'percentage',
                value: 0,
                criteria: ''
            }
        ]);
    };

    const removeFeeComponent = (id) => {
        setFeeComponents(feeComponents.filter(comp => comp.id !== id));
    };

    const removeOneTimeFee = (id) => {
        setOneTimeFees(oneTimeFees.filter(fee => fee.id !== id));
    };

    const removeConcessionScheme = (id) => {
        setConcessionSchemes(concessionSchemes.filter(scheme => scheme.id !== id));
    };

    const updateFeeComponent = (id, field, value) => {
        setFeeComponents(feeComponents.map(comp =>
            comp.id === id ? { ...comp, [field]: value } : comp
        ));
    };

    const calculateTotal = () => {
        const monthlyTotal = feeComponents
            .filter(comp => comp.type === 'monthly')
            .reduce((sum, comp) => sum + (comp.amount * 12), 0);

        const annualTotal = feeComponents
            .filter(comp => comp.type === 'annual')
            .reduce((sum, comp) => sum + comp.amount, 0);

        const oneTimeTotal = oneTimeFees.reduce((sum, fee) => sum + fee.amount, 0);

        return monthlyTotal + annualTotal + oneTimeTotal;
    };

    const handleSubmit = async () => {
        if (!structureName || !academicYear || !grade) {
            alert('Please fill required fields');
            return;
        }

        const structureData = {
            name: structureName,
            academic_year: academicYear,
            grade,
            section,
            apply_to: applyTo,
            fee_components: feeComponents,
            one_time_fees: oneTimeFees,
            concession_schemes: concessionSchemes,
            late_fee_rules: lateFeeRules,
            total_amount: calculateTotal()
        };

        try {
            await api.post('/fees/structures/create', structureData);
            alert('Fee structure created successfully!');
            onSuccess();
        } catch (error) {
            console.error('Failed to create structure:', error);
            alert('Error creating fee structure');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold">Create Fee Structure</h3>
                    <p className="text-slate-500">Design comprehensive fee structures for classes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { }}>
                        <Copy size={16} className="mr-2" />
                        Duplicate Existing
                    </Button>
                    <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-500 to-blue-600">
                        <Save size={16} className="mr-2" />
                        Save Structure
                    </Button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Structure Name *</label>
                    <input
                        type="text"
                        value={structureName}
                        onChange={(e) => setStructureName(e.target.value)}
                        className="w-full p-3 rounded-xl border"
                        placeholder="e.g., Class 10 Fee Structure 2024-25"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Academic Year *</label>
                    <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full p-3 rounded-xl border"
                    >
                        <option value="2024-2025">2024-2025</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2025-2026">2025-2026</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium mb-2">Grade *</label>
                        <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full p-3 rounded-xl border"
                        >
                            <option value="">Select Grade</option>
                            {['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                                <option key={g} value={g}>Class {g}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Section</label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full p-3 rounded-xl border"
                        >
                            <option value="">All Sections</option>
                            {['A', 'B', 'C', 'D', 'E'].map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex space-x-4">
                    {['components', 'one-time', 'concessions', 'late-fee'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-4 py-2 border-b-2 text-sm font-medium",
                                activeTab === tab
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {tab.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fee Components */}
            {activeTab === 'components' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Monthly/Annual Fee Components</h4>
                        <Button onClick={addFeeComponent} size="sm">
                            <Plus size={16} className="mr-2" />
                            Add Component
                        </Button>
                    </div>

                    {feeComponents.map((component, index) => (
                        <div key={component.id} className="p-4 border rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Layers size={20} className="text-blue-500" />
                                    <span className="font-medium">Component {index + 1}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFeeComponent(component.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={component.name}
                                        onChange={(e) => updateFeeComponent(component.id, 'name', e.target.value)}
                                        className="w-full p-2 rounded-lg border"
                                        placeholder="e.g., Tuition Fee"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select
                                        value={component.type}
                                        onChange={(e) => updateFeeComponent(component.id, 'type', e.target.value)}
                                        className="w-full p-2 rounded-lg border"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annual">Annual</option>
                                        <option value="term">Term-wise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={component.amount}
                                        onChange={(e) => updateFeeComponent(component.id, 'amount', e.target.value)}
                                        className="w-full p-2 rounded-lg border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Due Day</label>
                                    <input
                                        type="number"
                                        value={component.dueDay}
                                        onChange={(e) => updateFeeComponent(component.id, 'dueDay', e.target.value)}
                                        className="w-full p-2 rounded-lg border"
                                        min="1"
                                        max="31"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* One-time Fees */}
            {activeTab === 'one-time' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">One-time Fees</h4>
                        <Button onClick={addOneTimeFee} size="sm">
                            <Plus size={16} className="mr-2" />
                            Add Fee
                        </Button>
                    </div>

                    {oneTimeFees.map((fee, index) => (
                        <div key={fee.id} className="p-4 border rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <DollarSign size={20} className="text-emerald-500" />
                                    <span className="font-medium">One-time Fee {index + 1}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOneTimeFee(fee.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={fee.name}
                                        onChange={(e) => {
                                            const updated = [...oneTimeFees];
                                            updated[index].name = e.target.value;
                                            setOneTimeFees(updated);
                                        }}
                                        className="w-full p-2 rounded-lg border"
                                        placeholder="e.g., Admission Fee"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={fee.amount}
                                        onChange={(e) => {
                                            const updated = [...oneTimeFees];
                                            updated[index].amount = e.target.value;
                                            setOneTimeFees(updated);
                                        }}
                                        className="w-full p-2 rounded-lg border"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`refundable-${fee.id}`}
                                        checked={fee.refundable}
                                        onChange={(e) => {
                                            const updated = [...oneTimeFees];
                                            updated[index].refundable = e.target.checked;
                                            setOneTimeFees(updated);
                                        }}
                                        className="mr-2"
                                    />
                                    <label htmlFor={`refundable-${fee.id}`} className="text-sm">
                                        Refundable
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 rounded-2xl">
                <h4 className="font-bold text-lg mb-4">Structure Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</div>
                        <div className="text-sm text-slate-500">Total Annual Fee</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                        <div className="text-3xl font-bold text-emerald-600">{feeComponents.length}</div>
                        <div className="text-sm text-slate-500">Fee Components</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                        <div className="text-3xl font-bold text-purple-600">{concessionSchemes.length}</div>
                        <div className="text-sm text-slate-500">Concession Schemes</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeStructureCreator;