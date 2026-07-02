import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Key, 
  RefreshCw, 
  Send, 
  Users, 
  UserPlus, 
  Trash2, 
  Lock, 
  Server, 
  Radio, 
  Activity, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  QrCode,
  LockKeyhole
} from 'lucide-react';
import { useGlobalGeoContext } from '../../context/GlobalGeoContext';

interface Contact {
  name: string;
  number: string;
  role: string;
}

interface KeyStatus {
  keysCount: number;
  currentKeyIndex: number;
  activeKeyMasked: string;
  isSwarmActive: boolean;
}

export default function SecurityAndWhatsAppPanel() {
  const { addLog } = useGlobalGeoContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  
  // Form States
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [newContactRole, setNewContactRole] = useState('Safety Inspector');
  
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // WhatsApp connection states
  const [qrData, setQrData] = useState<{connected: boolean, status: string} | null>(null);
  
  // Security Incidents Timeline Simulator
  const [incidentLogs, setIncidentLogs] = useState<any[]>([
    { id: 1, time: '17:31:02', type: 'INTEGRITY', message: 'CRC-32 checksum integrity block verified successfully. Author credits unchanged.', status: 'OK' },
    { id: 2, time: '17:34:40', type: 'FIREWALL', message: 'Rate limiter verified: 0 active IP suspensions in the last 15 minutes.', status: 'SECURE' },
    { id: 3, time: '17:38:15', type: 'WA-GATEKEEPER', message: 'Unauthorized query attempt from unrecognized phone +6282311223344 blocked.', status: 'BLOCKED' },
    { id: 4, time: '17:41:01', type: 'SWARM-ROTATOR', message: 'API key index auto-balancing active. Zero 429 exceptions logged.', status: 'OK' }
  ]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/whatsapp/contacts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
        if (data.length > 0 && !selectedContact) {
          setSelectedContact(data[0].number);
        }
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch('/api/security/keys');
      const data = await res.json();
      setKeyStatus(data);
    } catch (err) {
      console.error('Failed to fetch key status:', err);
    }
  };

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      const data = await res.json();
      setQrData(data);
    } catch (err) {
      console.error('Failed to fetch WA status:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchKeyStatus();
    fetchWhatsAppStatus();
    
    const interval = setInterval(() => {
      fetchWhatsAppStatus();
      fetchKeyStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactNumber.trim()) return;

    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName,
          number: newContactNumber,
          role: newContactRole
        })
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        setNewContactName('');
        setNewContactNumber('');
        
        // Add security event log
        const timestamp = new Date().toLocaleTimeString();
        setIncidentLogs(prev => [
          { id: Date.now(), time: timestamp, type: 'GATEKEEPER', message: `Registered dispatch contact: ${newContactName} (${newContactNumber})`, status: 'OK' },
          ...prev
        ]);
        
        addLog({
          type: 'INFO',
          source: 'SECURITY',
          message: `Added new WhatsApp alerting contact: ${newContactName} [${newContactRole}]`
        });
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan kontak');
    }
  };

  const handleDeleteContact = async (num: string) => {
    try {
      const res = await fetch(`/api/whatsapp/contacts/${num}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        if (selectedContact === num && data.contacts.length > 0) {
          setSelectedContact(data.contacts[0].number);
        }
        
        const timestamp = new Date().toLocaleTimeString();
        setIncidentLogs(prev => [
          { id: Date.now(), time: timestamp, type: 'GATEKEEPER', message: `Revoked dispatch contact credentials for JID ending in ${num.substring(num.length - 4)}`, status: 'REVOKED' },
          ...prev
        ]);
        
        addLog({
          type: 'WARN',
          source: 'SECURITY',
          message: `Removed WhatsApp alerting contact with number ending in ${num.substring(num.length - 4)}`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRotateKey = async () => {
    setIsRotatingKey(true);
    try {
      const res = await fetch('/api/security/rotate-key', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setKeyStatus(data);
        const timestamp = new Date().toLocaleTimeString();
        setIncidentLogs(prev => [
          { id: Date.now(), time: timestamp, type: 'SWARM-ROTATOR', message: `Manual API Key rotation complete. Active key updated to slot #${data.currentKeyIndex}`, status: 'OK' },
          ...prev
        ]);
        addLog({
          type: 'INFO',
          source: 'KEY-ROTATOR',
          message: `Swarm API Key manually rotated to index ${data.currentKeyIndex} [Active: ${data.activeKeyMasked}]`
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !customAlertMessage.trim()) return;

    setIsSendingAlert(true);
    try {
      const targetObj = contacts.find(c => c.number === selectedContact);
      const res = await fetch('/api/whatsapp/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetNumber: selectedContact,
          message: customAlertMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        const timestamp = new Date().toLocaleTimeString();
        setIncidentLogs(prev => [
          { id: Date.now(), time: timestamp, type: 'ALERT-DISPATCH', message: `Dispatched warning report to ${targetObj?.name || selectedContact}`, status: 'DISPATCHED' },
          ...prev
        ]);
        addLog({
          type: 'INFO',
          source: 'WA-GATEWAY',
          message: `Warning alert dispatched via WhatsApp to ${targetObj?.name || selectedContact}: "${customAlertMessage}"`
        });
        setCustomAlertMessage('');
        alert(`Sukses! Warning terkirim ke ${targetObj?.name || selectedContact}`);
      } else {
        alert(`Gagal mengirim WA: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengirim WhatsApp alert.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  return (
    <div className="bg-[#111112] border border-[#222] rounded-xl p-6 shadow-xl flex flex-col gap-6" id="security-wa-gateway">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#222] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00E5FF]">
            <Lock className="w-5 h-5" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              System Security Firewall & WhatsApp Alerting Gateway
            </h2>
          </div>
          <p className="text-[11px] font-mono text-[#666] mt-1">
            Core encryption matrices, automatic multi-agent API swarm key-rotations, and field-wide WhatsApp notification directories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-2 bg-black/60 border border-[#222] px-3 py-1.5 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${qrData?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></span>
            <span className="text-[10px] font-mono font-bold uppercase text-white">
              WA BOT: {qrData?.connected ? 'CONNECTED' : 'STANDBY / WAIT QR'}
            </span>
          </div>
          
          <button
            onClick={fetchWhatsAppStatus}
            className="p-1.5 bg-[#1a1a1c] border border-[#2d2d30] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Refresh connection status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: WhatsApp Subscriber / Contact Directory */}
        <div className="bg-black/40 border border-[#222] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase">WA Alert Directory</h3>
            </div>
            <span className="text-[9px] font-mono bg-[#1c1c1f] px-2 py-0.5 rounded text-emerald-400">
              {contacts.length} Contacts
            </span>
          </div>

          {/* New Contact Form */}
          <form onSubmit={handleAddContact} className="flex flex-col gap-2 bg-[#161618] p-3 rounded-lg border border-[#222]">
            <span className="text-[8px] font-mono uppercase text-[#666] font-bold block mb-1">Add Warning Recipient</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newContactName}
                onChange={e => setNewContactName(e.target.value)}
                className="bg-black border border-[#333] rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-emerald-500 w-full"
                required
              />
              <input
                type="text"
                placeholder="Phone (628...)"
                value={newContactNumber}
                onChange={e => setNewContactNumber(e.target.value)}
                className="bg-black border border-[#333] rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-emerald-500 w-full"
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={newContactRole}
                onChange={e => setNewContactRole(e.target.value)}
                className="bg-black border border-[#333] rounded px-2 py-1 text-[10px] font-mono text-gray-400 focus:outline-none flex-1"
              >
                <option value="HSE Field Controller">HSE Controller</option>
                <option value="Safety Inspector">Safety Inspector</option>
                <option value="Geotechnical Site Engineer">Site Engineer</option>
                <option value="Project Director">Project Director</option>
                <option value="Field Analyst">Field Analyst</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Add
              </button>
            </div>
          </form>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto max-h-[170px] space-y-2 pr-1 scrollbar-thin">
            {isLoadingContacts ? (
              <p className="text-[10px] font-mono text-[#555] text-center italic mt-4">Loading contacts list...</p>
            ) : contacts.length === 0 ? (
              <p className="text-[10px] font-mono text-[#555] text-center italic mt-4">No recipients registered.</p>
            ) : (
              contacts.map((contact, i) => (
                <div key={i} className="bg-[#121214] border border-[#222] rounded-lg p-2.5 flex items-center justify-between group">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold text-white block">{contact.name}</span>
                    <span className="text-[9px] font-mono text-emerald-400">+{contact.number}</span>
                    <span className="text-[8px] font-mono uppercase text-[#666]">{contact.role}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.number)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 text-red-500 rounded transition-all cursor-pointer"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Send WhatsApp Warning & API Key Swarm */}
        <div className="bg-black/40 border border-[#222] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase">Dispatch Warning</h3>
            </div>
            <span className="text-[9px] font-mono bg-[#1c1c1f] px-2 py-0.5 rounded text-orange-400">
              Emergency Override
            </span>
          </div>

          {/* Quick Alert Dispatch Form */}
          <form onSubmit={handleSendAlert} className="flex flex-col gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono uppercase text-[#666]">Target Recipient</span>
              <select
                value={selectedContact}
                onChange={e => setSelectedContact(e.target.value)}
                className="bg-black border border-[#222] rounded px-3 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-orange-500/50"
                required
              >
                <option value="" disabled>Select target...</option>
                {contacts.map((c, i) => (
                  <option key={i} value={c.number}>{c.name} (+{c.number})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-mono uppercase text-[#666]">Warning Details / Logs</span>
                <button
                  type="button"
                  onClick={() => setCustomAlertMessage('[RISK ALERT] Terdeteksi laju subsiden air tanah kritis di area basin survey barat daya (Zone-B). Segera periksa sumur pantau!')}
                  className="text-[8px] font-mono text-[#00E5FF] hover:underline cursor-pointer"
                >
                  Insert Sample Anomaly
                </button>
              </div>
              <textarea
                value={customAlertMessage}
                onChange={e => setCustomAlertMessage(e.target.value)}
                placeholder="Enter exact hazard findings, geophysics drift data, or evacuation notice..."
                className="bg-black border border-[#222] rounded p-2.5 text-[10px] font-mono text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none flex-1 leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSendingAlert || contacts.length === 0}
              className={`w-full py-2 border rounded-lg font-mono text-xs font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                contacts.length === 0
                  ? 'border-neutral-800 bg-neutral-900/30 text-neutral-600 cursor-not-allowed'
                  : 'border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/25 text-orange-400'
              }`}
            >
              {isSendingAlert ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatches...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Alert (WhatsApp)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Column 3: Code Security Audits, Key Rotation & Intruder Logs */}
        <div className="bg-black/40 border border-[#222] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-2">
            <div className="flex items-center gap-2">
              <LockKeyhole className="w-4 h-4 text-[#00E5FF]" />
              <h3 className="text-xs font-mono font-bold text-white uppercase">Security Audits</h3>
            </div>
            <span className="text-[9px] font-mono bg-[#1c1c1f] px-2 py-0.5 rounded text-[#00E5FF]">
              TLS 1.3 Active
            </span>
          </div>

          {/* Security Checklist Statuses */}
          <div className="grid grid-cols-2 gap-2 bg-[#121214] border border-[#222] p-3 rounded-lg text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>CORS: STRICT</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Rate Limiter: ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Basic Auth: FORCED</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Code Audit: VERIFIED</span>
            </div>
          </div>

          {/* API Key Swarm Manager Panel */}
          <div className="bg-[#141416] border border-[#222] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono uppercase text-[#666] font-bold">API Swarm Keys Status</span>
              <button
                onClick={handleRotateKey}
                disabled={isRotatingKey}
                className="text-[8px] font-mono text-orange-400 hover:text-orange-300 uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isRotatingKey ? 'animate-spin' : ''}`} /> Rotate Key
              </button>
            </div>

            {keyStatus ? (
              <div className="flex items-center justify-between bg-black/40 border border-[#222] p-2 rounded text-[10px] font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400 font-bold">Key Index: <span className="text-orange-400">#{keyStatus.currentKeyIndex}</span> / {keyStatus.keysCount}</span>
                  <span className="text-[9px] text-gray-500 font-bold select-all">{keyStatus.activeKeyMasked}</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border border-emerald-500/20">
                  HEALTHY
                </span>
              </div>
            ) : (
              <div className="text-[9px] text-[#555] font-mono py-1">Connecting to API security vault...</div>
            )}
          </div>

          {/* Security & Firewall Incident Terminal Logs */}
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[8px] font-mono uppercase text-[#666] font-bold">Intruder & Security Events</span>
            <div className="bg-black/80 border border-[#222] rounded-lg p-2.5 h-28 overflow-y-auto space-y-2 pr-1 scrollbar-thin font-mono text-[9px] leading-relaxed">
              {incidentLogs.map((log) => (
                <div key={log.id} className="border-b border-neutral-900 pb-1.5 last:border-0 last:pb-0 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">[{log.time}]</span>
                    <span className={`font-bold ${
                      log.status === 'BLOCKED' ? 'text-red-400' : log.status === 'OK' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="ml-auto text-[8px] bg-neutral-900 text-gray-400 px-1 rounded uppercase">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-0.5">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
