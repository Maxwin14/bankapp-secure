import React, { useState, useEffect } from 'react';

function Dashboard() {
    const [directoryAccounts, setDirectoryAccounts] = useState([]);
    const [users, setUsers] = useState([]); 
    const [message, setMessage] = useState('Loading secure vault data...');
    const [scheduled, setScheduled] = useState([]);
    
    // My Wallet State
    const [myAccounts, setMyAccounts] = useState([]);
    const [history, setHistory] = useState([]);

    // --- NEW: Favorites State ---
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('bank_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // Quick Transfer State
    const [senderAccountNumber, setSenderAccountNumber] = useState('');
    const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [transferMsg, setTransferMsg] = useState('');

    // Scheduled Transfer State
    const [schedSender, setSchedSender] = useState('');
    const [schedReceiver, setSchedReceiver] = useState('');
    const [schedAmount, setSchedAmount] = useState('');
    const [schedDate, setSchedDate] = useState('');
    const [schedFrequency, setSchedFrequency] = useState('MONTHLY');
    const [schedMsg, setSchedMsg] = useState('');

    // --- NEW: Auto-save favorites when they change ---
    useEffect(() => {
        localStorage.setItem('bank_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const fetchAllData = async () => {
        const token = localStorage.getItem("jwtToken");
        if (!token) { setMessage("❌ No wristband found. Please log in."); return; }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const loggedInUserId = payload.sub;

            const accRes = await fetch(`http://localhost:8080/api/accounts/user/${loggedInUserId}`, { headers: { "Authorization": `Bearer ${token}` } });
            let userAccounts = [];
            if (accRes.ok) {
                userAccounts = await accRes.json();
                setMyAccounts(userAccounts);
            }

            const dirRes = await fetch("http://localhost:8080/api/accounts/all", { headers: { "Authorization": `Bearer ${token}` } });
            if (dirRes.ok) setDirectoryAccounts(await dirRes.json());

            const schedRes = await fetch("http://localhost:8080/api/scheduled/all", { headers: { "Authorization": `Bearer ${token}` } });
            if (schedRes.ok) setScheduled(await schedRes.json());

            const userRes = await fetch("http://localhost:8080/api/users/all", { headers: { "Authorization": `Bearer ${token}` } });
            if (userRes.ok) setUsers(await userRes.json());

            if (userAccounts.length > 0) {
                const historyPromises = userAccounts.map(acc => 
                    fetch(`http://localhost:8080/api/transactions/history/${acc.accountId}`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json())
                );
                const historiesArray = await Promise.all(historyPromises);
                const combinedHistory = historiesArray.flat().sort((a, b) => new Date(b.transactionTime) - new Date(a.transactionTime));
                setHistory(combinedHistory);
            }

            setMessage("🔓 Vault Unlocked!");
        } catch (error) { setMessage("❌ Cannot connect to the server."); }
    };

    useEffect(() => { fetchAllData(); }, []);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setTransferMsg("Processing transfer...");
        const token = localStorage.getItem("jwtToken");
        try {
            const response = await fetch("http://localhost:8080/api/transactions/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ senderAccountNumber, receiverAccountNumber, amount: parseFloat(amount) })
            });
            const data = await response.text();
            if (response.ok && data.startsWith("SUCCESS")) {
                setTransferMsg(`✅ ${data}`);
                setSenderAccountNumber(''); setReceiverAccountNumber(''); setAmount('');
                fetchAllData(); 
            } else { setTransferMsg(`❌ ${data}`); }
        } catch (error) { setTransferMsg("❌ Cannot connect to the transaction server."); }
    };

    const handleSetupSchedule = async (e) => {
        e.preventDefault();
        setSchedMsg("Programming robot...");
        const token = localStorage.getItem("jwtToken");
        try {
            const response = await fetch("http://localhost:8080/api/scheduled/setup", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ fromAccountNumber: schedSender, toAccountNumber: schedReceiver, amount: parseFloat(schedAmount), nextRunDate: schedDate, frequency: schedFrequency })
            });
            if (response.ok) {
                setSchedMsg("✅ Autopay Successfully Scheduled!");
                setSchedSender(''); setSchedReceiver(''); setSchedAmount(''); setSchedDate('');
                fetchAllData(); 
            } else { setSchedMsg("❌ Failed to schedule transfer."); }
        } catch (error) { setSchedMsg("❌ Cannot connect to the server."); }
    };

    const handleCancelSchedule = async (transferId) => {
        const token = localStorage.getItem("jwtToken");
        try {
            const response = await fetch(`http://localhost:8080/api/scheduled/cancel/${transferId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
            if (response.ok) fetchAllData();
        } catch (error) { console.error("Failed to cancel transfer", error); }
    };

    const handleOpenNewAccount = async () => {
        const token = localStorage.getItem("jwtToken");
        try {
            setMessage("Opening new account...");
            const response = await fetch("http://localhost:8080/api/accounts/open", { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
            if (response.ok) { setMessage("✅ New Account Successfully Opened!"); fetchAllData(); } 
            else { setMessage("❌ Failed to open account."); }
        } catch (error) { setMessage("❌ Cannot connect to the server."); }
    };

    const handleLogout = () => { localStorage.removeItem("jwtToken"); window.location.reload(); };

    // --- NEW: Helper Functions for Contact Book ---
    const toggleFavorite = (accountNumber) => {
        if (favorites.includes(accountNumber)) {
            setFavorites(favorites.filter(fav => fav !== accountNumber));
        } else {
            setFavorites([...favorites, accountNumber]);
        }
    };

    const quickFillTransfer = (accountNumber) => {
        setReceiverAccountNumber(accountNumber);
        // If they have exactly 1 account, auto-select it as the sender too!
        if (myAccounts.length === 1) {
            setSenderAccountNumber(myAccounts[0].accountNumber);
        }
        window.scrollTo({ top: 400, behavior: 'smooth' }); // Scroll up smoothly to the transfer box
    };

    // --- NEW: Derive Contact Book Logic ---
    const recentAccountIds = new Set();
    history.forEach(tx => {
        const iAmSender = myAccounts.some(acc => acc.accountId === tx.fromAccountId);
        const iAmReceiver = myAccounts.some(acc => acc.accountId === tx.toAccountId);
        if (iAmSender) recentAccountIds.add(tx.toAccountId);
        if (iAmReceiver) recentAccountIds.add(tx.fromAccountId);
    });

    const contactBook = directoryAccounts.filter(acc => {
        const isRecent = recentAccountIds.has(acc.accountId);
        const isFavorite = favorites.includes(acc.accountNumber);
        const isNotMine = !myAccounts.some(myAcc => myAcc.accountId === acc.accountId);
        return isNotMine && (isRecent || isFavorite);
    });

    // Sort contacts: Favorites first
    contactBook.sort((a, b) => {
        const aFav = favorites.includes(a.accountNumber) ? 1 : 0;
        const bFav = favorites.includes(b.accountNumber) ? 1 : 0;
        return bFav - aFav;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* --- HEADER CARD --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md flex items-center justify-center">
                            <span className="text-2xl text-white">🏦</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900">Secure Bank</h2>
                            <p className={`text-sm mt-0.5 font-medium ${message.startsWith("❌") ? 'text-red-500' : 'text-emerald-600'}`}>{message}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-all duration-300 shadow-sm">Log Out</button>
                </div>

                {/* --- MY WALLET SECTION --- */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-md border border-blue-500 p-8 text-white">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><span>💳</span> My Wallet & Balances</h3>
                        <button onClick={handleOpenNewAccount} className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2">
                            <span>+</span> Open New Account
                        </button>
                    </div>
                    
                    {myAccounts.length === 0 ? (
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center"><p className="text-blue-100">No active accounts found.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {myAccounts.map(acc => (
                                <div key={acc.accountId} className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${acc.status === 'ACTIVE' || acc.isActive ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' : 'bg-red-400/20 text-red-100 border border-red-400/30'}`}>
                                            {acc.status || (acc.isActive ? 'ACTIVE' : 'INACTIVE')}
                                        </span>
                                    </div>
                                    <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Account Number</p>
                                    <p className="text-xl font-mono tracking-widest mb-4">{acc.accountNumber}</p>
                                    <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</p>
                                    <p className="text-4xl font-bold">${parseFloat(acc.balance).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- TWO COLUMN LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT: Instant Transfer */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><span>⚡</span> Instant Transfer</h3>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">From Account #</label>
                                <select value={senderAccountNumber} onChange={(e) => setSenderAccountNumber(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="" disabled>Select your account</option>
                                    {myAccounts.map(acc => (
                                        <option key={acc.accountId} value={acc.accountNumber}>{acc.accountNumber} (Bal: ${parseFloat(acc.balance).toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">To Account #</label>
                                <input type="text" placeholder="Select from contacts below or type here" value={receiverAccountNumber} onChange={(e) => setReceiverAccountNumber(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Amount ($)</label>
                                <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <button type="submit" className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors">Send Now</button>
                        </form>
                        {transferMsg && <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-gray-50 border">{transferMsg}</div>}
                    </div>

                    {/* RIGHT: Scheduled Transfer Setup */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-purple-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><span>🗓️</span> Setup Autopay</h3>
                        <form onSubmit={handleSetupSchedule} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">From Account</label>
                                    <select value={schedSender} onChange={(e) => setSchedSender(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="" disabled>Select account</option>
                                        {myAccounts.map(acc => <option key={acc.accountId} value={acc.accountNumber}>{acc.accountNumber}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">To Account</label>
                                    <input type="text" value={schedReceiver} onChange={(e) => setSchedReceiver(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount ($)</label>
                                    <input type="number" min="0.01" step="0.01" value={schedAmount} onChange={(e) => setSchedAmount(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Frequency</label>
                                    <select value={schedFrequency} onChange={(e) => setSchedFrequency(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="ONCE">One-Time</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Select Transfer Date</label>
                                <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>
                            <button type="submit" className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm transition-colors">Schedule Transfer</button>
                        </form>
                        {schedMsg && <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-gray-50 border">{schedMsg}</div>}
                    </div>
                </div>

                {/* --- ROBOT MONITOR & NEW CONTACT BOOK --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><span>🤖</span> Robot Task List</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {scheduled.length === 0 ? <p className="text-sm text-gray-500 italic">No scheduled transfers yet.</p> : scheduled.map((item) => (
                                <div key={item.transferId} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-900">${item.amount}</p>
                                        <p className="text-xs text-gray-500">Runs: {item.nextRunDate}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">{item.frequency}</span>
                                        <button onClick={() => handleCancelSchedule(item.transferId)} className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white text-xs font-bold rounded-md transition-colors">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- NEW SMART CONTACT BOOK --- */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span>👥</span> Contact Book</h3>
                            <p className="text-xs text-gray-500 mt-1">Recent payees and saved favorites</p>
                        </div>
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                            {contactBook.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 italic">No recent contacts found.</p>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                                        <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="px-4 py-3 font-semibold text-center w-12">Fav</th>
                                            <th className="px-4 py-3 font-semibold">Account #</th>
                                            <th className="px-4 py-3 font-semibold">Username</th>
                                            <th className="px-4 py-3 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {contactBook.map((acc) => {
                                            const owner = users.find(u => u.userId === acc.userId);
                                            const isFav = favorites.includes(acc.accountNumber);
                                            return (
                                                <tr key={acc.accountId} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            onClick={() => toggleFavorite(acc.accountNumber)}
                                                            className={`text-xl transition-colors hover:scale-110 ${isFav ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                                                            title={isFav ? "Remove Favorite" : "Add to Favorites"}
                                                        >
                                                            ★
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-mono tracking-widest">{acc.accountNumber}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-700">{owner ? owner.username : "Unknown"}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button 
                                                            onClick={() => quickFillTransfer(acc.accountNumber)}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        >
                                                            Send Money ↗
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- TRANSACTION HISTORY TABLE --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span>🧾</span> Transaction Receipts</h3>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-center text-gray-500 py-10 italic">No transactions found. Make a transfer to see it here!</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 shadow-sm">
                                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Sender ID (Hash)</th>
                                        <th className="px-6 py-4 font-semibold">Receiver ID (Hash)</th>
                                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((tx) => {
                                        const isSender = myAccounts.some(acc => acc.accountId === tx.fromAccountId);
                                        return (
                                            <tr key={tx.transactionId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{new Date(tx.transactionTime).toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wide">{tx.status}</span></td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{tx.fromAccountId.substring(0, 8)}...</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{tx.toAccountId.substring(0, 8)}...</td>
                                                <td className={`px-6 py-4 text-right font-bold text-lg ${isSender ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {isSender ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;