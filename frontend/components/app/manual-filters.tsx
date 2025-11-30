"use client";

import React, { useState, useEffect, useRef } from "react";

interface ManualFiltersProps {
  searchTerm: string;
  category: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  sortBy: string | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onMaxPriceChange: (value: number | null) => void;
  onMinPriceChange: (value: number | null) => void;
  onSortChange: (value: string | null) => void;
  onClearAll: () => void;
  availableCategories: string[];
}

export default function ManualFilters({
  searchTerm,
  category,
  maxPrice,
  minPrice,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onMaxPriceChange,
  onMinPriceChange,
  onSortChange,
  onClearAll,
  availableCategories,
}: ManualFiltersProps) {
  // Local state for price inputs to allow free typing
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");
  
  // Refs to track if user is actively typing (prevent useEffect from overwriting)
  const isTypingMin = useRef(false);
  const isTypingMax = useRef(false);

  // Sync local state with props when they change externally (e.g., from voice agent)
  // Only sync if user is not actively typing and the value actually changed
  useEffect(() => {
    if (!isTypingMin.current) {
      const newValue = minPrice !== null && minPrice !== undefined ? minPrice.toString() : "";
      // Only update if different to avoid unnecessary re-renders
      if (newValue !== minPriceInput) {
        setMinPriceInput(newValue);
      }
    }
  }, [minPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTypingMax.current) {
      const newValue = maxPrice !== null && maxPrice !== undefined ? maxPrice.toString() : "";
      // Only update if different to avoid unnecessary re-renders
      if (newValue !== maxPriceInput) {
        setMaxPriceInput(newValue);
      }
    }
  }, [maxPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters =
    searchTerm ||
    category ||
    maxPrice ||
    minPrice ||
    sortBy;

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-[#232F3E]/10 px-6 py-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            🔍 Filter & Sort Products
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setMinPriceInput("");
                setMaxPriceInput("");
                onClearAll();
              }}
              className="text-xs text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white/70 px-3 py-1 rounded-lg border border-[#007185]/20 transition-all"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category || ""}
              onChange={(e) =>
                onCategoryChange(e.target.value || null)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min Price (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={minPriceInput}
              onChange={(e) => {
                isTypingMin.current = true;
                const rawValue = e.target.value;
                
                // Filter out non-numeric characters
                const digitsOnly = rawValue.replace(/[^0-9]/g, '');
                
                // Always update local state immediately
                setMinPriceInput(digitsOnly);
                
                // Update parent state
                if (digitsOnly === "") {
                  onMinPriceChange(null);
                } else {
                  const numValue = parseInt(digitsOnly, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    onMinPriceChange(numValue);
                  } else {
                    onMinPriceChange(null);
                  }
                }
              }}
              onFocus={() => {
                isTypingMin.current = true;
              }}
              onBlur={(e) => {
                isTypingMin.current = false;
                // Validate and sync on blur
                const value = e.target.value.trim();
                if (value === "") {
                  setMinPriceInput("");
                  onMinPriceChange(null);
                } else {
                  const numValue = parseInt(value, 10);
                  if (isNaN(numValue) || numValue < 0) {
                    setMinPriceInput("");
                    onMinPriceChange(null);
                  } else {
                    setMinPriceInput(numValue.toString());
                    onMinPriceChange(numValue);
                  }
                }
              }}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max Price (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxPriceInput}
              onChange={(e) => {
                isTypingMax.current = true;
                const rawValue = e.target.value;
                
                // Filter out non-numeric characters
                const digitsOnly = rawValue.replace(/[^0-9]/g, '');
                
                // Always update local state immediately
                setMaxPriceInput(digitsOnly);
                
                // Update parent state
                if (digitsOnly === "") {
                  onMaxPriceChange(null);
                } else {
                  const numValue = parseInt(digitsOnly, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    onMaxPriceChange(numValue);
                  } else {
                    onMaxPriceChange(null);
                  }
                }
              }}
              onFocus={() => {
                isTypingMax.current = true;
              }}
              onBlur={(e) => {
                isTypingMax.current = false;
                // Validate and sync on blur
                const value = e.target.value.trim();
                if (value === "") {
                  setMaxPriceInput("");
                  onMaxPriceChange(null);
                } else {
                  const numValue = parseInt(value, 10);
                  if (isNaN(numValue) || numValue < 0) {
                    setMaxPriceInput("");
                    onMaxPriceChange(null);
                  } else {
                    setMaxPriceInput(numValue.toString());
                    onMaxPriceChange(numValue);
                  }
                }
              }}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
            Sort by:
          </label>
          <select
            value={sortBy || "default"}
            onChange={(e) =>
              onSortChange(e.target.value === "default" ? null : e.target.value)
            }
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
          </select>
        </div>
      </div>
    </div>
  );
}

