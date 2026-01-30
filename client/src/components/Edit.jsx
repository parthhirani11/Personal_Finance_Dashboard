import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiX } from "react-icons/fi";
import api from "../api/axios";
import "../styles/main.css";

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ================= STATE ================= */

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    person: "",
    paymentMode: "cash",
    description: "",
    tags: "",
  });

  const [selectedMode, setSelectedMode] = useState("cash");
  const [paymentModes, setPaymentModes] = useState([]);

  const [attachment, setAttachment] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  /* ================= COLORS ================= */

  const paymentColors = {
  cash: { bg: "#e5e7eb33", text: "#e5e7eb" },      // light grey
  bank: { bg: "#3b82f633", text: "#3b82f6" },      // blue
  upi: { bg: "#22c55e33", text: "#6ee7b7" },
  };

 const getRandomColor = () => {
  const colors = [
    { bg: "#facc1533", text: "#fbbf24" }, // yellow
    { bg: "#3b82f633", text: "#3b82f6" }, // blue
    { bg: "#ec489933", text: "#f87171" }, // red
    { bg: "#8b5cf633", text: "#c084fc" }, // purple
    { bg: "#f9731633", text: "#fb923c" }, // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};


  /* ================= FETCH RECORD ================= */

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/account/${id}`, {
        withCredentials: true,
      });

      const r = res.data;
      const mode = r.paymentMode?.toLowerCase() || "cash";

      setForm({
        type: r.type,
        amount: r.amount,
        person: r.person || "",
        paymentMode: mode,
        description: r.description || "",
        tags: r.tags?.join(",") || "",
      });

      setSelectedMode(mode);

      if (r.attachment) {
        setCurrentFile({
          filename: r.attachment,
          originalName: r.originalName,
        });
      }
    } catch (err) {
      console.error("Fetch edit record error:", err);
    }
  };

  /* ================= FETCH PAYMENT MODES ================= */

  const fetchPaymentModes = async () => {
    try {
      const res = await api.get("/account/payment-modes", {
        withCredentials: true,
      });

      const modes = res.data.map(i => i._id.toLowerCase());
      const unique = [...new Set(modes)];

      setPaymentModes(unique);
    } catch (err) {
      console.error("Payment mode fetch error", err);
    }
  };

  useEffect(() => {
    fetchRecord();
    fetchPaymentModes();
  }, []);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (attachment) data.append("attachment", attachment);

    try {
      await api.put(`/account/edit/${id}`, data, {
        withCredentials: true,
      });
      navigate("/home");
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  /* ================= JSX ================= */

  return (
    <div className="container mt-4 mb-4">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-body ">

              <h4 className="mb-4 text-center fw-semibold">
                Edit Transaction
              </h4>

              <form onSubmit={handleSubmit} encType="multipart/form-data">

                {/* TYPE */}
                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label">Type</label>

                    <div className="type-slider">
                      <div
                        className={`slider-option ${form.type === "income" ? "active" : ""}`}
                        onClick={() => setForm(prev => ({ ...prev, type: "income" }))}
                      >
                        Income
                      </div>

                      <div
                        className={`slider-option ${form.type === "expense" ? "active" : ""}`}
                        onClick={() => setForm(prev => ({ ...prev, type: "expense" }))}
                      >
                        Expense
                      </div>

                      <div className={`slider-bg ${form.type}`}></div>
                    </div>
                  </div>

                  {/* AMOUNT */}
                  <div className="col-md-6">
                    <label className="form-label">Amount</label>
                    <input
                      className="form-control"
                      value={form.amount}
                      onChange={(e) =>
                        setForm(prev => ({
                          ...prev,
                          amount: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* PERSON */}
                <div className="mb-2">
                  <label className="form-label">Account Holder</label>
                  <input
                    className="form-control"
                    autoComplete="off"
                    name="person"
                    value={form.person}
                    onChange={handleChange}
                  />
                </div>

                {/* PAYMENT MODE */}
                <div className="mb-2">
                  <label className="form-label">Payment Mode</label>

                  <div className="payment-mode">
                    {paymentModes.map((mode, i) => {
                      const color =
                        paymentColors[mode] || getRandomColor();

                      return (
                        <label key={i} className="radio-item">
                          <input
                            type="radio"
                            name="paymentMode"
                            value={mode}
                            checked={selectedMode === mode}
                            onChange={() => {
                              setSelectedMode(mode);
                              setForm(prev => ({ ...prev, paymentMode: mode }));
                            }}
                          />

                          <span className="custom-radio"></span>

                          <span
                            className="mode-text pay-badge"
                            style={{
                              background: color.bg,
                              color: color.text,
                              padding: "0.25rem 0.6rem",
                              borderRadius: "0.375rem",
                              fontWeight: "600",
                            }}
                          >
                            {mode.toUpperCase()}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* CATEGORY + TAGS */}
                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <input
                      className="form-control"
                      name="description"
                      autoComplete="off"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tags</label>
                    <input
                      className="form-control"
                      autoComplete="off"
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* ATTACHMENT */}
                <div className="mb-3">
                  <label className="form-label">Attachment</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setAttachment(e.target.files[0])}
                  />
                </div>

                {currentFile && (
                  <p>
                    Current File:{" "}
                    <a href={`/uploads/${currentFile.filename}`} target="_blank">
                      {currentFile.originalName}
                    </a>
                  </p>
                )}

                {/* BUTTONS */}
                <div className="d-flex justify-content-end gap-3 mt-4 fs-6 ">
                  <button className="edit-btn d-flex align-items-center gap-1">Save  <FiEdit2 /></button>
                  <button
                    type="button"
                    className="delete-btn d-flex align-items-center gap-1 "
                    onClick={() => navigate("/home")}
                  >
                    Close
                     <FiX />
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
