import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VideocamIcon from '@mui/icons-material/Videocam';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

export default function Authentication() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // 0 = Sign In, 1 = Sign Up
    const [formState, setFormState] = useState(0);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const { handleRegister, handleLogin, userData } = useContext(AuthContext);

    // If already logged in, redirect to /home
    useEffect(() => {
        if (userData?.token) {
            navigate('/home');
        }
    }, [userData, navigate]);

    // Handle initial mode from URL (e.g. /auth?mode=signup)
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'signup') {
            setFormState(1);
        } else if (mode === 'signin') {
            setFormState(0);
        }
    }, [searchParams]);

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (formState === 0) {
            // Sign In validation
            if (!username.trim() || !password.trim()) {
                setError('Please provide your email/username and password.');
                return;
            }
        } else {
            // Sign Up validation
            if (!name.trim()) {
                setError('Please enter your full name.');
                return;
            }
            if (!email.trim()) {
                setError('Please enter your email address.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setError('Please enter a valid email address.');
                return;
            }
            if (!username.trim()) {
                setError('Please choose a username.');
                return;
            }
            if (!password || password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }

        setLoading(true);

        try {
            if (formState === 0) {
                // Sign In using email or username
                await handleLogin(username.trim(), password);
            } else {
                // Sign Up with email
                const result = await handleRegister(name.trim(), username.trim(), email.trim(), password);
                setMessage(result || 'Registration successful! You can now log in.');
                setOpenSnackbar(true);
                setFormState(0);
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            const apiMessage = err?.response?.data?.message || err?.message || 'Authentication failed. Please try again.';
            setError(apiMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="authPageWrapper">
            <div className="authCard">
                {/* Brand Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="brandIcon">
                            <VideocamIcon fontSize="large" />
                        </div>
                        <span className="brandName" style={{ fontSize: '1.9rem' }}>
                            Call<span className="brandMesh">Mesh</span>
                        </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                        {formState === 0 ? 'Welcome back! Sign in with your email or username.' : 'Create an account to host, share, and track calls.'}
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="authTabs">
                    <button
                        type="button"
                        className={`authTabBtn ${formState === 0 ? 'active' : ''}`}
                        onClick={() => { setFormState(0); setError(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`authTabBtn ${formState === 1 ? 'active' : ''}`}
                        onClick={() => { setFormState(1); setError(''); }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="authErrorBanner">
                        {error}
                    </div>
                )}

                {/* Form Fields */}
                <form noValidate onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {formState === 1 && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                                    Full Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ankit Swami"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.6rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
                                            color: '#ffffff',
                                            fontSize: '0.95rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <BadgeOutlinedIcon style={{ position: 'absolute', left: '0.8rem', top: '0.8rem', color: '#64748b', fontSize: '1.2rem' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="email"
                                        placeholder="e.g. ankit@callmesh.app"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.6rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
                                            color: '#ffffff',
                                            fontSize: '0.95rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <EmailOutlinedIcon style={{ position: 'absolute', left: '0.8rem', top: '0.8rem', color: '#64748b', fontSize: '1.2rem' }} />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                            {formState === 0 ? 'Email or Username' : 'Username'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder={formState === 0 ? 'Enter your email or username' : 'Choose a unique username'}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                            <PersonOutlineIcon style={{ position: 'absolute', left: '0.8rem', top: '0.8rem', color: '#64748b', fontSize: '1.2rem' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                placeholder={formState === 0 ? 'Enter your password' : 'Create a strong password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                            <LockOutlinedIcon style={{ position: 'absolute', left: '0.8rem', top: '0.8rem', color: '#64748b', fontSize: '1.2rem' }} />
                        </div>
                    </div>

                    {formState === 1 && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                <LockOutlinedIcon style={{ position: 'absolute', left: '0.8rem', top: '0.8rem', color: '#64748b', fontSize: '1.2rem' }} />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.6rem',
                            padding: '0.85rem 0',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && <CircularProgress size={18} style={{ color: '#ffffff' }} />}
                        <span>{formState === 0 ? 'Sign In' : 'Create Account'}</span>
                    </button>
                </form>

                {/* Guest access option */}
                <div style={{ textAlign: 'center', marginTop: '1.6rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        Just looking to test a call quickly?
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/guest-lobby-' + Math.random().toString(36).substring(2, 7))}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Join call as guest without account →
                    </button>
                </div>
            </div>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
            >
                <Alert severity="success" sx={{ width: '100%', background: '#0f172a', color: '#ffffff', border: '1px solid #10b981' }}>
                    {message}
                </Alert>
            </Snackbar>
        </div>
    );
}