"use client";

import { useState, useRef, useEffect } from "react";
import { sendRequestToManager, type JobResponse } from "@/lib/api";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { toUnits } from "thirdweb/utils";
import { client } from "@/client";
import { baseSepolia } from "thirdweb/chains";
import { PriceComparison } from "./PriceComparison";
import { LoadingProgress } from "./LoadingProgress";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  jobResponse?: JobResponse;
  paymentCompleted?: boolean; // Track if payment was made for this message
  transactionHash?: string; // Store transaction hash after payment
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendRequestToManager(input.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.result,
        timestamp: new Date(),
        jobResponse: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full max-w-4xl mx-auto">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-zinc-50 dark:bg-zinc-900 rounded-t-lg">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            <p className="text-lg mb-2">👋 Welcome to AgentLink!</p>
            <p>Ask the Manager Agent to help you with your project.</p>
            <p className="text-sm mt-2">Try: "I need a smart contract for a meme coin"</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-5 transition-all duration-200 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-md hover:shadow-lg"
                }`}
              >
                {/* Show price comparison animation if available */}
                {message.jobResponse?.priceComparison && (
                  <div className="mb-4">
                    <PriceComparison {...message.jobResponse.priceComparison} />
                  </div>
                )}

                {/* Show preview or full result based on payment status */}
                <div className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium ${
                  message.role === "assistant" && message.jobResponse
                    ? "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/30 dark:via-violet-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm"
                    : ""
                }`} style={{ letterSpacing: "-0.01em" }}>
                  {message.paymentCompleted && message.jobResponse?.fullResult ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                        <span>📦</span>
                        <span>Full Deliverable</span>
                      </div>
                      <div className="text-zinc-800 dark:text-zinc-100">
                        {message.jobResponse.fullResult}
                      </div>
                    </div>
                  ) : message.jobResponse ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                        <span>👁️</span>
                        <span>Preview</span>
                      </div>
                      <div className="text-zinc-800 dark:text-zinc-100 font-semibold">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 dark:text-zinc-100">
                      {message.content}
                    </div>
                  )}
                </div>
                
                {/* Show payment button if invoice exists and payment not completed */}
                {message.jobResponse?.invoice && !message.paymentCompleted && (
                  <div className="mt-4">
                    {/* Enhanced Invoice Card */}
                    <div className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-900 dark:via-indigo-950/30 dark:to-violet-950/30 rounded-2xl border-2 border-indigo-200/60 dark:border-indigo-800/60 shadow-2xl overflow-hidden backdrop-blur-sm">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-5 py-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-xl">💰</span>
                            </div>
                            <div>
                              <div className="text-white font-bold text-base">Payment Invoice</div>
                              <div className="text-white/80 text-xs">Complete payment to unlock full code</div>
                            </div>
                          </div>
                          {message.jobResponse.priceComparison && message.jobResponse.priceComparison.options.length > 1 && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg ring-2 ring-emerald-300/50">
                              <span>✓</span>
                              <span>Best Price</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4">
                        {/* Total Amount - Prominent Display */}
                        <div className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/30 rounded-xl p-5 border-2 border-indigo-200/50 dark:border-indigo-800/50 shadow-lg">
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2 font-semibold uppercase tracking-wide">Total Amount</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                              {message.jobResponse.invoice.amount}
                            </span>
                            <span className="text-xl text-indigo-500 dark:text-indigo-400 font-bold">
                              {message.jobResponse.invoice.currency}
                            </span>
                          </div>
                          {message.jobResponse.priceComparison && message.jobResponse.priceComparison.options.length > 1 && (
                            <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                              <span>✓</span>
                              <span>Compared {message.jobResponse.priceComparison.options.length} specialists</span>
                            </div>
                          )}
                        </div>

                        {/* Visual Breakdown - Enhanced */}
                        {message.jobResponse?.invoice?.breakdown && message.jobResponse.invoice.breakdown.length > 1 ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Payment Breakdown
                              </div>
                              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                            
                            <div className="space-y-2">
                              {message.jobResponse.invoice.breakdown.map((item, idx) => {
                                const invoice = message.jobResponse!.invoice;
                                const totalAmount = parseFloat(invoice.amount);
                                const itemAmount = parseFloat(item.amount);
                                const percentage = totalAmount > 0 ? (itemAmount / totalAmount) * 100 : 0;
                                
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md flex items-center justify-center text-white text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
                                            {item.specialist}
                                          </div>
                                          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                                            {item.address.slice(0, 8)}...{item.address.slice(-6)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                          {item.amount} ETH
                                        </div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                          {percentage.toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                    {/* Visual progress bar */}
                                    <div className="h-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden shadow-inner">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Total and Recipient */}
                            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                                  Payment Recipient
                                </div>
                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                  Total: {message.jobResponse.invoice.amount} ETH
                                </div>
                              </div>
                              <div className="font-mono text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-semibold">
                                {message.jobResponse.invoice.to}
                              </div>
                              <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium">
                                Primary specialist will distribute to others
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Single Specialist Display */
                          <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-950/30 rounded-xl p-4 border-2 border-indigo-200/50 dark:border-indigo-800/50 shadow-md">
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2 font-semibold uppercase tracking-wide">Payment Recipient</div>
                            <div className="font-mono text-sm text-indigo-700 dark:text-indigo-300 break-all font-semibold">
                              {message.jobResponse.invoice.to}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-200/50 dark:border-indigo-800/50 font-medium">
                          {message.jobResponse.invoice.description}
                        </div>
                      </div>

                      {/* Payment Button - Enhanced */}
                      <div className="px-5 pb-5">
                        <button
                          onClick={async () => {
                            if (!account || !message.jobResponse?.invoice) return;
                            
                            try {
                              // Convert ETH amount to wei (18 decimals)
                              const amountInWei = toUnits(
                                message.jobResponse.invoice.amount,
                                18 // ETH has 18 decimals
                              );
                              
                              // Prepare the transaction
                              const transaction = prepareTransaction({
                                to: message.jobResponse.invoice.to as `0x${string}`,
                                value: amountInWei,
                                chain: baseSepolia,
                                client: client,
                              });
                              
                              // Send the transaction
                              sendTransaction(transaction, {
                                onSuccess: (receipt) => {
                                  console.log("Transaction successful:", receipt);
                                  // Mark payment as completed
                                  setMessages((prev) =>
                                    prev.map((msg) =>
                                      msg.id === message.id
                                        ? { 
                                            ...msg, 
                                            paymentCompleted: true,
                                            transactionHash: receipt.transactionHash,
                                          }
                                        : msg
                                    )
                                  );
                                },
                                onError: (error) => {
                                  console.error("Transaction failed:", error);
                                  setError(`Payment failed: ${error.message}`);
                                },
                              });
                            } catch (err) {
                              console.error("Error preparing transaction:", err);
                              setError(`Payment error: ${err instanceof Error ? err.message : "Unknown error"}`);
                            }
                          }}
                          disabled={!account || isTransactionPending}
                          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 text-base font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ring-2 ring-emerald-200/50 dark:ring-emerald-700/50"
                        >
                          {isTransactionPending ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Processing Payment...</span>
                            </>
                          ) : (
                            <>
                              <span>💳</span>
                              <span>Pay {message.jobResponse.invoice.amount} {message.jobResponse.invoice.currency}</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 text-center">
                          🔓 Pay to unlock the full code and deliverables
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show payment confirmation if paid - Enhanced with Animation */}
                {message.paymentCompleted && message.jobResponse?.invoice && (
                  <div className="mt-4 animate-fadeInUp">
                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 shadow-xl p-5 overflow-hidden relative">
                      {/* Success Animation Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-cyan-400/10 animate-pulse" />
                      
                      <div className="relative z-10">
                        {/* Success Icon with Animation */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-scaleIn">
                              <svg className="w-7 h-7 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {/* Ripple effect */}
                            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                          </div>
                          <div>
                            <div className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-300">
                              Payment Confirmed
                            </div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              Full code unlocked
                            </div>
                          </div>
                        </div>

                        {/* Transaction Details Card */}
                        {message.transactionHash && (
                          <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">
                                  Transaction Hash
                                </div>
                                <div className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                  {message.transactionHash.slice(0, 12)}...{message.transactionHash.slice(-8)}
                                </div>
                              </div>
                              <a
                                href={`https://sepolia.basescan.org/tx/${message.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on BaseScan
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Confetti Effect (Subtle) */}
                        <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
                          <div className="absolute top-2 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                          <div className="absolute top-6 right-8 w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="absolute top-10 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-xs opacity-60 dark:opacity-50 mt-2 font-medium">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && <LoadingProgress />}
      </div>

      {/* Error Message - Enhanced Graceful UI */}
      {error && (
        <div className="mx-4 mb-4 animate-slideDown">
          <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/40 dark:via-rose-950/40 dark:to-pink-950/40 rounded-xl border-2 border-red-300 dark:border-red-700 shadow-lg p-4">
            <div className="flex items-start gap-3">
              {/* Error Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-red-700 dark:text-red-300 mb-1">
                  Error
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                  {error}
                </div>
                
                {/* Error Suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setError(null);
                      if (messages.length > 0) {
                        const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
                        if (lastUserMessage) {
                          setInput(lastUserMessage.content);
                        }
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Container - Enhanced with Micro-interactions */}
      <div className="p-4 bg-white dark:bg-zinc-800 rounded-b-lg border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea with smooth transition
                const textarea = e.target;
                textarea.style.height = "auto";
                const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
                textarea.style.height = `${newHeight}px`;
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full p-4 pr-12 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 leading-relaxed overflow-hidden"
              rows={1}
              disabled={isLoading}
              style={{ 
                minHeight: "56px", 
                maxHeight: "200px",
                height: "56px"
              }}
            />
            {/* Character count hint (optional, can be removed) */}
            {input.length > 100 && (
              <div className="absolute bottom-2 right-3 text-xs text-zinc-400 dark:text-zinc-500">
                {input.length}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 min-w-[100px]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


