import React, { useState } from 'react';
import { Camera, Upload, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { extractMerchantData, MerchantData } from '../../services/geminiService';
import { AppConfig, CatalogItem } from '../../types';

interface SetupScreenProps {
  onComplete: (config: AppConfig) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [shopName, setShopName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setLoading(true);

      try {
        const data = await extractMerchantData(base64);
        if (data) {
          setUpiId(data.upiId);
          if (data.shopName) setShopName(data.shopName);
          if (data.category) setCategory(data.category);
          setStep(2);
        } else {
          setError("Could not find a valid UPI ID. Please try another image or enter manually.");
        }
      } catch (err) {
        setError("Error processing image. Please enter manually.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getDefaultsByCategory = (cat: string) => {
    switch (cat) {
      case 'tea_shop':
        return {
          amounts: [10, 20, 50, 100],
          catalog: [
            { id: '1', name: 'Tea', price: 10 },
            { id: '2', name: 'Coffee', price: 20 },
            { id: '3', name: 'Samosa', price: 15 }
          ]
        };
      case 'grocery':
        return {
          amounts: [50, 100, 200, 500],
          catalog: [
             { id: '1', name: 'Milk', price: 30 },
             { id: '2', name: 'Bread', price: 40 }
          ]
        };
      case 'restaurant':
        return {
          amounts: [100, 200, 500, 1000],
          catalog: []
        };
      case 'pharmacy':
        return {
          amounts: [50, 100, 200, 500],
          catalog: []
        };
      default:
        return {
          amounts: [10, 20, 50, 100],
          catalog: []
        };
    }
  };

  const handleSubmit = () => {
    if (!shopName || !upiId) {
      setError('Please fill all fields');
      return;
    }
    // Basic UPI validation
    if (!upiId.includes('@')) {
        setError('Invalid UPI ID format');
        return;
    }

    const defaults = getDefaultsByCategory(category);

    const config: AppConfig = { 
      shopName, 
      upiId,
      quickAmounts: defaults.amounts,
      catalog: defaults.catalog
    };
    localStorage.setItem('fixpay_config', JSON.stringify(config));
    onComplete(config);
  };

  return (
    <div className="min-h-screen p-6 bg-white relative overflow-hidden flex flex-col font-archivo">
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="max-w-md mx-auto w-full relative z-10 flex-1 flex flex-col">
        
        {/* Header - Matches Sketch */}
        <div className="flex flex-col items-center mb-10 mt-6">
          <h1 
            className="text-7xl font-black uppercase tracking-tighter leading-none"
            style={{ 
              color: '#CEF431', 
              WebkitTextStroke: '3px black',
              textShadow: '6px 6px 0px #000'
            }}
          >
            SHOP
          </h1>
          <div className="h-3 w-32 bg-black mt-2"></div>
        </div>

        {/* Step 1: Upload QR */}
        {step === 1 && (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Main Card */}
            <div className="border-4 border-black bg-white p-6 shadow-neo relative mt-4">
              
              {/* Badge Label */}
              <div className="absolute -top-5 left-4 bg-black px-4 py-2 transform -rotate-1 shadow-sm">
                <span className="text-white font-black uppercase tracking-wider text-sm">
                  STEP 1: SCAN QR
                </span>
              </div>

              {/* Dashed Drop Zone */}
              <div className="mt-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="qr-upload"
                />
                
                <label
                    htmlFor="qr-upload"
                    className={`flex flex-col items-center justify-center w-full aspect-square border-4 border-dashed border-black cursor-pointer transition-all relative ${loading ? 'bg-gray-100 opacity-50 cursor-wait' : 'bg-white hover:bg-gray-50'}`}
                >
                    {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                    <div className="flex flex-col items-center text-center p-4">
                        <Camera size={64} className="mb-4 text-black" strokeWidth={2} />
                        <p className="font-black uppercase text-xl text-black">
                        TAKE PHOTO OF QR
                        </p>
                        <p className="text-xs font-bold mt-2 text-black opacity-60 uppercase">
                            Or select from gallery
                        </p>
                    </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                            <Loader2 className="animate-spin mb-4 text-black" size={48} />
                            <p className="font-black uppercase text-sm animate-pulse text-black">
                                AI Extracting Info...
                            </p>
                        </div>
                    )}
                </label>
              </div>
            </div>

            {error && (
                <div className="bg-[#FF3366] text-white font-black uppercase text-sm p-4 border-4 border-black shadow-neo-sm flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <button
              onClick={() => { setStep(2); setError(null); }}
              className="w-full py-5 font-black uppercase text-lg border-4 border-black bg-white shadow-neo hover:shadow-neo-sm hover:translate-x-1 hover:translate-y-1 transition-all active:translate-x-2 active:translate-y-2 text-black"
            >
              Enter Manually Instead
            </button>
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 2 && (
          <div className="flex-1 flex flex-col gap-6">
             {/* Main Card */}
            <div className="border-4 border-black bg-white p-6 shadow-neo relative mt-4">
              
              {/* Badge Label */}
              <div className="absolute -top-5 left-4 bg-black px-4 py-2 transform -rotate-1 shadow-sm">
                <span className="text-white font-black uppercase tracking-wider text-sm">
                  STEP 2: DETAILS
                </span>
              </div>

              <div className="space-y-6 mt-4">
                <div>
                  <label className="block font-black uppercase text-sm mb-2 text-black">
                    UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@upi"
                    className="w-full px-4 py-4 border-4 border-black font-bold text-lg focus:outline-none focus:bg-primary/20 placeholder:text-gray-400 text-black bg-white"
                  />
                </div>

                <div>
                  <label className="block font-black uppercase text-sm mb-2 text-black">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="My Awesome Shop"
                    className="w-full px-4 py-4 border-4 border-black font-bold text-lg focus:outline-none focus:bg-primary/20 placeholder:text-gray-400 text-black bg-white"
                  />
                </div>
                
                 <div>
                  <label className="block font-black uppercase text-sm mb-2 text-black">
                    Category (AI Detected)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-4 border-4 border-black font-bold text-lg focus:outline-none focus:bg-primary/20 text-black bg-white appearance-none"
                  >
                     <option value="tea_shop">Tea Shop</option>
                     <option value="grocery">Grocery / Kirana</option>
                     <option value="restaurant">Restaurant</option>
                     <option value="pharmacy">Pharmacy</option>
                     <option value="other">Other</option>
                  </select>
                  <p className="text-[10px] font-bold mt-1 text-gray-500 uppercase">
                    Used to suggest presets & items
                  </p>
                </div>
              </div>
            </div>

            {error && (
                <div className="bg-[#FF3366] text-white font-black uppercase text-sm p-4 border-4 border-black shadow-neo-sm flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-auto">
                <button
                onClick={() => setStep(1)}
                className="w-full py-5 font-black uppercase text-sm border-4 border-black bg-white shadow-neo hover:shadow-neo-sm transition-all text-black flex items-center justify-center gap-2"
                >
                <ArrowLeft size={20} strokeWidth={3} /> Back
                </button>
                <button
                onClick={handleSubmit}
                disabled={!shopName || !upiId}
                className="w-full py-5 font-black uppercase text-sm border-4 border-black bg-[#03D26F] text-black shadow-neo hover:shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Complete Setup
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupScreen;