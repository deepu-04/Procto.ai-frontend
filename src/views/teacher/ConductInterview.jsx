import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  PhoneXMarkIcon, MicrophoneIcon, VideoCameraIcon, 
  SparklesIcon, UserGroupIcon, ShieldCheckIcon,
  LinkIcon, ClipboardDocumentIcon, ChartBarIcon
} from '@heroicons/react/24/solid';

const socket = io('http://localhost:5000');

export default function ConductInterview() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'setup' | 'call'
  const [stream, setStream] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const myVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();

  // 1. Dashboard UI Component
  const Dashboard = () => (
    <div className="min-h-screen bg-[#F2F2F7] p-8 text-slate-900">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Interviewer <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-500 font-medium">Manage your active recruitment sessions</p>
        </div>
        <button 
          onClick={() => setView('setup')}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" /> New Session
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
          <ChartBarIcon className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-3xl font-black">24</h3>
          <p className="text-slate-500 text-sm font-bold uppercase">Total Interviews</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[32px] shadow-xl text-white">
          <UserGroupIcon className="w-8 h-8 text-indigo-200 mb-4" />
          <h3 className="text-3xl font-black">88%</h3>
          <p className="text-indigo-100 text-sm font-bold uppercase">Avg. Candidate Score</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
          <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mb-4" />
          <h3 className="text-3xl font-black">Active</h3>
          <p className="text-slate-500 text-sm font-bold uppercase">Proctoring Status</p>
        </div>
      </div>
    </div>
  );

  // 2. Setup Form Component
  const SetupForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full space-y-8 bg-[#F9F9FB] p-10 rounded-[40px] shadow-2xl border border-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-[24px] flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black">Generate Invite</h2>
          <p className="text-slate-400">Share this ID with the candidate</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Room Name (e.g. React-Senior-01)"
            className="w-full p-5 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button 
            onClick={startCall}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-black transition-all"
          >
            Launch Interview
          </button>
          <button onClick={() => setView('dashboard')} className="w-full text-slate-400 font-bold text-sm">Cancel</button>
        </div>
      </div>
    </motion.div>
  );

  // 3. WebRTC Call Logic
  const startCall = async () => {
    setView('call');
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(localStream);
    if (myVideo.current) myVideo.current.srcObject = localStream;

    socket.emit('join-room', { roomId, role: 'teacher', email: 'teacher@procto.ai' });
    
    // Initialize WebRTC Peer Connection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    localStream.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream));

    peerConnection.current.ontrack = (event) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };
  };

  return (
    <div className="font-sans">
      {view === 'dashboard' && <Dashboard />}
      {view === 'setup' && <SetupForm />}
      
      {view === 'call' && (
        <div className="fixed inset-0 bg-black z-[10000] flex items-center justify-center overflow-hidden">
          {/* Main Remote Video */}
          <div className="absolute inset-0 z-10 bg-slate-900">
            <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" poster="https://i.pravatar.cc/1000?u=student" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Floating Teacher PIP */}
          <motion.div drag dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }} className="absolute top-10 right-10 w-48 h-64 bg-black rounded-[32px] z-30 overflow-hidden border border-white/20 shadow-2xl shadow-black/50">
            <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
            <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">You (Examiner)</p>
            </div>
          </motion.div>

          {/* iOS Style Control Center */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 px-10 py-5 bg-white/10 backdrop-blur-3xl rounded-[50px] border border-white/20">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'}`}><MicrophoneIcon className="w-6 h-6" /></button>
            <button className="p-4 bg-white/10 text-white rounded-full"><VideoCameraIcon className="w-6 h-6" /></button>
            <div className="w-[1px] h-8 bg-white/20 mx-2" />
            <button onClick={() => setView('dashboard')} className="p-5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 hover:scale-110 active:scale-95 transition-all">
              <PhoneXMarkIcon className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}