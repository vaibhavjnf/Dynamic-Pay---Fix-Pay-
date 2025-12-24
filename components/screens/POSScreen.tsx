import React, { useState, useRef, useEffect } from 'react';
import { LogOut, RotateCcw, X, History, Mic, MicOff, Loader2, Settings, ShoppingBag, Plus } from 'lucide-react';
import { AppConfig, Transaction, CatalogItem } from '../../types';
import QRCodeDisplay from '../QRCodeDisplay';
import { GoogleGenAI, Type, FunctionDeclaration, LiveSession, Modality } from "@google/genai";

interface POSScreenProps {
  config: AppConfig;
  onLogout: () => void;
  onShowLedger: () => void;
  onShowSettings: () => void;
  onSaveTransaction: (t: Transaction) => void;
  todayTotal: number;
}

const createBlob = (data: Float32Array): { data: string; mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
};

const POSScreen: React.FC<POSScreenProps> = ({ config, onLogout, onShowLedger, onShowSettings, onSaveTransaction, todayTotal }) => {
  const [amount, setAmount] = useState('0');
  const [showQR, setShowQR] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  
  // Live API State
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleKeyPress = (key: string) => {
    if (showQR) return;

    if (amount === '0' && key !== '.') {
      setAmount(key);
    } else if (key === '.' && amount.includes('.')) {
      return;
    } else if (amount.split('.')[1]?.length >= 2) {
      return;
    } else if (amount.length > 8) {
      return;
    } else {
      setAmount(amount + key);
    }
  };

  const handleClear = () => {
    setAmount('0');
    setShowQR(false);
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handlePresetAdd = (val: number) => {
    const current = parseFloat(amount) || 0;
    const next = current + val;
    setAmount(next.toString());
  };

  const handleCatalogPick = (item: CatalogItem) => {
      const current = parseFloat(amount) || 0;
      const next = current + item.price;
      setAmount(next.toString());
  };

  const handleCharge = () => {
    if (parseFloat(amount) > 0) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        amount: amount,
        timestamp: new Date().toISOString(),
        shopName: config.shopName,
        upiId: config.upiId
      };
      onSaveTransaction(transaction);
      setShowQR(true);
      stopLiveSession();
    }
  };

  const handleNewPayment = () => {
    setShowQR(false);
    setAmount('0');
  };

  // --- Live API ---
  const startLiveSession = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing");
      return;
    }
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const updateAmountTool: FunctionDeclaration = {
        name: 'updateAmount',
        parameters: {
          type: Type.OBJECT,
          description: 'Updates the POS amount when the user states a monetary value.',
          properties: {
            amount: { type: Type.NUMBER, description: 'The amount in rupees.' },
          },
          required: ['amount'],
        },
      };

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          tools: [{ functionDeclarations: [updateAmountTool] }],
          systemInstruction: {
            parts: [{
              text: "You are a backend for a POS system. Listen to the cashier. When they state a final bill amount, call `updateAmount` with the number. Do not speak. Only call the tool."
            }]
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Connected");
            setIsConnecting(false);
            setIsListening(true);
            if (!audioContextRef.current || !streamRef.current) return;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              session.sendRealtimeInput({ media: pcmBlob });
            };
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
          },
          onmessage: (msg) => {
             if (msg.toolCall) {
                msg.toolCall.functionCalls.forEach(fc => {
                  if (fc.name === 'updateAmount') {
                    const args = fc.args as any;
                    if (args && args.amount) {
                      setAmount(args.amount.toString());
                      session.sendToolResponse({
                        functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                      });
                    }
                  }
                });
             }
          },
          onclose: () => { setIsListening(false); setIsConnecting(false); },
          onerror: (err) => { console.error(err); setIsListening(false); setIsConnecting(false); }
        }
      });
      sessionRef.current = session;
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
      setIsListening(false);
      stopLiveSession();
    }
  };

  const stopLiveSession = () => {
    sessionRef.current = null;
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    setIsListening(false);
    setIsConnecting(false);
  };

  const toggleListening = () => {
    if (isListening || isConnecting) stopLiveSession();
    else startLiveSession();
  };

  const upiString = `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(config.shopName)}&am=${amount}&cu=INR`;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'];
  const presets = config.quickAmounts || [10, 20, 50, 100];

  if (showQR) {
    return (
      <div className="min-h-screen p-6 bg-white relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}></div>
        <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
          <div className="flex justify-between items-start mb-8 pt-2">
             <div className="flex flex-col">
                <div className="h-2 w-16 bg-black mb-1"></div>
                <h1 className="text-xl font-black uppercase text-black leading-none truncate w-40">PAYMENT</h1>
             </div>
             <button onClick={handleNewPayment} className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center shadow-neo-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                <X size={24} color="black" strokeWidth={3} />
             </button>
          </div>
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase text-black mb-2">Collect Amount</p>
            <h1 className="text-6xl font-black tracking-tighter text-black">₹{amount}</h1>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center mb-8">
            <div className="border-4 border-black p-4 bg-white shadow-neo-lg rotate-1 transform transition-transform hover:rotate-0">
              <QRCodeDisplay data={upiString} />
            </div>
            <div className="mt-8 text-center bg-black text-white p-4 w-full shadow-neo border-4 border-white">
                <p className="font-black uppercase text-xl text-primary">{config.shopName}</p>
                <p className="text-sm font-mono text-white">{config.upiId}</p>
            </div>
          </div>
          <button onClick={handleNewPayment} className="w-full px-6 py-5 font-black uppercase text-xl border-4 border-black bg-primary text-black shadow-neo hover:shadow-neo-sm hover:translate-x-1 hover:translate-y-1 transition-all active:translate-x-2 active:translate-y-2">
            New Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col font-archivo relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}></div>

        <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pt-2">
                <div className="flex flex-col">
                    <div className="h-2 w-16 bg-black mb-2"></div>
                    <h1 className="text-xl font-black uppercase text-black leading-none truncate w-32 sm:w-48">
                        {config.shopName}
                    </h1>
                </div>
                <div className="flex gap-2">
                     <button onClick={onShowSettings} className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-black" title="Settings">
                         <Settings size={20} color="black" strokeWidth={3} />
                    </button>
                    <button onClick={onShowLedger} className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-black" title="Ledger">
                         <History size={20} color="black" strokeWidth={3} />
                    </button>
                    <button onClick={onLogout} className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-black" title="Logout">
                         <LogOut size={20} color="black" strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Today's Sales */}
            <div className="mb-4 border-4 border-black bg-primary p-3 shadow-neo flex justify-between items-center transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="font-black uppercase text-xs text-black tracking-wide">TODAY'S SALES</span>
                <span className="font-black text-2xl text-black">₹{todayTotal.toFixed(2)}</span>
            </div>

            {/* Amount Box */}
            <div className="mb-4 relative">
                 <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
                 <div className={`relative border-4 border-black bg-white h-24 flex items-center justify-between px-4 ${isListening ? 'ring-4 ring-[#FF3366] ring-offset-2' : ''}`}>
                    <button onClick={toggleListening} className={`w-10 h-10 flex items-center justify-center border-4 border-black transition-all ${isListening ? 'bg-[#FF3366] text-white animate-pulse' : 'bg-gray-100 text-black'}`}>
                        {isConnecting ? <Loader2 className="animate-spin" size={20} strokeWidth={3} /> : isListening ? <Mic size={20} strokeWidth={3} /> : <MicOff size={20} strokeWidth={3} />}
                    </button>
                    {/* Key property forces re-render animation when amount changes */}
                    <span key={amount} className="text-5xl font-black text-black tracking-tight truncate ml-2 animate-[pulse_0.2s_ease-in-out]">
                        {amount === '0' ? <span className="text-black opacity-20">0</span> : amount}
                    </span>
                 </div>
                 {isListening && <div className="absolute -bottom-6 left-0 right-0 text-center"><span className="bg-black text-white text-xs font-black uppercase px-2 py-1">Listening...</span></div>}
            </div>
            
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {presets.map((val, idx) => (
                <button 
                  key={idx}
                  onClick={() => handlePresetAdd(val)}
                  className="bg-white border-4 border-black py-2 font-black shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:bg-gray-100 transition-all text-sm text-black"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* Catalog Button Toggle */}
             {config.catalog && config.catalog.length > 0 && (
                 <button 
                    onClick={() => setShowCatalog(!showCatalog)}
                    className="mb-4 w-full flex items-center justify-center gap-2 border-4 border-black bg-gray-100 py-2 font-black uppercase text-xs hover:bg-white transition-colors text-black"
                 >
                    <ShoppingBag size={16} strokeWidth={3}/> {showCatalog ? "Hide Catalog" : "Quick Pick Item"}
                 </button>
             )}

            {/* Catalog Grid (Collapsible) */}
            {showCatalog && config.catalog && (
                 <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto border-4 border-black p-2 bg-gray-50">
                    {config.catalog.map(item => (
                         <button 
                            key={item.id}
                            onClick={() => handleCatalogPick(item)}
                            className="bg-white border-2 border-black p-2 flex justify-between items-center hover:bg-primary/20 transition-colors"
                         >
                            <span className="text-xs font-bold truncate text-black">{item.name}</span>
                            <span className="text-xs font-black text-black">+₹{item.price}</span>
                         </button>
                    ))}
                 </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 flex-1 mb-4">
                {keys.map(key => (
                    <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="border-4 border-black bg-white text-2xl font-black text-black shadow-neo-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:bg-gray-100 transition-all flex items-center justify-center min-h-[50px]"
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-2 h-16 mb-2">
                <button onClick={handleClear} className="col-span-1 border-4 border-black bg-[#FF3366] flex items-center justify-center shadow-neo-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                    <X size={24} color="white" strokeWidth={4} />
                </button>
                <button onClick={handleBackspace} className="col-span-1 border-4 border-black bg-white flex items-center justify-center shadow-neo-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                    <RotateCcw size={24} color="black" strokeWidth={3} />
                </button>
                <button onClick={handleCharge} disabled={parseFloat(amount) <= 0} className="col-span-2 border-4 border-black bg-[#03D26F] flex items-center justify-center shadow-neo-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1">
                    <span className="font-black text-xl uppercase text-black tracking-wider">CHARGE</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default POSScreen;