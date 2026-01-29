import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { X } from "lucide-react";

import Logo from "../assets/logo.svg";

/* ================= CONFIG ================= */

const SCHOOL = {
    name: "KALABURGITech",
    phone: "+91 9164800233",
    email: "kalaburagitech@gmail.com",
    website: "https://www.kalaburagitech.com",
};

const CARD_W = 85;
const CARD_H = 54;
const SCALE = 4;

/* ================= COMPONENT ================= */

export default function IDCardGenerator({
    person,
    type = "student",
    onClose,
}) {
    const frontRef = useRef();
    const backRef = useRef();

    if (!person) return null;

    /* ================= DATA ================= */

    const data = {
        id:
            person.student_id ||
            person.teacher_id ||
            person.employee_id ||
            person._id ||
            "N/A",

        name: person.full_name || person.name || "N/A",

        phone: person.phone || "N/A",

        dob: person.dob
            ? new Date(person.dob).toLocaleDateString("en-GB")
            : "N/A",

        blood: person.blood_group || "N/A",

        photo: person.photo || null,

        class: person.class_info?.grade || "",

        role:
            person.role ||
            person.designation ||
            type.toUpperCase(),
    };

    /* ================= SUB TITLE ================= */

    const getSubTitle = () => {
        if (type === "student") return `Class: ${data.class}`;
        if (type === "teacher") return "Teacher";
        if (type === "driver") return "Driver";
        if (type === "admin") return "Admin";

        return data.role;
    };


    const qrValue = `KALABURGITech------------------
      Name: ${data.name || "N/A"}
      ID: ${data.id || "N/A"}
      ${type === "student" ? `Class: ${data.class || "N/A"}` : `Role: ${data.role || "N/A"}`}
      Phone: ${data.phone || "N/A"}
      ------------------
      Website:
      ${SCHOOL.website}
   `.trim();

    /* ================= PDF ================= */

    const generatePDF = async (print = false) => {
        const front = await html2canvas(frontRef.current, {
            scale: SCALE,
            useCORS: true,
            backgroundColor: "#ff8c1a",
        });

        const back = await html2canvas(backRef.current, {
            scale: SCALE,
            useCORS: true,
            backgroundColor: "#ff8c1a",
        });

        const pdf = new jsPDF("landscape", "mm", [
            CARD_W,
            CARD_H,
        ]);

        pdf.addImage(front, "PNG", 0, 0, CARD_W, CARD_H);
        pdf.addPage();
        pdf.addImage(back, "PNG", 0, 0, CARD_W, CARD_H);

        if (print) {
            pdf.autoPrint();
            window.open(pdf.output("bloburl"));
        } else {
            pdf.save(`${data.id}_ID_CARD.pdf`);
        }
    };

    /* ================= UI ================= */

    return (
        <div style={ui.overlay}>

            <div style={ui.modal}>

                {/* HEADER */}

                <div style={ui.header}>
                    <h2>
                        ID Card Preview – {type.toUpperCase()}
                    </h2>

                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* CARDS */}

                <div style={ui.cardWrap}>

                    {/* FRONT */}

                    <div ref={frontRef} style={card.front}>

                        {/* TOP */}

                        <div style={card.top}>

                            <img src={Logo} style={card.logo} />

                            <div>
                                <h3>{SCHOOL.name}</h3>
                                <p>{getSubTitle()}</p>
                            </div>

                        </div>

                        {/* BODY */}

                        <div style={card.body}>

                            {/* PHOTO */}

                            <div style={card.photoBox}>

                                {data.photo ? (
                                    <img
                                        src={data.photo}
                                        style={card.photo}
                                        alt="Student"
                                    />
                                ) : (
                                    <span>No Photo</span>
                                )}

                            </div>

                            {/* INFO */}

                            <div style={card.info}>

                                <h4>{data.name}</h4>

                                <p>ID: {data.id}</p>
                                <p>Phone: {data.phone}</p>
                                <p>DOB: {data.dob}</p>
                                <p>Blood: {data.blood}</p>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div style={card.footer}>
                            <span>Valid: 2026–27</span>

                            <div style={card.qrBox}>
                                <QRCodeCanvas
                                    value={qrValue}
                                    size={60}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    style={{
                                        padding: 2,
                                        background: "#fff",
                                        borderRadius: 2,
                                        boxShadow: "0 1px 1px rgba(0,0,0,0.3)",
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                    {/* BACK */}

                    <div ref={backRef} style={card.back}>

                        <div>

                            <h3>{SCHOOL.name}</h3>

                            <p>{SCHOOL.phone}</p>
                            <p>{SCHOOL.email}</p>
                            <p>{SCHOOL.website}</p>

                        </div>

                        <ul>

                            <li>Carry card always</li>
                            <li>Report loss immediately</li>
                            <li>Property of school</li>

                        </ul>

                        <div style={card.sign}>

                            <span>Holder</span>
                            <span>Authority</span>

                        </div>

                    </div>

                </div>

                {/* BUTTONS */}

                <div style={ui.actions}>

                    <button
                        onClick={() => generatePDF()}
                        style={ui.btnPrimary}
                    >
                        Download PDF
                    </button>

                    <button
                        onClick={() => generatePDF(true)}
                        style={ui.btnSecondary}
                    >
                        Print
                    </button>

                </div>

            </div>

        </div>
    );
}

/* ================= UI STYLES ================= */

const ui = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modal: {
        background: "#020617",
        color: "white",
        width: "100%",
        maxWidth: 1100,
        borderRadius: 12,
    },

    header: {
        padding: 15,
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
    },

    cardWrap: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: 40,
        padding: 30,
        justifyItems: "center",
    },

    actions: {
        padding: 20,
        display: "flex",
        justifyContent: "center",
        gap: 15,
        borderTop: "1px solid #1e293b",
    },

    btnPrimary: {
        background: "#ff8c1a",
        color: "white",
        border: "none",
        padding: "10px 22px",
        borderRadius: 6,
        fontWeight: 600,
        cursor: "pointer",
    },

    btnSecondary: {
        background: "#1e293b",
        color: "white",
        border: "none",
        padding: "10px 22px",
        borderRadius: 6,
        fontWeight: 600,
        cursor: "pointer",
    },
};

/* ================= CARD STYLES ================= */

const card = {
    front: {
        width: "85mm",
        height: "54mm",
        background:
            "linear-gradient(135deg,#ff8c1a,#ffb347)",
        borderRadius: 12,
        padding: 12,
        color: "#111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Arial",
    },

    back: {
        width: "85mm",
        height: "54mm",
        background:
            "linear-gradient(135deg,#ff8c1a,#ffa64d)",
        borderRadius: 12,
        padding: 12,
        color: "#111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontSize: 11,
        fontFamily: "Arial",
    },

    top: {
        display: "flex",
        gap: 10,
        alignItems: "center",
    },

    logo: {
        width: 34,
        height: 34,
    },

    body: {
        display: "flex",
        gap: 12,
    },

    photoBox: {
        width: 80,
        height: 95,
        background: "white",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
    },

    photo: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    info: {
        fontSize: 11,
    },

    footer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 10,
        // minHeight: 10,      // Prevent overflow
        minHeight: 50,   // ✅ Enough space for QR
        paddingBottom: 20,
    },

    qrBox: {
        background: "white",
        padding: 4,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    sign: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
    },
};
