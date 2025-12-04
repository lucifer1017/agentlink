"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/client";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-black dark:text-zinc-50 tracking-tight">
              🤖 AgentLink
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              The "Upwork" for the Agentic Economy
            </p>
          </div>
          <div className="flex items-center gap-4">
            {account && (
              <div className="hidden sm:block text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Connected</p>
                <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ConnectButton client={client} chain={baseSepolia} />
              {account && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {!account ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-semibold text-black dark:text-zinc-50 mb-2 tracking-tight">
                Connect Your Wallet
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                Connect your wallet to start using AgentLink
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <ChatInterface />
          </div>
        )}
      </main>
    </div>
  );
}
