
import React from "react";
import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider, ConnectButton, useActiveAccount } from "thirdweb/react";
import Assistant from "./Assistant";
import { Wallet } from "lucide-react";

export const client = createThirdwebClient({
  clientId: "687fd5fa9f2df91f1df0887b30abb03a",
});

function WalletConnectUI() {
  const account = useActiveAccount();
  
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Glass Header */}
        <header className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-neutral-950/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wallet className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">AI Expense Tracker</h1>
              <p className="text-xs text-neutral-400 font-medium">Powered by Sepolia Eth</p>
            </div>
          </div>
          <div className="scale-90 transform origin-right">
            <ConnectButton client={client} theme="dark" />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <Assistant />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThirdwebProvider>
      <WalletConnectUI />
    </ThirdwebProvider>
  );
}

export default App;


