import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/screens/WelcomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import POSScreen from './components/screens/POSScreen';
import LedgerScreen from './components/screens/LedgerScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import { AppConfig, Screen, Transaction, User } from './types';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.WELCOME);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Initialize State from LocalStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('fixpay_auth');
    const savedConfig = localStorage.getItem('fixpay_config');
    const savedTransactions = localStorage.getItem('fixpay_transactions');

    if (savedAuth) {
      setUser(JSON.parse(savedAuth));
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Ensure defaults for new fields
        if (!parsedConfig.quickAmounts) parsedConfig.quickAmounts = [10, 20, 50, 100];
        if (!parsedConfig.catalog) parsedConfig.catalog = [];
        setConfig(parsedConfig);
        setCurrentScreen(Screen.POS);
      } else {
        setCurrentScreen(Screen.SETUP);
      }
    } else {
        setCurrentScreen(Screen.WELCOME);
    }

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Auth Handlers
  const handleLogin = () => {
    const mockUser = { id: '1', email: 'merchant@fixpay.com' };
    localStorage.setItem('fixpay_auth', JSON.stringify(mockUser));
    setUser(mockUser);
    
    // Check if config exists to determine next screen
    const savedConfig = localStorage.getItem('fixpay_config');
    if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (!parsedConfig.quickAmounts) parsedConfig.quickAmounts = [10, 20, 50, 100];
        if (!parsedConfig.catalog) parsedConfig.catalog = [];
        setConfig(parsedConfig);
        setCurrentScreen(Screen.POS);
    } else {
        setCurrentScreen(Screen.SETUP);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fixpay_auth');
    setUser(null);
    setCurrentScreen(Screen.WELCOME);
  };

  // Setup/Settings Handlers
  const handleConfigUpdate = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('fixpay_config', JSON.stringify(newConfig));
    setCurrentScreen(Screen.POS);
  };
  
  const handleFactoryReset = () => {
      if (window.confirm("ARE you sure? This will delete EVERYTHING.")) {
          localStorage.clear();
          setUser(null);
          setConfig(null);
          setTransactions([]);
          setCurrentScreen(Screen.WELCOME);
      }
  };

  // Transaction Handlers
  const handleSaveTransaction = (transaction: Transaction) => {
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('fixpay_transactions', JSON.stringify(updatedTransactions));
  };
  
  const handleDeleteTransaction = (id: string) => {
      if(window.confirm("Are you sure you want to delete this transaction?")) {
        const updated = transactions.filter(t => t.id !== id);
        setTransactions(updated);
        localStorage.setItem('fixpay_transactions', JSON.stringify(updated));
      }
  };

  const handleImportTransactions = (imported: Transaction[]) => {
      // Merge: Avoid duplicates by ID
      const existingIds = new Set(transactions.map(t => t.id));
      const newUnique = imported.filter(t => !existingIds.has(t.id));
      const merged = [...newUnique, ...transactions].sort((a,b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setTransactions(merged);
      localStorage.setItem('fixpay_transactions', JSON.stringify(merged));
  };

  const getTodayTotal = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => new Date(t.timestamp).toDateString() === today)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  // Render Logic
  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.WELCOME:
        return <WelcomeScreen onLogin={handleLogin} />;
      
      case Screen.SETUP:
        return <SetupScreen onComplete={handleConfigUpdate} />;
      
      case Screen.POS:
        return config ? (
          <POSScreen 
            config={config} 
            onLogout={handleLogout}
            onShowLedger={() => setCurrentScreen(Screen.LEDGER)}
            onShowSettings={() => setCurrentScreen(Screen.SETTINGS)}
            onSaveTransaction={handleSaveTransaction}
            todayTotal={getTodayTotal()}
          />
        ) : (
            <SetupScreen onComplete={handleConfigUpdate} />
        );
      
      case Screen.LEDGER:
        return (
          <LedgerScreen 
            transactions={transactions} 
            onBack={() => setCurrentScreen(Screen.POS)}
            onDelete={handleDeleteTransaction}
            onImport={handleImportTransactions}
          />
        );

      case Screen.SETTINGS:
          return config ? (
              <SettingsScreen 
                config={config}
                onSave={handleConfigUpdate}
                onBack={() => setCurrentScreen(Screen.POS)}
                onFactoryReset={handleFactoryReset}
              />
          ) : null;
      
      default:
        return <WelcomeScreen onLogin={handleLogin} />;
    }
  };

  return (
    <>
        {renderScreen()}
    </>
  );
};

export default App;