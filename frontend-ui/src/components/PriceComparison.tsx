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
    <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/50 dark:via-violet-950/50 dark:to-purple-950/50 rounded-xl shadow-xl border border-indigo-200/50 dark:border-indigo-800/50 overflow-hidden relative backdrop-blur-sm">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 animate-pulse" />
      
      <div className="relative z-10">
        {/* Header with progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg flex items-center justify-center">
              <span className="text-xl text-white animate-spin-slow">🔍</span>
            </div>
            <div>
              <div className="text-indigo-900 dark:text-indigo-100 font-bold text-base">
                {phaseLabels[phase]}
              </div>
              <div className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                {specialization} specialists
              </div>
            </div>
          </div>
          {phase !== "complete" && (
            <div className="text-indigo-700 dark:text-indigo-300 text-xs font-bold bg-white/60 dark:bg-indigo-900/40 px-3 py-1.5 rounded-full">
              {Math.round(progress)}%
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-lg relative"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
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
                className={`p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-500 transform ${
                  isSelected && showSelected
                    ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border-emerald-400 dark:border-emerald-500 shadow-2xl scale-105 ring-4 ring-emerald-200/50 dark:ring-emerald-700/50"
                    : isHighlighted
                    ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border-amber-300 dark:border-amber-600 shadow-xl scale-[1.02]"
                    : "bg-white/80 dark:bg-zinc-800/80 border-indigo-200/60 dark:border-indigo-800/60 shadow-md hover:shadow-lg"
                }`}
                style={{
                  animation: "slideInUp 0.5s ease-out",
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Number badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all ${
                      isSelected && showSelected
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 scale-110 ring-2 ring-emerald-300 dark:ring-emerald-600"
                        : isHighlighted
                        ? "bg-gradient-to-br from-amber-500 to-yellow-500 scale-105"
                        : "bg-gradient-to-br from-indigo-500 to-violet-600"
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-base text-zinc-800 dark:text-zinc-100">
                          {option.name}
                        </div>
                        {isCheapest && phase === "complete" && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md animate-bounce">
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
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-indigo-700 dark:text-indigo-300"
                    }`}>
                      {option.rate} ETH
                    </div>
                    {!isCheapest && ratePercentage > 0 && (
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
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
          <div className="mt-4 p-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl border-2 border-emerald-400 dark:border-emerald-500 shadow-2xl animate-fadeInUp backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-base drop-shadow-sm">
                  Selected: {selected.name}
                </div>
                <div className="text-white/95 text-sm mt-0.5 font-medium">
                  Best price: <span className="font-bold">{selected.rate} ETH</span>
                </div>
                <div className="text-white/85 text-xs mt-1 font-mono">
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

