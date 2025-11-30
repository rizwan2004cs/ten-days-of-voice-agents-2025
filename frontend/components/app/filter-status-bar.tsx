"use client";

import React from "react";

interface FilterStatusBarProps {
  totalProducts: number;
  filteredProducts: number;
  filters: {
    searchTerm: string;
    category: string | null;
    maxPrice: number | null;
    minPrice: number | null;
    sortBy: string | null;
  };
}

export default function FilterStatusBar({
  totalProducts,
  filteredProducts,
  filters,
}: FilterStatusBarProps) {
  const isFiltered =
    filters.searchTerm ||
    filters.category ||
    filters.maxPrice ||
    filters.minPrice ||
    filters.sortBy;

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case "price_asc":
        return "💰 Price: Low to High";
      case "price_desc":
        return "💰 Price: High to Low";
      case "rating_desc":
        return "⭐ Highest Rated";
      case "name_asc":
        return "🔤 Name (A → Z)";
      case "name_desc":
        return "🔤 Name (Z → A)";
      default:
        return null;
    }
  };

  return (
    <div className={`px-6 py-4 border-b transition-all ${
      isFiltered
        ? "bg-blue-50 border-blue-200"
        : "bg-white border-gray-300"
    }`}>
      {/* Main Status Line */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className={`font-semibold ${
            isFiltered ? "text-blue-900" : "text-gray-800"
          }`}>
            {isFiltered ? "🔍 Filtered Results" : "📊 All Products"}
          </p>
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {filteredProducts}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">
              {totalProducts}
            </span>{" "}
            products
          </p>
        </div>

        {/* Sort Badge */}
        {getSortLabel() && (
          <div className="bg-gradient-to-r from-[#FF9900] to-[#ff7a00] text-white px-3 py-1 rounded-full text-xs font-semibold">
            {getSortLabel()}
          </div>
        )}
      </div>

      {/* Filter Details */}
      {isFiltered && (
        <div className="text-xs text-gray-600 space-y-1">
          {filters.searchTerm && (
            <p>
              🔎 Search: "<span className="font-semibold">{filters.searchTerm}</span>"
            </p>
          )}
          {filters.category && (
            <p>
              📂 Category: <span className="font-semibold">{filters.category}</span>
            </p>
          )}
          {filters.maxPrice && (
            <p>
              💵 Max Price: <span className="font-semibold">₹{filters.maxPrice.toLocaleString('en-IN')}</span>
            </p>
          )}
          {filters.minPrice && (
            <p>
              💵 Min Price: <span className="font-semibold">₹{filters.minPrice.toLocaleString('en-IN')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

