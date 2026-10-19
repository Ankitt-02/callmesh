import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import withAuth from '../utils/withAuth';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                if (Array.isArray(history)) {
                    setMeetings(history);
                } else {
                    setMeetings([]);
                }
            } catch (err) {
                console.error('Error fetching meeting history:', err);
                setMeetings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'Recent';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setSnackbarMsg(`Copied meeting code: ${code}`);
    };

    return (
        <div className="historyWrapper">
            {/* Header */}
            <div className="historyHeader">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <button
                        className="btnSignIn"
                        onClick={() => navigate('/home')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                    >
                        <ArrowBackIcon fontSize="small" />
                        <span>Back</span>
                    </button>

                    <div className="brandLogo" onClick={() => navigate('/home')}>
                        <div className="brandIcon">
                            <VideocamIcon fontSize="inherit" />
                        </div>
                        <span className="brandName">
                            Call<span className="brandMesh">Mesh</span> History
                        </span>
                    </div>
                </div>

                <button
                    className="btnPrimaryCta"
                    onClick={() => navigate('/home')}
                    style={{ padding: '0.6rem 1.4rem', fontSize: '0.95rem' }}
                >
                    + New Meeting
                </button>
            </div>

            {/* Content State */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                    <CircularProgress style={{ color: '#a855f7' }} />
                </div>
            ) : meetings.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        maxWidth: '550px',
                        margin: '2rem auto'
                    }}
                >
                    <div style={{ fontSize: '3rem', color: '#64748b', marginBottom: '1rem' }}>
                        📋
                    </div>
                    <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No Meeting Records Yet</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        Calls you join or create while signed in will appear here so you can revisit them anytime.
                    </p>
                    <button className="btnPrimaryCta" onClick={() => navigate('/home')}>
                        Start a Meeting Now
                    </button>
                </div>
            ) : (
                <div className="historyGrid">
                    {meetings.map((m, index) => (
                        <div key={m._id || index} className="historyCard">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Meeting Room
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                                        {m.meetingCode}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleCopyCode(m.meetingCode)}
                                    title="Copy Code"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '6px',
                                        color: '#cbd5e1',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.4rem' }}>
                                <CalendarTodayIcon style={{ fontSize: '0.95rem', color: '#a855f7' }} />
                                <span>{formatDate(m.date)}</span>
                            </div>

                            <button
                                className="btnPrimaryCta"
                                onClick={() => navigate(`/${m.meetingCode}`)}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '0.65rem 0',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <PlayArrowIcon fontSize="small" />
                                <span>Rejoin Call</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Snackbar
                open={!!snackbarMsg}
                autoHideDuration={3000}
                onClose={() => setSnackbarMsg('')}
            >
                <Alert severity="info" sx={{ width: '100%', background: '#0f172a', color: '#ffffff', border: '1px solid #38bdf8' }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default withAuth(History);