"use client";

import React from "react";

interface ActiveFiltersChipsProps {
  filters: {
    searchTerm: string;
    category: string | null;
    maxPrice: number | null;
    minPrice: number | null;
    sortBy: string | null;
  };
  onClearAll: () => void;
}

export default function ActiveFiltersChips({
  filters,
  onClearAll,
}: ActiveFiltersChipsProps) {
  const chips: Array<{ id: string; label: string; icon: string }> = [];

  if (filters.searchTerm) {
    chips.push({
      id: "search",
      label: `Search: "${filters.searchTerm}"`,
      icon: "🔎",
    });
  }

  if (filters.category) {
    chips.push({
      id: "category",
      label: `Category: ${filters.category}`,
      icon: "📂",
    });
  }

  if (filters.maxPrice) {
    chips.push({
      id: "max-price",
      label: `Up to ₹${filters.maxPrice.toLocaleString('en-IN')}`,
      icon: "💵",
    });
  }

  if (filters.minPrice) {
    chips.push({
      id: "min-price",
      label: `From ₹${filters.minPrice.toLocaleString('en-IN')}`,
      icon: "💵",
    });
  }

  if (filters.sortBy) {
    let sortLabel = "";
    switch (filters.sortBy) {
      case "price_asc":
        sortLabel = "Price: Low to High";
        break;
      case "price_desc":
        sortLabel = "Price: High to Low";
        break;
      case "rating_desc":
        sortLabel = "Highest Rated";
        break;
      case "name_asc":
        sortLabel = "Name (A → Z)";
        break;
      case "name_desc":
        sortLabel = "Name (Z → A)";
        break;
    }
    if (sortLabel) {
      chips.push({
        id: "sort",
        label: sortLabel,
        icon: "📊",
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-white/70 backdrop-blur-xl border-b border-[#232F3E]/10 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-700 font-semibold">Active Filters:</span>

      {chips.map(chip => (
        <div
          key={chip.id}
          className="inline-flex items-center gap-2 bg-[#FF9900] border border-[#FF9900] text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-[#FF8800] transition-all shadow-md"
        >
          <span>{chip.icon}</span>
          <span>{chip.label}</span>
        </div>
      ))}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="ml-auto px-3 py-1 text-xs text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white/70 rounded-full border border-[#007185]/20 transition-all"
      >
        ✕ Clear All
      </button>
    </div>
  );
}

