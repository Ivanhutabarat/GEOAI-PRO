import React, { useState, useEffect } from 'react';
import { Menu, FileText, Settings, Megaphone, Terminal, Wifi, QrCode, X } from 'lucide-react';

export const WhatsAppBotMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<'IDLE' | 'TESTING'>('IDLE');
  
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{connected: boolean, status: string, qr?: string, pairingCode?: string} | null>(null);

  const menuItems = [
    { title: 'WhatsApp Auth (QR)', icon: QrCode, action: 'SHOW_QR' },
    { title: 'Test n8n Webhook', icon: Terminal, action: 'TEST_WEBHOOK' },
  ];

  const fetchQrCode = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      const data = await res.json();
      setQrData(data);
    } catch (e) {
      console.error("Error fetching QR", e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (showQrModal) {
      fetchQrCode();
      interval = setInterval(fetchQrCode, 5000);
    }
    return () => clearInterval(interval);
  }, [showQrModal]);

  const handleAction = async (action: string) => {
    let endpoint = '';
    let body = {};
    if (action === 'SHOW_QR') {
      setShowQrModal(true);
      setIsOpen(false);
      return;
    } else if (action === 'TEST_WEBHOOK') {
      endpoint = '/api/webhook/whatsapp';
      body = { senderNumber: '6285260245100', message: 'STATUS' };
      setGatewayStatus('TESTING');
    }

    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        alert(data.message || data.reply || 'Action executed.');
      } catch (e) {
        alert('Action failed.');
      } finally {
        if (action === 'TEST_WEBHOOK') setGatewayStatus('IDLE');
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#00E5FF] p-3 rounded-full text-black shadow-lg relative group"
      >
        <Menu size={24} />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-[#1A1A1A] border border-[#333] p-4 rounded-lg w-72 shadow-2xl">
          <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
            <h3 className="text-[#00E5FF] font-mono text-sm uppercase">Van-Botz Command Menu</h3>
            <div className={`flex items-center gap-1 text-[10px] uppercase font-mono ${gatewayStatus === 'TESTING' ? 'text-yellow-400' : 'text-green-400'}`}>
              <Wifi size={12} className={gatewayStatus === 'TESTING' ? 'animate-pulse' : ''} />
              {gatewayStatus === 'TESTING' ? 'PINGING...' : 'GATEWAY LIVE'}
            </div>
          </div>
          
          {menuItems.map((item) => (
            <button 
              key={item.action}
              className="flex items-center gap-3 text-white hover:text-[#00E5FF] w-full p-2 mb-2 rounded border border-transparent hover:border-[#333] font-mono text-sm uppercase"
              onClick={() => handleAction(item.action)}
            >
              <item.icon size={16} />
              {item.title}
            </button>
          ))}
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 w-full max-w-sm flex flex-col items-center relative">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-[#00E5FF] font-bold text-lg mb-4 uppercase">WhatsApp Auth</h2>
            
            <div className="bg-white p-2 rounded-lg mb-4">
              {qrData?.qr ? (
                <img src={qrData.qr} alt="QR Code" className="w-64 h-64 object-contain" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-800 text-sm font-mono">
                  {qrData?.connected ? '✅ ALREADY CONNECTED' : 'GENERATING QR...'}
                </div>
              )}
            </div>

            <p className="text-gray-400 text-sm font-mono text-center mb-2">
              Status: <span className="text-white">{qrData?.status || 'Connecting...'}</span>
            </p>
            
            {qrData?.pairingCode && (
              <p className="text-gray-400 text-sm font-mono text-center">
                Pairing Code: <span className="text-white font-bold text-lg">{qrData.pairingCode}</span>
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Scan this QR with your WhatsApp linked devices.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
