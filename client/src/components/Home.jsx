import { useEffect,useMemo, useState, useRef  } from "react";
import robot from "../assets/robot.png";
import CountUp from "react-countup";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axios";
import { FiPieChart, FiBarChart2, FiTrendingUp, FiCreditCard, FiFilter,FiDownload ,FiEdit2, FiTrash2, FiSave,FiPlusCircle   } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";

/* ================= DASHBOARD ================= */
export default function Dashboard() {

  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
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
  });
  const [filters, setFilters] = useState([{ id: Date.now(), type: "all", value: "", start: "", end: "" }]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
 
  // categoury
  const fixedCategories = ["Goods", "Salary", "Rent", "Food", "Travel"];
  const [categoryInput, setCategoryInput] = useState("");
  const [allCategories, setAllCategories] = useState([]);       // DB
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // sab tags
  const fixedTags = ["office", "personal", "urgent", "family", "emi"];
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]);
  
  const tagRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  
  const [showPopup, setShowPopup] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});

  // payment mode 
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState("");
  const [customMode, setCustomMode] = useState("");
  const [showModal, setShowModal] = useState(false);
  // ............................................................................. 

  const PAYMENT_COLORS = {
    cash: { bg: "#e5e7eb33", text: "#e5e7eb" },      // light grey
    bank: { bg: "#3b82f633", text: "#3b82f6" },      // blue
    upi: { bg: "#22c55e33", text: "#6ee7b7" },       // green
  };
  const [paymentColors, setPaymentColors] = useState(PAYMENT_COLORS);

  //  .............................................................................

  /* ================= FETCH DASHBOARD ================= */
  useEffect(() => {
    fetchDashboard();
    
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get(
        "/account/home",
        {
          withCredentials: true,
        }
      );
      const data = res.data.accounts || [];
      setAccounts(data);
      setTransactions(data);   
      setSummary(calculateSummary(data));
    } catch (err) {
        console.error("Dashbord error:", err);
      }
  };
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
      alert("Please select export type");
      return;
    }

    if (!filteredData.length) {
      alert("No data to export");
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

  /* ================= Filter Transection ================= */
  const filteredData = useMemo(() => {
    let data = [...transactions];
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

      if (!f.value) return;

      const values = f.value.split(",").map(v => v.trim().toLowerCase());

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
      return [
        ...new Set(
          data.map(i => new Date(i.date).getFullYear())
        )
      ].map(String);
    }
    if (type === "recipient")
      return [...new Set(data.map(i => i.person).filter(Boolean))];

    if (type === "category")
      return [...new Set(data.map(i => i.description).filter(Boolean))];

    if (type === "tags")
      return [...new Set(data.flatMap(i => i.tags || []))];

    if (type === "paymentMode") {
      return [
        ...new Set(
          data
            .map(i => i.paymentMode)
            .filter(Boolean)
            .map(v => v.toLowerCase())
        )
      ];
    }

    
    return [];
  };

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

  
  /* ================= Select Suggestion Data Name ================= */
  const selectSuggestion = (index, suggestion) => {
    setFilters(prev => {
      const updated = [...prev];
      const value = updated[index].value || "";

      const parts = value.split(",");
      parts[parts.length - 1] = " " + suggestion;

      updated[index] = {
        ...updated[index],
        value: parts.join(",").trimStart()
      };

      return updated;
    });
    setActiveSuggestions([]);
  };

  //  .............................................................................

  /* ================= UPDATE SUMMARY WHEN FILTERS CHANGE ================= */
  useEffect(() => {
    const s = calculateSummary(filteredData);
    setSummary(s);
  }, [filteredData]);

  /* ================= FILTER CONTROLS ================= */
  const addFilter = () => {
   setFilters(prev => [...prev, { id: Date.now(), type: "all", value: "", start: "", end: "" }]);
  };

  const removeFilter = (id) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFilter = (id, field, value) => {
   setFilters(prev =>
      prev.map(f => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  /* ================= ADD TRANSACTION ================= */
  const addTransaction = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append("type", form.type);
    formData.append("amount", amount);
    formData.append("person", form.person);
    formData.append("date",  form.date|| "");
    formData.append("paymentMode", selectedMode);
    formData.append("tags", selectedTags.join(","));
    formData.append("description", selectedCategories.join(", "));

    if (file) {
      formData.append("attachment", file);
    }

     let newErrors = {};

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Please enter amount";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // ❌ stop submit
    }
    try {
      await api.post(
        "/account/add",
        formData,
        { 
          withCredentials: true 
        }
      );

      await fetchDashboard();
      await fetchCategories();
      setShowPopup(false);

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

      // await fetchDashboard();
      // await fetchCategories();
      // setShowPopup(false);

      // setSelectedTags([]);
      // // setShowTagDropdown(false);
      // setShowTagSuggestions(false);
      // setSelectedCategories([]);
      // setCategoryInput("");
      // setFilteredCategories([]);
      // setShowSuggestions(false);
      // // setTags("");
 
      // // e.target.reset();
      // // setPaymentMode("Cash");

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
    await api.post(
      `/account/delete/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Remove from state
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    fetchDashboard(); 
    fetchCategories(); 

    // Show toast
    toast.success("Record deleted successfully");

  } catch (err) {
    console.error("Delete error:", err);
    toast.error("Failed to delete record");
  } finally {
    setConfirmDelete({ show: false, id: null }); // hide modal
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

    transactions.forEach((t) => {
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

    transactions.forEach(t => {
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

        <div className="tooltip-row">
          <strong>Total</strong>
          <strong>₹{total.toLocaleString()}</strong>
        </div>
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

  //  .............................................................................

  // lover case and duplicate valve not show
  const normalize = (v) => v.trim().toLowerCase();
    // categories filter and add ..........
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setFilteredCategories(allCategories);
  }, [allCategories]);

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

    if (isDuplicate) return; // ❌ already exists

    setSelectedCategories(prev => [...prev, value]);

    setCategoryInput("");
    setShowSuggestions(false);
  };

 const removeCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.filter((cat) => cat !== value)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const value = categoryInput.trim();
      if (!value) return;

      addCategory(value);
    }
  };

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

  //  .............................................................................
  // sub tags filter and add  

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

  useEffect(() => {
    setFilteredTags(allTags);
  }, [allTags]);

  const addTag = (tag) => {
  const value = tag.trim();
  if (!value) return;

  const isDuplicate = selectedTags.some(
    t => normalize(t) === normalize(value)
  );

  if (isDuplicate) return;

  setSelectedTags(prev => [...prev, value]);
  setTagInput("");
  setFilteredTags(allTags);
};


  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = tagInput.trim().toLowerCase();
      if (!value) return;
      addTag(value);
    }
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
  // payment mode add in popup form 
  useEffect(() => {
    if (paymentModes.length && !selectedMode) {
      setSelectedMode(paymentModes[0].name);
    }
  }, [paymentModes]);

  useEffect(() => {
    const fetchModes = async () => {
      const res = await api.get("/account/payment-modes");
      const final = res.data.map(i => ({
        name: i._id,      // bank / upi / cash / sbi
        count: i.count
      }));
      // API → { sbi: 5, cash: 3 }
      const usageMap = {};
      res.data.forEach(item => {
        if (item._id) {
          usageMap[item._id.toLowerCase()] = item.count;
        }
      });

      // DEFAULT MODES
      const defaultModes = ["cash", "upi", "bank"];

      // FINAL UNIQUE SET
      const modeSet = new Set();

      // 1️⃣ default add
      defaultModes.forEach(m => modeSet.add(m));

      // 2️⃣ db-used add
      Object.keys(usageMap).forEach(m => modeSet.add(m));

      // BUILD FINAL ARRAY
      const finalModes = Array.from(modeSet).map(name => ({
        name,
        count: usageMap[name] || 0,
        isDefault: defaultModes.includes(name),
      }));

      // SORT → count DESC (default + used first)
      finalModes.sort((a, b) => b.count - a.count);

      setPaymentModes(final);
    };

    fetchModes();
  }, []);



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

  return (
    <div className="container">
      {/* SUMMARY DashBoard */}
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

              <ResponsiveContainer width="100%" height={235}>
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
                    innerRadius={55}
                    outerRadius={110}
                    paddingAngle={4}
                    cornerRadius={4}
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

                {/* ===== LEGEND BOX ===== */}
                <div className="pie-legend">
                  {paymentPieData.map(item => (
                    <div key={item.key} className="legend-row">
                      <span
                        className="legend-dot"
                        style={{ background: colorMap.current[item.key] }}
                      />
                      <span>{item.name}</span>
                      <strong>₹{item.value.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>       
            </div>

            {/* Savings Trend */}
            <div className="chart-card dark">
              <h4 className="chart-title"><FiTrendingUp className="chart-icon line" />Savings Trend</h4>
              <p className="sub-text">12-month savings performance</p>

                <ResponsiveContainer width="100%" height={235}>
                  <LineChart data={savingsTrend}>

                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: "#cbd5f5" }} />
                    <YAxis tick={{ fill: "#cbd5f5" }} />
                      {/* ✅ PASTE HERE */}
                      <Tooltip  content={<DarkTooltip />} />

                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={true}
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
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={monthWiseChartData}
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
                    interval={0}
                    tick={{
                      fill: "#cbd5f5",   
                    }}
                  />
                  <YAxis tick={{ fill: "#cbd5f5", fontWeight: 100 }} />

                  <Tooltip cursor={false} content={<CustomTooltip />} />

                  <Legend
                    wrapperStyle={{
                      color: "#e5e7eb",
                      fontWeight: 500,
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
          {/* TRANSACTION LIST */}
          {/* <div className="transection"><h4 >Transactions...</h4></div> */}
       
          <div className="d-flex justify-content-between align-items-center  ">
  
            {/* EXPORT + FILTER */}
            <div className="export-filter-container d-flex">
              <select
                className="form-select border-2"
                style={{ width: 200 }}
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option value="">Select Export Type</option>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="pdf">PDF</option>
              </select>

              <button
                className="plus-btnnx d-flex align-items-center gap-1"
                onClick={handleExport}
              >
                <FiDownload size={16} />
                Export
              </button>
            </div>

            {/* RIGHT SIDE – TITLE */}
            <h3 className="text-white mb-0">Transactions...</h3>

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
                  <option value="recipient">Recipient</option>
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
                      value={f.value || ""}
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
                      <input
                        className="form-control border-3"
                        placeholder="Search multiple values (comma separated)"
                        value={f.value || ""}
                        onChange={(e) => {
                          handleSuggestionInputChange(e, f, index)}}
                      />
                        {activeFilterIndex === index && activeSuggestions.length > 0 && (
                          <div className="suggestionBox list-group">
                            {activeSuggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onClick={() => selectSuggestion(index, s)}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
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
                    ×
                  </button>
                )}
                
                {/* ADD FILTER BUTTON (ONLY LAST ROW) */}
                {index === filters.length - 1 && (
                  <button className="plus-btnnnx d-flex align-items-center gap-1" onClick={addFilter}>
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
                      <span className={`type-badge ${item.type}`}>
                        {item.type.toUpperCase()}
                      </span>

                      <span
                        className={
                          item.type === "income"
                            ? "amount income"
                            : "amount expense"
                        }
                      >
                        ₹{item.amount}
                      </span>
                    </div>

                    <div className="transaction-details fixed">
                      <div className="row">
                        <span className="label">Payment Mode :</span>
                        <span className="value" >{item.paymentMode.toUpperCase() || "-"}</span>
                      </div>

                      <div className="row">
                        <span className="label">Recipient :</span>
                        <span className="value" >{item.person || "-"}</span>
                      </div>

                      <div className="row">
                        <span className="label">Category :</span>
                        <span className="value">{item.description || "-"}</span>
                      </div>

                      <div className="row">
                        <span className="label">Tags :</span>
                        <span className="value wrap">{item.tags?.join(", ") || "-"}</span>
                      </div>

                      {item.attachment && item.attachment !== "No File" && (
                        <div className="row full">
                          <span className="label">Attachment :</span>
                          <a
                            className="value link"
                            href={`http://localhost:5000/uploads/${item.attachment}`}
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
                    <div className="action-buttons d-flex gap-2">
                      <button
                        className="edit-btn d-flex align-items-center gap-1"
                        onClick={() => navigate(`/edit/${item._id}`)}
                      >
                        <FiEdit2 size={14} />
                        Edit
                      </button>
                     

                      <button
                        className="delete-btn d-flex align-items-center gap-1"
                        onClick={() => setConfirmDelete({ show: true, id: item._id })}
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
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
        </>
      )}
    {/* ........................................add transection recode popup box............................................... */}
      <button className="robot-add-btn" onClick={() => setShowPopup(true)}>
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
              
                <label>Type <span className="text-danger">*</span></label>
                <div className="type-slider">
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

                  {/* IMPORTANT for FormData */}
                  <input type="hidden" name="type" value={form.type} />
                </div>
              
                <div className="row mb-2">
                  <div className="col-md-6 mt-2">
                    {/* <div className="d-flex align-items-center gap-2 mb-2"> */}
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
                      {/* </div> */}
                  </div>
                  <div className="col-md-6 mt-2">
                    <label>Account Holder Name</label>
                    <input className="form-control"
                      type="text"
                      name="person"
                      autoComplete="off"
                      value={form.person}            // ✅ bind to state
                      onChange={(e) =>
                        setForm({ ...form, person: e.target.value })  // ✅ update state
                      }
                    />
                  </div>
                </div>

                <div className="mb-2"> 
                  <label>
                    Payment Mode <span className="text-danger">*</span>
                  </label>
                  <div className="payment-mode">
                    {paymentModes.map((m, i) => {
                      // 🔒 Normalize mode name safely
                      const modeName =
                        typeof m === "string"
                          ? m
                          : m?.name || m?._id;

                      if (!modeName) return null;

                      const key = modeName.toLowerCase();
                      const color = paymentColors[key] || getRandomColor();

                      return (
                        <label key={i} className="radio-item">
                          <input
                            type="radio"
                            name="paymentMode"
                            value={modeName}
                            checked={selectedMode === modeName}
                            onChange={() => setSelectedMode(modeName)}
                          />

                          <span className="custom-radio"></span>

                          <span
                            className="mode-text pay-badge"
                            style={{
                              background: color.bg,
                              color: color.text,
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.375rem",
                              display: "inline-block",
                              minWidth: "50px",
                              textAlign: "center",
                              fontWeight: "600",
                            }}
                          >
                            {modeName.toUpperCase()}
                            {typeof m === "object" && m.count != null && (
                              <small style={{ marginLeft: 4, fontWeight: 400 }}>
                                {/* ({m.count}) */}
                              </small>
                            )}
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
                    {/* ADD CUSTOM MODE */}
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
                                    const newMode = customMode.trim();
                                    if (!newMode) return;

                                    const exists = paymentModes.some(m => {
                                      const name = typeof m === "string" ? m : m.name;
                                      return normalize(name) === normalize(newMode);
                                    });

                                    if (exists) {
                                      toast.error("Payment mode already exists");
                                      return;
                                    }

                                    setPaymentModes(prev => [
                                      ...prev,
                                      { name: newMode }
                                    ]);

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
                  </div>

                </div>

                
                {/* <div className="d-flex align-items-center gap-2 mb-2"> */}
                <div className="row mb-2">
                  <div className="col-md-6 mt-2">
                    <div className="mb-2 position-relative">
                      <label className="form-label">Category</label>
                      <div className="tag-input-wrapper">
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

                        <input
                          className="tag-input"
                          value={categoryInput}
                          autoComplete="off"
                          placeholder="Type category & press Enter"
                          onFocus={() => {
                            setShowSuggestions(true);
                            setFilteredCategories(allCategories);
                          }}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                      </div>
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
                      
                      {!showSuggestions && (
                        <div className="category-buttons mt-2">
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
                  </div>
                  <div className="col-md-6 mt-2">
                    <label className="form-label">Tags</label>

                    <div className="tag-input-wrapper position-relative" ref={tagRef}>
                      {/* SELECTED TAGS */}
                      {selectedTags.map((tag, i) => (
                        <span key={i} className="tag-chip">
                          {tag}
                          <button
                            type="button"
                            className="remove-btn"
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
                        placeholder="Type tag & press Enter"
                        onFocus={() => {
                          setShowTagSuggestions(true);
                          setFilteredTags(allTags);
                        }}
                        onChange={(e) => handleTagChange(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />

                      {/* ✅ SUGGESTION BOX (INSIDE ref — VERY IMPORTANT) */}
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
                              No tag found. Press Enter to add
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                      {/* FIXED TAG BUTTONS */}
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
                
                <div className="mb-1">
                  <label>Attachment</label>
                  <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
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
            ₹
            <CountUp
              end={Math.abs(value)}
              duration={getDuration(value)}
              separator=","
              formattingFn={(n) =>
                n.toLocaleString("en-IN", { minimumFractionDigits: 2 })
              }
            />
          </h3>

          <span className="summary-sub">
            {percentage !== undefined
              ? `${Math.abs(percentage)}% of ${percentage < 0 ? "expense" : "income"}`
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