import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { AppConfig, CatalogItem } from '../../types';

interface SettingsScreenProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
  onBack: () => void;
  onFactoryReset: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ config, onSave, onBack, onFactoryReset }) => {
  // Local state for editing before saving
  const [shopName, setShopName] = useState(config.shopName);
  const [upiId, setUpiId] = useState(config.upiId);
  const [quickAmounts, setQuickAmounts] = useState<string[]>(
    (config.quickAmounts || [10, 20, 50, 100]).map(String)
  );
  const [catalog, setCatalog] = useState<CatalogItem[]>(config.catalog || []);
  
  // Catalog Item Input State
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleSave = () => {
    const parsedAmounts = quickAmounts.map(a => parseFloat(a) || 0);
    const newConfig: AppConfig = {
      shopName,
      upiId,
      quickAmounts: parsedAmounts,
      catalog
    };
    onSave(newConfig);
  };

  const handleAddCatalogItem = () => {
    if (!newItemName || !newItemPrice) return;
    const item: CatalogItem = {
      id: Date.now().toString(),
      name: newItemName,
      price: parseFloat(newItemPrice)
    };
    setCatalog([...catalog, item]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleDeleteCatalogItem = (id: string) => {
    setCatalog(catalog.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col font-archivo relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}></div>

        <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full pb-24">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-2">
                <button
                    onClick={onBack}
                    className="p-2 border-4 border-black bg-white shadow-neo-sm hover:translate-x-1 hover:translate-y-1 active:shadow-none transition-all text-black"
                >
                    <ArrowLeft size={24} strokeWidth={3} />
                </button>
                <h1 className="text-3xl font-black uppercase text-black">SETTINGS</h1>
            </div>

            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* General Settings */}
                <section>
                    <h2 className="font-black uppercase text-lg mb-4 flex items-center gap-2 text-black">
                        <span className="bg-black text-white px-2 py-1 text-xs">01</span> Shop Details
                    </h2>
                    <div className="space-y-4 border-4 border-black p-4 bg-white shadow-neo-sm">
                        <div>
                            <label className="block font-bold text-xs uppercase mb-1 text-black">Shop Name</label>
                            <input 
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:bg-primary/20 text-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xs uppercase mb-1 text-black">UPI ID</label>
                            <input 
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:bg-primary/20 text-black bg-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Quick Amounts */}
                <section>
                    <h2 className="font-black uppercase text-lg mb-4 flex items-center gap-2 text-black">
                        <span className="bg-black text-white px-2 py-1 text-xs">02</span> Quick Presets (₹)
                    </h2>
                    <div className="grid grid-cols-4 gap-2 border-4 border-black p-4 bg-white shadow-neo-sm">
                        {quickAmounts.map((amount, idx) => (
                            <input
                                key={idx}
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    const newAmounts = [...quickAmounts];
                                    newAmounts[idx] = e.target.value;
                                    setQuickAmounts(newAmounts);
                                }}
                                className="w-full border-2 border-black p-2 text-center font-black text-lg focus:outline-none focus:bg-primary/20 text-black bg-white"
                            />
                        ))}
                    </div>
                    <p className="text-xs font-bold mt-2 text-gray-600">Buttons on POS will use these values.</p>
                </section>

                {/* Product Catalog */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="font-black uppercase text-lg flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-1 text-xs">03</span> Catalog
                        </h2>
                    </div>
                    
                    <div className="border-4 border-black bg-white shadow-neo-sm overflow-hidden">
                        {/* Add New Item */}
                        <div className="p-4 bg-gray-50 border-b-4 border-black grid grid-cols-[1fr_80px_40px] gap-2 items-end">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-black">Item Name</label>
                                <input 
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="e.g. Tea"
                                    className="w-full border-2 border-black p-1 text-sm font-bold focus:outline-none text-black bg-white placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-black">Price</label>
                                <input 
                                    type="number"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    placeholder="0"
                                    className="w-full border-2 border-black p-1 text-sm font-bold focus:outline-none text-black bg-white placeholder:text-gray-400"
                                />
                            </div>
                            <button 
                                onClick={handleAddCatalogItem}
                                disabled={!newItemName || !newItemPrice}
                                className="h-8 bg-black text-white flex items-center justify-center hover:bg-primary hover:text-black transition-colors disabled:opacity-50"
                            >
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto">
                            {catalog.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 font-bold text-sm uppercase">
                                    No items yet
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black text-white text-xs uppercase font-black sticky top-0">
                                        <tr>
                                            <th className="p-2">Item</th>
                                            <th className="p-2 text-right">Price</th>
                                            <th className="p-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {catalog.map((item) => (
                                            <tr key={item.id} className="border-b-2 border-gray-100 hover:bg-yellow-50 font-bold">
                                                <td className="p-2 text-sm truncate max-w-[150px] text-black">{item.name}</td>
                                                <td className="p-2 text-sm text-right text-black">₹{item.price}</td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteCatalogItem(item.id)}
                                                        className="text-error hover:text-black transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </section>

                 {/* Danger Zone */}
                 <section className="mt-8 border-4 border-error p-4 bg-red-50">
                    <h2 className="font-black uppercase text-lg text-error mb-2 flex items-center gap-2">
                         <AlertTriangle size={20} /> Danger Zone
                    </h2>
                    <p className="text-xs font-bold mb-4 text-black">
                        This will delete all transactions and reset configuration.
                    </p>
                    <button
                        onClick={onFactoryReset}
                        className="w-full py-3 bg-error text-white font-black uppercase text-sm border-4 border-black shadow-neo-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        Factory Reset
                    </button>
                </section>
            </div>

            {/* Save Button Fixed Bottom */}
            <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none">
                <button
                    onClick={handleSave}
                    className="pointer-events-auto w-full py-4 bg-success border-4 border-black shadow-neo font-black uppercase text-xl flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-neo-lg transition-all active:translate-y-1 active:shadow-neo-sm text-black"
                >
                    <Save size={24} strokeWidth={3} />
                    Save Changes
                </button>
            </div>

        </div>
    </div>
  );
};

export default SettingsScreen;