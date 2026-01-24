'use client';

import { useState, useEffect } from 'react';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory, TicketNote, TicketAttachment } from '@/types';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/app';

export function TicketManagement() {
  const user = useAppStore((s) => s.user);
  const selectedTicketId = useAppStore((s) => s.selectedTicketId);
  const setSelectedTicketId = useAppStore((s) => s.setSelectedTicketId);
  const isAdmin = user?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'new-ticket' | 'view-ticket' | 'all-tickets'>('my-tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [isAdminResponse, setIsAdminResponse] = useState(false);

  // Form states for new ticket
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as TicketCategory,
    priority: 'medium' as TicketPriority,
    attachments: [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const query = new URLSearchParams();
      if (filterStatus !== 'all') query.append('status', filterStatus);
      if (filterPriority !== 'all') query.append('priority', filterPriority);
      if (searchTerm) query.append('search', searchTerm);
      
      // If viewing all tickets (admin), fetch all tickets
      if (activeTab === 'all-tickets') {
        query.append('all', 'true');
      }

      const response = await fetch(`/api/tickets?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      // Get user ID from session
      let userId = null;
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('sems_auth_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            userId = session.user?.id;
          } catch (e) {
            console.error('Failed to parse session:', e);
          }
        }
      }
      
      if (!userId) {
        setSubmitMessage({
          type: 'error',
          text: 'User information not found. Please log in again.',
        });
        setSubmitting(false);
        return;
      }

      // Generate ticket ID and number
      const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Process attachments to base64
      const attachments: { name: string; data: string; type: string; size: number }[] = [];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
      
      for (const file of newTicket.attachments) {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping file ${file.name}: Exceeds 5MB limit`);
          continue;
        }
        
        try {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          
          if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
            console.warn(`Skipping file ${file.name}: Invalid base64 encoding`);
            continue;
          }
          
          attachments.push({
            name: file.name,
            data: base64,
            type: file.type || 'application/octet-stream',
            size: file.size,
          });
        } catch (fileError) {
          console.error('Error processing attachment:', fileError);
        }
      }

      // Create ticket object for local storage
      const localTicket = {
        id: ticketId,
        ticketNumber,
        userId,
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
        attachments,
        notes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        synced: false,
        syncError: null,
      };

      // Save to local storage first
      const localTickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
      localTickets.push(localTicket);
      localStorage.setItem('local_tickets', JSON.stringify(localTickets));

      // Also save to IndexedDB for better persistence
      try {
        await db.tickets.put(localTicket as any);
        console.log('Ticket saved to IndexedDB');
      } catch (indexedDBError) {
        console.warn('Failed to save ticket to IndexedDB:', indexedDBError);
        // Continue anyway - localStorage is the fallback
      }

      setSubmitMessage({
        type: 'success',
        text: 'Ticket created locally! It will sync to the server when you have internet connection.',
      });

      // Also attempt to sync immediately if online
      if (navigator.onLine && authToken) {
        try {
          const formData = new FormData();
          formData.append('title', newTicket.title);
          formData.append('description', newTicket.description);
          formData.append('category', newTicket.category);
          formData.append('priority', newTicket.priority);

          newTicket.attachments.forEach((file) => {
            formData.append('attachments', file);
          });

          const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
          });

          if (response.ok) {
            const cloudTicket = await response.json();
            // Mark as synced in local storage
            const updatedTickets = localTickets.map((t: any) =>
              t.id === ticketId ? { ...t, synced: true, id: cloudTicket.id } : t
            );
            localStorage.setItem('local_tickets', JSON.stringify(updatedTickets));

            // Also update IndexedDB with the synced ticket
            try {
              const syncedTicket = {
                id: ticketId,
                ticketNumber,
                userId,
                title: newTicket.title,
                description: newTicket.description,
                category: newTicket.category,
                priority: newTicket.priority,
                status: 'open',
                attachments,
                notes: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                synced: true,
              };
              await db.tickets.put(syncedTicket as any);
              console.log('Ticket marked as synced in IndexedDB');
            } catch (indexedDBError) {
              console.warn('Failed to update ticket sync status in IndexedDB:', indexedDBError);
            }

            setSubmitMessage({
              type: 'success',
              text: 'Ticket created and synced to server successfully!',
            });
          }
        } catch (syncError) {
          console.log('Failed to sync immediately, will retry later:', syncError);
        }
      }

      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        attachments: [],
      });

      setTimeout(() => {
        setActiveTab('my-tickets');
      }, 2000);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setSubmitMessage({
        type: 'error',
        text: 'An error occurred while creating the ticket',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    
    // Filter files by size and show warning for oversized files
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setNewTicket({ ...newTicket, attachments: validFiles });
    }
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('view-ticket');
    // Fetch full ticket details
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const details = await response.json();
        setTicketDetails(details);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleViewTicketById = async (ticketId: string) => {
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const details = await response.json();
        setTicketDetails(details);
        setActiveTab('view-ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  // Handle notification navigation to ticket
  useEffect(() => {
    if (selectedTicketId) {
      handleViewTicketById(selectedTicketId);
      setSelectedTicketId(null); // Clear after loading
    }
  }, [selectedTicketId]);

  // Load tickets
  useEffect(() => {
    if (activeTab === 'my-tickets' || activeTab === 'all-tickets') {
      loadTickets();
    }
  }, [activeTab, filterStatus, filterPriority]);

  const handlePreviewAttachment = (file: File) => {
    try {
      // For images, PDFs, and other common formats, open in new tab
      const fileURL = URL.createObjectURL(file);
      const fileType = file.type;

      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        window.open(fileURL, '_blank');
      } else {
        // For other file types, offer download
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    } catch (error) {
      console.error('Error previewing attachment:', error);
      alert('Unable to preview attachment. Please try again.');
    }
  };

  const handleDownloadAttachment = (attachment: TicketAttachment) => {
    try {
      // Clean the base64 string - remove whitespace and invalid characters
      const cleanBase64 = attachment.data.replace(/\s/g, '').trim();
      
      // Validate base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error('Invalid base64 data format');
      }

      // Convert base64 to blob
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: attachment.type });
      const url = URL.createObjectURL(blob);

      // If it's an image or PDF, open in new tab for viewing
      if (attachment.type.startsWith('image/') || attachment.type === 'application/pdf') {
        window.open(url, '_blank');
      } else {
        // For other types, download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert(`Unable to download "${attachment.name}". The file data may be corrupted. Please try uploading again.`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !noteContent.trim()) return;

    setAddingNote(true);
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      // Get user info from session
      let userId: string | null = null;
      let userName = 'Unknown';
      
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('sems_auth_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            userId = session.user?.id;
            userName = session.user?.fullName || session.user?.email || 'Unknown';
          } catch (e) {
            console.error('Failed to parse session:', e);
          }
        }
      }

      if (!userId) {
        throw new Error('User information not found. Please log in again');
      }

      // Create local note object
      const localNote: TicketNote = {
        id: `local-note-${Date.now()}-${Math.random()}`,
        ticketId: selectedTicket.id,
        authorId: userId,
        authorName: userName,
        content: noteContent,
        isAdminNote: isAdmin && isAdminResponse,
        createdAt: Date.now(),
      };

      // Save to localStorage first
      const localNotes = JSON.parse(localStorage.getItem('local_ticket_notes') || '[]');
      const noteWithSync = { ...localNote, synced: false };
      localNotes.push(noteWithSync);
      localStorage.setItem('local_ticket_notes', JSON.stringify(localNotes));

      // Also try to save to IndexedDB
      try {
        await db.ticketNotes.put(noteWithSync as any);
      } catch (err) {
        console.warn('Failed to save note to IndexedDB:', err);
      }

      // Update UI immediately with the local note
      if (ticketDetails) {
        setTicketDetails({
          ...ticketDetails,
          notes: [localNote, ...(ticketDetails.notes || [])],
        });
      }
      setNoteContent('');

      // Try to sync to cloud in background
      try {
        const response = await fetch(`/api/tickets/${selectedTicket.id}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ content: noteContent }),
        });

        if (response.ok) {
          const syncedNote = await response.json();
          // Update localStorage with synced note
          const updatedNotes = localNotes.map((n: any) =>
            n.id === localNote.id ? { ...syncedNote, synced: true } : n
          );
          localStorage.setItem('local_ticket_notes', JSON.stringify(updatedNotes));

          // Update UI with synced note
          if (ticketDetails) {
            setTicketDetails({
              ...ticketDetails,
              notes: (ticketDetails.notes || []).map((n: TicketNote) =>
                n.id === localNote.id ? syncedNote : n
              ),
            });
          }
        }
      } catch (syncError) {
        console.warn('Failed to sync note to cloud (will retry on next sync):', syncError);
        // Note is already saved locally, so it's safe to continue
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert(error instanceof Error ? error.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleBackToTickets = () => {
    setSelectedTicket(null);
    setTicketDetails(null);
    setNoteContent('');
    setActiveTab('my-tickets');
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticketDetails) return;

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(
        `/api/tickets/${ticketDetails.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicketDetails(updatedTicket.ticket || updatedTicket);
        
        // Reload tickets to reflect status change
        await loadTickets();
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {activeTab !== 'view-ticket' && (
          <>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'my-tickets'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Tickets
            </button>
            <button
              onClick={() => setActiveTab('new-ticket')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'new-ticket'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create New Ticket
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('all-tickets')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'all-tickets'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Tickets (Admin)
              </button>
            )}
          </>
        )}
      </div>

      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by ticket number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="on-hold">On Hold</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TicketPriority | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleViewTicket(ticket)}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 
                        onClick={() => handleViewTicket(ticket)}
                        className="text-base font-semibold text-blue-600 cursor-pointer hover:text-blue-800 underline transition"
                      >
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-gray-600">#{ticket.ticketNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <div className="flex gap-4">
                      <span>Category: {ticket.category}</span>
                      <span>
                        Created: {formatDate(ticket.createdAt)} {formatTime(ticket.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Ticket Tab */}
      {activeTab === 'new-ticket' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h2>

            {submitMessage && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  submitMessage.type === 'success'
                    ? 'bg-green-100 border border-green-300 text-green-800'
                    : 'bg-red-100 border border-red-300 text-red-800'
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="bug-report">Bug Report</option>
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed information about your issue"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {newTicket.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Selected files:</p>
                    <ul className="space-y-1">
                      {newTicket.attachments.map((file, idx) => (
                        <li
                          key={idx}
                          onClick={() => handlePreviewAttachment(file)}
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <span>👁️</span>
                          <span className="underline">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !newTicket.title || !newTicket.description}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
                >
                  {submitting ? 'Creating Ticket...' : 'Create Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-tickets')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Tickets Tab (Admin) */}
      {activeTab === 'all-tickets' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by ticket number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="on-hold">On Hold</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TicketPriority | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No tickets found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleViewTicket(ticket)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Ticket #{ticket.ticketNumber}</p>
                      <p className="text-sm text-gray-700 mt-2">{ticket.description}</p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {ticket.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTime(ticket.createdAt)}</p>
                      {ticket.notes && ticket.notes.length > 0 && (
                        <p className="text-xs text-blue-600 mt-2">💬 {ticket.notes.length} comment{ticket.notes.length !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Details Tab */}
      {activeTab === 'view-ticket' && ticketDetails && (
        <div className="space-y-6">
          <button
            onClick={handleBackToTickets}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            ← Back to Tickets
          </button>

          <div className="bg-white rounded-lg shadow p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{ticketDetails.title}</h1>
                <p className="text-gray-600">Ticket #{ticketDetails.ticketNumber}</p>
              </div>
              <div className="flex gap-2">
                {isAdmin || ticketDetails.userId === user?.id ? (
                  <select
                    value={ticketDetails.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(ticketDetails.status)}`}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticketDetails.status)}`}>
                    {ticketDetails.status}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticketDetails.priority)}`}>
                  {ticketDetails.priority}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <p className="text-lg font-medium text-gray-900">{ticketDetails.category}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Created</label>
                <p className="text-lg font-medium text-gray-900">{formatDate(ticketDetails.createdAt)} {formatTime(ticketDetails.createdAt)}</p>
              </div>
              {ticketDetails.resolvedAt && (
                <div>
                  <label className="text-sm text-gray-600">Resolved</label>
                  <p className="text-lg font-medium text-gray-900">{formatDate(ticketDetails.resolvedAt)} {formatTime(ticketDetails.resolvedAt)}</p>
                </div>
              )}
              {ticketDetails.closedAt && (
                <div>
                  <label className="text-sm text-gray-600">Closed</label>
                  <p className="text-lg font-medium text-gray-900">{formatDate(ticketDetails.closedAt)} {formatTime(ticketDetails.closedAt)}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{ticketDetails.description}</p>
            </div>

            {/* Attachments */}
            {ticketDetails.attachments && ticketDetails.attachments.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h2>
                <ul className="space-y-2">
                  {ticketDetails.attachments.map((attachment, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <span>📎</span>
                      <span className="underline">{attachment.name}</span>
                      <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(2)} KB)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes & Comments</h2>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mb-6 pb-6 border-b border-gray-200">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                
                {isAdmin && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="admin-response"
                      checked={isAdminResponse}
                      onChange={(e) => setIsAdminResponse(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="admin-response" className="text-sm font-medium text-red-700">
                      Mark as Admin Response
                    </label>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={addingNote || !noteContent.trim()}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
                >
                  {addingNote ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              {/* Notes List */}
              {ticketDetails.notes && ticketDetails.notes.length > 0 ? (
                <div className="space-y-4">
                  {ticketDetails.notes.map((note: TicketNote) => (
                    <div key={note.id} className={`p-4 rounded-lg ${note.isAdminNote ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{note.authorName}</p>
                          {note.isAdminNote && (
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(note.createdAt)} {formatTime(note.createdAt)}</p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
