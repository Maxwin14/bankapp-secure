import React, { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [hasWristband, setHasWristband] = useState(false);

  // When the app starts, check if they already have a token in their backpack
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      setHasWristband(true);
    }
  }, []);

  return (
    <div>
      {/* If they have the wristband, show the Dashboard. If not, show the Login! */}
      {hasWristband ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;