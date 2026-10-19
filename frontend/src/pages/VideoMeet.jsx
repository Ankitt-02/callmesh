import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { Badge, IconButton, Tooltip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import styles from '../styles/videoComponent.module.css';
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

const createSilenceTrack = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        const track = dst.stream.getAudioTracks()[0];
        track.enabled = false;
        return track;
    } catch {
        return null;
    }
};

const createBlackVideoTrack = ({ width = 640, height = 480 } = {}) => {
    try {
        const canvas = Object.assign(document.createElement('canvas'), { width, height });
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        const track = stream.getVideoTracks()[0];
        if (track) track.enabled = false;
        return track;
    } catch {
        return null;
    }
};

const ParticipantAvatar = ({ name, isCameraOff }) => {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    const initial = trimmed ? trimmed.charAt(0).toUpperCase() : '';
    const displayLabel = trimmed || 'Guest';

    return (
        <div className={styles.avatarFallback}>
            <div className={styles.avatarCircle}>
                {initial ? initial : <PersonIcon style={{ fontSize: '2.4rem' }} />}
            </div>
            <div className={styles.avatarName}>
                {displayLabel}
            </div>
            {isCameraOff && (
                <div className={styles.cameraOffBadge}>
                    <VideocamOffIcon style={{ fontSize: '0.85rem' }} />
                    <span>Camera Off</span>
                </div>
            )}
        </div>
    );
};

