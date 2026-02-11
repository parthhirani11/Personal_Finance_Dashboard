// edit transection recode
import { useState, useEffect, useRef, useMemo } from "react";
import { FiX, FiSave, FiPlusCircle } from "react-icons/fi";
import api from "../api/axios";
import "../styles/edit.css";
import { toast } from "react-toastify";
import { useCategoryTag } from "../context/CategoryTagContext";


export default function EditPopup({ id, onClose,transactions ,dashboardId }){

  /* ================= STATE ================= */
  const [record, setRecord] = useState(null);
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
  const { categories, tags } = useCategoryTag();
  
  const [categoryInput, setCategoryInput] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // ---------- TAGS ----------
  const [tagInput, setTagInput] = useState("");
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
       setRecord(r);
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

  // const fetchPaymentModes = async () => {
  //   try {
  //     const res = await api.get("/account/payment-modes", {
  //       withCredentials: true,
  //     });

  //     const modes = res.data.map(i => i._id.toLowerCase());
  //     const unique = [...new Set(modes)];

  //     setPaymentModes(unique);
  //   } catch (err) {
  //     console.error("Payment mode fetch error", err);
  //   }
  // };

  const fetchPaymentModes = async () => {
    if (!dashboardId) return;

    try {
      const res = await api.get(
        `/account/payment-modes/${dashboardId}`,
        { withCredentials: true }
      );

      const usageMap = {};
      res.data.forEach(item => {
        if (item._id) {
          usageMap[item._id.toLowerCase()] = item.count;
        }
      });

      // CASH always default
      const modeSet = new Set(["cash"]);
      Object.keys(usageMap).forEach(m => modeSet.add(m));

      const finalModes = Array.from(modeSet);

      setPaymentModes(finalModes);

      // 🔥 ensure selected mode valid
      setForm(prev => ({
        ...prev,
        paymentMode: finalModes.includes(prev.paymentMode)
          ? prev.paymentMode
          : "cash"
      }));

    } catch (err) {
      console.error("Payment mode fetch error", err);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  useEffect(() => {
    fetchPaymentModes();
  }, [dashboardId]); // 🔥 dashboard change → modes change

  // transection tags and category data fetch and showing in suggestion box
  const transactionCategories = useMemo(() => {
    return [
      ...new Set(
        transactions
          .flatMap(t =>
            t.description
              ? t.description.split(",").map(c => c.trim())
              : []
          )
          .filter(Boolean)
          .map(c => c.toLowerCase())
      )
    ];
  }, [transactions]);

  const transactionTags = useMemo(() => {
    return [
      ...new Set(
        transactions
          .flatMap(t => t.tags || [])
          .filter(Boolean)
          .map(t => t.toLowerCase())
      )
    ];
  }, [transactions]);

  // tags and category change handle 
  const handleCategoryChange = (value) => {
    setCategoryInput(value);
    setShowSuggestions(true);

    setFilteredCategories(
      transactionCategories.filter(cat =>
        cat.includes(value.toLowerCase())
      )
    );
  };

  const handleTagChange = (value) => {
    setTagInput(value);
    setShowTagSuggestions(true);

    setFilteredTags(
      transactionTags.filter(tag =>
        tag.includes(value.toLowerCase())
      )
    );
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

  // ADD NEW CATEGORY.......
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

  // REMOVE CATEGORY
  const removeCategory = (cat) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

   //  Type the word and press enter.(CATEGORY)
  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory(categoryInput);
    }
  };

  // ADD NEW TAGS.....................................
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
  // REMOVE TAGS
  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  

  //  Type the word and press enter.(TAGS)
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
              <label className="form-label">Payment Mode <span className="text-danger">*</span></label>

              <div className="edit-payment-mode">
                <button
                  type="button"
                  className="add-mode-btn d-flex align-items-center gap-1"
                  onClick={() => setShowModal(true)}
                >
                  <FiPlusCircle size={16} />
                  Add
                </button>
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
                      setFilteredCategories(transactionCategories);
                    }}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />

                  {/* ✅ SUGGESTION DROPDOWN LIST IN CATEGORY */}
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

                {/* SUGGESTION 5 CATEGOURY BTN */}
                {!showSuggestions && (
                  <div className="mt-2">
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addCategory(cat)}
                      >
                        + {cat}
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
                      setFilteredTags(transactionTags);
                    }}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  />

                  {/* SUGGESTION TAGS LIST */}
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

                {/* SUGGESTION 5  TAGS BTN */}
                {!showTagSuggestions && (
                  <div className="mt-2">
                    {tags.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addTag(tag)}
                      >
                       + {tag}
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
          <button className="btn btn-primary align-items-centerd-inline-flex gap-2" onClick={handleSubmit}>
            Save Transaction <FiSave />
          </button>
        </div>

      </div>
    </div>
  );
}
