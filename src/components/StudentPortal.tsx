import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Building, 
  Sparkles, 
  Send, 
  CheckCircle, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  Lock,
  Wifi,
  Search,
  MessageCircle,
  QrCode
} from 'lucide-react';
import { Complaint, Room, Resident, ComplaintCategory, ComplaintPriority } from '../types';
import { formatDate } from '../utils';

interface StudentPortalProps {
  complaints: Complaint[];
  rooms: Room[];
  residents: Resident[];
  onAddComplaint: (complaint: Complaint) => void;
  onExit: () => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Wi-Fi',
  'Furniture',
  'Security',
  'Other'
];

export default function StudentPortal({
  complaints,
  rooms,
  residents,
  onAddComplaint,
  onExit
}: StudentPortalProps) {
  // Portal States
  const [selectedHostelId, setSelectedHostelId] = useState<'1' | '2'>('1');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submittedTicketId, setSubmittedTicketId] = useState('');

  // Form States
  const [roomId, setRoomId] = useState('');
  const [residentId, setResidentId] = useState('manual');
  const [manualName, setManualName] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Wi-Fi');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [aadhaarVerification, setAadhaarVerification] = useState('');

  // Filtered rooms & residents based on selected hostel
  const hostelRooms = rooms.filter(r => r.hostelId === selectedHostelId);
  const availableRoomIds = Array.from(
    new Set([
      ...hostelRooms.map(r => r.id),
      ...residents.filter(res => res.hostelId === selectedHostelId && res.roomId && res.status === 'Active').map(res => res.roomId as string)
    ])
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const roomResidents = residents.filter(r => r.hostelId === selectedHostelId && r.roomId?.trim() === roomId.trim() && r.status === 'Active');

  // Handle room change: pre-select first resident in that room if exists
  const handleRoomChange = (rId: string) => {
    setRoomId(rId);
    setAadhaarVerification('');
    const trimmedId = rId.trim();
    const residentsInRoom = residents.filter(r => r.hostelId === selectedHostelId && r.roomId?.trim() === trimmedId && r.status === 'Active');
    if (residentsInRoom.length > 0) {
      setResidentId(residentsInRoom[0].id);
      setManualName('');
    } else {
      setResidentId('manual');
      setManualName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roomId) {
      setErrorMsg('Please select your room number.');
      return;
    }

    let studentName = '';
    let studentId = 'student-portal';

    if (residentId === 'manual') {
      if (!manualName.trim()) {
        setErrorMsg('Please enter your name.');
        return;
      }
      studentName = manualName.trim();
    } else {
      const selectedRes = residents.find(r => r.id === residentId);
      if (selectedRes) {
        studentName = selectedRes.name;
        studentId = selectedRes.id;

        // Perform Aadhaar Verification
        const enteredLast4Digits = aadhaarVerification.trim();
        const resident = {
          ...selectedRes,
          aadhaarLast4: selectedRes.aadhaarNumber ? selectedRes.aadhaarNumber.replace(/\D/g, '').slice(-4) : ''
        };

        if (enteredLast4Digits !== resident.aadhaarLast4) {
          alert("Authentication failed. Last 4 Aadhaar digits do not match.");
          setErrorMsg("Authentication failed. Last 4 Aadhaar digits do not match.");
          return;
        }
      } else {
        setErrorMsg('Selected resident not found.');
        return;
      }
    }

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter a summary title and full description.');
      return;
    }

    const ticketId = `comp-std-${Date.now()}`;

    const newComplaint: Complaint = {
      id: ticketId,
      hostelId: selectedHostelId,
      residentId: studentId,
      residentName: studentName,
      roomId: roomId,
      category: category,
      priority: priority,
      title: title.trim(),
      description: description.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    onAddComplaint(newComplaint);
    setSubmittedTicketId(ticketId);
    setStep('success');

    // Reset inputs
    setTitle('');
    setDescription('');
    setAadhaarVerification('');
  };

  // Get recent tickets filed for the selected room in this hostel to track progress!
  const recentRoomTickets = complaints.filter(
    c => c.hostelId === selectedHostelId && c.roomId === roomId
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" id="student-portal-root">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800 bg-slate-950 p-5 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-white leading-tight">Yashoda Deluxe</h1>
              <p className="text-3xs text-emerald-400 font-semibold uppercase tracking-wider">Student Self-Service Helpdesk</p>
            </div>
          </div>
          
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left Column: Info card & status tracking */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Lodge Direct Complaints</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Welcome to the Yashoda Deluxe Student Portal. Scan the QR code or visit this link to lodge room maintenance, electrical, plumbing, or Wi-Fi speed issues directly to the warden's active dashboard.
                  </p>
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-4xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Active SLA Response</span>
                    <p className="text-2xs text-slate-300">
                      High priority: <strong className="text-rose-400">Under 4 hours</strong><br />
                      Medium/Low priority: <strong className="text-amber-400">Under 24 hours</strong>
                    </p>
                  </div>
                </div>

                {/* Status tracking for room */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Room Ticket Status</h3>
                  {!roomId ? (
                    <p className="text-2xs text-slate-500 leading-normal italic">
                      Select your Room Number in the form to track active complaints of your room.
                    </p>
                  ) : recentRoomTickets.length === 0 ? (
                    <p className="text-2xs text-slate-500 leading-normal">
                      No tickets currently logged for Room {roomId} in {selectedHostelId === '1' ? 'H1' : 'H2'}.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {recentRoomTickets.map(t => (
                        <div key={t.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-3xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 truncate pr-1">{t.title}</span>
                            <span className={`px-1.5 py-0.2 rounded-full font-bold uppercase text-[9px] ${
                              t.status === 'Open' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : t.status === 'In Progress'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-1">{t.description}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-850/50">
                            <span>{t.category}</span>
                            <span>{formatDate(t.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Submission Form */}
              <div className="md:col-span-2">
                <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 shadow-xl">
                  <div className="border-b border-slate-800 pb-4">
                    <h2 className="text-lg font-display font-bold text-white">Create Repair Ticket</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Please provide accurate description so the technician comes prepared.</p>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-950/40 border border-rose-900 text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Hostel Switcher */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Select Hostel Branch</label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHostelId('1');
                          setRoomId('');
                          setResidentId('manual');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
                          selectedHostelId === '1'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }`}
                      >
                        Yashoda Deluxe Boys (H1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHostelId('2');
                          setRoomId('');
                          setResidentId('manual');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
                          selectedHostelId === '2'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }`}
                      >
                        Yashoda-2 Deluxe Boys (H2)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room Selection */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Room Number</label>
                      <select
                        value={roomId}
                        onChange={(e) => handleRoomChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono bg-slate-900"
                        required
                      >
                        <option value="">-- Select Room --</option>
                        {availableRoomIds.map(rId => (
                          <option key={rId} value={rId}>Room {rId}</option>
                        ))}
                      </select>
                    </div>

                    {/* Resident Name Select/Input */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
                      {roomId && roomResidents.length > 0 ? (
                        <div className="space-y-1.5">
                          <select
                            value={residentId}
                            onChange={(e) => {
                              setResidentId(e.target.value);
                              setAadhaarVerification('');
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 bg-slate-900"
                          >
                            {roomResidents.map(res => (
                              <option key={res.id} value={res.id}>{res.name}</option>
                            ))}
                            <option value="manual">-- Other / Type manually --</option>
                          </select>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {roomId && roomResidents.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-2xs space-y-1 animate-fadeIn">
                      <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Roommates checked in Room {roomId}:</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {roomResidents.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setResidentId(r.id);
                              setManualName('');
                              setAadhaarVerification('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-3xs font-semibold transition-all cursor-pointer ${
                              residentId === r.id
                                ? 'bg-emerald-600 text-white shadow-sm font-bold scale-[1.02]'
                                : 'bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            👤 {r.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setResidentId('manual');
                            setManualName('');
                            setAadhaarVerification('');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-3xs font-semibold transition-all cursor-pointer ${
                            residentId === 'manual'
                              ? 'bg-emerald-600 text-white shadow-sm font-bold'
                              : 'bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          ✏️ Type Name Manually
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Aadhaar Verification component for checked-in residents */}
                  {roomId && residentId !== 'manual' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-3xs font-bold uppercase tracking-wider">Secure Student Identity Check</span>
                      </div>
                      <p className="text-3xs text-slate-400 leading-normal">
                        To authenticate this request and prevent unauthorized complaints under your name, please verify your profile by entering the **last 4 digits of the Aadhaar Card** you registered at check-in.
                      </p>
                      
                      <div className="space-y-1 max-w-xs">
                        <label className="text-3xs font-bold text-slate-300 block uppercase tracking-wider">Aadhaar (Last 4 Digits)</label>
                        <div className="relative">
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="e.g. 9012"
                            value={aadhaarVerification}
                            onChange={(e) => setAadhaarVerification(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-12 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono font-bold tracking-tighter">XXXX-</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Manual input if 'manual' is selected and roomResidents are present */}
                  {roomId && roomResidents.length > 0 && residentId === 'manual' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1 animate-slideDown"
                    >
                      <label className="text-xs font-semibold text-slate-300 block">Type Your Name</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Ticket Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Urgency / Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Low">Low (General Repair)</option>
                        <option value="Medium">Medium (Disruptive but usable)</option>
                        <option value="High">High (Immediate Action Required)</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Topic */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Summary Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Wi-Fi disconnected / AC remote not working"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Details & Description</label>
                    <textarea
                      placeholder="Please share specific details (e.g. 'router shows red light since morning', 'water is dripping from bathroom tap')."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 cursor-pointer text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-white">Ticket Submitted Successfully!</h2>
                <p className="text-slate-400 text-xs">
                  Your complaint has been logged directly on the Hostel Warden's support panel.
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 font-mono text-2xs space-y-1.5 text-left">
                <div className="flex justify-between text-slate-400">
                  <span>Ticket ID:</span>
                  <span className="font-bold text-white text-xs">{submittedTicketId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hostel:</span>
                  <span className="text-slate-200">Branch {selectedHostelId === '1' ? 'Yashoda H1' : 'Yashoda H2'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Room:</span>
                  <span className="text-slate-200">Room {roomId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Priority:</span>
                  <span className={`font-bold ${priority === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>{priority}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Lodge Another Issue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Simplified Footer */}
      <footer className="border-t border-slate-800/50 py-4 text-center text-4xs text-slate-500 mt-8">
        <span>Yashoda Deluxe Hostel Portal • Secure Student Sandbox Portal</span>
      </footer>
    </div>
  );
}
