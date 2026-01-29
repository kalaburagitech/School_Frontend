import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../utils/api";
import Input from "./ui/Input";
import Button from "./ui/Button";

import {
    Shield,
    Phone,
    GraduationCap,
    Mail,
    Camera,
    CheckCircle,
    Bus,
} from "lucide-react";

import clsx from "clsx";

/* ---------------- HELPERS ---------------- */

const formatAadhaar = (val) => {
    const d = val.replace(/\D/g, "").slice(0, 12);
    return d.replace(/(\d{4})(?=\d)/g, "$1-");
};

const cleanAadhaar = (val) => val.replace(/\D/g, "");

/* Teacher ID */
const makeTeacherId = (aadhaar) => {
    if (aadhaar.length !== 12) return "TCHR-XXXX-0001";

    const last4 = aadhaar.slice(-4);

    return `TCHR-${last4}-0001`;
};

const subjectColors = [
    "bg-indigo-100 text-indigo-700",
    "bg-green-100 text-green-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
];

/* ---------------- COMPONENT ---------------- */

const TeacherForm = ({
    initialData,
    onSubmit,
    onCancel,
    loading,
}) => {

    const fileRef = useRef();

    /* ---------------- STATE ---------------- */

    const [subjects, setSubjects] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routeStops, setRouteStops] = useState([]);

    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({

        staff_id: "",

        aadhaar: "",
        name: "",
        email: "",
        phone: "",
        dob: "",
        blood: "",
        photo: "",

        designation: "",
        qualification: "",

        subjects: [],

        joining: "",
        status: "Active",

        transport: {
            is_using_bus: false,
            bus_id: "",
            stop_name: "",
        },
    });

    /* ---------------- LOAD DATA ---------------- */

    useEffect(() => {

        const load = async () => {
            try {

                const [s, b] = await Promise.all([
                    api.get("/subjects"),
                    api.get("/buses"),
                ]);

                setSubjects(s.data);
                setBuses(b.data);

            } catch (err) {
                console.error(err);
            }
        };

        load();

    }, []);

    /* ---------------- LOAD STOPS ---------------- */

    const handleBusChange = async (e) => {

        const busId = e.target.value;

        setForm((p) => ({
            ...p,
            transport: {
                ...p.transport,
                bus_id: busId,
                stop_name: "",
            },
        }));

        if (!busId) return;

        try {

            const res = await api.get(`/buses/${busId}/stops`);

            setRouteStops(res.data || []);

        } catch (err) {
            console.error(err);
        }
    };

    /* ---------------- EDIT MODE ---------------- */

    useEffect(() => {

        if (!initialData) return;

        setForm({

            staff_id: initialData.staff_id,

            aadhaar: formatAadhaar(initialData.aadhaar_number || ""),
            name: initialData.full_name || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            dob: initialData.dob || "",
            blood: initialData.blood_group || "",
            photo: initialData.photo_url || "",

            designation: initialData.designation || "",
            qualification: initialData.qualification || "",

            subjects: initialData.subjects?.map(s => s._id) || [],

            joining: initialData.joining_date?.split("T")[0] || "",
            status: initialData.status || "Active",

            transport: {
                is_using_bus: initialData.transport?.is_using_bus || false,
                bus_id: initialData.transport?.bus_id || "",
                stop_name: initialData.transport?.stop_name || "",
            },
        });

    }, [initialData]);

    /* ---------------- UPDATE HELPER ---------------- */

    const update = useCallback((key, value) => {
        setForm((p) => ({ ...p, [key]: value }));
    }, []);

    /* ---------------- PHOTO ---------------- */

    const uploadPhoto = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const fd = new FormData();

        fd.append("image", file);

        try {

            setUploading(true);

            const res = await api.post("/students/photo", fd);

            setForm((p) => ({ ...p, photo: res.data.imageUrl }));

        } catch {

            alert("Upload failed");

        } finally {

            setUploading(false);

        }
    };

    /* ---------------- VALIDATION ---------------- */

    const validate = () => {

        const e = {};

        if (cleanAadhaar(form.aadhaar).length !== 12)
            e.aadhaar = "Invalid Aadhaar";

        if (!form.name) e.name = "Name required";

        if (!form.dob) e.dob = "DOB required";

        if (!form.email.includes("@"))
            e.email = "Invalid email";

        if (!/^\d{10}$/.test(form.phone))
            e.phone = "10 digit phone only";

        if (!form.joining)
            e.joining = "Joining date required";

        return e;
    };

    /* ---------------- SUBMIT ---------------- */

    const submit = (e) => {

        e.preventDefault();

        const v = validate();

        if (Object.keys(v).length) {
            setErrors(v);
            return;
        }

        setErrors({});

        const aadhaarClean = cleanAadhaar(form.aadhaar);

        const payload = {

            staff_id:
                initialData?.staff_id ||
                makeTeacherId(aadhaarClean),

            aadhaar_number: aadhaarClean,

            full_name: form.name,
            email: form.email,
            phone: form.phone,
            dob: form.dob,
            blood_group: form.blood,

            photo_url: form.photo,

            designation: form.designation,
            qualification: form.qualification,

            subjects: form.subjects,

            joining_date: form.joining,
            status: form.status,

            transport: form.transport.is_using_bus
                ? {
                    is_using_bus: true,
                    bus_id: form.transport.bus_id,
                    stop_name: form.transport.stop_name,
                }
                : { is_using_bus: false },
        };

        console.log("SUBMIT PAYLOAD 👉", payload);

        onSubmit(payload);
    };

    /* ---------------- MEMO ---------------- */

    const teacherId = useMemo(() => {

        if (initialData) return form.staff_id;

        return makeTeacherId(cleanAadhaar(form.aadhaar));

    }, [form.aadhaar, initialData]);

    /* ---------------- UI ---------------- */

    return (

        <form
            onSubmit={submit}
            className="space-y-8 max-h-[80vh] overflow-y-auto p-4"
        >

            {/* ERRORS */}

            {Object.values(errors).length > 0 && (
                <div className="bg-red-100 text-red-700 p-3 rounded-xl">
                    {Object.values(errors).map((e, i) => (
                        <p key={i}>⚠ {e}</p>
                    ))}
                </div>
            )}

            {/* IDENTIFICATION */}

            <div className="p-4 bg-blue-50 rounded-xl border">

                <div className="flex gap-2 mb-3 font-bold text-blue-900">
                    <Shield size={18} />
                    Identification
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-black">

                    <div>

                        <label className="font-semibold">Aadhaar</label>

                        <input
                            value={form.aadhaar}
                            disabled={initialData}
                            onChange={(e) =>
                                update("aadhaar", formatAadhaar(e.target.value))
                            }
                            className="input-field font-mono text-blue-900"
                            placeholder="XXXX-XXXX-XXXX"
                        />

                        {cleanAadhaar(form.aadhaar).length === 12 && (
                            <p className="text-green-600 text-xs mt-1 flex gap-1">
                                <CheckCircle size={12} /> Valid
                            </p>
                        )}

                    </div>

                    <div>

                        <label className="font-semibold">Teacher ID</label>

                        <div className="input-field bg-red-200 text-blue-900 font-bold">
                            {teacherId}
                        </div>

                    </div>

                </div>

            </div>

            {/* PERSONAL */}

            <div className="grid md:grid-cols-3 gap-6 text-white ">

                <div className="md:col-span-2 space-y-4 ">

                    <Input
                        text-color="text-white"
                        label="Full Name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">

                        <Input
                            type="date"
                            label="DOB"
                            value={form.dob}
                            onChange={(e) => update("dob", e.target.value)}
                        />

                        <select
                            className="input-field"
                            value={form.blood}
                            onChange={(e) => update("blood", e.target.value)}
                        >
                            <option value="">Blood Group</option>
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(b => (
                                <option key={b}>{b}</option>
                            ))}
                        </select>

                    </div>

                </div>

                {/* PHOTO */}

                <div className="flex justify-center">

                    <input
                        hidden
                        ref={fileRef}
                        type="file"
                        onChange={uploadPhoto}
                    />

                    <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        className="w-32 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center"
                    >
                        {form.photo ? (
                            <img
                                src={form.photo}
                                className="w-full h-full rounded-xl object-cover"
                            />
                        ) : uploading ? "Uploading..." : <>
                            <Camera /> Upload
                        </>}
                    </button>

                </div>

            </div>

            {/* CONTACT */}

            <div className="grid md:grid-cols-2 gap-4">

                <Input
                    icon={Mail}
                    label="Email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                />

                <Input
                    icon={Phone}
                    label="Phone"
                    value={form.phone}
                    onChange={(e) =>
                        update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                />

            </div>

            {/* SUBJECTS */}

            <div>

                <h4 className="font-bold mb-3 flex gap-2 text">
                    <GraduationCap size={16} /> Subjects
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                    {subjects.map((s, i) => {

                        const active = form.subjects.includes(s._id);

                        return (

                            <button
                                type="button"
                                key={s._id}
                                onClick={() => {

                                    update(
                                        "subjects",
                                        active
                                            ? form.subjects.filter(id => id !== s._id)
                                            : [...form.subjects, s._id]
                                    );

                                }}
                                className={clsx(
                                    "px-3 py-2 rounded-xl text-xs font-bold border",
                                    active
                                        ? subjectColors[i % 6]
                                        : "bg-white-100"
                                )}
                            >
                                {s.name}
                            </button>

                        );

                    })}

                </div>
            </div>

            {/* TRANSPORT (OLD STYLE) */}

            <div className="bg-slate-700 p-6 rounded-2xl border text-black bg-red-500">

                <div className="flex items-center space-x-3 mb-4">

                    <input
                        text-black
                        type="checkbox"
                        checked={form.transport.is_using_bus}
                        onChange={(e) => setForm(p => ({
                            ...p,
                            transport: {
                                ...p.transport,
                                is_using_bus: e.target.checked
                            }
                        }))}
                    />

                    <span className="font-bold">Enable School Bus</span>

                </div>

                {form.transport.is_using_bus && (

                    <div className="grid grid-cols-2 gap-4 text-black">

                        {/* BUS */}

                        <div>

                            <label className="font-semibold">Assign Bus</label>

                            <select
                                className="input-field"
                                value={form.transport.bus_id}
                                onChange={handleBusChange}
                            >
                                <option value="">Select Bus</option>

                                {buses.map(bus => (
                                    <option key={bus._id} value={bus._id}>
                                        {bus.vehicle_number}
                                    </option>
                                ))}

                            </select>

                        </div>

                        {/* STOP */}

                        <div>

                            <label className="font-semibold">Pickup Stop</label>

                            <select
                                className="input-field"
                                value={form.transport.stop_name}
                                onChange={(e) => setForm(p => ({
                                    ...p,
                                    transport: {
                                        ...p.transport,
                                        stop_name: e.target.value
                                    }
                                }))}
                            >
                                <option value="">Select Stop</option>

                                {routeStops.map((s, i) => (
                                    <option key={i} value={s.stop_name}>
                                        {s.stop_name}
                                    </option>
                                ))}

                            </select>

                        </div>

                    </div>
                )}

            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 pt-4 border-t">

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                >
                    Cancel
                </Button>

                <Button loading={loading}>
                    {initialData ? "Update" : "Save"}
                </Button>

            </div>

        </form>
    );
};

export default TeacherForm;
