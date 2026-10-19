import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideocamIcon from '@mui/icons-material/Videocam';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const { userData, handleLogout } = useContext(AuthContext);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="App">
            {/* Top Navigation */}
            <nav className="landingNav">
                <div className="brandLogo" onClick={() => navigate('/')}>
                    <div className="brandIcon">
                        <VideocamIcon fontSize="inherit" />
                    </div>
                    <span className="brandName">
                        Call<span className="brandMesh">Mesh</span>
                    </span>
                </div>

                <ul className="navLinks">
                    <li>
                        <span className="navLinkItem active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Home
                        </span>
                    </li>
                    <li>
                        <span className="navLinkItem" onClick={() => scrollToSection('features')}>
                            Features
                        </span>
                    </li>
                    <li>
                        <span className="navLinkItem" onClick={() => scrollToSection('about')}>
                            About
                        </span>
                    </li>
                </ul>

                <div className="navAuthGroup">
                    {userData ? (
                        <>
                            <div className="userBadge">
                                <span>{userData.username}</span>
                            </div>
                            <button className="btnSignIn" onClick={() => navigate('/home')}>
                                Dashboard
                            </button>
                            <button className="btnSignIn" onClick={handleLogout} style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btnSignIn" onClick={() => navigate('/auth?mode=signin')}>
                                Sign In
                            </button>
                            <button className="btnSignUp" onClick={() => navigate('/auth?mode=signup')}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="heroContainer">
                <div className="heroContent">
                    <div className="eyebrowPill">
                        <span className="eyebrowDot"></span>
                        High Quality · Secure · Free to Use
                    </div>

                    <h1 className="heroHeadline">
                        <span className="gradientCyan">Connect</span>
                        <span className="whiteHeadline">with your people</span>
                    </h1>

                    <p className="heroSubtitle">
                        Seamless, high-quality video calls for friends, classmates, and communities. Stay close, no matter the distance.
                    </p>

                    <div className="heroBtnGroup">
                        <button
                            className="btnPrimaryCta"
                            onClick={() => navigate(userData ? '/home' : '/auth?mode=signup')}
                        >
                            <span>{userData ? 'Open Dashboard' : 'Get Started'}</span>
                            <ArrowForwardIcon fontSize="small" />
                        </button>

                        <button className="btnSecondaryCta" onClick={() => scrollToSection('features')}>
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Bottom 4-Card Feature Strip */}
                <div className="bottomFeatureBar">
                    <div className="featureCardItem">
                        <div className="featureIconWrapper" style={{ color: '#818cf8' }}>
                            <FlashOnIcon fontSize="inherit" />
                        </div>
                        <div>
                            <div className="featureItemTitle">Crystal Clear Calls</div>
                            <div className="featureItemDesc">HD video and audio</div>
                        </div>
                    </div>

                    <div className="featureCardItem">
                        <div className="featureIconWrapper" style={{ color: '#a855f7' }}>
                            <LockOutlinedIcon fontSize="inherit" />
                        </div>
                        <div>
                            <div className="featureItemTitle">Secure & Private</div>
                            <div className="featureItemDesc">Your conversations, your space</div>
                        </div>
                    </div>

                    <div className="featureCardItem">
                        <div className="featureIconWrapper" style={{ color: '#38bdf8' }}>
                            <GroupIcon fontSize="inherit" />
                        </div>
                        <div>
                            <div className="featureItemTitle">Connect Anywhere</div>
                            <div className="featureItemDesc">On any device, any network</div>
                        </div>
                    </div>

                    <div className="featureCardItem">
                        <div className="featureIconWrapper" style={{ color: '#f43f5e' }}>
                            <FavoriteIcon fontSize="inherit" />
                        </div>
                        <div>
                            <div className="featureItemTitle">Stay Close</div>
                            <div className="featureItemDesc">Built for friends and communities</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Features Section */}
            <section id="features" className="featuresSection">
                <div className="sectionHeader">
                    <div className="sectionEyebrow">Cutting Edge Real-Time Calling</div>
                    <h2 className="sectionTitle">Engineered for Seamless Communication</h2>
                    <p className="sectionSubtitle">
                        CallMesh pairs low-latency WebRTC technology with a modern, distraction-free interface so you can talk with ease.
                    </p>
                </div>

                <div className="featureGrid">
                    <div className="featureBox">
                        <div className="featureBoxIcon">
                            <VideocamIcon fontSize="inherit" />
                        </div>
                        <h3 className="featureBoxTitle">Real-Time Video & Audio</h3>
                        <p className="featureBoxDesc">
                            Smooth browser-based video calls using WebRTC.
                        </p>
                    </div>

                    <div className="featureBox">
                        <div className="featureBoxIcon" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)' }}>
                            <ShieldOutlinedIcon fontSize="inherit" />
                        </div>
                        <h3 className="featureBoxTitle">Private Meeting Rooms</h3>
                        <p className="featureBoxDesc">
                            Room-based participant isolation, reflecting the implemented signaling controls.
                        </p>
                    </div>

                    <div className="featureBox">
                        <div className="featureBoxIcon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
                            <ScreenShareIcon fontSize="inherit" />
                        </div>
                        <h3 className="featureBoxTitle">Screen Sharing & Chat</h3>
                        <p className="featureBoxDesc">
                            Share your screen and exchange messages during a call.
                        </p>
                    </div>

                    <div className="featureBox">
                        <div className="featureBoxIcon" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)' }}>
                            <HistoryIcon fontSize="inherit" />
                        </div>
                        <h3 className="featureBoxTitle">Meeting History</h3>
                        <p className="featureBoxDesc">
                            Return to previously recorded meeting rooms through the existing authenticated history feature.
                        </p>
                    </div>
                </div>
            </section>

            {/* Dedicated About Section */}
            <section id="about" className="aboutSection">
                <div className="aboutCard">
                    <div className="sectionEyebrow" style={{ marginBottom: '1rem' }}>
                        About CallMesh
                    </div>
                    <h2 className="aboutHeading">
                        Built with a passion for connecting people.
                    </h2>
                    <p className="aboutDescription">
                        CallMesh is a real-time video-calling project focused on bringing people together through simple, accessible browser-based communication.
                    </p>
                    <div className="aboutAttribution">
                        Designed and developed by Ankit Swami.
                    </div>

                    <div className="aboutBtnGroup">
                        <a
                            href="https://www.linkedin.com/in/ankit-swami-161b80301/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialBtnLinkedIn"
                            aria-label="Connect with Ankit Swami on LinkedIn"
                        >
                            <LinkedInIcon fontSize="small" />
                            <span>Connect on LinkedIn</span>
                        </a>

                        <a
                            href="https://ankit02.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialBtnPortfolio"
                            aria-label="Visit Ankit Swami's Portfolio website"
                        >
                            <LanguageIcon fontSize="small" />
                            <span>Visit Portfolio</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="landingFooter">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <VideocamIcon style={{ color: '#a855f7' }} />
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>CallMesh</span>
                    <span>— High-quality, secure peer-to-peer video meetings.</span>
                </div>
                <div>
                    <span>&copy; {new Date().getFullYear()} CallMesh. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}