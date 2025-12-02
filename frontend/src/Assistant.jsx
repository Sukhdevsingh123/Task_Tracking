
import { useState, useRef, useEffect } from 'react';
import { Send, Wallet, Receipt, Loader2, DollarSign, Sparkles, ArrowRight } from 'lucide-react';
// Thirdweb Imports
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import { client } from "./App"; 
import ExpenseHistory from './ExpenseHistory'; 

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xa63250936c5Cf634854045b54E43dcfAFB29D704";
const CHAIN = defineChain(11155111); // Base Sepolia

function Assistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null); 
  const [viewMode, setViewMode] = useState('chat'); 

  const messagesEndRef = useRef(null);
  const account = useActiveAccount(); 

  const contract = getContract({ 
    client, 
    chain: CHAIN, 
    address: CONTRACT_ADDRESS,
  });

  const { mutate: sendTransaction, isPending: isTxPending } = useSendTransaction();
  
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setPendingTx(null);

    try {
      const response = await fetch('http://localhost:8787/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMessage }] }),
      });

      const text = await response.text(); 
      try {
        const data = JSON.parse(text);
        if(data.error) {
           setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't identify an expense." }]);
        } else {
           setMessages(prev => [...prev, { role: 'assistant', content: data.analysis }]);
           setPendingTx(data);
        }
      } catch (jsonError) {
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to Agent." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = () => {
    if(!account) return alert("Please connect wallet first");
    
    const transaction = prepareContractCall({
      contract,
      method: "function logExpense(uint256 _amount, string _category, string _description)",
      params: [BigInt(pendingTx.amount), pendingTx.category, pendingTx.description],
    });

    sendTransaction(transaction, {
      onSuccess: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: "✅ Successfully logged to the Blockchain!" }]);
        setPendingTx(null);
      },
      onError: (err) => {
        console.error(err);
        alert("Transaction Failed: " + err.message);
      }
    });
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      
      {/* Floating Toggle Bar */}
      <div className="flex justify-center pt-6 pb-2">
        <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full flex gap-1 shadow-2xl">
            <button 
                onClick={() => setViewMode('chat')} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${viewMode==='chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:text-white'}`}
            >
                AI Assistant
            </button>
            <button 
                onClick={() => setViewMode('history')} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${viewMode==='history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:text-white'}`}
            >
                Transactions
            </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 scroll-smooth">
        
        {viewMode === 'history' && (
             <ExpenseHistory isConnected={!!account} />
        )}

        {/* CHAT VIEW */}
        {viewMode === 'chat' && (
          <div className="max-w-2xl mx-auto space-y-8 pb-32">
            
            {/* Empty State / Welcome */}
            {messages.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <div className="w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl mx-auto flex items-center justify-center border border-white/5 mb-6 shadow-xl">
                        <Sparkles className="text-blue-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                    <p className="text-neutral-400">Tell me about an expense to log it on-chain.</p>
                </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/5 ${msg.role === 'user' ? 'bg-neutral-800 text-white' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'}`}>
                  {msg.role === 'user' ? <DollarSign size={18} /> : <Receipt size={18} />}
                </div>
                <div className={`max-w-[85%] p-5 rounded-3xl leading-relaxed shadow-sm text-[15px] ${
                    msg.role === 'user' 
                    ? 'bg-neutral-100 text-neutral-900 rounded-tr-md' 
                    : 'bg-neutral-900/80 backdrop-blur border border-white/10 rounded-tl-md text-neutral-200'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {pendingTx && (
              <div className="ml-16 max-w-sm bg-gradient-to-b from-neutral-900 to-black border border-blue-500/30 rounded-2xl p-5 shadow-2xl shadow-blue-900/10 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Ready to Mint
                  </h3>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md text-[10px] font-mono">BASE SEPOLIA</span>
                </div>

                <div className="space-y-3 mb-6 font-mono text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-neutral-500">Amount</span> 
                    <span className="text-white text-lg font-bold">${pendingTx.amount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-neutral-500">Category</span> 
                    <span className="text-blue-300">{pendingTx.category}</span>
                  </div>
                  <div className="flex justify-between items-start pt-2">
                    <span className="text-neutral-500">Details</span> 
                    <span className="text-neutral-300 text-right max-w-[150px] truncate">{pendingTx.description}</span>
                  </div>
                </div>

                <button 
                    onClick={handleMint} 
                    disabled={isTxPending} 
                    className="w-full py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTxPending ? <Loader2 className="animate-spin w-4 h-4"/> : <Wallet className="w-4 h-4"/>}
                  {isTxPending ? "Confirming on Wallet..." : "Sign Transaction"}
                </button>
              </div>
            )}
            
            {isLoading && (
                <div className="flex gap-4 ml-1">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-150"></span>
                        <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-300"></span>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      {/* INPUT AREA */}
      {viewMode === 'chat' && (
        <footer className="p-4 md:p-6 bg-transparent fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="e.g. Bought a server for $50..." 
                className="w-full bg-neutral-900/90 backdrop-blur-xl text-white pl-6 pr-16 py-4 rounded-2xl border border-white/10 focus:border-white/20 outline-none transition-all shadow-2xl placeholder:text-neutral-600 relative z-10" 
              />
              <button 
                type="submit" 
                disabled={isLoading} 
                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-colors z-20 disabled:bg-neutral-800 disabled:text-neutral-500"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight size={20} />}
              </button>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}

export default Assistant;







