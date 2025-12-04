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
                  <div className="mt-4 pt-4 border-t border-zinc-300 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">💰 Invoice</div>
                      {message.jobResponse.priceComparison && message.jobResponse.priceComparison.options.length > 1 && (
                        <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                          <span>✓</span>
                          <span>Best Price Selected</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm space-y-1 mb-3">
                      <div className="flex items-center gap-2">
                        <span>
                          Amount: <span className="font-bold">{message.jobResponse.invoice.amount}</span> {message.jobResponse.invoice.currency}
                        </span>
                        {message.jobResponse.priceComparison && message.jobResponse.priceComparison.options.length > 1 && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            (Compared {message.jobResponse.priceComparison.options.length} options)
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs">
                        To: {message.jobResponse.invoice.to}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {message.jobResponse.invoice.description}
                      </div>
                    </div>
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
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                    >
                      {isTransactionPending ? "Processing..." : `Pay ${message.jobResponse.invoice.amount} ${message.jobResponse.invoice.currency}`}
                    </button>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
                      Pay to unlock the full code
                    </p>
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