export default function VideoMeetComponent() {
    const { url } = useParams();
    const navigate = useNavigate();
    const normalizedRoomId = typeof url === 'string' ? url.trim().toLowerCase() : '';

    const { userData, addToUserHistory } = useContext(AuthContext);

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoref = useRef(null);
    const localStreamRef = useRef(null);
    const connectionsRef = useRef({});
    const chatEndRef = useRef(null);
    const showChatRef = useRef(false);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [newMessages, setNewMessages] = useState(0);

    // Pre-call Lobby state
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState('');

    // Remote participants state
    const [videos, setVideos] = useState([]);
    const [remoteCameraStates, setRemoteCameraStates] = useState({});
    const [remoteUsernames, setRemoteUsernames] = useState({});
    const [copiedCode, setCopiedCode] = useState(false);

    // Pre-fill username from AuthContext if available
    useEffect(() => {
        if (userData?.username) {
            setUsername(userData.username);
        } else if (userData?.name) {
            setUsername(userData.name);
        }
    }, [userData]);

    // Validate room ID
    useEffect(() => {
        if (!normalizedRoomId) {
            navigate('/home');
        }
    }, [normalizedRoomId, navigate]);

    // Scroll chat to bottom when messages update and chat is visible
    useEffect(() => {
        if (showChat) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showChat]);

    // Initial media setup with StrictMode-safe lifecycle
    useEffect(() => {
        let isMounted = true;

        const initMedia = async () => {
            try {
                if (navigator.mediaDevices?.getDisplayMedia) {
                    if (isMounted) setScreenAvailable(true);
                }

                let stream = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    if (isMounted) {
                        setVideoAvailable(true);
                        setAudioAvailable(true);
                        setVideo(true);
                        setAudio(true);
                    }
                } catch (primaryErr) {
                    console.warn('Initial dual-media request failed, checking individual devices:', primaryErr.message);

                    let videoTrack = null;
                    try {
                        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        videoTrack = vStream.getVideoTracks()[0];
                        if (isMounted) {
                            setVideoAvailable(true);
                            setVideo(true);
                        }
                    } catch {
                        if (isMounted) {
                            setVideoAvailable(false);
                            setVideo(false);
                        }
                    }

                    let audioTrack = null;
                    try {
                        const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioTrack = aStream.getAudioTracks()[0];
                        if (isMounted) {
                            setAudioAvailable(true);
                            setAudio(true);
                        }
                    } catch {
                        if (isMounted) {
                            setAudioAvailable(false);
                            setAudio(false);
                        }
                    }

                    const tracks = [];
                    if (videoTrack) tracks.push(videoTrack);
                    if (audioTrack) tracks.push(audioTrack);
                    if (tracks.length > 0) {
                        stream = new MediaStream(tracks);
                    }
                }

                if (!stream) {
                    const blackTrack = createBlackVideoTrack();
                    const silenceTrack = createSilenceTrack();
                    const dummyTracks = [];
                    if (blackTrack) dummyTracks.push(blackTrack);
                    if (silenceTrack) dummyTracks.push(silenceTrack);
                    stream = new MediaStream(dummyTracks);
                }

                if (isMounted) {
                    localStreamRef.current = stream;
                    window.localStream = stream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = stream;
                    }
                    // Attach to any existing peer connections if created before stream was ready
                    Object.values(connectionsRef.current).forEach((pc) => {
                        stream.getTracks().forEach((track) => {
                            try {
                                pc.addTrack(track, stream);
                            } catch (e) {}
                        });
                    });
                } else {
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                console.error('Media initialization error:', err);
            }
        };

        initMedia();

        return () => {
            isMounted = false;
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.values(connectionsRef.current).forEach(pc => pc.close());
            connectionsRef.current = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Create RTCPeerConnection for a peer
    const createPeerConnection = (peerId) => {
        if (connectionsRef.current[peerId]) {
            return connectionsRef.current[peerId];
        }

        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('signal', peerId, JSON.stringify({ ice: event.candidate }));
            }
        };

        // Attach local tracks
        const stream = localStreamRef.current || window.localStream;
        if (stream) {
            stream.getTracks().forEach((track) => {
                try {
                    pc.addTrack(track, stream);
                } catch (e) {
                    console.warn('Error adding track to peer connection:', e);
                }
            });
        }

        const handleRemoteStream = (remoteStream) => {
            setVideos((prevVideos) => {
                const exists = prevVideos.some((v) => v.socketId === peerId);
                if (exists) {
                    return prevVideos.map((v) =>
                        v.socketId === peerId ? { ...v, stream: remoteStream } : v
                    );
                }
                return [
                    ...prevVideos,
                    { socketId: peerId, stream: remoteStream, autoplay: true, playsinline: true }
                ];
            });
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                handleRemoteStream(event.streams[0]);
            }
        };

        pc.onaddstream = (event) => {
            if (event.stream) {
                handleRemoteStream(event.stream);
            }
        };

        return pc;
    };

    const gotMessageFromServer = (fromId, messagePayload) => {
        let signal;
        try {
            signal = JSON.parse(messagePayload);
        } catch {
            return;
        }

        if (fromId === socketIdRef.current) return;

        let pc = connectionsRef.current[fromId];
        if (!pc) {
            pc = createPeerConnection(fromId);
        }

        if (signal.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        return pc.createAnswer().then((description) => {
                            return pc.setLocalDescription(description).then(() => {
                                if (socketRef.current) {
                                    socketRef.current.emit(
                                        'signal',
                                        fromId,
                                        JSON.stringify({ sdp: pc.localDescription })
                                    );
                                }
                            });
                        });
                    }
                })
                .catch((e) => console.error('Error handling SDP signal:', e));
        }

        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) =>
                console.error('Error adding ICE candidate:', e)
            );
        }
    };

    const addMessage = (data, sender, socketIdSender, timestamp) => {
        const isMe = socketIdSender === socketIdRef.current;
        const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setMessages((prev) => [
            ...prev,
            {
                data,
                sender: sender || 'Guest',
                socketIdSender,
                isMe,
                timestamp: timeStr
            }
        ]);

        if (!isMe && !showChatRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const connectToSocketServer = () => {
        const socket = io(server_url, { secure: false });
        socketRef.current = socket;

        const effectiveUsername = username.trim() || userData?.username || userData?.name || 'Guest';

        socket.on('signal', gotMessageFromServer);

        socket.on('connect', () => {
            socketIdRef.current = socket.id;

            // Join room with username
            socket.emit('join-call', normalizedRoomId, effectiveUsername);

            // Record to history if user is authenticated
            if (userData?.token && addToUserHistory) {
                addToUserHistory(normalizedRoomId).catch(() => {});
            }

            socket.on('chat-message', addMessage);

            // Remote camera state changes
            socket.on('camera-state', (peerId, isCameraOn) => {
                setRemoteCameraStates((prev) => ({ ...prev, [peerId]: isCameraOn }));
            });

            // Remote user metadata updates
            socket.on('user-info', (peerId, name, cameraOn) => {
                setRemoteUsernames((prev) => ({ ...prev, [peerId]: name }));
                setRemoteCameraStates((prev) => ({ ...prev, [peerId]: cameraOn }));
            });

            socket.on('user-left', (id) => {
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
                setVideos((prev) => prev.filter((v) => v.socketId !== id));
                setRemoteCameraStates((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                });
                setRemoteUsernames((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                });
            });

            socket.on('user-joined', (id, clients, userMeta) => {
                if (userMeta && typeof userMeta === 'object') {
                    const newNames = {};
                    const newCameras = {};
                    Object.entries(userMeta).forEach(([sockId, meta]) => {
                        if (sockId !== socket.id) {
                            if (meta.username) newNames[sockId] = meta.username;
                            if (typeof meta.cameraOn === 'boolean') newCameras[sockId] = meta.cameraOn;
                        }
                    });
                    setRemoteUsernames((prev) => ({ ...prev, ...newNames }));
                    setRemoteCameraStates((prev) => ({ ...prev, ...newCameras }));
                }

                // Announce our info to peers
                socket.emit('user-info', { username: effectiveUsername, cameraOn: video });

                clients.forEach((socketListId) => {
                    if (socketListId === socket.id) return;
                    if (!connectionsRef.current[socketListId]) {
                        createPeerConnection(socketListId);
                    }
                });

                // If this client joined, initiate offers to existing peers
                if (id === socket.id) {
                    for (const peerId in connectionsRef.current) {
                        if (peerId === socket.id) continue;
                        const pc = connectionsRef.current[peerId];
                        pc.createOffer()
                            .then((description) => {
                                return pc.setLocalDescription(description).then(() => {
                                    socket.emit(
                                        'signal',
                                        peerId,
                                        JSON.stringify({ sdp: pc.localDescription })
                                    );
                                });
                            })
                            .catch((e) => console.error('Error creating offer:', e));
                    }
                }
            });
        });
    };

    const handleVideo = () => {
        const nextVideo = !video;
        setVideo(nextVideo);
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach((track) => {
                track.enabled = nextVideo;
            });
        }
        if (socketRef.current) {
            socketRef.current.emit('camera-state', nextVideo);
        }
    };

    const handleAudio = () => {
        const nextAudio = !audio;
        setAudio(nextAudio);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = nextAudio;
            });
        }
    };

    const handleScreen = async () => {
        if (!screen) {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const screenTrack = displayStream.getVideoTracks()[0];

                for (const id in connectionsRef.current) {
                    const pc = connectionsRef.current[id];
                    const senders = pc.getSenders();
                    const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
                    if (videoSender) {
                        videoSender.replaceTrack(screenTrack);
                    }
                }

                if (localVideoref.current) {
                    localVideoref.current.srcObject = displayStream;
                }

                screenTrack.onended = () => {
                    setScreen(false);
                    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
                    for (const id in connectionsRef.current) {
                        const pc = connectionsRef.current[id];
                        const senders = pc.getSenders();
                        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
                        if (videoSender && cameraTrack) {
                            videoSender.replaceTrack(cameraTrack);
                        }
                    }
                    if (localVideoref.current && localStreamRef.current) {
                        localVideoref.current.srcObject = localStreamRef.current;
                    }
                };

                setScreen(true);
            } catch (err) {
                console.warn('Screen share cancelled or failed:', err);
                setScreen(false);
            }
        } else {
            setScreen(false);
            const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
            for (const id in connectionsRef.current) {
                const pc = connectionsRef.current[id];
                const senders = pc.getSenders();
                const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
                if (videoSender && cameraTrack) {
                    videoSender.replaceTrack(cameraTrack);
                }
            }
            if (localVideoref.current && localStreamRef.current) {
                localVideoref.current.srcObject = localStreamRef.current;
            }
        }
    };

    const handleEndCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        Object.values(connectionsRef.current).forEach((pc) => pc.close());
        connectionsRef.current = {};
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        navigate('/home');
    };

    const sendMessage = (e) => {
        if (e) e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || !socketRef.current) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderName = username.trim() || userData?.username || 'Guest';

        socketRef.current.emit('chat-message', trimmed, senderName, timeStr);
        setMessage('');
    };

    const toggleChat = () => {
        const nextState = !showChat;
        setShowChat(nextState);
        showChatRef.current = nextState;
        if (nextState) {
            setNewMessages(0);
        }
    };

    const copyRoomCode = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(normalizedRoomId);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    const myDisplayName = username.trim() || userData?.username || userData?.name || 'You';

    return (
        <div>
            {askForUsername ? (
                <div className="authPageWrapper">
                    <div className="authCard" style={{ maxWidth: '520px', textAlign: 'center' }}>
                        <div
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}
                            onClick={() => navigate('/home')}
                        >
                            <div className="brandIcon">
                                <VideocamIcon fontSize="large" />
                            </div>
                            <span className="brandName" style={{ fontSize: '1.8rem' }}>
                                Call<span className="brandMesh">Mesh</span>
                            </span>
                        </div>

                        <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                            Ready to join meeting?
                        </h2>
                        <p style={{ color: '#38bdf8', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.4rem' }}>
                            Room: {normalizedRoomId}
                        </p>

                        <div style={{ width: '100%', height: '220px', background: '#020617', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.4rem', border: '1px solid rgba(255, 255, 255, 0.12)', position: 'relative' }}>
                            <video
                                ref={localVideoref}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                Camera Preview
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Enter your display name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') connect(); }}
                                style={{
                                    padding: '0.85rem 1.2rem',
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />

                            <button
                                type="button"
                                className="btnPrimaryCta"
                                onClick={connect}
                                style={{ justifyContent: 'center', padding: '0.85rem 0' }}
                            >
                                Enter Conference Room
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Top Navigation & Status Bar */}
                    <div className={styles.meetTopBar}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/home')}>
                            <div className="brandIcon" style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}>
                                <VideocamIcon fontSize="inherit" />
                            </div>
                            <span className="brandName" style={{ fontSize: '1.2rem' }}>
                                Call<span className="brandMesh">Mesh</span>
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Room:</span>
                            <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600 }}>{normalizedRoomId}</span>
                            <Tooltip title={copiedCode ? "Copied!" : "Copy Room Code"}>
                                <IconButton size="small" onClick={copyRoomCode} style={{ color: copiedCode ? '#10b981' : '#94a3b8', padding: '3px' }}>
                                    <ContentCopyIcon style={{ fontSize: '0.95rem' }} />
                                </IconButton>
                            </Tooltip>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span>{videos.length + 1} in room</span>
                        </div>
                    </div>

                    {/* Main Video Conference Grid */}
                    <div className={styles.conferenceView}>
                        {/* Local Participant Tile */}
                        <div className={styles.videoTileWrapper}>
                            <video
                                ref={localVideoref}
                                autoPlay
                                muted
                                playsInline
                                className={styles.videoElement}
                                style={{ display: video ? 'block' : 'none' }}
                            />
                            {!video && (
                                <ParticipantAvatar
                                    name={myDisplayName}
                                    isCameraOff={true}
                                />
                            )}
                            <div className={styles.tileNameTag}>
                                <span>{myDisplayName + ' (You)'}</span>
                                {!audio && <MicOffIcon style={{ fontSize: '0.85rem', color: '#f87171' }} />}
                            </div>
                        </div>

                        {/* Remote Participants Tiles */}
                        {videos.map((v) => {
                            const remoteName = remoteUsernames[v.socketId] || 'Guest';
                            const isCamOn = remoteCameraStates[v.socketId] !== false;

                            return (
                                <div key={v.socketId} className={styles.videoTileWrapper}>
                                    <video
                                        data-socket={v.socketId}
                                        ref={(ref) => {
                                            if (ref && v.stream && ref.srcObject !== v.stream) {
                                                ref.srcObject = v.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className={styles.videoElement}
                                        style={{ display: isCamOn ? 'block' : 'none' }}
                                    />
                                    {!isCamOn && (
                                        <ParticipantAvatar
                                            name={remoteName}
                                            isCameraOff={true}
                                        />
                                    )}
                                    <div className={styles.tileNameTag}>
                                        <span>{remoteName}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* In-Call Slide-Over Chat Panel */}
                    {showChat && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <ChatIcon style={{ color: '#38bdf8', fontSize: '1.2rem' }} />
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                                        Messages
                                    </h3>
                                </div>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowChat(false)}
                                    style={{ color: '#94a3b8' }}
                                    aria-label="Close chat"
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </div>

                            <div className={styles.chatMessagesStream}>
                                {messages.length === 0 ? (
                                    <div className={styles.chatEmptyState}>
                                        <div className={styles.chatEmptyIcon}>
                                            <ChatBubbleOutlineIcon fontSize="medium" />
                                        </div>
                                        <p style={{ fontWeight: 600, color: '#f1f5f9', margin: '0 0 0.3rem 0' }}>
                                            No messages yet
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                                            Send a message to everyone in the room!
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`${styles.chatBubbleContainer} ${item.isMe ? styles.chatBubbleMe : styles.chatBubbleOther}`}
                                        >
                                            <div className={styles.chatBubbleSender}>
                                                {item.isMe ? 'You' : item.sender}
                                                <span className={styles.chatBubbleTime}>{item.timestamp}</span>
                                            </div>
                                            <div className={styles.chatBubbleText}>
                                                {item.data}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={sendMessage} className={styles.chatComposer}>
                                <input
                                    type="text"
                                    placeholder="Type a message... (Press Enter to send)"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className={styles.chatInput}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className={styles.chatSendBtn}
                                    aria-label="Send message"
                                >
                                    <SendIcon style={{ fontSize: '1.05rem' }} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Bottom Floating Control Bar */}
                    <div className={styles.buttonContainers}>
                        <Tooltip title={video ? "Turn camera off" : "Turn camera on"}>
                            <IconButton
                                onClick={handleVideo}
                                className={`${styles.ctrlBtn} ${!video ? styles.ctrlBtnOff : ''}`}
                                aria-label={video ? "Turn camera off" : "Turn camera on"}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                            <IconButton
                                onClick={handleAudio}
                                className={`${styles.ctrlBtn} ${!audio ? styles.ctrlBtnOff : ''}`}
                                aria-label={audio ? "Mute microphone" : "Unmute microphone"}
                            >
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing screen" : "Share screen"}>
                                <IconButton
                                    onClick={handleScreen}
                                    className={`${styles.ctrlBtn} ${screen ? styles.ctrlBtnOff : ''}`}
                                    aria-label="Toggle screen share"
                                >
                                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="In-call chat">
                            <Badge badgeContent={newMessages} color="primary" max={99}>
                                <IconButton
                                    onClick={toggleChat}
                                    className={`${styles.ctrlBtn} ${showChat ? styles.ctrlBtnOff : ''}`}
                                    aria-label="Toggle in-call chat"
                                >
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        <Tooltip title="End call">
                            <IconButton
                                onClick={handleEndCall}
                                className={`${styles.ctrlBtn} ${styles.ctrlBtnEnd}`}
                                aria-label="Leave conference"
                            >
                                <CallEndIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>
    );
}