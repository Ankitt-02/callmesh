import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import withAuth from '../utils/withAuth';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const [error, setError] = useState('');

    const { addToUserHistory, userData, handleLogout } = useContext(AuthContext);

    const handleJoinVideoCall = async (codeToJoin) => {
        const code = (codeToJoin || meetingCode).trim().toLowerCase();
        if (!code) {
            setError('Please enter a valid meeting code.');
            return;
        }

        try {
            await addToUserHistory(code);
        } catch (e) {
            console.warn('Could not record meeting history:', e);
        }

        navigate(`/${code}`);
    };

    const handleCreateInstantMeeting = () => {
        const randomCode = 'mesh-' + Math.random().toString(36).substring(2, 8);
        handleJoinVideoCall(randomCode);
    };

    return (
        <div className="dashboardWrapper">
            {/* Top Navigation */}
            <header className="dashboardNav">
                <div className="brandLogo" onClick={() => navigate('/')}>
                    <div className="brandIcon">
                        <img src="/callmesh-logo.svg" alt="CallMesh Logo" className="brandLogoImg" />
                    </div>
                    <span className="brandName">
                        Call<span className="brandMesh">Mesh</span>
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="userBadge">
                        <span>{userData?.username || 'User'}</span>
                    </div>

                    <button
                        className="btnSignIn"
                        onClick={() => navigate('/history')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                    >
                        <RestoreIcon fontSize="small" />
                        <span>History</span>
                    </button>

                    <button
                        className="btnSignIn"
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#f87171'
                        }}
                    >
                        <LogoutIcon fontSize="small" />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Dashboard Hero */}
            <main className="dashboardMain">
                <div className="meetingActionCard">
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a855f7',
                            marginBottom: '1.25rem'
                        }}
                    >
                        <MeetingRoomIcon style={{ fontSize: '2rem' }} />
                    </div>

                    <h1 className="meetingActionTitle">
                        Connect with High Quality Video
                    </h1>

                    <p className="meetingActionSubtitle">
                        Join an existing conference with a meeting code, or launch a new instant room in seconds.
                    </p>

                    {error && (
                        <div className="authErrorBanner" style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                            {error}
                        </div>
                    )}

                    {/* Join Meeting Form */}
                    <div className="meetingInputGroup">
                        <input
                            type="text"
                            placeholder="Enter meeting code (e.g. room-alpha)"
                            value={meetingCode}
                            onChange={(e) => { setMeetingCode(e.target.value); setError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleJoinVideoCall(); }}
                            style={{
                                flex: 1,
                                padding: '0.85rem 1.2rem',
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '12px',
                                color: '#ffffff',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />

                        <button
                            className="btnPrimaryCta"
                            onClick={() => handleJoinVideoCall()}
                            style={{ borderRadius: '12px', padding: '0.85rem 1.8rem' }}
                        >
                            Join
                        </button>
                    </div>

                    <div className="orDivider">
                        <span>or start fresh</span>
                    </div>

                    {/* Create New Meeting Button */}
                    <button
                        className="btnNewMeeting"
                        onClick={handleCreateInstantMeeting}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <AddCircleOutlineIcon fontSize="small" style={{ color: '#a855f7' }} />
                        <span>Start Instant Meeting</span>
                    </button>
                </div>
            </main>
        </div>
    );
}

export default withAuth(HomeComponent);