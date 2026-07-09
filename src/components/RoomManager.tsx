import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid, 
  List, 
  Plus, 
  Search, 
  DoorClosed, 
  Bed, 
  Check, 
  X, 
  ChevronRight,
  Sparkles,
  Layers,
  Edit2,
  Trash2
} from 'lucide-react';
import { Room, RoomType, Resident } from '../types';
import { formatCurrency } from '../utils';

interface RoomManagerProps {
  rooms: Room[];
  residents: Resident[];
  onAddRoom: (room: Room) => void;
  onEditRoom: (room: Room) => void;
  onSelectResident: (residentId: string) => void;
  onDeleteRoom: (roomId: string) => void;
}

const AVAILABLE_AMENITIES = [
  'AC',
  'Wi-Fi',
  'Attached Bath',
  'Study Table',
  'Refrigerator',
  'Balcony',
  'Common Bath'
];

const getSharingLabel = (type: RoomType) => {
  switch (type) {
    case 'Single': return 'Single sharing';
    case 'Double': return 'Double sharing';
    case 'Triple': return 'Triple sharing';
    case 'Quadruple': return 'Four sharing';
    case 'Quintuple': return 'Five sharing';
    default: return `${type} sharing`;
  }
};

export default function RoomManager({ 
  rooms, 
  residents, 
  onAddRoom, 
  onEditRoom,
  onSelectResident 
}: RoomManagerProps) {
  // Filters and views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isListView, setIsListView] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // New/Edit Room Form State
  const [formId, setFormId] = useState('');
  const [formType, setFormType] = useState<RoomType>('Single');
  const [formFloor, setFormFloor] = useState(1);
  const [formRent, setFormRent] = useState(300);
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  // Calculations for stats
  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const filledBeds = rooms.reduce((acc, r) => acc + r.residentIds.length, 0);
  const availableBeds = totalBeds - filledBeds;

  const roomTypesCount = rooms.reduce((acc: { [key: string]: number }, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, { Single: 0, Double: 0, Triple: 0, Quadruple: 0, Quintuple: 0 });

  // Handle opening add modal
  const openAddModal = () => {
    setFormId('');
    setFormType('Single');
    setFormFloor(1);
    setFormRent(7000);
    setFormAmenities(['Wi-Fi', 'Study Table']);
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Handle opening edit modal
  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormId(room.id);
    setFormType(room.type);
    setFormFloor(room.floor);
    setFormRent(room.rent);
    setFormAmenities(room.amenities);
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Toggle single amenity
  const toggleAmenity = (amenity: string) => {
    if (formAmenities.includes(amenity)) {
      setFormAmenities(formAmenities.filter(a => a !== amenity));
    } else {
      setFormAmenities([...formAmenities, amenity]);
    }
  };

  // Handle Room Type selection auto-setting capacities and standard rents
  const handleTypeChange = (type: RoomType) => {
    setFormType(type);
    if (type === 'Single') {
      setFormRent(7000);
    } else if (type === 'Double') {
      setFormRent(7000);
    } else if (type === 'Triple') {
      setFormRent(9000);
    } else if (type === 'Quadruple') {
      setFormRent(7500);
    } else if (type === 'Quintuple') {
      setFormRent(7000);
    }
  };

  // Form submission: Add room
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) {
      setFormError('Room number is required');
      return;
    }
    // Room ID format validation e.g. "101", "204"
    if (!/^\d+$/.test(formId)) {
      setFormError('Room number must be numeric (e.g. 101, 202)');
      return;
    }
    if (rooms.some(r => r.id === formId.trim())) {
      setFormError(`Room ${formId} already exists`);
      return;
    }

    const capacity = formType === 'Single' ? 1 : formType === 'Double' ? 2 : formType === 'Triple' ? 3 : formType === 'Quadruple' ? 4 : 5;

    const newRoom: Room = {
      id: formId.trim(),
      type: formType,
      floor: formFloor,
      wing: 'Wing A',
      capacity,
      rent: Number(formRent),
      amenities: formAmenities,
      residentIds: []
    };

    onAddRoom(newRoom);
    setIsAddModalOpen(false);
  };

  // Form submission: Edit room
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const newCapacity = formType === 'Single' ? 1 : formType === 'Double' ? 2 : formType === 'Triple' ? 3 : formType === 'Quadruple' ? 4 : 5;

    // Check if new capacity is smaller than current resident count
    if (newCapacity < editingRoom.residentIds.length) {
      setFormError(`Cannot shrink room capacity to ${newCapacity} because it currently has ${editingRoom.residentIds.length} active residents.`);
      return;
    }

    const updatedRoom: Room = {
      ...editingRoom,
      type: formType,
      floor: formFloor,
      wing: editingRoom.wing || 'Wing A',
      capacity: newCapacity,
      rent: Number(formRent),
      amenities: formAmenities
    };

    onEditRoom(updatedRoom);
    setIsEditModalOpen(false);
  };

  // Filter Rooms logic
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.id.includes(searchQuery);
    const matchesType = selectedType === 'All' || r.type === selectedType;
    const matchesFloor = selectedFloor === 'All' || r.floor.toString() === selectedFloor;
    
    // Status filter
    const spotsFilled = r.residentIds.length;
    let matchesStatus = true;
    if (selectedStatus === 'Available') {
      matchesStatus = spotsFilled < r.capacity;
    } else if (selectedStatus === 'Full') {
      matchesStatus = spotsFilled === r.capacity;
    } else if (selectedStatus === 'Empty') {
      matchesStatus = spotsFilled === 0;
    }

    return matchesSearch && matchesType && matchesFloor && matchesStatus;
  });

  return (
    <div className="space-y-6" id="room-manager-view">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-950">Room Directory</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage room inventories, floor distributions, and basic utilities.</p>
        </div>
        <button
          id="add-room-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <div className="space-y-1">
          <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Beds Capacity</span>
          <p className="text-xl font-display font-bold text-gray-900">{totalBeds} Beds</p>
          <span className="text-xs text-gray-500 block">{rooms.length} active rooms</span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Beds Occupied</span>
          <p className="text-xl font-display font-bold text-indigo-600">{filledBeds} Occupied</p>
          <span className="text-xs text-gray-500 block">{Math.round((filledBeds/totalBeds)*100 || 0)}% occupancy</span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Beds Available</span>
          <p className="text-xl font-display font-bold text-blue-600">{availableBeds} Available</p>
          <span className="text-xs text-gray-500 block">Vacant for checks</span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Types split</span>
          <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-700 mt-1">
            <span className="bg-white px-1.5 py-0.5 border border-gray-100 rounded text-3xs font-medium" title="Single Room">1B: {roomTypesCount.Single || 0}</span>
            <span className="bg-white px-1.5 py-0.5 border border-gray-100 rounded text-3xs font-medium" title="Double Room">2B: {roomTypesCount.Double || 0}</span>
            <span className="bg-white px-1.5 py-0.5 border border-gray-100 rounded text-3xs font-medium" title="Triple Room">3B: {roomTypesCount.Triple || 0}</span>
            <span className="bg-white px-1.5 py-0.5 border border-gray-100 rounded text-3xs font-medium" title="Quadruple Room">4B: {roomTypesCount.Quadruple || 0}</span>
            <span className="bg-white px-1.5 py-0.5 border border-gray-100 rounded text-3xs font-medium" title="Quintuple Room">5B: {roomTypesCount.Quintuple || 0}</span>
          </div>
          <span className="text-gray-400 text-3xs uppercase block">Beds 1 to 5 split count</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              id="room-search-input"
              type="text"
              placeholder="Search room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Grid/List View Toggles */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setIsListView(false)}
              className={`p-2 rounded-lg border ${!isListView ? 'bg-gray-100 border-gray-200 text-gray-800' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600'} transition-all cursor-pointer`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsListView(true)}
              className={`p-2 rounded-lg border ${isListView ? 'bg-gray-100 border-gray-200 text-gray-800' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600'} transition-all cursor-pointer`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Type:</span>
            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100 flex-wrap">
              {['All', 'Single', 'Double', 'Triple', 'Quadruple', 'Quintuple'].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    selectedType === t 
                      ? 'bg-white text-gray-950 shadow-2xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Floor:</span>
            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
              {['All', '1', '2', '3', '4', '5', '6'].map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    selectedFloor === f 
                      ? 'bg-white text-gray-950 shadow-2xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {f === 'All' ? 'All' : `L${f}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Status:</span>
            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
              {['All', 'Available', 'Full', 'Empty'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    selectedStatus === s 
                      ? 'bg-white text-gray-950 shadow-2xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {!isListView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
              <DoorClosed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">No rooms found</p>
              <p className="text-gray-400 text-xs mt-1">Try relaxing or modifying your directory search filters.</p>
            </div>
          ) : (
            filteredRooms.map(room => {
              const occupants = residents.filter(r => room.residentIds.includes(r.id) && r.status === 'Active');
              const availableSpots = room.capacity - occupants.length;

              return (
                <motion.div
                  key={room.id}
                  layoutId={`room-card-${room.id}`}
                  className="bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Top Row: Room ID & Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-display font-bold text-gray-900">Room {room.id}</h3>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Floor {room.floor} • {getSharingLabel(room.type)}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold text-indigo-600">{formatCurrency(room.rent)}</span>
                        <span className="text-gray-400 text-3xs block uppercase">/ Month</span>
                      </div>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5">
                        <span className="font-medium flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-gray-400" />
                          Occupancy
                        </span>
                        <span className="font-mono text-2xs">
                          {occupants.length} / {room.capacity} filled
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {Array.from({ length: room.capacity }).map((_, idx) => {
                          const isFilled = idx < occupants.length;
                          return (
                            <div 
                              key={idx}
                              className={`h-2 flex-1 rounded-full ${
                                isFilled ? 'bg-indigo-500' : 'bg-gray-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Room Residents Details */}
                    {occupants.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Residents</span>
                        <div className="space-y-1.5">
                          {occupants.map(occ => (
                            <div 
                              key={occ.id} 
                              onClick={() => onSelectResident(occ.id)}
                              className="flex items-center justify-between text-xs bg-gray-50 hover:bg-gray-100 p-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                            >
                              <span className="font-medium text-gray-700">{occ.name}</span>
                              <span className="text-gray-400 text-2xs hover:text-indigo-600 flex items-center gap-0.5">
                                Profile <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities Checklist tags */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {room.amenities.map(am => (
                        <span 
                          key={am} 
                          className="bg-gray-50 border border-gray-100 text-gray-500 text-3xs px-2 py-0.5 rounded-full"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="bg-gray-50/50 border-t border-gray-100 p-3 px-5 flex items-center justify-between">
                    <span className={`text-2xs font-semibold ${
                      availableSpots > 0 ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {availableSpots > 0 ? `● ${availableSpots} Bed Vacant` : '● Fully Booked'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(room)}
                        className="text-xs text-gray-500 hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Configure
                      </button>
                      <button
                        onClick={() => onDeleteRoom(room.id)}
                        className="text-xs text-gray-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer font-semibold"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* List Display */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-xs">
                  <th className="py-4 px-6">Room</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Floor</th>
                  <th className="py-4 px-6">Capacity</th>
                  <th className="py-4 px-6">Active Dwellers</th>
                  <th className="py-4 px-6">Monthly Cost</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No rooms found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map(room => {
                    const occupants = residents.filter(r => room.residentIds.includes(r.id) && r.status === 'Active');
                    const availableSpots = room.capacity - occupants.length;

                    return (
                      <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-950">Room {room.id}</td>
                        <td className="py-4 px-6 text-gray-600">{getSharingLabel(room.type)}</td>
                        <td className="py-4 px-6 text-gray-500">Floor {room.floor}</td>
                        <td className="py-4 px-6 text-gray-600">{room.capacity} Beds</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              availableSpots > 0 ? 'bg-indigo-500' : 'bg-gray-300'
                            }`} />
                            <span className="text-xs text-gray-700">
                              {occupants.length} Occupants ({availableSpots} vacant)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-indigo-600">{formatCurrency(room.rent)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(room)}
                              className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => onDeleteRoom(room.id)}
                              className="bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950">
                    {isAddModalOpen ? 'Register New Room' : `Configure Room ${formId}`}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isAddModalOpen ? 'Define configuration specs for a new living room.' : 'Update pricing, amenities list, or layout details.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Grid for basics */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Room Number */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Room Number</label>
                    <input
                      type="text"
                      disabled={isEditModalOpen}
                      placeholder="e.g. 104"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  {/* Room Type */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Room Sharing Type</label>
                    <select
                      value={formType}
                      onChange={(e) => handleTypeChange(e.target.value as RoomType)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="Single">Single (1 Bed)</option>
                      <option value="Double">Double (2 Beds)</option>
                      <option value="Triple">Triple (3 Beds)</option>
                      <option value="Quadruple">Four sharing (4 Beds)</option>
                      <option value="Quintuple">Five sharing (5 Beds)</option>
                    </select>
                  </div>

                  {/* Floor */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Floor Level</label>
                    <select
                      value={formFloor}
                      onChange={(e) => setFormFloor(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value={1}>1st Floor</option>
                      <option value={2}>2nd Floor</option>
                      <option value={3}>3rd Floor</option>
                      <option value={4}>4th Floor</option>
                      <option value={5}>5th Floor</option>
                      <option value={6}>6th Floor</option>
                    </select>
                  </div>
                </div>

                {/* Price block */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Monthly Rent Cost (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={formRent}
                      onChange={(e) => setFormRent(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-3xs text-gray-400 mt-1 block">Triple: 9000 and Quad: 7500</span>
                </div>

                {/* Amenities checklist */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Amenities Available</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    {AVAILABLE_AMENITIES.map(am => {
                      const isChecked = formAmenities.includes(am);
                      return (
                        <div 
                          key={am} 
                          onClick={() => toggleAmenity(am)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-950 font-medium' 
                              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{am}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    {isAddModalOpen ? 'Create Room' : 'Apply Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
