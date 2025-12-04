"use client";

import { useEffect, useState } from "react";

interface LoadingStep {
  id: string;
  label: string;
  icon: string;
}

const steps: LoadingStep[] = [
  { id: "analyzing", label: "Analyzing your request...", icon: "🧠" },
  { id: "identifying", label: "Identifying required skills...", icon: "🔍" },
  { id: "contacting", label: "Contacting specialists...", icon: "📡" },
  { id: "compiling", label: "Compiling results...", icon: "📦" },
];

export function LoadingProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Progress through steps automatically with different timings
    let stepIndex = 0;
    const timeouts: NodeJS.Timeout[] = [];
    
    // Timing configuration: first 3 steps take 3.5s each, last step stays active
    const stepTimings = [3500, 3500, 3500, Infinity]; // 3.5s for first 3, infinite for last
    
    const progressToStep = (index: number) => {
      if (index < steps.length) {
        setCurrentStep(index);
        
        // Mark previous step as completed
        if (index > 0) {
          setCompletedSteps((prevCompleted) => {
            const newCompleted = new Set(prevCompleted);
            newCompleted.add(steps[index - 1].id);
            return newCompleted;
          });
        }
        
        // Schedule next step (except for last step which stays active)
        if (index < steps.length - 1) {
          const delay = stepTimings[index] || 3500;
          const timeout = setTimeout(() => {
            progressToStep(index + 1);
          }, delay);
          timeouts.push(timeout);
        }
        // Last step (Compiling results) stays active - no timeout
      }
    };

    // Start progression after initial delay
    const initialTimeout = setTimeout(() => {
      progressToStep(0);
    }, 500);
    timeouts.push(initialTimeout);
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-lg max-w-md">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(step.id) || index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className="flex items-center gap-4 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md"
                      : isActive
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg scale-110"
                      : "bg-zinc-200 dark:bg-zinc-700 opacity-50"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className={isActive ? "animate-pulse" : ""}>{step.icon}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium transition-all duration-300 ${
                      isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isActive
                        ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  {/* Progress line (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="mt-2 ml-5">
                      <div
                        className={`h-1 w-0.5 transition-all duration-500 ${
                          isCompleted || isActive
                            ? "bg-gradient-to-b from-indigo-500 to-violet-500 h-8"
                            : "bg-zinc-200 dark:bg-zinc-700 h-4"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

