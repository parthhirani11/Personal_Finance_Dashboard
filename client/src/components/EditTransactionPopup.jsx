import { useState, useEffect } from "react";
import { FiEdit2, FiX } from "react-icons/fi";
import api from "../api/axios";
import "../styles/main.css";

export default function EditTransactionPopup({ id, onClose }) {
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
  const [loading, setLoading] = useState(true);

  /* ================= COLORS ================= */
  const paymentColors = {
    cash: { bg: "#e5e7eb33", text: "#e5e7eb" },
    bank: { bg: "#3b82f633", text: "#3b82f6" },
    upi: { bg: "#22c55e33", text: "#6ee7b7" },
  };

  const getRandomColor = () => {
    const colors = [
      { bg: "#facc1533", text: "#fbbf24" },
      { bg: "#3b82f633", text: "#3b82f6" },
      { bg: "#ec489933", text: "#f87171" },
      { bg: "#8b5cf633", text: "#c084fc" },
      { bg: "#f9731633", text: "#fb923c" },
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  /* ================= FETCH RECORD ================= */
  const fetchRecord = async () => {
    try {
      const res = await api.get(`/account/${id}`, { withCredentials: true });
      const r = res.data;
      const mode = r.paymentMode?.toLowerCase() || "cash";

      setForm({
        type: r.type ?? "income",
        amount: r.amount ?? "",
        person: r.person ?? "",
        paymentMode: mode,
        description: r.description ?? "",
        tags: r.tags?.join(",") ?? "",
      });

      setSelectedMode(mode);

      if (r.attachment) {
        setCurrentFile({
          filename: r.attachment,
          originalName: r.originalName,
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Fetch edit record error:", err);
      setLoading(false);
    }
  };

  /* ================= FETCH PAYMENT MODES ================= */
  const fetchPaymentModes = async () => {
    try {
      const res = await api.get("/account/payment-modes", {
        withCredentials: true,
      });
      const modes = res.data.map((i) => i._id.toLowerCase());
      setPaymentModes([...new Set(modes)]);
    } catch (err) {
      console.error("Payment mode fetch error", err);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchRecord();
      fetchPaymentModes();
    }
  }, [id]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (attachment) data.append("attachment", attachment);

    try {
      await api.put(`/account/edit/${id}`, data, {
        withCredentials: true,
      });
      onClose();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  if (!id || loading) return null;

  return (
    <div className="edit-popup-overlay">
      <div className="edit-popup-box">
        {/* HEADER */}
        <div className="edit-popup-header">
          <h3>Edit Transaction</h3>
          <button className="edit-popup-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* BODY */}
        <div className="edit-popup-body">
          <form id="editForm" onSubmit={handleSubmit} encType="multipart/form-data">
            {/* TYPE */}
            <label>Type *</label>
            <div className="type-slider">
              <div
                className={`slider-option ${
                  form.type === "income" ? "active income" : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, type: "income" }))
                }
              >
                Income
              </div>
              <div
                className={`slider-option ${
                  form.type === "expense" ? "active expense" : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, type: "expense" }))
                }
              >
                Expense
              </div>
              <div className={`slider-bg ${form.type}`} />
            </div>

            {/* AMOUNT + PERSON */}
            <div className="row">
              <div className="col-md-6 mt-2">
                <label htmlFor="amount">Amount *</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  className="form-control"
                  value={form.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="col-md-6 mt-2">
                <label htmlFor="person">Account Holder Name</label>
                <input
                  id="person"
                  name="person"
                  type="text"
                  className="form-control"
                  value={form.person}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* PAYMENT MODE */}
            <label className="mt-3">Payment Mode *</label>
            <div className="payment-mode">
              {paymentModes.map((mode) => {
                const color = paymentColors[mode] || getRandomColor();
                return (
                  <label key={mode} htmlFor={`pay-${mode}`} className="radio-item">
                    <input
                      id={`pay-${mode}`}
                      type="radio"
                      name="paymentMode"
                      value={mode}
                      checked={selectedMode === mode}
                      onChange={() => {
                        setSelectedMode(mode);
                        setForm((p) => ({ ...p, paymentMode: mode }));
                      }}
                    />
                    <span className="custom-radio" />
                    <span
                      className="pay-badge"
                      style={{
                        background: color.bg,
                        color: color.text,
                      }}
                    >
                      {mode.toUpperCase()}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* DESCRIPTION + TAGS */}
            <div className="row">
              <div className="col-md-6 mt-2">
                <label htmlFor="description">Category</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  className="form-control"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mt-2">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  className="form-control"
                  value={form.tags}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ATTACHMENT */}
            <label htmlFor="attachment" className="mt-2">
              Attachment
            </label>
            <input
              id="attachment"
              type="file"
              className="form-control"
              onChange={(e) => setAttachment(e.target.files[0])}
            />

            {currentFile && (
              <p className="brand-desc m-0">
                
                Current File:{" "}
                <a
                  href={`/uploads/${currentFile.filename}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {currentFile.originalName}
                </a>
              </p>
            )}
          </form>
        </div>

        {/* FOOTER */}
        <div className="edit-popup-footer">
          <button type="submit" form="editForm" className="btn btn-primary">
            Save <FiEdit2 />
          </button>
        </div>
      </div>
    </div>
  );
}
