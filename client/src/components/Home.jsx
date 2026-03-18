// DASHBOARD PAGE
import { useEffect,useMemo, useState, useRef  } from "react";
import { useNavigate } from "react-router-dom";
import robot from "../assets/robot.png";
import CountUp from "react-countup";
import Edit from "./Edit";
import { toast, ToastContainer } from "react-toastify";
import { socket } from "../socket";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axios";
import { FiPieChart, FiBarChart2, FiTrendingUp, FiCreditCard, FiFilter, FiDownload, FiEdit2, FiSave, FiPlusCircle, FiPlus,  FiTrash2 ,
   FiEdit, FiChevronDown, FiSettings 
} from "react-icons/fi";
import { FaRupeeSign, FaBell  } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,} from "recharts";
import { useCategoryTag } from "../context/CategoryTagContext";

/* ================= DASHBOARD ================= */
export default function Dashboard() {

  const navigate = useNavigate();
  
  const textRefs = useRef({});
  const [expandedId, setExpandedId] = useState(null);
  const [isClamped, setIsClamped] = useState({});
  
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const currentUserId = localStorage.getItem("userId");
  const [exportType, setExportType] = useState("");
  const [activeFilterIndex, setActiveFilterIndex] = useState(null);
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    person: "",
    category: "",
    payment: "",
    note: "",
    date: "",
    tags: [],
    relatedDetails: "",
  });
  
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionWrapperRef = useRef(null);
  const inputRefs = useRef({});
  const [filters, setFilters] = useState([
    { id: Date.now(), type: "all", value: "", values: [], start: "", end: "" }
  ]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
 
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null
  });

  // categoury
  const { categories, tags, updateCategories, updateTags} = useCategoryTag();
  const [showCatPopup, setShowCatPopup] = useState(false);
  const [tempCategories, setTempCategories] = useState([...categories]);
  const [categoryInput, setCategoryInput] = useState("");
  const [allCategories, setAllCategories] = useState([]);       // DB
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Tags
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [tempTags, setTempTags] = useState([...tags]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]);
  const tagRef = useRef(null);

  // POPUP SHOW
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});

  // payment mode 
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState("");
  const [customMode, setCustomMode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [paymentModeVersion, setPaymentModeVersion] = useState(0);
  
  
  const PAYMENT_COLORS = {
    cash: { bg: "#e5e7eb33", text: "#e5e7eb" },      // light grey
    bank: { bg: "#3b82f633", text: "#3b82f6" },      // blue
    upi: { bg: "#22c55e33", text: "#6ee7b7" },       // green
  };
  // settlement enable
  const [settlementEnabled, setSettlementEnabled] = useState(false);
  // other user ID input
  const [otherUserId, setOtherUserId] = useState("");
  // other user data
  const [otherUser, setOtherUser] = useState(null);
  // other user dashboards
  const [otherUserDashboards, setOtherUserDashboards] = useState([]);
  // selected dashboard
  const [selectedOtherDashboard, setSelectedOtherDashboard] = useState("");

  // settlement type
  const [settlementType, setSettlementType] = useState("payable");
  const handleSettlementToggle = (checked) => {

    setSettlementEnabled(checked);

    if (checked) {
      setSettlementType("payable");

      // reset normal type
      setForm(prev => ({
        ...prev,
        type: "income"
      }));
    }

  };

  // notifications
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // popup change dashboard

  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [originalDashboard, setOriginalDashboard] = useState(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingDashboard, setPendingDashboard] = useState(null);

  // 🔥 SINGLE selected dashboard for transaction
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  useEffect(() => {
    if (showPopup && activeDashboard && dashboards.length > 0) {
      setSelectedDashboard(activeDashboard);
    }
  }, [showPopup, activeDashboard, dashboards]);

  // Edit page 
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = showEdit ? "hidden" : "auto";
  }, [showEdit]);

  const [showAdd, setShowAdd] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [renamePopup, setRenamePopup] = useState(null);
  const [newName, setNewName] = useState("");

  // ...........................................................................................

  // add new dashboard
 
  useEffect(() => {
    api.get("/dashboard").then(res => {
      setDashboards(res.data);

      if (res.data.length > 0) {
        const savedId = localStorage.getItem("activeDashboardId");
        const exists = res.data.find(d => d._id === savedId);

        setActiveDashboard(exists ? savedId : res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [activeDashboard]);

  const fetchDashboard = async () => {
    if (!activeDashboard) return;

    const res = await api.get(`/account/home/${activeDashboard}`);
    setTransactions(
      Array.isArray(res.data.transactions)
        ? res.data.transactions
        : []
    );
  };

  useEffect(() => {
    if (showPopup && activeDashboard) {
      setSelectedDashboard(activeDashboard);
      setOriginalDashboard(activeDashboard);   // 🔥 store original
    }
  }, [showPopup, activeDashboard]);

 //  .............................................................................

  /* ================= SUMMARY (PURE FUNCTION) ================= */
  const calculateSummary = (data) => {
    const income = data
      .filter((i) => i.type === "income")
      .reduce((s, i) => s + Number(i.amount), 0);

    const expense = data
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + Number(i.amount), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  };

  const balancePercentage =
  summary.totalIncome > 0
    ? ((summary.balance / summary.totalIncome) * 100).toFixed(0)
    : 0;
  
  //  .............................................................................
  /* ================= EXPORT FILE HANDLE ================= */
  const handleExport = async () => {
    if (!exportType) {
      toast.warning("Please select export type");
      return;
    }

    if (!filteredData.length) {
     toast.info("No data to export");
      return;
    }

    let url = "";
    if (exportType === "csv") url = "/account/export/csv";
    if (exportType === "xlsx") url = "account/export/xlsx";
    if (exportType === "pdf") url = "/account/export/pdf";

    try {
      const res = await api.post(
        url,
        { data: filteredData },
        { responseType: "blob" } 
      );

      const blob = new Blob([res.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      link.download =
      exportType === "csv"
        ? "transactions.csv"
        : exportType === "xlsx"
        ? "transactions.xlsx"
        : "transactions.pdf";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      } catch (err) {
        console.error("Export error:", err);
        alert("Export failed");
    }
  };
  // ...........................................................................
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionWrapperRef.current &&
        !suggestionWrapperRef.current.contains(event.target)
      ) {
        setActiveSuggestions([]);
        setActiveFilterIndex(null);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e, f, index) => {

    if (e.key === "ArrowDown") {
      if (!activeSuggestions.length) return;
      e.preventDefault();
      setFocusedSuggestionIndex(prev =>
        prev < activeSuggestions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      if (!activeSuggestions.length) return;
      e.preventDefault();
      setFocusedSuggestionIndex(prev =>
        prev > 0 ? prev - 1 : activeSuggestions.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // 🔥 1. Arrow selection active
      if (
        focusedSuggestionIndex >= 0 &&
        activeSuggestions[focusedSuggestionIndex]
      ) {
        addChip(index, activeSuggestions[focusedSuggestionIndex]);
        setActiveSuggestions([]);
        setFocusedSuggestionIndex(-1);
        return;
      }

      const typedValue = f.value.trim().toLowerCase();
      if (!typedValue) return;

      const data = getFilteredDataExcept(index);
      const allSuggestions = getSuggestions(f.type, data);

      // 🔥 2. Exact match
      const exactMatch = allSuggestions.find(
        s => s.toLowerCase() === typedValue
      );

      if (exactMatch) {
        addChip(index, exactMatch);
        setActiveSuggestions([]);
        return;
      }

      // 🔥 3. Partial match (THIS FIXES YOUR ISSUE)
      const partialMatch = allSuggestions.find(
        s => s.toLowerCase().startsWith(typedValue)
      );

      if (partialMatch) {
        addChip(index, partialMatch);
        setActiveSuggestions([]);
        return;
      }

      // 🔥 4. Otherwise add typed value
      addChip(index, typedValue);
      setActiveSuggestions([]);
    }

    if (e.key === "Tab") {

      // 🔥 Only intercept if suggestion box is open
      if (activeSuggestions.length > 0) {
        e.preventDefault();

        if (
          focusedSuggestionIndex >= 0 &&
          activeSuggestions[focusedSuggestionIndex]
        ) {
          addChip(index, activeSuggestions[focusedSuggestionIndex]);
        } else {
          const typedValue = f.value.trim().toLowerCase();
          if (!typedValue) return;

          const data = getFilteredDataExcept(index);
          const allSuggestions = getSuggestions(f.type, data);

          const match = allSuggestions.find(s =>
            s.toLowerCase().startsWith(typedValue)
          );

          if (match) {
            addChip(index, match);
          } else {
            addChip(index, typedValue);
          }
        }

        setActiveSuggestions([]);
        setFocusedSuggestionIndex(-1);

        // 🔥 Important: manually move focus to next element
        setTimeout(() => {
          e.target.blur();
        }, 0);
      }

    }

    if (e.key === "Escape") {
      setActiveSuggestions([]);
    }
  };

  const addChip = (index, value) => {
  
    setFilters(prev => {
      const updated = [...prev];

      if (!updated[index].values.includes(value)) {
        updated[index].values = [...updated[index].values, value];
      }

      updated[index].value = "";
      return updated;
    });

    setFocusedSuggestionIndex(-1);

    // 🔥 auto focus back to input
    setTimeout(() => {
      inputRefs.current[index]?.focus();

      const data = getFilteredDataExcept(index);
      const suggestions = getSuggestions(filters[index].type, data);
      setActiveSuggestions(suggestions);
    }, 0);
  };


  const removeChip = (filterIndex, chipValue) => {
    setFilters(prev => {
      const updated = [...prev];
      updated[filterIndex].values =
        updated[filterIndex].values.filter(v => v !== chipValue);
      return updated;
    });
  };


  /* ================= Filter Transection ================= */
  const filteredData = useMemo(() => {
    // let data = [...transactions];
    let data = Array.isArray(transactions) ? [...transactions] : [];
    filters.forEach((f) => {
      if (f.type === "all" && f.value) {
          const values = f.value.split(",").map(v => v.trim().toLowerCase());

          data = data.filter(item =>
            values.some(v =>
              item.person?.toLowerCase().includes(v) ||
              item.description?.toLowerCase().includes(v) ||
              item.tags?.join(",").toLowerCase().includes(v) ||
              item.paymentMode?.toLowerCase().includes(v) ||
              item.type?.toLowerCase().includes(v)
            )
          );
          return;
      }
      if (f.type === "week" && f.value) {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (f.value === "current") {
          start.setDate(now.getDate() - now.getDay());
        }

        if (f.value === "last") {
          start.setDate(now.getDate() - now.getDay() - 7);
          end.setDate(start.getDate() + 6);
        }

        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        data = data.filter(item => {
          const d = new Date(item.date);
          return d >= start && d <= end;
        });
        return;
      }

      if (f.type === "month" && f.value !== "") {
        const month = Number(f.value);

        data = data.filter(item => {
          const d = new Date(item.date);
          return d.getMonth() === month;
        });
        return;
      }

      if (f.type === "year" && f.value) {
        const years = f.value.split(",").map(v => Number(v.trim()));

        data = data.filter(item => {
          const d = new Date(item.date);
          return years.includes(d.getFullYear());
        });
        return;
      }

      //  DATE FILTER
      if (f.type === "date" && f.start && f.end) {
        const startDate = new Date(f.start);
        const endDate = new Date(f.end);
        endDate.setHours(23, 59, 59, 999);

        data = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });
        return;
      }
      if (f.type === "type" && f.value) {
        data = data.filter(item => item.type === f.value);
        return;
      }

      // 🔥 Multi-value filters (chips)
      if (!f.values || f.values.length === 0) return;

      const values = f.values.map(v => v.toLowerCase());


      data = data.filter(item => {
        if (f.type === "recipient")
          return values.some(v => item.person?.toLowerCase().includes(v));

        if (f.type === "category")
          return values.some(v => item.description?.toLowerCase().includes(v));

        if (f.type === "tags")
          return values.some(v =>
            item.tags?.join(",").toLowerCase().includes(v)
          );

        if (f.type === "type")
          return values.includes(item.type);

        if (f.type === "paymentMode") {
          return values.some(v =>
            item.paymentMode?.toLowerCase().includes(v)
          );
        }

        
      });
    });
    return data;
  }, [transactions, filters]);

  
  /* =================Filter data Excepted or not  ================= */
  const getFilteredDataExcept = (activeIndex) => {
    let data = [...transactions];

    filters.forEach((f, i) => {
      if (i === activeIndex) return;
      if (!f.value || f.type === "all" || f.type === "date") return;
      if (f.type === "week" || f.type === "month" || f.type === "year")return true;
      const values = f.value.split(",").map(v => v.trim().toLowerCase());

      data = data.filter(item => {
        if (f.type === "recipient")
          return values.some(v => item.person?.toLowerCase().includes(v));

        if (f.type === "category")
          return values.some(v => item.description?.toLowerCase().includes(v));

        if (f.type === "tags")
          return values.some(v => item.tags?.join(",").toLowerCase().includes(v));

        if (f.type === "paymentMode")
          return values.some(v =>
          item.paymentMode?.toLowerCase().includes(v)
        );


        return true;
      });
    });

    return data;
  };

  // ............................................................
  const getUniqueCaseInsensitive = (arr) => {
    const map = new Map();

    arr.forEach(item => {
      if (!item) return;
      const lower = item.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, item);
      }
    });

    return Array.from(map.values());
  };

  /* ================= SUGGESTIONS DATA ================= */
  const getSuggestions = (type, data) => {
    if (type === "all") {
      const values = new Set();

      data.forEach(i => {
        if (i.person) values.add(i.person);
        if (i.description) values.add(i.description);
        if (i.type) values.add(i.type);
        if (i.paymentMode) values.add(i.paymentMode);

        if (i.tags?.length)
          i.tags.forEach(t => values.add(t));

        if (i.bankDetails?.bankName)
          values.add(i.bankDetails.bankName);

        if (i.upiDetails?.appName)
          values.add(i.upiDetails.appName);
      });

      return [...values];
    }
    if (type === "year") {
      return [ ...new Set(data.map(i => new Date(i.date).getFullYear()))].map(String);
    }
    if (type === "recipient")
      return getUniqueCaseInsensitive(
        data.map(i => i.person).filter(Boolean)
      );

    if (type === "category")
      return getUniqueCaseInsensitive(
        data.map(i => i.description).filter(Boolean)
      );

    if (type === "tags")
      return getUniqueCaseInsensitive(
        data.flatMap(i => i.tags || [])
      );


    if (type === "paymentMode") {
      return getUniqueCaseInsensitive(
        data.map(i => i.paymentMode).filter(Boolean)
      );
    }


    
    return [];
  };

  // SUGGESTION INPUT 
  const handleSuggestionInputChange = (e, f, index) => {
    updateFilter(f.id, "value", e.target.value);
    setActiveFilterIndex(index);

    const value = e.target.value;
    const parts = value.split(",");
    const current = parts[parts.length - 1].trim().toLowerCase();

    if (!current) {
      setActiveSuggestions([]);
      return;
    }

    const data = getFilteredDataExcept(index);
    const allSuggestions = getSuggestions(f.type, data);

    // ✅ EXACT MATCH → HIDE BOX
    if (allSuggestions.some(s => s.toLowerCase() === current)) {
      setActiveSuggestions([]);
      return;
    }

    const suggestions = allSuggestions.filter(s =>
      s.toLowerCase().includes(current)
    );

    setActiveSuggestions(suggestions);
  };

  /* ================= UPDATE SUMMARY WHEN FILTERS CHANGE ================= */
  useEffect(() => {
    const s = calculateSummary(filteredData);
    setSummary(s);
  }, [filteredData]);

  const addFilter = () => {
    setFilters(prev => [...prev, { 
      id: Date.now(), 
      type: "all", 
      value: "", 
      values: [],   // 🔥 important
      start: "", 
      end: "" 
    }]);
  };

  const removeFilter = (id) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFilter = (id, field, value) => {
    setFilters(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              [field]: value,
              ...(field === "type" && { value: "", values: [] })
            }
          : f
      )
    );

    // 🔥 close suggestion box when type changes
    if (field === "type") {
      setActiveSuggestions([]);
      setActiveFilterIndex(null);
      setFocusedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    if (!activeDashboard) return;

    api.get(`/account/home/${activeDashboard}`)
      .then(res => {
        setTransactions(
          Array.isArray(res.data.transactions)
            ? res.data.transactions
            : []
        );
      })
      .catch(err => {
        console.error(err);
        setTransactions([]);
      });
  }, [activeDashboard]);

  // capitalizeFirst
  const capitalizeFirst = (text) => {

    if (!text || typeof text !== "string") return "";

    return text
      .split(" ")
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  /* ================= CHECK DESCRIPTION OVERFLOW ================= */

  useEffect(() => {
    const newClampedState = {};

    requestAnimationFrame(() => {
      Object.keys(textRefs.current).forEach((id) => {
        const el = textRefs.current[id];

        if (el) {
          const isOverflowing =
            el.scrollHeight - el.offsetHeight > 1;  // 🔥 tolerance fix

          newClampedState[id] = isOverflowing;
        }
      });

      setIsClamped(newClampedState);
    });

  }, [filteredData]);
  
  /* ================= ADD TRANSACTION ================= */
  const addTransaction = async (e) => {
    e.preventDefault();
  
    if (!selectedDashboard) {
      toast.error("Please select a dashboard");
      return;
    }

    const formData = new FormData();

    formData.append("dashboardIds", selectedDashboard);
    formData.append("type", form.type);
    if (!amount || Number(amount) <= 0) {
      setErrors({ amount: "Please enter amount" });
      return;
    }
    formData.append("amount", amount);
    formData.append("person", form.person);
    formData.append("date",  form.date|| "");
    formData.append("tags", selectedTags.join(","));
    formData.append("description", selectedCategories.join(", "));
    formData.append("relatedDetails", form.relatedDetails);
    // ✅ settlement fields append
    formData.append("settlementEnabled", settlementEnabled ? "true" : "false");

    // Settlement enabled
    if (settlementEnabled) {

      // validations
      if (!otherUser || !otherUser._id) {
        toast.error("Select valid user");
        return;
      }

      if (!settlementType) {
        toast.error("Select settlement type");
        return;
      }

      // append settlement fields
      formData.append("settlementType", settlementType);
      formData.append("otherUserId", otherUser._id);

    } 
    // Settlement disabled
    else {

      formData.append("paymentMode", selectedMode);

    }

    if (file) {
      formData.append("attachment", file);
    }

    let newErrors = {};

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Please enter amount";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; //  stop submit
    }

    try {
      const res = await api.post("/account/add", formData, {
        withCredentials: true,
      });

      await fetchCategories();

      // 🔥 If dashboard changed → ask first
      if (selectedDashboard !== originalDashboard) {
        setPendingDashboard(selectedDashboard);
        setShowSwitchConfirm(true);
      } else {
        // Same dashboard → close + refresh
        setShowPopup(false);
        await fetchDashboard();
        toast.success(res.data.message || "Transaction added");
      }

      // Reset all states
      setForm({
        type: "income",      // default type
        amount: "",
        person: "",
        category: "",
        payment: "",
        note: "",
        date: "",
        tags: [],
        relatedDetails: "", 
      });

      setAmount("");
      setSelectedTags([]);
      setSelectedCategories([]);
      setCategoryInput("");
      setFilteredCategories(allCategories); // reset to all categories
      setShowSuggestions(false);
      setTagInput("");
      setShowTagSuggestions(false);
      setSelectedMode(paymentModes[0]?.name || "cash"); // default payment mode
      setFile(null);
      setErrors({});

      setSettlementEnabled(false);
      setOtherUserId("");
      setOtherUser(null);
      setSettlementType("receivable");
      
    } catch (err) {
      const msg =
      err.response?.data?.msg ||
      err.response?.data?.message ||
      "Something went wrong";

      toast.error(msg);
    }
   
  };

    
  /* ================= DELETE TRANSACTION ================= */

  const handleConfirmDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await api.post(`/account/delete/${id}`);
  
      // ✅ Remove deleted transaction from UI instantly
      setTransactions(prev => prev.filter(t => t._id !== id));

      // ✅ Reload current dashboard transactions
      if (activeDashboard) {
        const res = await api.get(`/account/home/${activeDashboard}`);
        setTransactions(
          Array.isArray(res.data.transactions)
            ? res.data.transactions
            : []
        );
      }
       setPaymentModeVersion(prev => prev + 1);
      // Optional refresh helpers
      fetchCategories();
      await fetchTags();

      toast.success("Record deleted successfully");

    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record");
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };


  const fetchUserByUserId = async (userId) => {
    if (!userId || !userId.trim()) return setOtherUser(null);

    try {
      const res = await api.get("/users/by-userid", {
        params: { name: userId.trim() }  // must match DB
      });
      if (res.data?.success && res.data?.user) setOtherUser(res.data.user);
      else setOtherUser(null);
    } catch (err) {
      setOtherUser(null);
    }
  };
 

  const fetchNotifications = async () => {

    try {

      const res = await api.get("/notifications");

      if (res.data?.success) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications([]);
      }

    } catch (err) {

      console.error("fetchNotifications error:", err);
      setNotifications([]);

    }

  };

  useEffect(()=>{
    fetchNotifications();
  },[]);

  useEffect(() => {

  const userId = localStorage.getItem("userId");

    socket.connect();
    socket.on("connect", () => {

      if(userId){
        socket.emit("join", userId);
      }

    });

    socket.on("newNotification",(data)=>{

      toast.info(data.message);
      fetchNotifications();
      playNotificationSound();
      showBrowserNotification(data);

    });
    
    socket.on("transactionUpdated",(data)=>{

      if(data?.dashboardId === activeDashboard){
        fetchDashboard();
      } 
    });

    return ()=>{
      socket.off("newNotification");
      socket.off("transactionUpdated");
      socket.disconnect();
    };

  },[]);

  useEffect(()=>{

    if("Notification" in window){

      if(Notification.permission === "default"){
        Notification.requestPermission().then(permission=>{
          console.log("Notification permission:",permission);
        });
      }

    }

  },[]);

  const notificationSound = new Audio("/cheerful-527.ogg?v=1");
 
  const requestNotificationPermission = async () => {

    if (!("Notification" in window)) {
      console.log("Browser does not support notifications");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      console.log("Permission:", permission);
    }

  };
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const showBrowserNotification = (data)=>{

    if(Notification.permission === "granted"){

      new Notification(data.title,{
        body:data.message,
        icon:"/logo.png"
      });
    

    } else {
      console.log("Notification blocked");
    }

  };

  const playNotificationSound = () => {

  notificationSound.currentTime = 0;
  notificationSound.play().catch(()=>{});

  };

  useEffect(()=>{

  document.addEventListener("click",()=>{

    notificationSound.play()
    .then(()=>{
      notificationSound.pause();
      notificationSound.currentTime = 0;
    })
    .catch(()=>{});

  },{once:true});

  },[]);

  const completeSettlement = async (settlementId) => {
    try {

      if (!settlementId) {
        console.log("No settlement id");
        return;
      }

      await api.post(`/settlement/pay/${settlementId}`);
     
      // fetchDashboard();
      await fetchDashboard();   // ✅ correct
      await fetchNotifications();

    } catch (err) {
      console.error("Settlement error:", err);
    }
  };

  //  .............................................................................

  /* ================= MONTH WISE COLUMN CHART DATA (ALL MONTHS) ================= */
  const monthWiseChartData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthMap = {};

    // initialize all months with 0
    months.forEach((m) => {
      monthMap[m] = { month: m, income: 0, expense: 0 };
    });

    (Array.isArray(transactions) ? transactions : []).forEach(t =>  {
      if (!t.date) return;

      const date = new Date(t.date);
      const month = date.toLocaleString("default", { month: "short" });

      if (monthMap[month]) {
        if (t.type === "income") {
          monthMap[month].income += Number(t.amount || 0);
        }
        if (t.type === "expense") {
          monthMap[month].expense += Number(t.amount || 0);
        }
      }
    });

    return months.map((m) => monthMap[m]);
  }, [transactions]);

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>

        {payload.map((item, index) => {
          const isIncome = item.dataKey === "income";

          return (
            <div key={index} className="tooltip-row">
              <span
                className="tooltip-dot"
                style={{
                  backgroundColor: isIncome ? "#34d399" : "#f87171",
                }}
              />

              <span
                className="tooltip-name"
                style={{
                  color: isIncome ? "#34d399" : "#f87171",
                }}
              >
                {item.name}
              </span>

              <span
                className="tooltip-value"
                style={{
                  color: isIncome ? "#34d399" : "#f87171",
                }}
              >
                ₹{item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  } 

  //  .............................................................................
  // Expense and income by Bank , UPI, Cash(Dynamic Pie / Donut)
  const normalizeMode = (mode) =>
  mode ? mode.toLowerCase() : "unknown";
  const paymentBreakdown = useMemo(() => {
    const map = {};

    (Array.isArray(transactions) ? transactions : []).forEach(t => {
    const amount = Number(t.amount || 0);
    const mode = normalizeMode(t.paymentMode);

      if (!map[mode]) {
        map[mode] = { income: 0, expense: 0 };
      }

      if (t.type === "income") {
        map[mode].income += amount;
      }

      if (t.type === "expense") {
        map[mode].expense += amount;
      }
    });

    return map;
  }, [transactions]);


 const paymentPieData = useMemo(() => {
  return Object.entries(paymentBreakdown)
    .map(([key, val]) => ({
      key,                              // cash / bank / upi / sbi
      name: key.toUpperCase(),          // CASH / BANK
      value: val.income + val.expense,
    }))
    .filter(i => i.value > 0);
  }, [paymentBreakdown]);

  function PaymentTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const key = payload[0].payload.key;
    const data = paymentBreakdown[key];

    if (!data) return null;

    const total = data.income + data.expense;

    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{key.toUpperCase()}</p>

        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: "#34d399" }} />
          <span>Income</span>
          <span>₹{data.income.toLocaleString()}</span>
        </div>

        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: "#f87171" }} />
          <span>Expense</span>
          <span>₹{data.expense.toLocaleString()}</span>
        </div>

        <hr />

        {/* <div className="tooltip-row">
          <strong>Total</strong>
          <strong>₹{total.toLocaleString()}</strong>
        </div> */}
      </div>
    );
  }

   
  const PAYMENTS_COLORS = {
    cash: "#f59e0b",
    bank: "#3b82f6",
    upi: "#22c55e",
  };

  const getRandomColors = () => {
    const colors = [
      "#a855f7", "#ec4899", "#14b8a6",
      "#d24411", "#6366f1", "#84cc16"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const colorMap = useRef({});


  //Savings Trend (Line Chart – 12 Months).......................

  const savingsTrend = useMemo(() => {
    return monthWiseChartData.map(m => ({
      month: m.month,
      savings: m.income - m.expense,
    }));
  }, [monthWiseChartData]);

  function DarkTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="custom-tooltip">
        {label && <p className="tooltip-label">{label}</p>}

        {payload.map((item, i) => (
          <div className="tooltip-row" key={i}>
            <span
              className="tooltip-dot"
              style={{ backgroundColor: item.color }}
            />
            <span className="tooltip-name">{item.name}</span>
            <span className="tooltip-value">₹{item.value}</span>
          </div>
        ))}
      </div>
    );
  }


  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //  .............................................................................

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

  const allCategoryOptions = useMemo(() => {
    const merged = [
      ...transactionCategories,
      ...categories,
      ...allCategories
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
  }, [transactionCategories, categories, allCategories]);

  const transactionTags = useMemo(() => {
    return [
      ...new Set(
        transactions
          .flatMap(t => t.tags || [])
          .filter(Boolean)
      )
    ];
  }, [transactions]);

  const allTagOptions = useMemo(() => {
    const merged = [
      ...transactionTags,
      ...tags,
      ...allTags
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
  }, [transactionTags, tags, allTags]);


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

  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(-1);
  const [focusedTagIndex, setFocusedTagIndex] = useState(-1);

  const handleCateKeyDown = (e) => {

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

  // categories filter and add ..........
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/account/categories", {
        withCredentials: true,
      });
      setAllCategories(res.data || []);
      setFilteredCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addCategory = (cat) => {
    const value = cat.trim();
    if (!value) return;

    const isDuplicate = selectedCategories.some(
      c => normalize(c) === normalize(value)
    );

    if (isDuplicate) return; 

    setSelectedCategories(prev => [...prev, value]);

    setCategoryInput("");
    setShowSuggestions(false);
  };

  const removeCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.filter((cat) => cat !== value)
    );
  };


  //  .............................................................................
  // sub tags filter and add  

  const addTag = (tag) => {
    const value = tag.trim();
    if (!value) return;

    const isDuplicate = selectedTags.some(
      t => normalize(t) === normalize(value)
    );

    if (isDuplicate) return;

    // ✅ add to selected tags
    setSelectedTags(prev => [...prev, value]);

    // ✅ add to allTags (for instant suggestion)
    setAllTags(prev => {
      const exists = prev.some(
        t => normalize(t) === normalize(value)
      );
      return exists ? prev : [...prev, value];
    });

    // reset input & suggestion
    setTagInput("");
    setFilteredTags([]);
    setShowTagSuggestions(false);
  };

  const fetchTags = async () => {
    try {
      const res = await api.get("/account/tags", {
        withCredentials: true,
      });
      setAllTags(res.data || []);
      setFilteredTags(res.data || []);
    } catch (err) {
      console.error("Fetch tags error:", err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };



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


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagRef.current && !tagRef.current.contains(e.target)) {
        setShowTagSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  //  .............................................................................

  // lover case and duplicate valve not show
  const normalize = (v) => v.trim().toLowerCase();

  // payment mode add in popup form 
  useEffect(() => {
    if (paymentModes.length && !selectedMode) {
      setSelectedMode(paymentModes[0].name);
    }
  }, [paymentModes]);


  useEffect(() => {
    if (!activeDashboard) return;

    const fetchModes = async () => {
      const res = await api.get(
        `/account/payment-modes/${activeDashboard}`
      );

      const usageMap = {};
      res.data.forEach(item => {
        if (item._id) {
          usageMap[item._id] = item.count;
        }
      });

      // CASH always default
      const modeSet = new Set(["cash"]);

      Object.keys(usageMap).forEach(m => {
        if (m !== "settlement") {   // ⭐ ADD THIS
          modeSet.add(m);
        }
      });

      const finalModes = Array.from(modeSet).map(name => ({
        name,
        count: usageMap[name] || 0,
      }));

      finalModes.sort((a, b) => b.count - a.count);

      setPaymentModes(finalModes);
      setSelectedMode(finalModes[0]?.name || "cash");
      setForm(prev => ({
        ...prev,
        paymentMode: finalModes[0]?.name || "cash"
      }));
    };

    fetchModes();
  }, [activeDashboard,paymentModeVersion]);


  //  .............................................................................

  // payment color codes........

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

  const EXTRA_COLORS = [
    { bg: "rgba(59, 246, 206, 0.2)", text: "#21adc2" }, // blue
    { bg: "rgba(234, 179, 8, 0.2)", text: "#facc15" },  // yellow
    { bg: "rgba(239, 68, 68, 0.2)", text: "#f87171" },  // red
    { bg: "rgba(139, 92, 246, 0.2)", text: "#c084fc" }, // purple
  ];

  const [paymentModeColors, setPaymentModeColors] = useState({});

  useEffect(() => {
    const map = {};
    let extraIndex = 0;

    paymentModes.forEach((mode) => {
      const key = mode.name.toLowerCase();
      if (PAYMENT_COLORS[key]) {
        map[key] = PAYMENT_COLORS[key];
      } else {
        map[key] = EXTRA_COLORS[extraIndex % EXTRA_COLORS.length];
        extraIndex++;
      }
    });

    setPaymentModeColors(map);
  }, [paymentModes]);

  
  // add new dashboard..............................................

  const refreshDashboard = async () => {
    if (!activeDashboard) return;

    const res = await api.get(`/account/home/${activeDashboard}`);
    setTransactions(
      Array.isArray(res.data.transactions)
        ? res.data.transactions
        : []
    );
  };

  const addDashboard = async () => {
    if (!dashboardName.trim()) return;

    const res = await api.post("/dashboard", { name: dashboardName });

    setDashboards(prev => [...prev, res.data]);
    setActiveDashboard(res.data._id);

    setDashboardName("");     // ✅ RESET INPUT
    setShowAdd(false);
  };

  // rename Dashboard
  const renameDashboard = async (id, name) => {
    await api.put(`/dashboard/${id}`, { name });

    setDashboards(d =>
      d.map(x => x._id === id ? { ...x, name } : x)
    );
  };

  const confirmDeletee = async () => {
    try {
      await api.delete(`/dashboard/${activeDashboard}`);

      localStorage.removeItem("activeDashboardId");

      // ✅ STEP 1: Fetch fresh dashboards from backend
      const resDash = await api.get("/dashboard");
      const newDashboards = resDash.data;

      setDashboards(newDashboards);

      // ✅ STEP 2: find default dashboard
      const defaultDash = newDashboards.find(d => d.isDefault);

      if (defaultDash) {
        setActiveDashboard(defaultDash._id);

        const res = await api.get(`/account/home/${defaultDash._id}`);
        setTransactions(
          Array.isArray(res.data.transactions)
            ? res.data.transactions
            : []
        );
      } else {
        setActiveDashboard(null);
        setTransactions([]);
      }

      setShowConfirm(false);

    } catch (err) {
      console.error(err);
    }
  };
  
  const dropdownRef = useRef(null);
 
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
    <div className="container">
      <div className="dashboard-bar">
        <button
          className="notification-btn"
          onClick={()=>navigate("/notifications")}
        >
          <FaBell />

          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount}
            </span>
          )}

        </button>
        <div className="dashboard-left">
          <select
            className="form-selectt border-2"
            value={activeDashboard || ""}
            onChange={(e) => {
              const id = e.target.value;
              setActiveDashboard(id);
              localStorage.setItem("activeDashboardId", id); // ✅ SAVE
            }}
          >
            {dashboards.map(d => (
              <option key={d._id} value={d._id}>
                {capitalizeFirst(d.name)} {d.isDefault ? "(Default)" : ""}
              </option>
            ))}
          </select>

          <button
            className="rename-btn"
            disabled={!activeDashboard}
            onClick={() => {
              const d = dashboards.find(x => x._id === activeDashboard);
              setRenamePopup(d);
              setNewName(d.name);
            }}
          >
            <FiEdit size={18} /> Rename
          </button>


          <button
            className="delete-btn"
            disabled={dashboards.length === 1}
            onClick={() => setShowConfirm(true)}
          >
            <FiTrash2 size={18} /> Delete
          </button>

        </div>

        {/* RIGHT SIDE – SELECT / RENAME / DELETE */}
        <div className="dashboard-right">

        
            <button className="edit-btn" onClick={() => setShowAdd(true)}>
            <FiPlus size={18} style={{ marginRight: "6px" }} />
            Add Acconut
          </button>
        </div>
      </div>

      {renamePopup && (
        <div className="modal-backdrop">
          <div className="popupp-box">
            <h4 style={{color:"#d9d8e2"}}>Rename Acconut </h4>

            <input
              type="text"
              className="form-inputt mb-3"
              value={capitalizeFirst(newName)}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={() => {
                  renameDashboard(renamePopup._id, newName);
                  setRenamePopup(null);
                }}
              >
                Save
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setRenamePopup(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {showAdd && (
        <div className="modal-backdrop">
          <div className="popupp-box ">
            <h4 style={{color:"#d9d8e2"}}>Add Acconut</h4>

            <input
              className="form-inputt mb-3"
              placeholder="Dashboard name"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn btn-primaryy" onClick={addDashboard}>Save</button>
              <button className="btn btn-secondary" 
              onClick={() => {
                setDashboardName("");   // ✅ RESET
                setShowAdd(false);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-box danger">
            <h4>Confirm Delete</h4>
            <b> "{capitalizeFirst(dashboards.find(d => d._id === activeDashboard)?.name)}" </b>
            <p> This Acconut and all its transactions will be deleted.</p>

            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDeletee}>
                Yes, Delete
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SUMMARY DashBoard .............................................*/}
      <div className="row mb-4">
        <SummaryCard title="Total Income" value={summary.totalIncome.toFixed(2)} color="income" />
        <SummaryCard title="Total Expense" value={summary.totalExpense.toFixed(2)} color="expense" />
        <SummaryCard title="Balance" value={summary.balance.toFixed(2)} color={
          summary.balance > 0
            ? "balance-positive"
            : summary.balance < 0
            ? "balance-negative"
            : "balance-zero"
        }  percentage={balancePercentage}/>
      </div>

      {/* tab transection list and graph */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions list
        </button>

        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Transection Graph Overview
        </button>

        <span
          className={`tab-slider ${
            activeTab === "transactions" ? "left" : "right"
          }`}
        />
      </div>
      {activeTab === "overview" && (
        <>
          {/* .......................................all graph.................................... */}
          {/* graph pie */}
          <div className="dual-chart-grid">
            <div className="chart-card dark">
              <h4 className="chart-title">
                <FiPieChart className="chart-icon pie" />
                  Transactions by Payment
              </h4>
              <p className="sub-text">Cash vs Bank vs UPI (Income + Expense)</p>
              {Array.isArray(transactions) && (
                <ResponsiveContainer width="100%" height={isMobile ? 190 : 235}>
                  <PieChart>
                    <text
                      x="50%"
                      y="48%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pie-center-title"
                    >
                      Balance
                    </text>

                    <text
                      x="50%"
                      y="56%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pie-center-value"
                    >
                      ₹{summary.totalIncome - summary.totalExpense}
                    </text>

                    <Pie
                      data={paymentPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={isMobile ? 40 : 55}
                      outerRadius={isMobile ? 75 : 110}
                      paddingAngle={3}
                      cornerRadius={3}
                    >
                      {paymentPieData.map((entry) => {
                        const key = entry.key;

                        if (!colorMap.current[key]) {
                          colorMap.current[key] =
                            PAYMENTS_COLORS[key] || getRandomColors();
                        }

                        return (
                          <Cell
                            key={key}
                            fill={colorMap.current[key]}
                          />
                        );
                      })}
                    </Pie>

                    <Tooltip content={<PaymentTooltip />} />

                    
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* ===== LEGEND BOX ===== */}
              <div className="pie-legend">
                {paymentPieData.map(item => (
                  <div key={item.key} className="legend-row">
                    <span
                      className="legend-dot"
                      style={{ background: colorMap.current[item.key] }}
                    />
                    <span>{item.name}</span>
                    {/* <strong>₹{item.value.toLocaleString()}</strong> */}
                  </div>
                ))}
              </div>       
            </div>

            {/* Savings Trend Chart*/}
            <div className="chart-card dark">
            
              <h4 className="chart-title"><FiTrendingUp className="chart-icon line" />Savings Trend</h4>
              <p className="sub-text">12-month savings performance</p>

                <ResponsiveContainer width="100%" height={isMobile ? 190 : 235}>
                  <LineChart data={savingsTrend}>

                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis  dataKey="month"
                      tick={{
                        fill: "#cbd5f5",
                        fontSize: isMobile ? 9 : 12
                      }}
                      interval={isMobile ? 1 : 0} 
                    />
                    <YAxis  tick={{ fill: "#cbd5f5", fontSize: isMobile ? 9 : 12 }} />
                      {/* ✅ PASTE HERE */}
                      <Tooltip  content={<DarkTooltip />} />

                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#22c55e"
                        strokeWidth={isMobile ? 2 : 3}
                        dot={{ r: isMobile ? 3 : 5 }}
                      />

                  </LineChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          {/* ================= MONTH WISE INCOME vs EXPENSE COLUMN CHART ================= */}
          <div className="bar-chart-card">
            <h4 className="chart-title"><FiBarChart2 className="chart-icon bar" />
              Monthly Overview
            </h4>
            <p className="sub-text">12-month income vs expenses comparison</p>
            <ResponsiveContainer width="100%" height={isMobile ? 260 : 350}>
              <BarChart
                data={monthWiseChartData}
                barCategoryGap={isMobile ? "25%" : "15%"}
                margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
              >
                {/* ===== GRADIENTS ===== */}
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>

                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  interval={isMobile ? 1 : 0}   // Skip every alternate month on mobile
                  angle={isMobile ? -35 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 40}
                  tick={{ fill: "#cbd5f5", fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis tick={{ fill: "#cbd5f5", fontSize: isMobile ? 10 : 12 }} />

                <Tooltip cursor={false} content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: isMobile ? "10px" : "13px",
                  }}

                />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="url(#incomeGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />

                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="url(#expenseGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}   

      {/* ..........................................filter transection and export data................................................................. */}
      {activeTab === "transactions" && (
        <>

          <div className="export-box mb-3">
            <div className="export-left">
              <select
                className="export-dropdown"
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option value="">Export Us..</option>
                <option value="csv">CSV File</option>
                <option value="xlsx">Excel File</option>
                <option value="pdf">PDF File</option>
              </select>

              <button
                className="export-action-btn"
                onClick={handleExport}
              >
                <FiDownload size={18} />
                <span className="btn-label">Export</span>
              </button>
            </div>
            {/* <h5 className="transaction-title"> Transactions list... </h5> */}

          </div>

          <div className="filters-container">
            {filters.map((f, index) => (
              <div
                key={f.id}
                className="d-flex align-items-center gap-1 mb-4 position-relative"
              >

                {/* FILTER TYPE */}
                <select
                  className="form-select border-2"
                  style={{ width: "200px" }}
                  value={f.type}
                  onChange={(e) => updateFilter(f.id, "type", e.target.value)}
                >
                  <option value="all">-- Select Filter --</option>
                  <option value="type">Type</option>
                  <option value="paymentMode">Payment Method</option>
                  <option value="recipient">Receiver/Payer</option>
                  <option value="category">Category</option>
                  <option value="tags">Tags</option>
                  <option value="date">Start & End Date</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>

                {/* INPUT AREA */}
                <div className="flex-grow-1 position-relative">

                  {/* ALL */}
                  {f.type === "all" && (
                    <input
                      className="form-control border-2"
                      placeholder="Search..."
                      value={capitalizeFirst(f.value) || ""}
                      onChange={(e) => handleSuggestionInputChange(e, f, index)}
                    />
                  )}

                  {/* TYPE */}
                  {f.type === "type" && (
                    <select
                      className="form-select border-2"
                      value={f.value || ""}
                      onChange={(e) => updateFilter(f.id, "value", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  )}


                  {/* RECIPIENT / CATEGORY / TAGS */}
                  {(f.type === "recipient" || f.type === "category" || f.type === "tags" || f.type === "paymentMode") && (
                    <>
                      <div className="chip-wrapper"ref={suggestionWrapperRef}>
                      {f.values?.map((val, i) => (
                        <div key={i} className="chip">
                          {capitalizeFirst(val)}
                          <span onClick={() => removeChip(index, val)}>✕</span>
                        </div>
                      ))}
                      <input
                        className="tag-input"
                        ref={el => inputRefs.current[index] = el}
                        placeholder="Search..."
                        value={f.value || ""}
                    
                        onClick={() => {
                          if (activeFilterIndex === index) {
                            // already open → close
                            setActiveFilterIndex(null);
                          } else {
                            // open new
                            setActiveFilterIndex(index);
                            setFocusedSuggestionIndex(-1);

                            const data = getFilteredDataExcept(index);
                            setActiveSuggestions(getSuggestions(f.type, data));
                          }
                        }}

                        onChange={(e) => handleSuggestionInputChange(e, f, index)}
                        onKeyDown={(e) => handleKeyDown(e, f, index)}
                      />
                       
                      {/* SUGGESTION BOX */}
                      {activeFilterIndex === index && activeSuggestions.length > 0 && (
                        <div className="suggestionBox list-group">
                          {activeSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`list-group-item list-group-item-action ${
                                i === focusedSuggestionIndex ? "active" : ""
                              }`}
                              onClick={() => addChip(index, s)}
                            >
                              {capitalizeFirst(s)}
                            </button>
                          ))}
                        </div>
                      )}
                      </div>
                    </>
                  )}

                  {/* DATE */}
                  {f.type === "date" && (
                    <div className="d-flex gap-1">
                      <input
                        type="date"
                        className="form-control border-2"
                        value={f.start || ""}
                        onChange={(e) => updateFilter(f.id, "start", e.target.value)}
                      />
                      <input
                        type="date"
                        className="form-control border-2"
                        value={f.end || ""}
                        onChange={(e) => updateFilter(f.id, "end", e.target.value)}
                      />
                    </div>
                  )}

                   {/* week */}
                  {f.type === "week" && (
                    <select
                      className="form-select border-2"
                      value={f.value || ""}
                      onChange={(e) => updateFilter(f.id, "value", e.target.value)}
                    >
                      <option value="">Select Week</option>
                      <option value="current">Current Week</option>
                      <option value="last">Last Week</option>
                    </select>
                  )}

                   {/* month */}
                  {f.type === "month" && (
                    <select
                      className="form-select border-2"
                      value={f.value || ""}
                      onChange={(e) => updateFilter(f.id, "value", e.target.value)}
                    >
                      <option value="">Select Month</option>
                      {[
                        "January","February","March","April","May","June",
                        "July","August","September","October","November","December"
                      ].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                  )}

                  {/* year */}
                  {f.type === "year" && (
                    <input
                      className="form-control border-2"
                      placeholder="2023, 2024..."
                      value={f.value || ""}
                      onChange={(e) => handleSuggestionInputChange(e, f, index)}
                    />
                  )}
                </div>
               

                {/* REMOVE */}
                {filters.length > 1 && (
                  <button className="close-btn" onClick={() => removeFilter(f.id)}>
                      <FiTrash2 size={17} color="red" />
                  </button>
                )}
                
                {/* ADD FILTER BUTTON (ONLY LAST ROW) */}
                {index === filters.length - 1 && (
                  <button className="plus-btnnx d-flex align-items-center gap-1" onClick={addFilter}>
                    <FiFilter size={15} />
                    Add Filter
                  </button>
                )}
              </div>
            ))}
          </div>


           {/* ....................................transection list recode card.................................... */}
          
          <ToastContainer position="top-center" autoClose={3000} />
          {filteredData.length > 0 ? (
            
            <div className="transaction-wrapper mt-3">
            
              {/* TRANSACTIONS */}
              {filteredData.map(item => (
                <div key={item._id} className="transaction-card">

                  {/* LEFT INFO */}
                  <div className="transaction-main">
                   
                    <div className="transaction-header">

                      {/* TYPE BADGE */}
                      <span
                        className={`type-badge ${
                          item.settlementStatus === "pending"
                            ? item.settlementRole === "receivable"
                              ? "to-receive"
                              : "to-pay"
                            : item.type
                        }`}
                      >

                        {item.settlementStatus === "pending"
                        ? item.settlementRole === "payable"
                            ? "TO GIVE"
                            : "TO TAKE"
                          : item.type.toUpperCase()}

                      </span>

                      {/* AMOUNT */}
                      <span
                        className={
                          item.settlementStatus === "pending"
                            ? item.settlementRole === "payable"
                              ? "amount pay-amount"
                              : "amount receive-amount"
                            : item.type === "income"
                            ? "amount income"
                            : "amount expense"
                        }
                      >
                        ₹{item.amount}
                      </span>
                    </div>
                 
                    <div className="transaction-details fixed">
                     
                      {item.settlementStatus === "pending" && (
                        <div className="rows">
                          <span className="label">Payment:</span>
                          <span className="value pending">Pending</span>
                        </div>
                      )}

                      {item.settlementStatus !== "pending" && (
                        <div className="rows">
                          <span className="label">Payment Mode:</span>
                          <span className="value">
                            {item.paymentMode?.toUpperCase() || "-"}
                          </span>
                        </div>
                        
                      )}
             
                      <div className="rows">
                       
                        <span className="label">
                          {item.type === "income" ? "Receiver: " : "Payer: "}
                        </span>
                        <span className="value" >
                          {/* {capitalizeFirst(item.person) || "-"} */}
                          {capitalizeFirst(
                              item.person?.name || item.manualPersonName
                            ) || "-"
                          }
                        </span>
                      </div>

                      <div className="rows">
                        <span className="label">Category: </span>
                        <span className="value">{capitalizeFirst(item.description) || "-"}</span>
                      </div>

                      <div className="rows">
                        <span className="label">Tags: </span>
                        <span className="value wrap">{item.tags?.map(tag => capitalizeFirst(tag)).join(", ") || "-"}</span>
                      </div>

                      {item.relatedDetails && (
                        <div className="rows full">
                          <span className="label">
                            Details:
                          </span>

                          <div className="details-wrapper">

                            <span
                              className={`value details-text ${
                                expandedId === item._id ? "expanded" : ""
                              }`}
                              ref={(el) => {
                                if (el) textRefs.current[item._id] = el;
                              }}
                            >
                              {item.relatedDetails}
                            </span>

                            {(isClamped[item._id] || expandedId === item._id) && (
                              <button
                                className="view-more-btn"
                                onClick={() =>
                                  setExpandedId(
                                    expandedId === item._id ? null : item._id
                                  )
                                }
                              >
                                {expandedId === item._id ? "Show Less" : "View More"}
                              </button>
                            )}

                          </div>
                        </div>
                      )}

                      {item.attachment && item.attachment !== "No File" && (
                        <div className="rows full">
                          <span className="label">Attachment :</span>
                          <a
                            className="value link"
                            href={`${import.meta.env.VITE_API_URL_UPLOADS}/uploads/${item.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.originalName}
                          </a>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* RIGHT ACTIONS */}
                  <div className="transaction-side">
                    <small>
                      {new Date(item.date).toLocaleString()}
                    </small>
                    
                    {/* STATUS BADGES */}

                    {item.settlementStatus === "pending" && (
                      <span
                        className={`pending-badge ${
                          item.settlementRole === "payable"
                            ? "pay-text"
                            : "receive-text"
                        }`}
                      >
                        {item.settlementRole === "payable"
                          ? `You need to pay ${item.person?.name || item.manualPersonName}`
                          : `You will receive from ${item.person?.name || item.manualPersonName}`}
                      </span>
                    )}

                    {item.paymentMode === "settlement" &&
                      item.settlementStatus === "settled" &&
                      item.settlementRole === "receivable" && (
                        <span className="completed-badge receive">
                          Settlement Received
                        </span>
                    )}

                    {item.paymentMode === "settlement" &&
                      item.settlementStatus === "settled" &&
                      item.settlementRole === "payable" && (
                        <span className="completed-badge paid">
                          Settlement Paid
                        </span>
                    )}

                    {item.settlementStatus === "settled" &&
                      item.paymentMode !== "settlement" && (
                        <span className="completed-badge neutral">
                          Settled
                        </span>
                    )}
                    <div className="action-buttons d-flex gap-2">
                      {item.settlementStatus === "pending" && (
                          <button
                            className="settle-btn"
                            onClick={() => completeSettlement(item.settlementId)}
                          >
                            Settle
                          </button>
                        )} 
                        {item.paymentMode !== "settlement" && (
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditId(item._id);
                              setShowEdit(true);
                            }}
                          >
                            <FiEdit2 /> Edit
                          </button>
                        )}            
                    
                        {/* <button
                          className="edit-btn"
                          onClick={() => {
                            setEditId(item._id);
                            setShowEdit(true);
                          }}
                        >
                          <FiEdit2 /> Edit
                        </button> */}
                      
                        {/* <button
                          className="delete-btn d-flex align-items-center gap-1"
                          onClick={() => setConfirmDelete({ show: true, id: item._id })}
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button> */}
                      {(
                        item.settlementStatus !== "pending" ||
                        item.createdBy === currentUserId
                      ) && (
                        <button
                          className="delete-btn d-flex align-items-center gap-1"
                          onClick={() => setConfirmDelete({ show: true, id: item._id })}
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      )}
   
                    </div>
                  </div>

                </div>
              ))}
            </div>
            ) : (
              <div className="no-records">
                <h5>No records found</h5>
                <p>Add transactions to see them here.</p>
              </div>
            )
          }

          <div style={{marginTop:20}} ></div> 
          {confirmDelete.show && (
            <div className="confirm-modal-backdrop">
              <div className="confirm-modal">
                <p>Delete this record?</p>
                <div className="confirm-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmDelete({ show: false, id: null })}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleConfirmDelete(confirmDelete.id)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {/*show edit recode popup   */}
            {showEdit && (
              <div className="edit-overlay">
                <div className="edit-modal">
                  <Edit
                    id={editId}
                    transactions={transactions}
                    dashboardId={activeDashboard}
                    dashboards={dashboards}
                    onDashboardSwitch={(newDash) => {
                      setActiveDashboard(newDash);   // 🔥 ADD THIS
                      refreshDashboard();
                    }}
                    onClose={() => {
                      setShowEdit(false);
                      setPaymentModeVersion(v => v + 1);
                       refreshDashboard();
                    }}
                  />
                </div>
              </div>
            )}
        </>
      )}

      {/* ........................................add transection recode popup box............................................... */}
      <button className="robot-add-btn"  onClick={() => {
        if (!activeDashboard) {
          toast.error("Please select a dashboard first");
          return;
        }
        setShowPopup(true);
      }}>
        <img src={robot} alt="Add Transaction Robot" />
          <div className="robot-msg">
            Add<br />Transaction
          </div>
      </button>

      {/* POPUP FORM */}
      {showPopup && (
        <div className="popup-overlay">
           <div className="popup-box">
             
            <div className="popup-header">
              <h3 className=" text-center">Add Transaction</h3>
              <span className="close-btn" onClick={() => setShowPopup(false)}>
                &times;
              </span>
            </div>
            <div className="popup-body">
              <form id="transactionForm" className="center" onSubmit={addTransaction} encType="multipart/form-data">
                <label>
                  Select Acconut <span className="text-danger">*</span>
                </label>

                <div className="single-select" ref={dropdownRef}>
                  {/* HEADER */}
                  <div
                    className="dashboard-select mb-2"
                    onClick={(e) => {
                      e.stopPropagation();      // 🔥 important
                      setShowDropdown(prev => !prev);
                    }}
                  >
                  {selectedDashboard
                    ? capitalizeFirst(
                        dashboards.find(d => d._id === selectedDashboard)?.name || ""
                      )
                    : "Select Dashboard"}

                    <FiChevronDown className="dropdown-icon" />
                  </div>

                  {/* LIST */}
                  {showDropdown && (
                    <div className="suggestionBox list-group mt-1">
                      {dashboards.map(d => (
                        <div
                          key={d._id}
                          className={`list-group-item list-group-item-action ${
                            selectedDashboard === d._id ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedDashboard(d._id); // 🔥 change selection
                            setShowDropdown(false);
                          }}
                        >
                          {capitalizeFirst(d.name)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* settlement checkbox */}

                <div className="settlement-toggle mt-3">

                  <input
                    type="checkbox"
                    checked={settlementEnabled}
                    onChange={(e)=>handleSettlementToggle(e.target.checked)}
                  />

                  <span className="settlement-label">
                    Enable settlement with another user
                  </span>

                </div>
                {settlementEnabled && (

                  <div className="settlement-box">

                    {/* USER SEARCH */}
                    <div className="user-search-row">

                      <div className="user-input">
                        <label>
                          Enter User ID <span className="text-danger">*</span>
                        </label>

                        <input
                          type="text"
                          className="form-control"
                          value={otherUserId}
                          onChange={(e)=>{
                            setOtherUserId(e.target.value);
                            fetchUserByUserId(e.target.value);
                          }}
                        />
                      </div>

                    </div>

                  </div>

                )}

                <label>Type <span className="text-danger">*</span></label>
                <div className="type-slider">

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

                      <input type="hidden" name="type" value={form.type} />

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
               
                <div className="row mb-2">
                  <div className={`${settlementEnabled ? "col-md-12" : "col-md-6"} mt-2`}>
                    
                      <label>Amount <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="amount"
                          className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                          autoComplete="off"
                          value={amount}
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) {
                              setAmount(value);
                              setErrors(prev => ({ ...prev, amount: "" }));
                            }
                          }}
                        />

                        {errors.amount && (
                          <div className="invalid-feedback">
                            {errors.amount}
                          </div>
                        )}
                      
                  </div>
                  {!settlementEnabled && (
                    <div className="col-md-6 mt-2">
                      
                      <label>
                        {form.type === "income" ? "Receiver Name" : "Payer Name"}                     
                      </label>
                      <input className="form-control mt-2"
                        type="text"
                        name="person"
                        autoComplete="off"
                        value={form.person}            // ✅ bind to state
                        onChange={(e) =>
                          setForm({ ...form, person: e.target.value })  // ✅ update state
                        }
                      />
                    </div>
                  )}
                </div>

                {!settlementEnabled && (
                  <div className="mb-2"> 
                    <label>
                      Payment Mode <span className="text-danger">*</span>
                    </label>
                    <div className="payment-mode">
                    
                      {/* redio btn payment mode */}
                      {paymentModes.map((m, i) => {
                        const modeName = m?.name;
                        if (!modeName) return null;
                        

                        const key = normalize(modeName);
                        const color = paymentModeColors[key] || getRandomColor();

                        return (
                          
                          <label key={i} className="radio-item">
                            <input
                              type="radio"
                              name="paymentMode"
                              value={modeName}
                              checked={selectedMode === modeName}
                              onChange={() => {
                                setSelectedMode(modeName);
                                setForm(prev => ({ ...prev, paymentMode: modeName }));
                              }}
                            />

                            <span className="custom-radio"></span>

                            <span
                              className="mode-text pay-badge"
                              style={{
                                background: color.bg,
                                color: color.text,
                                minWidth: 60,
                                textAlign: "center",
                                fontWeight: 600,
                              }}
                            >
                              {modeName.toUpperCase()}
                              {/* ({m.count}) */}
                            </span>
                          </label>
                        );
                        
                      })}

                      {/* add payment mode popup box */}
                      <div className="add-mode-wrapper">
                        
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
                                className="form-control mb-3"
                                // placeholder="Enter new tag"
                                value={customMode}
                                  onChange={e => setCustomMode(e.target.value)}
                              />

                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setShowModal(false)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => {
                                  
                                  const newMode = normalize(customMode);

                                  if (!newMode) return;

                                  const exists = paymentModes.some(
                                    m => normalize(m.name) === newMode
                                  );

                                  if (exists) {
                                    toast.error("Payment mode already exists");
                                    return;
                                  }

                                  setPaymentModes(prev => [...prev, { name: newMode, count: 0 }]);
                                  setSelectedMode(newMode);
                                  setForm(prev => ({ ...prev, paymentMode: newMode }));

                                  setCustomMode("");
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
                      {/* add more payment mode */}
                      <button
                        type="button"
                        className="add-mode-btn "
                        tabIndex={-1}
                        onClick={() => setShowModal(true)}
                      >
                        <FiPlusCircle className="add-icon" />
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="row mb-2">
                  <div className="col-md-6 mt-2">
                    <div className="mb-2 position-relative">
                      <label className="form-label">Category</label>
                      <div className="tag-input-wrapper">
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

                        <input
                          className="tag-input"
                          value={categoryInput}
                          autoComplete="off"
                          placeholder="Type Category "
                         
                          onMouseDown={() => {
                            setShowSuggestions(prev => !prev);   // 🔥 toggle
                            setFilteredCategories(allCategoryOptions);
                          }}

                          onChange={(e) => handleCategoryChange(e.target.value)}
                          onKeyDown={handleCateKeyDown}
                         
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
                      </div>
                      {/*  category suggestion list  */}
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
                      {/* add category 5 btn  */}
                     
                      {!showSuggestions && (
                        <div className="category-section mt-2">
                          {/* SETTINGS ICON */}
                          <button
                            className="settings-btn"
                            type="button"
                            tabIndex={-1}
                           
                           onClick={() => {
                            setTempCategories([...categories]); // 🔥 MUST
                            setShowCatPopup(true);
                          }}
                          >
                            <FiSettings size={20} className="settings-spin" />
                          </button>

                          {/* CATEGORY BUTTONS */}
                          <div className="category-buttons">
                            {categories.map((cat, i) => (
                              <button
                                key={i}
                                type="button"
                                tabIndex={-1}
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => addCategory(cat)}
                              >
                                + {capitalizeFirst(cat)}
                              </button>
                            ))}
                          </div>
                        </div>

                      )}

                 
                      {showCatPopup && (
                        <div className="popupp-overlay">
                          <div className="popupp-box">

                            {/* 🔹 HEADER */}
                            <div className="popupp-header">
                              <h5 style={{ color: "#38bdf8" }}>Edit Categories</h5>

                            </div>

                            {/* 🔹 BODY (SCROLLABLE INPUT AREA) */}
                            <div className="popupp-body">
                              {tempCategories.map((cat, i) => (
                                <div key={i} className="tag-input-row">
                                  <input
                                    className="form-control"
                                    value={cat}
                                    onChange={(e) => {
                                      const updated = [...tempCategories];
                                      updated[i] = e.target.value;
                                      setTempCategories(updated);
                                    }}
                                  />

                                  <button
                                    type="button"
                                    className="close-btn"
                                    onClick={() => {
                                      const updated = tempCategories.filter((_, index) => index !== i);
                                      setTempCategories(updated);
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* 🔹 FOOTER */}
                            <div className="popupp-footer">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => setTempCategories([...tempCategories, ""])}
                              >
                                {/* + Add Category */}
                                <span className="add-icon">+</span>
                                <span className="add-text">Add Category</span>
                              </button>

                              <div className="footer-actions">
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setTempCategories([...categories]);
                                    setShowCatPopup(false);
                                  }}
                                >
                                  Cancel
                                </button>

                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => {
                                    const cleaned = tempCategories
                                      .map(c => c.trim())
                                      .filter(Boolean);

                                    updateCategories(cleaned);
                                    setShowCatPopup(false);
                                  }}
                                >
                                  Update
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                  <div className="col-md-6 mt-2">
                    <label className="form-label">Tags</label>

                    <div className="tag-input-wrapper position-relative" ref={tagRef}>
                      {/* SELECTED TAGS */}
                      {selectedTags.map((tag, i) => (
                        <span key={i} className="tag-chip">
                          {capitalizeFirst(tag)}
                          <button
                            type="button"
                            className="remove-btn"
                            tabIndex={-1}
                            onClick={() => removeTag(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* INPUT */}
                      <input
                        className="tag-input"
                        value={tagInput}
                        autoComplete="off"
                        placeholder="Type Tag"
              
                        onMouseDown={() => {
                          setShowTagSuggestions(prev => !prev);
                          setFilteredTags(allTagOptions);
                        }}
                        onChange={(e) => handleTagChange(e.target.value)}
                        onKeyDown={handleTagKeyDown}
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

                      {/* ✅ SUGGESTION BOX TAGS */}
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
                              No tag found. Press Enter to add
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 5 FIXED TAG BUTTONS */}
                    {!showTagSuggestions && (
                      <div className="tag-section mt-2">
                        <button
                          className="settings-btn-tags"
                          tabIndex={-1}
                          type="button"
                          
                          onClick={() => {
                            setTempTags([...tags]); // 🔥 MUST
                            setShowTagPopup(true);
                          }}
                        >
                          <FiSettings size={20} className="settings-spin " />
                        </button>

                        <div className="tag-buttons">
                          {tags.map((tag, i) => (
                            <button
                              key={i}
                              type="button"
                              tabIndex={-1}
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => addTag(tag)}
                            >
                              + {capitalizeFirst(tag)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showTagPopup && (
                      <div className="popupp-overlay">
                        <div className="popupp-box">

                          {/* 🔹 HEADER */}
                          <div className="popupp-header">
                            <h5 className=" mb-3" style={{ color: "#38bdf8" }}>Edit Tags</h5>
                          
                          </div>

                          {/* 🔹 BODY (SCROLLABLE INPUT AREA) */}
                          <div className="popupp-body">
                            {tempTags.map((tag, i) => (
                              <div key={i} className="tag-input-row">
                                <input
                                  className="form-control"
                                  value={tag}
                                  onChange={(e) => {
                                    const updated = [...tempTags];
                                    updated[i] = e.target.value;
                                    setTempTags(updated);
                                  }}
                                />

                                <button
                                  type="button"
                                  className="close-btn"
                                  onClick={() => {
                                    const updated = tempTags.filter((_, index) => index !== i);
                                    setTempTags(updated);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* 🔹 FOOTER */}
                          <div className="popupp-footer">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setTempTags([...tempTags, ""])}
                            >
                              {/* + Add Tag */}
                              <span className="add-icon">+</span>
                              <span className="add-text">Add Tag</span>
                            </button>

                            <div className="footer-actions">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setTempTags([...tags]);
                                  setShowTagPopup(false);
                                }}
                              >
                                Cancel
                              </button>

                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  const cleaned = tempTags
                                    .map(t => t.trim())
                                    .filter(Boolean);

                                  updateTags(cleaned);
                                  setShowTagPopup(false);
                                }}
                              >
                                Update
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>   
                </div>
                {/* RECORD DETAILS TEXTAREA */}
                <div className="mb-2">
                  <label>Record Details</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter additional details..."
                    value={form.relatedDetails}
                    onChange={(e) =>
                      setForm({ ...form, relatedDetails: e.target.value })
                    }
                  ></textarea>
                </div>
                <label>Attachment</label>
                <div className="mb-1 file-wrapper">
                  <input type="file" className="form-control file-input" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <div id="tagHolder" className="mt-3"></div>
 
              </form>
            </div>
            <div className="popup-footer">
              <button type="submit" form="transactionForm"  className="btn btn-primary align-items-centerd-inline-flex gap-2 ">
                 Save Transaction <FiSave size={19} />
              </button>
            </div>
          </div>
        </div>
      )}
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
                onClick={async () => {
                  setShowSwitchConfirm(false);
                  setShowPopup(false);   // 🔥 close after decision
                  await fetchDashboard();
                   toast.success("Transaction added successfully");
                }}
              >
                No
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  setActiveDashboard(pendingDashboard);
                  localStorage.setItem("activeDashboardId", pendingDashboard);

                  setShowSwitchConfirm(false);
                  setShowPopup(false);   // 🔥 close after decision
                   toast.success("Transaction added successfully");
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


 
// ================= REUSABLE SUMMARY CARD =================.....................................................
function SummaryCard({ title, value, color, percentage }) {
  const icons = {
    income: <FaRupeeSign />,
    expense: <FiCreditCard />,
    "balance-positive": <FiTrendingUp />,
    "balance-negative": <FiTrendingUp />,
    "balance-zero": <FiTrendingUp />,
  };

 

const hasAnimated = useRef(false);

 const getDuration = (val) => {
  const amount = Math.abs(val);

  if (amount < 1_000) return 0.8;           // below 1,000
  if (amount < 10_000) return 1.2;          // below 10,000
  if (amount < 100_000) return 1.8;         // below 1,00,000 (1 lakh)
  if (amount < 1_000_000) return 2.5;       // below 10,00,000 (10 lakh)
  if (amount < 10_000_000) return 3.2;      // below 1,00,00,000 (1 crore)

  return 3.8;                               // very large amounts
};

  return (
    <div className="col-md-4">
      <div className={`summary-card summary-${color}`}>
        
        {/* LEFT TEXT */}
        <div className="summary-content">
          <h6 className="summary-title">{title}</h6>

          <h3 className="summary-value">
            {value < 0 && "-"}₹
          <CountUp
            end={Math.abs(value)}
            duration={!hasAnimated.current ? getDuration(value) : 0}
            separator=","
            formattingFn={(n) =>
              n.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })
            }
            onEnd={() => {
              hasAnimated.current = true;  
            }}
          />
          </h3>

          <span className="summary-sub">
            {percentage !== undefined
              ? `${percentage}% of ${percentage < 0 ? "expense" : "income"}`
              : "Amount"}
          </span>
        </div>

        {/* RIGHT ICON */}
        <div className="summary-icon">
          {icons[color]}
        </div>

      </div>
    </div>
  );
}

