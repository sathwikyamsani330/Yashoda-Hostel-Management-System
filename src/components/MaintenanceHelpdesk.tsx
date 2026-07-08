import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  X, 
  Wrench, 
  Sparkles,
  Layers,
  ChevronRight,
  ClipboardCheck,
  User,
  Info,
  Trash2
} from 'lucide-react';
import { Complaint, Resident, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { formatDate } from '../utils';

interface MaintenanceHelpdeskProps {
  complaints: Complaint[];
  residents: Resident[];
  onAddComplaint: (complaint: Complaint) => void;
  onUpdateComplaintStatus: (complaintId: string, status: ComplaintStatus) => void;
  onDeleteComplaint: (complaintId: string) => void;
  onClearResolvedComplaints: () => void;
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

export default function MaintenanceHelpdesk({ 
  complaints, 
  residents, 
  onAddComplaint,
  onUpdateComplaintStatus,
  onDeleteComplaint,
  onClearResolvedComplaints
}: MaintenanceHelpdeskProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | ComplaintPriority>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ComplaintCategory>('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [confirmDeleteDetail, setConfirmDeleteDetail] = useState(false);

  // Share Link States
  const [copied, setCopied] = useState(false);
  const studentLink = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?mode=student` : 'http://localhost:3000/?mode=student';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Form states
  const [formResidentId, setFormResidentId] = useState('');
  const [formCategory, setFormCategory] = useState<ComplaintCategory>('Plumbing');
  const [formPriority, setFormPriority] = useState<ComplaintPriority>('Medium');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Active residents list for dropdown
  const activeResidents = residents.filter(r => r.status === 'Active' && r.roomId);

  const openAddModal = () => {
    setFormResidentId(activeResidents[0]?.id || '');
    setFormCategory('Plumbing');
    setFormPriority('Medium');
    setFormTitle('');
    setFormDescription('');
    setFormError('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formResidentId) {
      setFormError('Please select a resident. If there are no active residents, register one first.');
      return;
    }
    if (!formTitle.trim() || !formDescription.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    const resident = residents.find(r => r.id === formResidentId);
    if (!resident || !resident.roomId) {
      setFormError('Selected resident has no assigned room.');
      return;
    }

    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      residentId: formResidentId,
      residentName: resident.name,
      roomId: resident.roomId,
      category: formCategory,
      priority: formPriority,
      title: formTitle.trim(),
      description: formDescription.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    onAddComplaint(newComplaint);
    setIsAddOpen(false);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.roomId.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6" id="maintenance-helpdesk-view">
      {/* Header and Add action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-950">Maintenance & Complaints Helpdesk</h2>
          <p className="text-gray-500 text-sm mt-0.5">Record guest room complaints, prioritize issues, and dispatch repair services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {complaints.some(c => c.status === 'Resolved') && (
            showConfirmClear ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 px-3 rounded-xl">
                <span className="text-xs font-bold text-rose-800">Clear all resolved?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearResolvedComplaints();
                    setShowConfirmClear(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="clear-resolved-complaints-btn"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-100 font-medium px-4 py-2.5 rounded-xl transition-all cursor-pointer text-sm"
                title="Clear all resolved issues from archive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Resolved
              </button>
            )
          )}
          <button
            id="lodge-complaint-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Lodge Complaint
          </button>
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase block">New / Open Issues</span>
            <p className="text-xl font-display font-bold text-gray-950 mt-1">
              {complaints.filter(c => c.status === 'Open').length} Tickets
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase block">In Repair/Progress</span>
            <p className="text-xl font-display font-bold text-gray-950 mt-1">
              {complaints.filter(c => c.status === 'In Progress').length} Tickets
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase block">Successfully Resolved</span>
            <p className="text-xl font-display font-bold text-gray-950 mt-1">
              {complaints.filter(c => c.status === 'Resolved').length} Resolved
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          <input
            id="complaint-search-input"
            type="text"
            placeholder="Search tickets by topic, resident, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Status Filters */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1 px-2 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1 px-2 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1 px-2 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">No helpdesk tickets logged</p>
            <p className="text-gray-400 text-xs mt-1">Excellent! No room issues matching current filter sets.</p>
          </div>
        ) : (
          filteredComplaints.map(ticket => (
            <motion.div
              key={ticket.id}
              layoutId={`complaint-card-${ticket.id}`}
              onClick={() => {
                setSelectedComplaint(ticket);
                setConfirmDeleteDetail(false);
              }}
              className="bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                {/* Header line */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    ticket.priority === 'High' 
                      ? 'bg-rose-100 text-rose-700' 
                      : ticket.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                  <span className="text-2xs text-gray-400 font-mono font-semibold">Room {ticket.roomId}</span>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-semibold text-gray-950 text-sm group-hover:text-indigo-700 transition-colors line-clamp-1">
                    {ticket.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-normal">
                    {ticket.description}
                  </p>
                </div>

                {/* Category block */}
                <div className="flex items-center gap-1 text-2xs text-gray-500 bg-gray-50 rounded-md p-1 px-2.5 w-fit border border-gray-100">
                  <span className="font-semibold">{ticket.category}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50/50 border-t border-gray-100 p-3 px-5 flex items-center justify-between text-2xs">
                <span className="text-gray-500 font-medium">By {ticket.residentName}</span>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    ticket.status === 'Open' 
                      ? 'text-rose-600' 
                      : ticket.status === 'In Progress'
                      ? 'text-amber-600'
                      : 'text-indigo-600'
                  }`}>
                    {ticket.status === 'Open' && <AlertTriangle className="w-3 h-3" />}
                    {ticket.status === 'In Progress' && <Clock className="w-3 h-3" />}
                    {ticket.status === 'Resolved' && <CheckCircle className="w-3 h-3" />}
                    {ticket.status}
                  </span>
                  {pendingDeleteId === ticket.id ? (
                    <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg text-3xs" onClick={(e) => e.stopPropagation()}>
                      <span className="text-rose-700 font-bold px-1">Delete?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteComplaint(ticket.id);
                          setPendingDeleteId(null);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteId(null);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(ticket.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer border border-rose-100/50"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Lodge Complaint Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950">Lodge Support Ticket</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Register a guest complaint or facilities maintenance request.</p>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Resident Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Select Guest Resident</label>
                  {activeResidents.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-3 rounded-xl">
                      No active residents are currently registered in the hostel. Please check in a resident first.
                    </div>
                  ) : (
                    <select
                      value={formResidentId}
                      onChange={(e) => setFormResidentId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      {activeResidents.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Room {r.roomId})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Grid for Priority and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Ticket Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ComplaintCategory)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Priority Level</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as ComplaintPriority)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Issue Topic / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Broken wall socket power plug"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Full Description</label>
                  <textarea
                    placeholder="Provide specific details about the issue so the technician has enough context (e.g., location, rattle sounds)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    required
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={activeResidents.length === 0}
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    Lodge Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Details & Action Sheet Drawer */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Support Ticket Details
                  </h3>
                  <p className="text-gray-400 text-3xs font-mono mt-0.5">TICKET ID: {selectedComplaint.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setConfirmDeleteDetail(false);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-3xs font-bold text-gray-400 uppercase tracking-wider block">Issue Topic</span>
                    <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                      selectedComplaint.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedComplaint.priority} Priority
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-950">{selectedComplaint.title}</h4>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
                  <span className="text-3xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Issue Description</span>
                  <p className="text-xs text-gray-700 leading-normal">{selectedComplaint.description}</p>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs border-y border-gray-100 py-4">
                  <div className="space-y-1">
                    <span className="text-gray-400 text-3xs font-semibold uppercase block">Resident & Room</span>
                    <span className="font-semibold text-gray-900 block">{selectedComplaint.residentName}</span>
                    <span className="text-2xs text-gray-500 font-mono block">Room {selectedComplaint.roomId}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-gray-400 text-3xs font-semibold uppercase block">Category & Date</span>
                    <span className="font-semibold text-gray-900 block">{selectedComplaint.category}</span>
                    <span className="text-2xs text-gray-500 block">Logged: {formatDate(selectedComplaint.createdAt)}</span>
                  </div>
                </div>

                {/* Resolution timestamps */}
                {selectedComplaint.status === 'Resolved' && selectedComplaint.resolvedAt && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-semibold block">Ticket Resolved</span>
                        <span className="text-3xs text-indigo-600 block">Resolved on {formatDate(selectedComplaint.resolvedAt)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-400 text-3xs font-bold uppercase tracking-wider block">Maintenance Archive Actions</span>
                      {confirmDeleteDetail ? (
                        <div className="space-y-2 bg-rose-50 border border-rose-150 p-3.5 rounded-xl">
                          <span className="text-rose-800 text-xs font-bold block">Are you sure you want to permanently delete this resolved ticket?</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteComplaint(selectedComplaint.id);
                                setSelectedComplaint(null);
                                setConfirmDeleteDetail(false);
                              }}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDetail(false)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDetail(true)}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-100"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          Delete Resolved Ticket
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action controls */}
                {selectedComplaint.status !== 'Resolved' && (
                  <div className="space-y-2">
                    <span className="text-gray-400 text-3xs font-bold uppercase tracking-wider block">Dispatch/Update State</span>
                    <div className="flex gap-2">
                      {selectedComplaint.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateComplaintStatus(selectedComplaint.id, 'In Progress');
                            setSelectedComplaint(null);
                          }}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Clock className="w-4 h-4" />
                          Mark 'In Progress'
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateComplaintStatus(selectedComplaint.id, 'Resolved');
                          setSelectedComplaint(null);
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Resolve Ticket
                      </button>
                    </div>

                    <div className="pt-2">
                      {confirmDeleteDetail ? (
                        <div className="space-y-2 bg-rose-50 border border-rose-150 p-3.5 rounded-xl mt-1">
                          <span className="text-rose-800 text-xs font-bold block">Are you sure you want to permanently delete this ticket?</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteComplaint(selectedComplaint.id);
                                setSelectedComplaint(null);
                                setConfirmDeleteDetail(false);
                              }}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDetail(false)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDetail(true)}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-100"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          Delete Ticket
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
