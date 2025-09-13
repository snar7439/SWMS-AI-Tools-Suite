"use client";

import { useState } from "react";

export default function ReportTestingModal({ isOpen, onClose, onSelect }) {
  const [hoveredOption, setHoveredOption] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const reportOptions = [
    {
      id: "single-report",
      title: "Single Report Verification",
      description:
        "Analyze and validate a single SWMS report with automated testing",
      icon: "📄",
      route: "/single-report-check",
    },
    {
      id: "compare-reports",
      title: "Compare Two Reports",
      description:
        "Side-by-side comparison of two SWMS reports with detailed analysis",
      icon: "⚖️",
      route: "/report-testing",
    },
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option.id);
    setTimeout(() => {
      onSelect(option);
      setSelectedOption(null);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform transition-all duration-300 scale-100">
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-100">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Header Content */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200">
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ReportSure.AI
                  </h2>
                  <p className="text-gray-600">
                    Choose your testing approach to get started
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Options Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      hoveredOption === option.id
                        ? "border-blue-300 shadow-lg transform -translate-y-1"
                        : "border-gray-200 hover:border-blue-200 hover:shadow-md"
                    }`}
                    onMouseEnter={() => setHoveredOption(option.id)}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={() => handleOptionSelect(option)}
                  >
                    {/* Background Gradient */}
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br transition-opacity duration-300 ${
                        hoveredOption === option.id
                          ? "from-blue-50/80 to-indigo-50/80 opacity-100"
                          : "from-gray-50/50 to-gray-50/50 opacity-0"
                      }`}
                    />

                    {/* Content */}
                    <div className="relative p-6">
                      {/* Icon */}
                      <div
                        className={`flex items-center justify-center w-16 h-16 rounded-xl mb-4 transition-all duration-300 ${
                          hoveredOption === option.id
                            ? "bg-gradient-to-br from-blue-100 to-indigo-200 transform scale-110"
                            : "bg-gradient-to-br from-gray-100 to-gray-200"
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {option.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {option.description}
                      </p>

                      {/* Action Button */}
                      <div
                        className={`flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ${
                          selectedOption === option.id
                            ? "bg-blue-700 text-white"
                            : hoveredOption === option.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 group-hover:bg-blue-600 group-hover:text-white"
                        }`}
                      >
                        {selectedOption === option.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Select Option</span>
                            <svg
                              className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hover Indicator */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 border-blue-400 transition-opacity duration-300 pointer-events-none ${
                        hoveredOption === option.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
