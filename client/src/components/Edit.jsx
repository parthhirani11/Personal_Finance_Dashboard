import { useState, useEffect, useRef } from "react";
import { FiX, FiSave, FiPlusCircle } from "react-icons/fi";
import api from "../api/axios";
import "../styles/edit.css";
import { toast } from "react-toastify";

export default function EditPopup({ id, onClose }){

  /* ================= STATE ================= */

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    person: "",
    paymentMode: "cash",
     category: "",
    tags: "",

  });

  
  const [showModal, setShowModal] = useState(false);
  const [customMode, setCustomMode] = useState("");
  const [selectedMode, setSelectedMode] = useState("cash");
  const [paymentModes, setPaymentModes] = useState([]);

  const [attachment, setAttachment] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  // ---------- CATEGORY ----------
  const fixedCategories = ["Goods", "Salary", "Rent", "Food", "Travel"];

  const [categoryInput, setCategoryInput] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // ---------- TAGS ----------
  const fixedTags = ["office", "personal", "urgent", "family", "emi"];

  const [tagInput, setTagInput] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const [modeError, setModeError] = useState("");

  const tagRef = useRef(null);

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

  const normalize = (val = "") =>
    val.toString().trim().toLowerCase().replace(/\s+/g, "");

  /* ================= FETCH RECORD ================= */

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/account/${id}`, {
        withCredentials: true,
      });

      const r = res.data;
      const mode = r.paymentMode?.toLowerCase() || "cash";

      setForm({
        amount: r.amount,
        person: r.person || "",
        paymentMode: r.paymentMode?.toLowerCase() || "cash",
        type: r.type,
        
      });

      setSelectedMode(mode);
      setSelectedCategories(
        r.description
          ? r.description.split(",").map(c => c.trim()).filter(Boolean)
          : []
      );
      setSelectedTags(r.tags || []);  

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

  const handleCategoryChange = (value) => {
  setCategoryInput(value);
  setShowSuggestions(true);

  const keyword = normalize(value);

  setFilteredCategories(
    allCategories.filter(cat =>
      normalize(cat).includes(keyword) &&
      !selectedCategories.some(
        sel => normalize(sel) === normalize(cat)
      )
    )
  );
};

const handleCategoryKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addCategory(categoryInput);
  }
};

  /* ================= SUBMIT ================= */

 const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData();

    // basic fields
    data.append("type", form.type);
    data.append("amount", form.amount);
    data.append("person", form.person);
    data.append("paymentMode", form.paymentMode);

    // arrays
    data.append("description", selectedCategories.join(", "));
    // selectedCategories.forEach(c => data.append("category[]", c));
    selectedTags.forEach(t => data.append("tags[]", t));

    // attachment
    if (attachment) {
      data.append("attachment", attachment);
    }

    try {
      await api.put(`/account/edit/${id}`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Transaction updated");
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Update failed");
    }
  };

  const fetchCategories = async () => {
    const res = await api.get("/account/categories", { withCredentials: true });

    // ✅ DIRECT STRINGS
    setAllCategories(res.data);
    setFilteredCategories(res.data);
  };


  // tags list and 5 btn suggestions
  const fetchTags = async () => {
    const res = await api.get("/account/tags", { withCredentials: true });

    // ✅ DIRECT STRINGS
    setAllTags(res.data);
    setFilteredTags(res.data);
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const addCategory = (cat) => {
    const value = cat.trim();
    if (!value) return;

    const exists = selectedCategories.some(
      c => normalize(c) === normalize(value)
    );
    if (exists) return;

    setSelectedCategories(prev => [...prev, value]);
    setCategoryInput("");
    setShowSuggestions(false);
  };

  const removeCategory = (cat) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };



  const addTag = (tag) => {
    const value = tag.trim();
    if (!value) return;

    const exists = selectedTags.some(
      t => normalize(t) === normalize(value)
    );
    if (exists) return;

    setSelectedTags(prev => [...prev, value]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagChange = (value) => {
    setTagInput(value);
    setShowTagSuggestions(true);

    const keyword = normalize(value);
    setFilteredTags(
      allTags.filter(tag =>
        normalize(tag).includes(keyword) &&
        !selectedTags.some(
          sel => normalize(sel) === normalize(tag)
        )
      )
    );
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <div className="edit-popup-overlay">
      <div className="edit-popup-box">

        {/* HEADER */}
        <div className="edit-popup-header">
          <h3 className=" text-center">Edit Transaction</h3>
          <span className="close-btn" onClick={onClose}>
            {/* <FiX /> */}
            &times;
          </span>
        </div>

        {/* BODY (ONLY THIS SCROLLS) */}
        <div className="edit-popup-body">
          <form onSubmit={handleSubmit}>

            {/* TYPE */}
            <label className="edit-label">Type <span className="text-danger">*</span></label>
            <div className="edit-type-slider">
              <div
                className={`edit-slider-option ${form.type === "income" ? "active" : ""}`}
                onClick={() => setForm(prev => ({ ...prev, type: "income" }))}
              >
                Income
              </div>

              <div
                className={`edit-slider-option ${form.type === "expense" ? "active" : ""}`}
                onClick={() => setForm(prev => ({ ...prev, type: "expense" }))}
              >
                Expense
              </div>

              <div className={`edit-slider-bg ${form.type}`}></div>
            </div>

            {/* AMOUNT + PERSON */}
            <div className="edit-grid-2 mt-2">
              <div>
                <label >Amount <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  value={form.amount}
                  onChange={e =>
                    setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, "") }))
                  }
                  required
                />
              </div>

              <div>
                <label >Account Holder Name</label>
                <input
                  className="form-control"
                  value={form.person}
                  onChange={e => setForm(p => ({ ...p, person: e.target.value }))}
                />
              </div>
            </div>

            {/* PAYMENT MODE */}
            <div className="mt-2">
              <label className="form-label">Payment Mode</label>

              <div className="edit-payment-mode">
                {paymentModes.map((mode, i) => {
                  const color =paymentColors[mode] || getRandomColor();
                    return (
                      <label key={i} className="radio-item">
                        <input
                          type="radio"                             
                          name="paymentMode"                             
                          value={mode}
                          checked={form.paymentMode === mode}
                          onChange={() => {
                            setSelectedMode(mode);
                            setForm(p => ({ ...p, paymentMode: mode }));
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

                <button
                  type="button"
                  className="add-mode-btn d-flex align-items-center gap-1"
                  onClick={() => setShowModal(true)}
                >
                  <FiPlusCircle size={16} />
                  Add
                </button>
                {showModal && (
                  <div className="tag-modal-backdrop">
                    <div className="tag-modal">
                      <div className="modal-header mb-2">         
                        <h5 style={{ color: "#d9d8e2" }}>Add Payment Mode</h5>
                        <button
                          type="button"
                          className="btn-close"
                          style={{ filter: "invert(1)" }}
                          onClick={() => setShowModal(false)}
                          />
                      </div>

                      <input
                        type="text"
                        className={`form-control mb-2 ${modeError ? "is-invalid" : ""}`}
                        placeholder="Enter payment mode"
                        value={customMode}
                        onChange={(e) => {
                          setCustomMode(e.target.value);
                          setModeError("");
                        }}
                      />
                      {modeError && (
                        <div className="text-danger small">{modeError}</div>
                      )}
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"   // 🔥 MOST IMPORTANT
                          className="btn btn-primary"
                          onClick={() => {
                            const newMode = customMode.trim().toLowerCase();

                            if (!newMode) {
                              setModeError("Payment mode required");
                              return;
                            }

                            const exists = paymentModes.some(
                              m => m.toLowerCase() === newMode
                            );

                            if (exists) {
                              setModeError("Payment mode already exists");
                              return; // popup open rehse
                            }

                            setPaymentModes(prev => [...prev, newMode]);
                            setForm(p => ({ ...p, paymentMode: newMode }));
                            setSelectedMode(newMode);

                            setCustomMode("");
                            setModeError("");
                            setShowModal(false);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div> 

            {/* CATEGORY + TAGS */}
            <div className="row mb-2">
              <div className="col-md-6 mt-2">
                <label className="form-label">Category</label>

                <div className="tag-input-wrapper position-relative">
                  {/* Selected categories */}
                  {selectedCategories.map((cat, i) => (
                    <span key={i} className="tag-chip">
                      {cat}
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeCategory(cat)}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* Input */}
                  <input
                    className="tag-input"
                    value={categoryInput}
                    autoComplete="off"
                    placeholder="Type category & press Enter"
                    onFocus={() => {
                      setShowSuggestions(true);
                      setFilteredCategories(
                        allCategories.filter(
                          c => !selectedCategories.some(
                            s => normalize(s) === normalize(c)
                          )
                        )
                      );
                    }}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />

                  {/* ✅ SUGGESTION DROPDOWN */}
                  {showSuggestions && (
                    <div className="suggestionBox list-group mt-1">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat, i) => (
                          <button
                            key={i}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onMouseDown={() => addCategory(cat)}
                          >
                            {cat}
                          </button>
                        ))
                      ) : (
                        <div className="no-category-msg px-2 py-1 text-muted">
                          Press Enter to add new category
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!showSuggestions && (
                  <div className="mt-2">
                    {fixedCategories.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>


              {/* TAGS ......................................................................*/}
              <div className="col-md-6 mt-2">
                <label className="form-label">Tags</label>

                <div className="tag-input-wrapper" ref={tagRef}>
                  {selectedTags.map((tag, i) => (
                    <span key={i} className="tag-chip">
                      {tag}
                      <button className="remove-btn" type="button" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}

                  <input
                    className="tag-input"
                    value={tagInput}
                    placeholder="Type & press Enter"
                    onChange={e => handleTagChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onFocus={() => {
                      setShowTagSuggestions(true);
                      setFilteredTags(allTags);
                    }}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  />

                  {showTagSuggestions && (
                    <div className="suggestionBox list-group mt-1">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag, i) => (
                          <button
                            key={i}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onMouseDown={() => addTag(tag)}
                          >
                            {tag}
                          </button>
                        ))
                      ) : (
                        <div className="no-category-msg px-2 py-1 text-muted">
                          Press Enter to add new tag
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!showTagSuggestions && (
                  <div className="mt-2">
                    {fixedTags.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
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
              <p className="edit-label">
                Current File:{" "}
                <a href={`/uploads/${currentFile.filename}`} target="_blank">
                  {currentFile.originalName}
                </a>
              </p>
            )}
 
          </form>
        </div>

        {/* FOOTER */}
        <div className="edit-popup-footer">
          <button className="edit-save-btn" onClick={handleSubmit}>
            Save Transaction <FiSave />
          </button>
        </div>

      </div>
    </div>
  );
}
