
import Account from "../models/Account.js";


// DASHBOARD OUTPUT
export const getDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const accounts = await Account.find({
      userId
    }).sort({ date: -1 });
    
    const totalIncome = accounts
      .filter(a => a.type === "income")
      .reduce((s, a) => s + a.amount, 0);

    const totalExpense = accounts
      .filter(a => a.type === "expense")
      .reduce((s, a) => s + a.amount, 0);

    res.json({
      accounts,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADD TRANSACTION
export const addTransaction = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {
      type,
      amount,
      person,
      description,
      tags,
      paymentMode,
      bankName,
      accountNumber,
      upiApp,
      upiId,
      date
    } = req.body;
    const file = req.file;
    const parsedTags = tags
      ? [...new Set(
          tags
            .split(",")
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)
        )]
      : [];

    const recordDate = date ? new Date(date) : new Date();
    await Account.create({
      userId, 
      type,
      amount: Number(amount),
      person,
      description,
      paymentMode,
      tags: parsedTags,
      attachment: file ? file.filename : null,
      originalName: file ? file.originalname : null,
      bankDetails: bankName
        ? { bankName, accountNumber }
        : undefined,
      upiDetails: upiApp
        ? { appName: upiApp, upiId }
        : undefined,
      // tags: tags ? tags.split(",").map(t => t.trim()) : [],
       date: recordDate,
    });

    res.json({ message: "Transaction added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// EDIT PAGE 
export const getEditTransaction = async (req, res) => {
  const record = await Account.findById(req.params.id);
  res.json(record); 
};

// UPDATE
export const updateTransaction = async (req, res) => {
  //  const userId = req.session.user.id;
  const {
    type,
    amount,
    person,
    description,
    tags,
    paymentMode,
    bankName,
    accountNumber,
    upiApp,
    upiId,
  } = req.body;

  const file = req.file;
  const parsedTags = tags
  ? [...new Set(
      tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
    )]
  : [];
  const updateData = {
    type,
    amount,
    person,
    description,
    tags: parsedTags,
    paymentMode,
  };
 if (file) {
      updateData.attachment = file.filename;
      updateData.originalName = file.originalname;
    }

  if (paymentMode === "Bank") {
    updateData.bankDetails = { bankName, accountNumber };
    updateData.upiDetails = {};
  }

  if (paymentMode === "UPI") {
    updateData.upiDetails = { appName: upiApp, upiId };
    updateData.bankDetails = {};
  }

  if (req.file) {
    updateData.attachment = req.file.filename;
    updateData.originalName = req.file.originalname;
  }

  await Account.findByIdAndUpdate(req.params.id, updateData);
  res.json({ success: true });
};

// DELETE
export const deleteTransaction = async (req, res) => {
  await Account.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const getSingleRecord = async (req, res) => {
  try {
     const userId = req.session.user.id;
    const { id } = req.params;
    const record = await Account.findOne({
      _id: id,
      userId,
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SUGGESTED TAGS
export const getSuggestedTags = async (req, res) => {
  try {
    const records = await Account.find(
      { userId: req.session.user.id },
      { tags: 1 }
    );

    const tagSet = new Set();

    records.forEach(r => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach(tag => tagSet.add(tag));
      }
    });

    res.json([...tagSet]); // ✅ unique tags

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

// GET ALL CATEGORIES (for suggestion box)
export const getAllCategories = async (req, res) => {
  try {
    // console.log("SESSION:", req.session);

    const userId = req.session.user.id; // ❌ optional chaining hatao

    const records = await Account.find(
      { userId },
      { description: 1 }
    );

    const set = new Set();

    records.forEach(r => {
      if (r.description) {
        r.description
          .split(",")
          .map(c => c.trim().toLowerCase())
          .filter(Boolean)
          .forEach(c => set.add(c));
      }
    });

    res.json([...set]);
  } catch (err) {
    console.error("CATEGORY API ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
