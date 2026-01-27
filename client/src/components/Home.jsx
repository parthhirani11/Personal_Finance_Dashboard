import { useEffect,useMemo, useState, useRef  } from "react";
import robot from "../assets/robot.png";
import CountUp from "react-countup";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axios";
import { FiPieChart, FiBarChart2, FiTrendingUp, FiCreditCard, FiFilter,FiDownload ,FiEdit2, FiTrash2, FiSave  } from "react-icons/fi";
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
  // const [tags, setTags] = useState("");
  const fixedCategories = ["Goods", "Salary", "Rent", "Food", "Travel"];
  const [categoryInput, setCategoryInput] = useState("");
  const [allCategories, setAllCategories] = useState([]);       // DB
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tagRef = useRef(null);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  
  const [newTag, setNewTag] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [banks, setBanks] = useState(["SBI", "HDFC"]);
  const [selectedBank, setSelectedBank] = useState("");
 
  /* ================= FETCH DASHBOARD ================= */
  useEffect(() => {
    fetchDashboard();
     fetchSuggestedTags();
  }, []);

  const fetchSuggestedTags = async () => {
    const res = await api.get(
      "/account/tags",
      
      { withCredentials: true }
    );
    setSuggestedTags(res.data || []);
  };

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

  //  tegs in dropdown list

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;

    // add to suggested list
    setSuggestedTags(prev =>
      prev.includes(tag) ? prev : [tag, ...prev]
    );

    // auto select
    setSelectedTags(prev =>
      prev.includes(tag) ? prev : [...prev, tag]
    );

    setNewTag("");               // reset modal input
    setShowAddTagModal(false);   // close popup
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagRef.current && !tagRef.current.contains(e.target)) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (exportType === "pdf") url = "api/account/export/pdf";

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
              item.bankDetails?.bankName?.toLowerCase().includes(v) ||
              item.upiDetails?.appName?.toLowerCase().includes(v) ||
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

        if (f.type === "payment") {
          return values.some(v => {
            // CASH
            if (v === "cash")
              return item.paymentMode === "Cash";

            // BANK
            if (item.paymentMode === "Bank")
              return (
                v === "bank" ||
                item.bankDetails?.bankName?.toLowerCase().includes(v)
              );

            // UPI
            if (item.paymentMode === "UPI")
              return (
                v === "upi" ||
                item.upiDetails?.appName?.toLowerCase().includes(v)
              );
              return false;
          });
        }
        return true;
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

        if (f.type === "payment")
          return values.some(v =>
            item.paymentMode?.toLowerCase().includes(v) ||
            item.bankDetails?.bankName?.toLowerCase().includes(v) ||
            item.upiDetails?.appName?.toLowerCase().includes(v)
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

    if (type === "payment") {
      const banks = data
        .filter(i => i.paymentMode === "Bank")
        .map(i => i.bankDetails?.bankName)
        .filter(Boolean);

      const upis = data
        .filter(i => i.paymentMode === "UPI")
        .map(i => i.upiDetails?.appName)
        .filter(Boolean);

      return [...new Set(["Cash", "Bank", "UPI", ...banks, ...upis])];
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

    const suggestions = getSuggestions(f.type, data).filter(s =>
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
    
    const formData = new FormData(e.target);
     formData.append("tags", selectedTags.join(","));
     formData.set("description", categoryInput); // ✅ IMPORTANT
     if (file) {
      formData.append("attachment", file);
    } 
    try {
      await api.post(
        "/account/add",
        formData,
        { 
          withCredentials: true 
        }
      );
      await fetchCategories();  
      setShowPopup(false);
      fetchDashboard();
      fetchSuggestedTags(); 

      setSelectedTags([]);
      setShowTagDropdown(false);
      
      setCategoryInput("");
      setFilteredCategories([]);
      setShowSuggestions(false);
      // setTags("");
 
      e.target.reset();
      setPaymentMode("Cash");

    } catch (err) {
      console.error("Add transaction error:", err);
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

    // Show toast
    toast.success("Record deleted successfully");

  } catch (err) {
    console.error("Delete error:", err);
    toast.error("Failed to delete record");
  } finally {
    setConfirmDelete({ show: false, id: null }); // hide modal
  }
};



  /* ================= ADD BANK ================= */
  const handleAddBank = () => {
    const name = prompt("Enter Bank Name");
    if (!name || banks.includes(name)) return;
    setBanks(prev => [...prev, name]);
    setSelectedBank(name);
  };

  const renderPayment = (item) => {
    if (item.paymentMode === "Cash") {
      return (
        <div className="payment-wrap">
          <span className="pay-badge cash">Cash</span>
        </div>
      );
    }

    if (item.paymentMode === "Bank") {
      return (
        <div className="payment-wrap">
          <span className="pay-badge bank">
          Bank: {item.bankDetails?.bankName || "Bank"}
          </span>

          {item.bankDetails?.accountNumber && (
            <div className="pay-detail bank-detail">
              <span className="pay-label">A/C:</span>
              <span className="pay-value">
                {item.bankDetails.accountNumber}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (item.paymentMode === "UPI") {
      return (
        <div className="payment-wrap">
          <span className="pay-badge upi">
          UPI: {item.upiDetails?.appName || "UPI"}
          </span>

          {item.upiDetails?.upiId && (
            <div className="pay-detail upi-detail">
              <span className="pay-label">UPI ID:</span>
              <span className="pay-value">
                {item.upiDetails.upiId}
              </span>
            </div>
          )}
        </div>
      );
    }
     return <span>-</span>;
  };


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

  // Expense and income by Bank , UPI, Cash(Dynamic Pie / Donut)
  const paymentBreakdown = useMemo(() => {
    const map = {
      Cash: { income: 0, expense: 0 },
      Bank: { income: 0, expense: 0 },
      UPI: { income: 0, expense: 0 },
    };

    transactions.forEach(t => {
      const amount = Number(t.amount || 0);
      const mode = t.paymentMode;

      if (!map[mode]) return;

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
      .map(([name, val]) => ({
        name,
        value: val.income + val.expense, // 👈 TOTAL
      }))
      .filter(i => i.value > 0);
  }, [paymentBreakdown]);

  function PaymentTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;

    const mode = payload[0].name; // Cash / Bank / UPI
    const data = paymentBreakdown[mode];

    if (!data) return null;

    const total = data.income + data.expense;

    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{mode}</p>

        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: "#34d399" }} />
          <span className="tooltip-name">Income</span>
          <span className="tooltip-value">
            ₹{data.income.toLocaleString()}
          </span>
        </div>

        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: "#f87171" }} />
          <span className="tooltip-name">Expense</span>
          <span className="tooltip-value">
            ₹{data.expense.toLocaleString()}
          </span>
        </div>

        <hr style={{ opacity: 0.2 }} />

        <div className="tooltip-row">
          <strong>Total</strong>
          <strong className="tooltip-value">
            ₹{total.toLocaleString()}
          </strong>
        </div>
      </div>
    );
  }

  const PAYMENT_COLORS = {
    Cash: "#f59e0b", // amber
    Bank: "#3b82f6", // blue
    UPI: "#22c55e",  // green
  };

  //Savings Trend (Line Chart – 12 Months)
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

// // suggestion / button click
// const addCategoryToInput = (value) => {
//   const currentValues = categoryInput
//     .split(",")
//     .map(v => v.trim())
//     .filter(Boolean);

//   if (!currentValues.includes(value)) {
//     const updated = currentValues.length
//       ? currentValues.join(", ") + ", " + value
//       : value;

//     setCategoryInput(updated);
//   }
// };

// // new category typed
// const handleNewCategory = () => {
//   const parts = categoryInput
//     .split(",")
//     .map(v => v.trim())
//     .filter(Boolean);

//   const last = parts[parts.length - 1];

//   if (last && !categories.includes(last)) {
//     setCategories(prev => [...prev, last]);
//   }
// };
useEffect(() => {
  fetchCategories();
}, []);

const fetchCategories = async () => {
  try {
    const res = await api.get(
      "/account/categories",
      
      { withCredentials: true }
    );
    // console.log("CATEGORIES FROM API:", res.data); // 🔴 CHECK THIS
    setAllCategories(res.data);
    setFilteredCategories(res.data);
  } catch (err) {
    console.error(err);
  }
};

const getLastKeyword = (value) => {
  const parts = value.split(",");
  return parts[parts.length - 1].trim().toLowerCase();
};

const handleCategoryChange = (value) => {
  setCategoryInput(value);

  const keyword = getLastKeyword(value);

  if (keyword === "") {
    setFilteredCategories(allCategories); // show all
  } else {
    setFilteredCategories(
      allCategories.filter(c =>
        c.toLowerCase().includes(keyword)
      )
    );
  }
};

const addCategoryToInput = (value) => {
  const parts = categoryInput
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  if (!parts.includes(value)) {
    const updated = [...parts, value].join(", ");
    setCategoryInput(updated);
  }
};

// useEffect(() => {
//   const close = () => setFilteredCategories([]);
//   document.addEventListener("click", close);
//   return () => document.removeEventListener("click", close);
// }, []);
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
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={2}
                  >
                    {paymentPieData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={PAYMENT_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    content={<PaymentTooltip />} 
                  />
                </PieChart>
              </ResponsiveContainer>

                {/* ===== LEGEND BOX ===== */}
                <div className="pie-legend">
                  {paymentPieData.map((item) => (
                    <div key={item.name} className="legend-row">
                      <span
                        className="legend-dot"
                        style={{ background: PAYMENT_COLORS[item.name] }}
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
                className="d-flex align-items-center gap-1 mb-2 position-relative"
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
                  <option value="payment">Payment Method</option>
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

                  {f.type === "payment" && (
                    <>
                      <input
                        className="form-control border-3"
                        placeholder="Cash, Bank, UPI, SBI, PhonePe..."
                        value={f.value || ""}
                        onChange={(e) => {
                          updateFilter(f.id, "value", e.target.value);
                          setActiveFilterIndex(index);

                          const parts = e.target.value.split(",").map(v => v.trim());
                          const current = parts.pop()?.toLowerCase();

                          if (!current) {
                            setActiveSuggestions([]);
                            return;
                          }

                          const data = getFilteredDataExcept(index);
                          const suggestions = getSuggestions("payment", data)
                            .filter(s => s.toLowerCase().includes(current))
                            .filter(s => !parts.map(p => p.toLowerCase()).includes(s.toLowerCase()));

                          setActiveSuggestions(suggestions);
                        }}
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

                  
                  {/* RECIPIENT / CATEGORY / TAGS */}
                  {(f.type === "recipient" || f.type === "category" || f.type === "tags") && (
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

          
            
              {/* SUMMARY */}
              {/* <div className="transaction-summary">
                <div>
                  <strong>Total Income:  </strong>
                  <span className="transaction-income-total">
                    ₹{summary.totalIncome.toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong> Total Expense:  </strong>
                  
                  <span className="transaction-expense-total">
                    ₹{summary.totalExpense.toFixed(2)}
                  </span>
                </div>
              </div> */}
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

                    <div className="transaction-details">
                      <div className="payment-row"><span className="payment-label">Payment:</span>{renderPayment(item)}</div>
                      <div><strong>Recipient:</strong> {item.person || "-"}</div>
                      <div><strong>Category:</strong> {item.description || "-"}</div>
                      <div><strong>Tags:</strong> {item.tags?.join(", ") || "-"}</div>

                      {item.attachment && item.attachment !== "No File" && (
                        <div>
                          <strong>Attachment:</strong>{" "}
                          <a
                            href={`https://phpstack-1249340-6098543.cloudwaysapps.com/uploads/${item.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.originalName || "View file"}
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
              
                <label>Type</label>
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
                      <label>Amount</label>
                        <input
                          type="text"
                          className="form-control"
                          autoComplete="off" 
                          name="amount"
                          // placeholder="Amount"
                          inputMode="decimal"
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                          }}
                          required
                        />
                      {/* </div> */}
                  </div>
                  <div className="col-md-6 mt-2">
                    <label>Name</label>
                    <input className="form-control"  name="person"  autoComplete="off" />
                  </div>
                </div>

                <div className="mb-2">      
                  <label>Payment Mode</label>
                  {/* <select className="form-select border-1" name="paymentMode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="Cash">Cash </option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI </option>
                  </select> */}
                  <div className="payment-mode">
                    <label className="radio-item">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="Cash"
                        checked={paymentMode === "Cash"}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      />
                      <span className="custom-radio"></span>
                      Cash
                    </label>

                    <label className="radio-item">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="Bank"
                        checked={paymentMode === "Bank"}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      />
                      <span className="custom-radio"></span>
                      Bank
                    </label>

                    <label className="radio-item">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="UPI"
                        checked={paymentMode === "UPI"}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      />
                      <span className="custom-radio"></span>
                      UPI
                    </label>
                  </div>

                </div>

                {/* <!-- BANK -->  */}
                {paymentMode === "Bank" && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <select className="form-select border-1" style={{width:"220px"}} name="bankName" value={selectedBank}  onChange={(e) => setSelectedBank(e.target.value)}>
                      <option value="">Select Bank</option>
                      {banks.map((bank, index) => (
                        <option key={index} value={bank}>
                          {bank}
                         </option>
                      ))}
                    </select>
                    <button className="plus-btnn" type="button" onClick={handleAddBank}>＋ Add Bank</button>
                    {/* <input className ="form-control "style={{width:"620px"}} name="accountNumber" autoComplete="off" step="0.01" placeholder="Account Number"required /> */}
                    <input
                          type="text"
                          className="form-control"
                          autoComplete="off" 
                          name="accountNumber"
                          // placeholder="Amount"
                          inputMode="decimal"
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                          }}
                          required
                        />
                  </div>
                )}

                {/* <!-- UPI --> */}
                {paymentMode === "UPI" && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <select className="form-select border-2"  style={{width:"220px"}} name="upiApp" >
                      <option value="">Select UPI</option>
                      <option value="GPay">Google Pay</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                    </select>
                    <input className ="form-control " style={{width:"730px"}} autoComplete="off" name="upiId" placeholder="UPI ID / Mobile" />
                  </div>
                )}
                {/* <div className="d-flex align-items-center gap-2 mb-2"> */}
                <div className="row mb-2">
                  <div className="col-md-6 mt-2">
                    <div className="mb-2 position-relative">
                      <label className="form-label">Category (add / select option)</label>

                      <input
                        className="form-control"
                        name="description"
                        value={categoryInput}
                        autoComplete="off" 
                        placeholder="goods, sales..."
                        onFocus={() => {
                          setShowSuggestions(true);
                          setFilteredCategories(allCategories);
                        }}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        onBlur={() => {
                          // thodu delay jethi click register thay
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                      />

                      {showSuggestions && (
                        <div className="suggestionBox list-group mt-1">

                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat, i) => (
                              <button
                                key={i}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onMouseDown={() => addCategoryToInput(cat)}
                              >
                                {cat}
                              </button>
                            ))
                          ) : (
                            <div className="no-category-msg">
                              No category found. Please add a new category
                            </div>
                          )}

                        </div>
                      )}

                      {/* FIXED BUTTONS */}
                      {!showSuggestions && (
                        <div className="category-buttons mb-2 mt-2">
                          {fixedCategories.map((cat, i) => (
                            <button
                              key={i}
                              type="button"
                              className="btn btn-outline-secondary btn-sm me-2"
                              onClick={() => addCategoryToInput(cat.toLowerCase())}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                  <div className="col-md-6 mt-2">
                    {/* TAG INPUT */}
                    <div className="mb-1 position-relative" ref={tagRef}>
                      <label className="form-label">Tags (add / select option)</label>
                      <input
                        type="text"
                        className="form-control"
                        // style={{ width: "350px" }}
                        // placeholder="Select tags"
                        value={selectedTags.join(", ")}   // ✅ THIS IS IMPORTANT
                        readOnly
                        onClick={() => setShowTagDropdown(true)}
                      />
                      {showTagDropdown && (
                        <div className="tag-dropdown">
                          {suggestedTags.length === 0 ? (
                            <div className="no-category-msg">
                              No tags found. Please add a new tag
                            </div>
                          ) : (
                            suggestedTags.map((tag, i) => (
                              
                                <label key={i} className="tag-option">
                                  <input
                                    type="checkbox"
                                    checked={selectedTags.includes(tag)}
                                    onChange={() => toggleTag(tag)}
                                  />
                                  <span>{tag}</span>
                                </label>
                             
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* ADD TAG BUTTON */}
                    <button
                      type="button"
                      className="plus-btnn mt-1"
                      // style={{ width: "240px", height:"45px"}}
                      onClick={() => setShowAddTagModal(true)}
                    >
                      + Add Tag
                    </button>
                    

                    {/* </div> */}
                    {showAddTagModal && (
                      <div className="tag-modal-backdrop">
                        <div className="tag-modal">
                          <h5 style={{color:"#4f46e5"}}>Add New Tag</h5>

                          <input
                            type="text"
                            className="form-control mb-3"
                            // placeholder="Enter new tag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                          />

                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-secondary"
                                onClick={() => setShowAddTagModal(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary"
                                onClick={addNewTag}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
                

                  
                {/* <div className="mb-3 position-relative" ref={tagRef}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Select or Add New Tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onFocus={() => setShowTagDropdown(true)}
                    onKeyDown={(e) => e.key === "Enter" && addNewTag()}
                  />

                  {showTagDropdown && (
                    <div className="tag-dropdown">
                      {tagsInput && (
                        <button
                          type="button"
                          className="add-tag-btn"
                          onClick={addNewTag}
                        >
                          + Add “{tagsInput}”
                        </button>
                      )}
                      {suggestedTags.map((tag, i) => (
                        <label
                          key={i}
                          className={`tag-option ${
                            selectedTags.includes(tag) ? "active" : ""
                          }`}
                        >
                             
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                          />
                          <span>{tag}</span>
                        </label>
                      ))}  
                    </div>
                  )}
                </div> */}

                <div className="mb-1">
                  <label>Attachment (Optional)</label>
                  <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
                </div>

                <div id="tagHolder" className="mt-3"></div>

              </form>
            
            </div>
            <div className="popup-footer">
              <button type="submit" form="transactionForm"  className="btn btn-primary align-items-center d-flex">
                <FiSave size={16} />
                  Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= REUSABLE SUMMARY CARD =================
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