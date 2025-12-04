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

type AnimationPhase = "loading" | "comparing" | "analyzing" | "selecting" | "complete";

export function PriceComparison({ specialization, options, selected }: PriceComparisonProps) {
  const [visibleOptions, setVisibleOptions] = useState<number>(0);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showSelected, setShowSelected] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset state
    setVisibleOptions(0);
    setHighlighted(null);
    setShowSelected(false);
    setPhase("loading");
    setProgress(0);

    // Phase 1: Loading (0-20%)
    setPhase("loading");
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 20) return prev + 2;
        clearInterval(loadingInterval);
        return 20;
      });
    }, 30);

    // Phase 2: Comparing - Show options one by one (20-60%)
    setTimeout(() => {
      setPhase("comparing");
      let currentIndex = 0;
      const showNext = () => {
        if (currentIndex < options.length) {
          setVisibleOptions(currentIndex + 1);
          setProgress(20 + (currentIndex + 1) * (40 / options.length));
          currentIndex++;
          setTimeout(showNext, 500);
        } else {
          // Phase 3: Analyzing - Highlight each option (60-85%)
          setPhase("analyzing");
          options.forEach((option, index) => {
            setTimeout(() => {
              setHighlighted(option.name);
              setProgress(60 + (index + 1) * (25 / options.length));
              setTimeout(() => setHighlighted(null), 400);
            }, 300 + index * 500);
          });
          
          // Phase 4: Selecting - Show final selection (85-100%)
          setTimeout(() => {
            setPhase("selecting");
            setHighlighted(selected.name);
            setProgress(90);
            setTimeout(() => {
              setShowSelected(true);
              setPhase("complete");
              setProgress(100);
            }, 600);
          }, 300 + options.length * 500 + 200);
        }
      };
      setTimeout(showNext, 200);
    }, 600);

    return () => {
      clearInterval(loadingInterval);
    };
  }, [options, selected]);

  if (options.length <= 1) return null; // Don't show if only one option

  const cheapestRate = Math.min(...options.map(o => parseFloat(o.rate)));
  const phaseLabels: Record<AnimationPhase, string> = {
    loading: "Initializing comparison...",
    comparing: "Discovering specialists...",
    analyzing: "Analyzing rates...",
    selecting: "Selecting best price...",
    complete: "Best price selected!",
  };

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg border border-blue-300 dark:border-blue-700 overflow-hidden relative">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" />
      
      <div className="relative z-10">
        {/* Header with progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl animate-spin-slow">🔍</span>
            </div>
            <div>
              <div className="text-white font-bold text-base">
                {phaseLabels[phase]}
              </div>
              <div className="text-white/80 text-xs">
                {specialization} specialists
              </div>
            </div>
          </div>
          {phase !== "complete" && (
            <div className="text-white/90 text-xs font-semibold">
              {Math.round(progress)}%
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-300 via-green-300 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-white/30 animate-shimmer" />
          </div>
        </div>

        {/* Options cards */}
        <div className="space-y-3">
          {options.slice(0, visibleOptions).map((option, index) => {
            const isSelected = option.name === selected.name;
            const isHighlighted = highlighted === option.name;
            const isCheapest = parseFloat(option.rate) === cheapestRate;
            const rateValue = parseFloat(option.rate);
            const ratePercentage = ((rateValue - cheapestRate) / cheapestRate) * 100;

            return (
              <div
                key={option.name}
                className={`p-4 rounded-lg border-2 backdrop-blur-sm transition-all duration-500 transform ${
                  isSelected && showSelected
                    ? "bg-green-400/90 dark:bg-green-600/90 border-green-300 dark:border-green-500 shadow-xl scale-105 ring-2 ring-green-300 dark:ring-green-400"
                    : isHighlighted
                    ? "bg-yellow-300/80 dark:bg-yellow-600/80 border-yellow-400 dark:border-yellow-500 shadow-lg scale-[1.02]"
                    : "bg-white/90 dark:bg-zinc-800/90 border-white/50 dark:border-zinc-700/50"
                }`}
                style={{
                  animation: "slideInUp 0.5s ease-out",
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Number badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-all ${
                      isSelected && showSelected
                        ? "bg-green-500 scale-110"
                        : isHighlighted
                        ? "bg-yellow-500 scale-105"
                        : "bg-blue-500"
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-base text-zinc-800 dark:text-zinc-100">
                          {option.name}
                        </div>
                        {isCheapest && phase === "complete" && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full animate-bounce">
                            ✓ Best
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono mt-0.5">
                        {option.address.slice(0, 8)}...{option.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-xl font-bold transition-colors ${
                      isCheapest
                        ? "text-green-600 dark:text-green-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {option.rate} ETH
                    </div>
                    {!isCheapest && ratePercentage > 0 && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        +{ratePercentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final selection card */}
        {showSelected && phase === "complete" && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg border-2 border-green-300 dark:border-green-400 shadow-xl animate-fadeInUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-base">
                  Selected: {selected.name}
                </div>
                <div className="text-white/90 text-sm mt-0.5">
                  Best price: <span className="font-bold">{selected.rate} ETH</span>
                </div>
                <div className="text-white/80 text-xs mt-1">
                  {selected.address.slice(0, 10)}...{selected.address.slice(-8)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

