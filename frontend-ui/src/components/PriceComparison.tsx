"use client";

import { useEffect, useState } from "react";

interface PriceComparisonProps {
  specialization: string;
  options: Array<{
    name: string;
    rate: string;
    address: string;
  }>;
  selected: {
    name: string;
    rate: string;
    address: string;
  };
}

export function PriceComparison({ specialization, options, selected }: PriceComparisonProps) {
  const [visibleOptions, setVisibleOptions] = useState<number>(0);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showSelected, setShowSelected] = useState(false);

  useEffect(() => {
    // Animation sequence: show options one by one, then highlight, then show selection
    let currentIndex = 0;
    const showNext = () => {
      if (currentIndex < options.length) {
        setVisibleOptions(currentIndex + 1);
        currentIndex++;
        setTimeout(showNext, 400);
      } else {
        // After all options shown, highlight each briefly
        options.forEach((option, index) => {
          setTimeout(() => {
            setHighlighted(option.name);
            setTimeout(() => setHighlighted(null), 400);
          }, 500 + index * 500);
        });
        // Then show selected
        setTimeout(() => {
          setHighlighted(selected.name);
          setShowSelected(true);
        }, 500 + options.length * 500 + 300);
      }
    };
    
    const timer = setTimeout(showNext, 300);
    return () => clearTimeout(timer);
  }, [options, selected]);

  if (options.length <= 1) return null; // Don't show if only one option

  const cheapestRate = Math.min(...options.map(o => parseFloat(o.rate)));

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="animate-pulse text-xl">🔍</div>
        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Comparing {specialization} specialists...
        </div>
      </div>

      <div className="space-y-2">
        {options.slice(0, visibleOptions).map((option, index) => {
          const isSelected = option.name === selected.name;
          const isHighlighted = highlighted === option.name;
          const isCheapest = parseFloat(option.rate) === cheapestRate;

          return (
            <div
              key={option.name}
              className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                isSelected && showSelected
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-lg transform scale-105"
                  : isHighlighted
                  ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 transform scale-102"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              }`}
              style={{
                animation: "slideIn 0.4s ease-out",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{option.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {option.address.slice(0, 6)}...{option.address.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${isCheapest ? "text-green-600 dark:text-green-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {option.rate} ETH
                  </div>
                  {isCheapest && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      Lowest
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showSelected && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <div>
              <div className="font-semibold text-green-700 dark:text-green-300">
                Selected: {selected.name}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Best price: {selected.rate} ETH
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

