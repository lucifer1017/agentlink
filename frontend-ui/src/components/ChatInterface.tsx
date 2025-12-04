"use client";

import { useState } from "react";
import { sendRequestToManager, type JobResponse } from "@/lib/api";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { toUnits } from "thirdweb/utils";
import { client } from "@/client";
import { baseSepolia } from "thirdweb/chains";
import { PriceComparison } from "./PriceComparison";

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900 rounded-t-lg">
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
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {/* Show price comparison animation if available */}
                {message.jobResponse?.priceComparison && (
                  <div className="mb-4">
                    <PriceComparison {...message.jobResponse.priceComparison} />
                  </div>
                )}

                {/* Show preview or full result based on payment status */}
                <div className="whitespace-pre-wrap break-words">
                  {message.paymentCompleted && message.jobResponse?.fullResult
                    ? message.jobResponse.fullResult
                    : message.content}
                </div>
                
                {/* Show payment button if invoice exists and payment not completed */}
                {message.jobResponse?.invoice && !message.paymentCompleted && (
                  <div className="mt-4">
                    {/* Enhanced Invoice Card */}
                    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4">
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
                            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
                              <span>✓</span>
                              <span>Best Price</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4">
                        {/* Total Amount - Prominent Display */}
                        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Amount</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                              {message.jobResponse.invoice.amount}
                            </span>
                            <span className="text-lg text-zinc-600 dark:text-zinc-400 font-semibold">
                              {message.jobResponse.invoice.currency}
                            </span>
                          </div>
                          {message.jobResponse.priceComparison && message.jobResponse.priceComparison.options.length > 1 && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                              ✓ Compared {message.jobResponse.priceComparison.options.length} specialists
                            </div>
                          )}
                        </div>

                        {/* Visual Breakdown - Enhanced */}
                        {message.jobResponse.invoice.breakdown && message.jobResponse.invoice.breakdown.length > 1 ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Payment Breakdown
                              </div>
                              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                            
                            <div className="space-y-2">
                              {message.jobResponse.invoice.breakdown.map((item, idx) => {
                                const totalAmount = parseFloat(message.jobResponse.invoice.amount);
                                const itemAmount = parseFloat(item.amount);
                                const percentage = totalAmount > 0 ? (itemAmount / totalAmount) * 100 : 0;
                                
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
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
                                    <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Total and Recipient */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                  Payment Recipient
                                </div>
                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                  Total: {message.jobResponse.invoice.amount} ETH
                                </div>
                              </div>
                              <div className="font-mono text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {message.jobResponse.invoice.to}
                              </div>
                              <div className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                                Primary specialist will distribute to others
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Single Specialist Display */
                          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Payment Recipient</div>
                            <div className="font-mono text-sm text-zinc-800 dark:text-zinc-100 break-all">
                              {message.jobResponse.invoice.to}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
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
                          className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed transition-all duration-300 text-base font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
                
                {/* Show payment confirmation if paid */}
                {message.paymentCompleted && message.jobResponse?.invoice && (
                  <div className="mt-4 pt-4 border-t border-green-500 dark:border-green-600">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                      ✅ Payment Confirmed
                    </div>
                    {message.transactionHash && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        <a
                          href={`https://sepolia.basescan.org/tx/${message.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline font-mono"
                        >
                          View on BaseScan: {message.transactionHash.slice(0, 10)}...
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Container */}
      <div className="p-4 bg-white dark:bg-zinc-800 rounded-b-lg border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}


