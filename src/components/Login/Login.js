import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [selectedUser, setSelectedUser] = useState('james');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    const result = await login(selectedUser, pin);

    if (!result.success) {
      setError(result.error || 'Invalid PIN');
      setPin('');
    }
    setLoading(false);
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 4) {
      setPin(value);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Brighton Points App</h1>
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="user-selection">
            <button
              type="button"
              className={selectedUser === 'james' ? 'active' : ''}
              onClick={() => setSelectedUser('james')}
            >
              James
            </button>
            <button
              type="button"
              className={selectedUser === 'laurie' ? 'active' : ''}
              onClick={() => setSelectedUser('laurie')}
            >
              Laurie
            </button>
          </div>

          <div className="pin-input-group">
            <label htmlFor="pin">Enter 4-digit PIN:</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="login-button"
            disabled={loading || pin.length !== 4}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
