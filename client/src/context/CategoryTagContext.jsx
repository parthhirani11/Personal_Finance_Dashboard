import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const CategoryTagContext = createContext();

export const CategoryTagProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // 🔹 FETCH
  const fetchCategories = async () => {
    const res = await api.get("/account/categories", {
      withCredentials: true,
    });
    setCategories(res.data || []);
  };

  const fetchTags = async () => {
    const res = await api.get("/account/tags", {
      withCredentials: true,
    });
    setTags(res.data || []);
  };

  // 🔹 UPDATE
  const updateCategories = async (updated) => {
    await api.post(
      "/account/categories",
      { categories: updated },
      { withCredentials: true }
    );
    setCategories(updated);
  };

  const updateTags = async (updated) => {
    await api.post(
      "/account/tags",
      { tags: updated },
      { withCredentials: true }
    );
    setTags(updated);
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  return (
    <CategoryTagContext.Provider
      value={{
        categories,
        tags,
        fetchCategories,
        fetchTags,
        updateCategories,
        updateTags,
      }}
    >
      {children}
    </CategoryTagContext.Provider>
  );
};

export const useCategoryTag = () => useContext(CategoryTagContext);
