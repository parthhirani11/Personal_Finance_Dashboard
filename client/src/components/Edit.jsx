import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    person: "",
    paymentMode: "Cash",
    bankName: "",
    accountNumber: "",
    upiApp: "",
    upiId: "",
    description: "",
    tags: "",
  });

  const [currentFile, setCurrentFile] = useState(null);
  const [attachment, setAttachment] = useState(null);

  /* ================= FETCH RECORD ================= */

 useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      
      const res = await api.get(
        `/account/${id}`,
        {
           withCredentials: true 
        }
      );

      const r = res.data;

      setForm({
        type: r.type,
        amount: r.amount,
        person: r.person || "",
        paymentMode: r.paymentMode,
        bankName: r.bankDetails?.bankName || "",
        accountNumber: r.bankDetails?.accountNumber || "",
        upiApp: r.upiDetails?.appName || "",
        upiId: r.upiDetails?.upiId || "",
        description: r.description || "",
        tags: r.tags?.join(",") || "",
      });

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

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const data = new FormData();

    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (attachment) data.append("attachment", attachment);

    try {
      await api.put(
        `/account/edit/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/home");
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div className="container mt-5 mb-5">
  <div className="row justify-content-center">
    <div className="col-lg-7 col-md-9">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">

          <h4 className="mb-4 text-center fw-semibold">
            Edit Transaction
          </h4>

          <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* Type & Amount */}
            <div className="row mb-2">
              <div className="col-md-6">
                <label className="form-label">Type</label>

                <div className="type-slider">
                  <div
                    className={`slider-option ${form.type === "income" ? "active" : ""}`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, type: "income" }))
                    }
                  >
                    Income
                  </div>

                  <div
                    className={`slider-option ${form.type === "expense" ? "active" : ""}`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, type: "expense" }))
                    }
                  >
                    Expense
                  </div>

                  <div className={`slider-bg ${form.type}`}></div>
                </div>
              </div>
              <input type="hidden" name="type" value={form.type} />

              <div className="col-md-6">
                <label className="form-label">Amount</label>
                <input
                  type="text"
                  className="form-control"
                  name="amount"
                  autoComplete="off" 
                  value={form.amount}
                  inputMode="decimal"
                  // placeholder="Enter amount"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    handleChange({
                      target: {
                        name: "amount",
                        value,
                      },
                    });
                  }}
                  required
                />
              </div>
            </div>

            {/* Person */}
            <div className="mb-2">
              <label className="form-label">Account Holder Name</label>
              <input
                className="form-control"
                name="person"
                autoComplete="off" 
                value={form.person}
                onChange={handleChange}
              />
            </div>

            {/* Payment Mode */}
            <div className="mb-2">
              <label className="form-label">Payment Mode</label>

            </div>

             <div className="row mb-2">
              {/* Category */}
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <input
                  className="form-control"
                  autoComplete="off" 
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              {/* Tags */}
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
            
           
            {/* Attachment */}
            <div className="mb-3">
              <label className="form-label">Attachment</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setAttachment(e.target.files[0])}
              />
            </div>

            {/* Current File (NO COLOR CHANGE) */}
            {currentFile && (
              <div className="mb-3">
                <p className="mb-0">
                  Current File:{" "}
                  <a
                    href={`/uploads/${currentFile.filename}`}
                    target="_blank"
                  >
                    {currentFile.originalName}
                  </a>
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button className="editt-btnn">
                Save
              </button>
              <button
                type="button"
                className="clo-btnn"
                onClick={() => navigate("/home")}
              >
                Close
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
