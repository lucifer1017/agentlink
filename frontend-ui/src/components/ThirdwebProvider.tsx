"use client";

import { ThirdwebProvider as ThirdwebProviderBase } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";

export function ThirdwebProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProviderBase>
      {children}
    </ThirdwebProviderBase>
  );
}


