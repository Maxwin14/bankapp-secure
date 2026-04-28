import React, { useState } from 'react';

function Login() {
    // UI State: 'login', 'reset', or 'register'
    const [mode, setMode] = useState('login'); 
    
    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("Authenticating...");
        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.text(); 
            if (data.startsWith("FAILED")) setMessage(`❌ ${data}`);
            else if (response.ok) { localStorage.setItem("jwtToken", data); window.location.reload(); }
            else setMessage("❌ Server rejected the request.");
        } catch (error) { setMessage("❌ Cannot connect to the server."); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage("Verifying identity...");
        try {
            const response = await fetch("http://localhost:8080/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, newPassword: password })
            });
            const data = await response.text();
            if (data.startsWith("SUCCESS")) { setMessage(`✅ ${data}`); setMode('login'); setPassword(''); }
            else setMessage(`❌ ${data}`);
        } catch (error) { setMessage("❌ Cannot connect to the server."); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("Creating your profile...");
        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.text();
            if (data.startsWith("SUCCESS")) { setMessage(`✅ ${data}`); setMode('login'); setPassword(''); }
            else setMessage(`❌ ${data}`);
        } catch (error) { setMessage("❌ Cannot connect to the server."); }
    };

    const switchMode = (newMode) => { setMode(newMode); setMessage(''); setPassword(''); };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-800">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 transition-all duration-300">
                
                {/* DYNAMIC HEADER */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg mb-4">
                        <span className="text-3xl text-white">🏦</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
                        {mode === 'login' ? "Secure Vault" : mode === 'reset' ? "Reset Password" : "Create Profile"}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {mode === 'login' && "Enter your credentials to access your accounts"}
                        {mode === 'reset' && "Verify your identity to create a new password"}
                        {mode === 'register' && "Join the bank and open your first account"}
                    </p>
                </div>

                {/* ALERT MESSAGES */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.startsWith("❌") ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {message}
                    </div>
                )}

                {/* DYNAMIC FORM */}
                <form onSubmit={mode === 'login' ? handleLogin : mode === 'reset' ? handleResetPassword : handleRegister} className="space-y-4">
                    
                    {/* USERNAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 pl-1">Username</label>
                        <input type="text" placeholder="e.g. max09" 
                            minLength="3" maxLength="20" // <-- React UI Boundary
                            value={username} onChange={(e) => setUsername(e.target.value)} 
                            required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    {/* EMAIL */}
                    {(mode === 'reset' || mode === 'register') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1 pl-1">Email Address</label>
                            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    )}

                    {/* PASSWORD */}
                    <div>
                        <div className="flex justify-between items-center mb-1 pl-1 pr-1">
                            <label className="block text-sm font-medium text-gray-600">{mode === 'reset' ? 'New Password' : 'Password'}</label>
                            {mode === 'login' && (
                                <button type="button" onClick={() => switchMode('reset')} className="text-xs font-bold text-blue-600 hover:text-blue-800">Forgot Password?</button>
                            )}
                        </div>
                        <input type="password" placeholder="••••••••" 
                            minLength="8" // <-- React UI Boundary
                            value={password} onChange={(e) => setPassword(e.target.value)} 
                            required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <button type="submit" className={`w-full py-3 mt-4 text-white font-semibold rounded-xl shadow-sm transition-colors ${mode === 'login' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {mode === 'login' ? "Unlock Vault" : mode === 'reset' ? "Update Password" : "Sign Up"}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm">
                    {mode === 'login' ? (
                        <p className="text-gray-600">Don't have an account? <button onClick={() => switchMode('register')} className="font-bold text-blue-600 hover:underline">Create one</button></p>
                    ) : (
                        <button onClick={() => switchMode('login')} className="font-medium text-gray-500 hover:text-gray-800">← Back to Login</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;