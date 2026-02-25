import { useState } from 'react';
import {
    HiOutlineMail,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineDocumentText,
} from 'react-icons/hi';

function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (!name.trim()) {
                    throw new Error('Name is required');
                }
            }
            if (!email.trim()) throw new Error('Email is required');
            if (!password.trim()) throw new Error('Password is required');
            if (mode === 'register' && password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const data = mode === 'register'
                ? { name: name.trim(), email: email.trim(), password }
                : { email: email.trim(), password };

            await onAuth(mode, data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
    };

    return (
        <div className="auth-page">
            {/* Animated background particles */}
            <div className="auth-bg">
                <div className="auth-bg-orb orb-1"></div>
                <div className="auth-bg-orb orb-2"></div>
                <div className="auth-bg-orb orb-3"></div>
            </div>

            <div className="auth-card">
                {/* Logo / branding */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <HiOutlineDocumentText />
                    </div>
                    <h1 className="auth-title">Papyr</h1>
                    <p className="auth-subtitle">
                        {mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <HiOutlineUser className="auth-input-icon" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>
                    )}

                    <div className="auth-field">
                        <div className="auth-input-wrapper">
                            <HiOutlineMail className="auth-input-icon" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <div className="auth-input-wrapper">
                            <HiOutlineLockClosed className="auth-input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="auth-spinner"></span>
                        ) : mode === 'login' ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Toggle link */}
                <div className="auth-toggle">
                    <span>
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <button onClick={toggleMode} className="auth-toggle-btn">
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
