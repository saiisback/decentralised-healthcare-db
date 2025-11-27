"use client";

import { ConnectKitButton } from "connectkit";

export function ConnectWallet() {
  return (
    <div className="flex justify-end p-4">
      <ConnectKitButton />
    </div>
  );
}

