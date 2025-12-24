import React, { useState, useRef } from 'react';
import { Transaction } from '../../types';
import { ArrowLeft, Trash2, Download, Upload, FileDown, FileUp } from 'lucide-react';

interface LedgerScreenProps {
  transactions: Transaction[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onImport: (data: Transaction[]) => void;
}

const LedgerScreen: React.FC<LedgerScreenProps> = ({ transactions, onBack, onDelete, onImport }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getFilteredTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      if (filter === 'today') return tDate >= today;
      if (filter === 'week') return tDate >= weekAgo;
      if (filter === 'month') return tDate >= monthAgo;
      return true;
    });
  };

  const filtered = getFilteredTransactions();
  const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date().toDateString();
    if (date.toDateString() === today) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // --- Export Logic ---
  const handleExport = () => {
    if (transactions.length === 0) return;
    
    // CSV Header
    const headers = ["Transaction ID", "Date", "Shop Name", "Amount (INR)", "UPI ID", "Description"];
    const rows = transactions.map(t => [
      t.id,
      t.timestamp,
      t.shopName,
      t.amount,
      t.upiId,
      t.items || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fixpay_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        // Simple CSV parser for demonstration. In production, use a library.
        // Assuming CSV format: id, timestamp, shopName, amount, upiId, items
        const lines = text.split('\n');
        const newTransactions: Transaction[] = [];
        
        // Skip header if present (check if first line has "Transaction ID")
        const startIndex = lines[0].includes("Transaction ID") ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(',');
          if (cols.length >= 4) {
             newTransactions.push({
               id: cols[0] || Date.now().toString(),
               timestamp: cols[1] || new Date().toISOString(),
               shopName: cols[2] || "Imported",
               amount: cols[3],
               upiId: cols[4] || "",
               items: cols[5] || ""
             });
          }
        }
        
        if (newTransactions.length > 0) {
           onImport(newTransactions);
           alert(`Successfully imported ${newTransactions.length} transactions.`);
        } else {
            alert("No valid transactions found in file.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="min-h-screen p-6 bg-white relative overflow-hidden flex flex-col">
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="max-w-md mx-auto w-full relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 mt-2">
          <div className="flex items-center gap-4">
            <button
                onClick={onBack}
                className="p-2 border-4 border-black bg-white shadow-neo-sm hover:translate-x-1 hover:translate-y-1 active:shadow-none transition-all text-black"
            >
                <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <h1 className="text-3xl font-black uppercase text-black">
              Ledger
            </h1>
          </div>
          <div className="flex gap-2">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
             <button onClick={handleImportClick} className="p-2 border-4 border-black bg-white hover:bg-gray-100 transition-all text-black" title="Import CSV">
                <FileUp size={20} strokeWidth={2.5}/>
             </button>
             <button onClick={handleExport} className="p-2 border-4 border-black bg-white hover:bg-gray-100 transition-all text-black" title="Export CSV">
                <FileDown size={20} strokeWidth={2.5}/>
             </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(['all', 'today', 'week', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-1 py-2 font-black uppercase text-[10px] sm:text-xs border-4 border-black transition-all text-black ${filter === f ? 'bg-primary shadow-neo-sm translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mb-6 border-4 border-black p-6 bg-white shadow-neo">
          <p className="text-sm font-black uppercase opacity-50 mb-2 text-black">
            {filter === 'all' ? 'Lifetime Total' : `${filter} Total`}
          </p>
          <p className="text-5xl font-black text-black">
            ₹{total.toFixed(2)}
          </p>
          <div className="h-1 w-full bg-gray-100 my-4">
            <div className="h-full bg-black" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm font-bold opacity-70 uppercase text-black">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Transactions List */}
        <div className="space-y-3 flex-1 overflow-auto pb-4 pr-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="border-4 border-dashed border-black p-12 text-center h-full flex flex-col items-center justify-center opacity-50">
              <p className="font-black uppercase text-lg text-black">
                No Data
              </p>
              <p className="text-sm text-black">Start selling to see history</p>
            </div>
          ) : (
            filtered.map((transaction, index) => (
              <div
                key={transaction.id}
                className="border-4 border-black p-4 bg-white shadow-neo-sm group"
                style={{ 
                  animation: `slideIn 0.3s ease-out ${Math.min(index * 0.05, 0.5)}s backwards`
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-black text-black">
                      ₹{parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                      {formatDate(transaction.timestamp)}
                    </p>
                    {transaction.items && (
                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase truncate max-w-[150px]">
                            Includes: {transaction.items}
                        </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-none bg-success border-2 border-black"></div>
                      <button 
                        onClick={() => onDelete(transaction.id)}
                        className="p-2 text-gray-300 hover:text-error transition-colors"
                      >
                          <Trash2 size={20} />
                      </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
       <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LedgerScreen;