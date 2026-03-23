// edit transection recode
import { useState, useEffect, useRef, useMemo } from "react";
import { FiX, FiSave, FiPlusCircle,FiChevronDown  } from "react-icons/fi";
import api from "../api/axios";
import "../styles/edit.css";
import { toast } from "react-toastify";
import { useCategoryTag } from "../context/CategoryTagContext";


export default function EditPopup({ id, onClose,transactions ,dashboardId,dashboards, onDashboardSwitch }){

  /* ================= STATE ================= */
  const [record, setRecord] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(dashboardId);
  const [originalDashboard, setOriginalDashboard] = useState(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingDashboard, setPendingDashboard] = useState(null);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    person: "",
    paymentMode: "cash",
    category: "",
    tags: "",
    relatedDetails: "",

  });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const safeDashboards = dashboards || [];

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

  const [settlementEnabled, setSettlementEnabled] = useState(false);
  const [settlementType, setSettlementType] = useState("receivable");
  const [otherUser, setOtherUser] = useState(null);


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

 const capitalizeFirst = (text = "") => {
    return text
      .split(" ")
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

   useEffect(() => {
    fetchRecord();
  }, [id]);
  // ..............................................................................................
  
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

      const isSettlementRecord = r.settlementId != null;
      setSettlementEnabled(isSettlementRecord);

      // settlement type
      if (r.settlementRole === "receivable") {
        setSettlementType("receivable");
      } else if (r.settlementRole === "payable") {
        setSettlementType("payable");
      }

      // other user
      if (isSettlementRecord) {
        setOtherUser(
          r.otherUserId?.name ||
          r.person?.name ||
          r.manualPersonName ||
          ""
        );
      } else {
            setOtherUser(null);
          }

      const mode = r.paymentMode?.toLowerCase() || "cash";

      setForm({
        amount: r.amount,
        person: r.manualPersonName || "",
        paymentMode: mode,
        type: r.type,
        relatedDetails: r.relatedDetails || "",
      });

      const initialDash = r.dashboardIds?.[0] || dashboardId;
      setSelectedDashboard(initialDash);
      setOriginalDashboard(initialDash);

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
    fetchPaymentModes();
  }, [dashboardId]); // 🔥 dashboard change → modes change

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
      )
    ];
  }, [transactions]);

  const transactionTags = useMemo(() => {
    return [
      ...new Set(
        transactions
          .flatMap(t => t.tags || [])
          .filter(Boolean)
      )
    ];
  }, [transactions]);



  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("dashboardId", selectedDashboard);

    // basic fields
    data.append("type", form.type);
    data.append("amount", form.amount);
    data.append("person", form.person);
    data.append("paymentMode", form.paymentMode);
    data.append("settlementType", settlementType);

    // arrays
    data.append("description", selectedCategories.join(", "));
    selectedTags.forEach(t => data.append("tags[]", t));
    data.append("relatedDetails", form.relatedDetails);

    // attachment
    if (attachment) {
      data.append("attachment", attachment);
    }

    try {
      await api.put(`/account/edit/${id}`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
        // 🔥 Dashboard changed?
    if (selectedDashboard !== originalDashboard) {
      setPendingDashboard(selectedDashboard);
      setShowSwitchConfirm(true);
    } else {
      toast.success("Transaction updated");
      onClose();
    }

    } catch (err) {
      console.error("Update error:", err);
      toast.error("Update failed");
    }
  };

   // tags and category change handle 

   const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(-1);
  const [focusedTagIndex, setFocusedTagIndex] = useState(-1);


   const allCategoryOptions = useMemo(() => {
    const merged = [
      ...transactionCategories,
      ...categories
    ];

    const unique = [];
    const seen = new Set();

    merged.forEach(cat => {
      const normalized = cat.trim().toLowerCase();

      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(cat.trim());
      }
    });

    return unique;
  }, [transactionCategories, categories]);

  const allTagOptions = useMemo(() => {
    const merged = [
      ...transactionTags,
      ...tags
    ];

    const unique = [];
    const seen = new Set();

    merged.forEach(tag => {
      const normalized = tag.trim().toLowerCase();

      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(tag.trim());
      }
    });

    return unique;
  }, [transactionTags, tags]);

  const handleCategoryChange = (value) => {
    setCategoryInput(value);
    setShowSuggestions(true);

    const filtered = allCategoryOptions.filter(cat =>
    cat.toLowerCase().includes(value.toLowerCase())
  );
  setFilteredCategories(filtered);
  };

  const handleTagChange = (value) => {
    setTagInput(value);
    setShowTagSuggestions(true);

    const filtered = allTagOptions.filter(tag =>
      tag.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredTags(filtered);

  };

  // ADD NEW CATEGORY...........................................................
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

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedCategoryIndex(prev =>
        prev < filteredCategories.length - 1 ? prev + 1 : 0
      );
    }

    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedCategoryIndex(prev =>
        prev > 0 ? prev - 1 : filteredCategories.length - 1
      );
    }

    else if (e.key === "Enter") {
      e.preventDefault();

      if (focusedCategoryIndex >= 0) {
        addCategory(filteredCategories[focusedCategoryIndex]);
      } else {
        addCategory(categoryInput);
      }

      setFocusedCategoryIndex(-1);
    }

    else if (e.key === "Tab") {
      if (categoryInput.trim()) {
        addCategory(categoryInput);
      }
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

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedTagIndex(prev =>
        prev < filteredTags.length - 1 ? prev + 1 : 0
      );
    }

    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedTagIndex(prev =>
        prev > 0 ? prev - 1 : filteredTags.length - 1
      );
    }

    else if (e.key === "Enter") {
      e.preventDefault();

      if (focusedTagIndex >= 0) {
        addTag(filteredTags[focusedTagIndex]);
      } else {
        addTag(tagInput);
      }

      setFocusedTagIndex(-1);
    }

    else if (e.key === "Tab") {
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    }
  };


  // dropdown open in select dashboard
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

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
            {settlementEnabled && otherUser && (
              <div className="mt-2">
                <label>With User</label>
                <p className="form-control-plaintext fw-semibold">
                  {capitalizeFirst(
                    typeof otherUser === "object"
                      ? otherUser.name
                      : otherUser
                  )}
                </p>
              </div>
            )}

            <label>Select Acconut <span className="text-danger">*</span></label>

            <div className="single-select mb-2" ref={dropdownRef}>
              <div
                className="dashboard-select"
                onClick={() => setShowDropdown(prev => !prev)}
              >
                
                {selectedDashboard
                  ? capitalizeFirst(
                      dashboards.find(d => d._id === selectedDashboard)?.name || ""
                    )
                  : "Select Dashboard"
                }
                <FiChevronDown />
              </div>

              {showDropdown && (
                <div className="suggestionBox list-group mt-1">
                  {dashboards.map(d => (
                    <div
                      key={d._id}
                      className={`list-group-item ${
                        selectedDashboard === d._id ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedDashboard(d._id);
                        setShowDropdown(false);
                      }}
                    >
                      {capitalizeFirst(d.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* TYPE */}
            <label>Type <span className="text-danger">*</span></label>

            <div
              className="type-slider"
              tabIndex={0}
              onKeyDown={(e) => {

                if (!settlementEnabled) {
                  if (e.key === "ArrowRight") {
                    setForm({ ...form, type: "expense" });
                  } else if (e.key === "ArrowLeft") {
                    setForm({ ...form, type: "income" });
                  }
                } else {
                  if (e.key === "ArrowRight") {
                    setSettlementType("receivable");
                  } else if (e.key === "ArrowLeft") {
                    setSettlementType("payable");
                  }
                }
              }}
            >

              {!settlementEnabled ? (
                <>
                  <div
                    className={`slider-option ${form.type === "income" ? "active income" : ""}`}
                    onClick={() => setForm({ ...form, type: "income" })}
                  >
                    Income
                  </div>

                  <div
                    className={`slider-option ${form.type === "expense" ? "active expense" : ""}`}
                    onClick={() => setForm({ ...form, type: "expense" })}
                  >
                    Expense
                  </div>

                  <div className={`slider-bg ${form.type}`}></div>

                </>
              ) : (
                <>
                  <div
                    className={`slider-option ${settlementType === "payable" ? "active expense" : ""}`}
                    onClick={() => setSettlementType("payable")}
                  >
                    I received money
                  </div>

                  <div
                    className={`slider-option ${settlementType === "receivable" ? "active income" : ""}`}
                    onClick={() => setSettlementType("receivable")}
                  >
                    I gave money
                  </div>

                  <div className={`slider-bg ${settlementType === "receivable" ? "expense" : "income"}`}></div>
                </>
              )}

            </div>
      
            {/* AMOUNT + PERSON */}
            <div className={`mt-2 ${settlementEnabled ? "" : "edit-grid-2"}`}>
  
              <div className={settlementEnabled ? "w-100" : ""}>
                <label>Amount <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  value={form.amount}
                  onChange={e =>
                    setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, "") }))
                  }
                  required
                />
              </div>

              {!settlementEnabled && (
                <div>
                  <label>
                    {form.type === "income" ? "Receiver Name" : "Payer Name"}
                  </label>
                  <input
                    className="form-control mt-2"
                    value={capitalizeFirst(form.person)}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        person: e.target.value
                      }))
                    }
                  />
                </div>
              )}

            </div>

            {/* PAYMENT MODE */}
            {!settlementEnabled && (
              <div className="mt-2">
                <label className="form-label">Payment Mode <span className="text-danger">*</span></label>

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

                  
                  {showModal && (
                    <div className="tag-modal-backdrop">
                      <div className="tag-modal">
                        <div className="modal-header mb-2">         
                          <h5 className="modal-title" style={{color:"#d9d8e2"}}>Add Payment Mode</h5>
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
                  <button
                    type="button"
                    className="add-mode-btn-edit d-flex align-items-center gap-1"
                    tabIndex={-1}
                    onClick={() => setShowModal(true)}
                  >
                    <FiPlusCircle size={16} />
                    Add
                  </button>
                </div>
              
              </div> 
            )}

            {/* CATEGORY + TAGS */}
            <div className="row mb-2">
              <div className="col-md-6 mt-2">
                <label className="form-label">Category</label>

                <div className="tag-input-wrapper position-relative">
                  {/* Selected categories */}
                  {selectedCategories.map((cat, i) => (
                    <span key={i} className="tag-chip">
                      {capitalizeFirst(cat)}
                      <button
                        type="button"
                        className="remove-btn"
                        tabIndex={-1}
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
                    onClick={() => {
                      setShowSuggestions(prev => !prev);   // 🔥 toggle
                      setFilteredCategories(allCategoryOptions);
                    }}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                   
                    onBlur={() => {
                      setTimeout(() => {
                        if (categoryInput.trim()) {
                          addCategory(categoryInput);
                        }
                        setFocusedCategoryIndex(-1);
                        setShowSuggestions(false);
                      }, 150);
                    }}

                  />

                  {/* ✅ SUGGESTION DROPDOWN LIST IN CATEGORY */}
                  {showSuggestions && (
                    <div className="suggestionBox list-group mt-1">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat, i) => (
                          <button
                            key={i}
                            type="button"
                            tabIndex={-1}
                           
                            className={`list-group-item list-group-item-action ${
                              i === focusedCategoryIndex ? "active" : ""
                            }`}

                            onMouseDown={() => addCategory(cat)}
                          >
                            {capitalizeFirst(cat)}
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
                        tabIndex={-1}
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addCategory(cat)}
                      >
                        + {capitalizeFirst(cat)}
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
                      {capitalizeFirst(tag)}
                      <button className="remove-btn" type="button" tabIndex={-1} onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}

                  <input
                    className="tag-input"
                    value={tagInput}
                    placeholder="Type & press Enter"
                    onChange={e => handleTagChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                   
                    onClick={() => {
                      setShowTagSuggestions(prev => !prev);   // 🔥 toggle
                      setFilteredTags(allTagOptions);
                    }}
                    
                    onBlur={() => {
                      setTimeout(() => {
                        if (tagInput.trim()) {
                          addTag(tagInput);
                        }
                        setFocusedTagIndex(-1);
                        setShowTagSuggestions(false);
                      }, 150);
                    }}

                  />

                  {/* SUGGESTION TAGS LIST */}
                  {showTagSuggestions && (
                    <div className="suggestionBox list-group mt-1">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag, i) => (
                          <button
                            key={i}
                            tabIndex={-1}
                            type="button"
                           
                            className={`list-group-item list-group-item-action ${
                              i === focusedTagIndex ? "active" : ""
                            }`}

                            onMouseDown={() => addTag(tag)}
                          >
                            {capitalizeFirst(tag)}
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
                        tabIndex={-1}
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => addTag(tag)}
                      >
                       + {capitalizeFirst(tag)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* RECORD DETAILS */}
            <div className="mb-3">
              <label className="form-label">Record Details</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter additional details..."
                value={form.relatedDetails}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    relatedDetails: e.target.value
                  }))
                }
              ></textarea>
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
                <a href={`/uploads/${currentFile.filename}`} target="_blank" tabIndex={-1}>
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
      {showSwitchConfirm && (
        <div className="modal-backdrop">
          <div className="modal-box danger">
            <h4>Switch Dashboard?</h4>
            <p>
              You selected {" "}  
              <strong>
                {capitalizeFirst(
                  dashboards.find(d => d._id === pendingDashboard)?.name || ""
                )}
              </strong> Account.
              <br />
              Do you want to switch to that Account?
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSwitchConfirm(false);
                  toast.success("Transaction updated");
                  onClose();
                }}

              >
                No
              </button>

              <button
                className="btn btn-success"
                onClick={() => {
                  onDashboardSwitch?.(pendingDashboard); 
                  toast.success("Transaction updated");
                  setShowSwitchConfirm(false);
                  onClose();
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
