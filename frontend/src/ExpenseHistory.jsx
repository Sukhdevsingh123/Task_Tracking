
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { RefreshCw, Receipt, Wallet, AlertCircle, Clock, Search } from 'lucide-react';

const CONTRACT_ADDRESS = "0xa63250936c5Cf634854045b54E43dcfAFB29D704";

const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "getMyExpenses",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "amount", "type": "uint256" },
                    { "internalType": "string", "name": "category", "type": "string" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "internalType": "struct ExpenseTracker.Expense[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "userExpenses",
        "outputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "string", "name": "category", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const ExpenseHistory = ({ isConnected }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [targetAddress, setTargetAddress] = useState('');

    const fetchExpenses = useCallback(async () => {
        if (!window.ethereum || !targetAddress) return;

        setLoading(true);
        setError(null);
        setExpenses([]); // Clear previous results

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            // We can use a provider (read-only) or signer. Provider is enough for reading.
            // But existing code used signer, so we stick to it or just use provider for flexibility.
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            const fetchedExpenses = [];
            let index = 0;
            let keepFetching = true;

            // Loop to fetch expenses one by one until we hit an error (out of bounds)
            // Note: This is not efficient for large arrays but necessary since we can't modify the contract
            while (keepFetching) {
                try {
                    const item = await contract.userExpenses(targetAddress, index);
                    fetchedExpenses.push({
                        amount: item.amount.toString(),
                        category: item.category,
                        description: item.description,
                        timestamp: Number(item.timestamp)
                    });
                    index++;

                    // Safety break to prevent infinite loops if something goes wrong, though try/catch should handle it
                    if (index > 1000) break;
                } catch (err) {
                    // We assume an error means we reached the end of the array
                    keepFetching = false;
                }
            }

            setExpenses(fetchedExpenses.reverse());

        } catch (err) {
            console.error("Ethers Error:", err);
            setError("Failed to fetch. Ensure you are on Base Sepolia and the address is valid.");
        } finally {
            setLoading(false);
        }
    }, [targetAddress]);

    useEffect(() => {
        if (isConnected && targetAddress) {
            fetchExpenses();
        }
    }, [isConnected, targetAddress]); // Removed fetchExpenses from dependency to avoid loop if it wasn't wrapped, but it is useCallback so it's fine.

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center mt-6">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-neutral-500">
                    <Wallet className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Wallet Not Connected</h3>
                <p className="text-neutral-400 mt-1 max-w-xs">Connect your wallet to view your on-chain expense history.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 mt-2 pb-20">
            <div className="flex flex-col gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">On-Chain History</h2>
                    </div>
                    <button
                        onClick={fetchExpenses}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition text-white border border-white/5 active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Address Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-500" />
                    </div>
                    <input
                        type="text"
                        value={targetAddress}
                        onChange={(e) => setTargetAddress(e.target.value)}
                        placeholder="Enter wallet address to view expenses..."
                        className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-colors"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex gap-3 items-center">
                    <AlertCircle size={18} className="shrink-0" /> {error}
                </div>
            )}

            {!loading && expenses.length === 0 && !error && (
                <div className="text-center py-16 bg-neutral-900/30 rounded-3xl border border-white/5">
                    <Receipt className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                    <p className="text-neutral-400 font-medium">No expenses found for this address.</p>
                </div>
            )}

            <div className="space-y-3">
                {expenses.map((exp, i) => (
                    <div key={i} className="group relative bg-neutral-900/60 border border-white/5 p-5 rounded-2xl hover:bg-neutral-900 hover:border-blue-500/20 transition-all duration-300 overflow-hidden">
                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative flex justify-between items-center z-10">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-white/5 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-white font-semibold text-lg">{exp.description}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/20 uppercase tracking-wider">
                                            {exp.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-neutral-500 text-xs">
                                            <Clock size={10} />
                                            {new Date(exp.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
                                    ${exp.amount}
                                </div>
                                <div className="text-[10px] text-neutral-600 font-mono mt-1">
                                    VERIFIED
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseHistory;