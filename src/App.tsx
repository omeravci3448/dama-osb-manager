import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Factory, Zap, Receipt, Settings, Search, Bell, Users, LogOut, ShieldCheck, History, AlertTriangle, Loader2 } from 'lucide-react';
import Dashboard from './components/dashboard/Dashboard';
import FactoryList from './components/factories/FactoryList';
import FinanceModule from './components/finance/FinanceModule';
import MeterReading from './components/meters/MeterReading';
import UserManagement from './components/users/UserManagement';
import SystemLogs from './components/system-logs/SystemLogs';
import Login from './components/auth/Login';
import { Fabrika, SayacOkuma, Fatura, Kullanici, LogKaydi, Bildirim, Ayarlar } from './types';
import SystemSettings from './components/settings/SystemSettings';
import { apiService } from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState<Kullanici | null>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [factories, setFactories] = useState<Fabrika[]>([]);
  const [readings, setReadings] = useState<SayacOkuma[]>([]);
  const [invoices, setInvoices] = useState<Fatura[]>([]);
  const [users, setUsers] = useState<Kullanici[]>([]);
  const [logs, setLogs] = useState<LogKaydi[]>([]);
  const [notifications, setNotifications] = useState<Bildirim[]>([]);
  const [settings, setSettings] = useState<Ayarlar | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Initial Data Fetch
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Login ekranı için gerekli olanlar
        const [uData, sData] = await Promise.all([
          apiService.getUsers(),
          apiService.getSettings()
        ]);
        setUsers(uData);
        setSettings(sData);

        // Eğer kullanıcı varsa geri kalanını yükle
        if (currentUser) {
          const [fData, rData, iData, lData, nData] = await Promise.all([
            apiService.getFactories(),
            apiService.getReadings(),
            apiService.getInvoices(),
            apiService.getLogs(),
            apiService.getNotifications()
          ]);
          setFactories(fData);
          setReadings(rData);
          setInvoices(iData);
          setLogs(lData);
          setNotifications(nData);
        }
      } catch (error) {
        console.error('Data load error:', error);
        showNotification('error', 'Veriler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]);


  // Auth Persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('osb_v2_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('osb_v2_current_user');
    }
  }, [currentUser]);

  const addLog = async (islem: string, detay: string, userOverride?: Kullanici) => {
    const user = userOverride || currentUser;
    if (!user) return;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('tr-TR')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      const newLog = await apiService.createLog({
        kullaniciId: user.id,
        kullaniciAdSoyad: user.adSoyad,
        islem,
        detay,
        tarih: dateStr
      });
      setLogs(prev => [newLog, ...prev]);
    } catch (error) {
      console.error('Log error:', error);
    }
  };

  const handleLogin = (user: Kullanici) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    addLog('Sisteme Giriş', `${user.adSoyad} sisteme giriş yaptı.`, user);
  };

  const handleLogout = () => {
    if (currentUser) addLog('Sistemden Çıkış', `${currentUser.adSoyad} sistemden güvenli çıkış yaptı.`);
    setCurrentUser(null);
  };

  const handleBatchInvoice = async (selectedIds?: string[]) => {
    if (!settings) return;

    const pendingReadings = readings.filter(r => {
      const isPending = r.faturaDurumu === 'BEKLIYOR' || r.faturaDurumu === 'TAHAKKUK_EDILDI';
      if (!isPending) return false;
      if (selectedIds && selectedIds.length > 0) {
        return selectedIds.includes(r.id);
      }
      return true;
    });

    if (pendingReadings.length === 0) return;

    try {
      for (const r of pendingReadings) {
        const tutar = r.hesaplananTutar || (r.tuketim * (settings.suBirimFiyat + settings.atikSuBirimFiyat));
        const kdv = tutar * 0.20;
        const toplamTutar = tutar + kdv;
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + settings.odemeVadesi);
        const formattedDueDate = dueDate.toLocaleDateString('tr-TR');
        
        const newInvoice = await apiService.createInvoice({
          fabrikaId: r.fabrikaId,
          donem: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
          tutar,
          kdv,
          toplamTutar,
          sonOdemeTarihi: formattedDueDate,
          durum: 'BEKLIYOR',
          tip: 'SU'
        });

        // Update reading status
        const updatedReading = await apiService.updateReading(r.id, { ...r, faturaDurumu: 'FATURALANDI' });
        
        // Update factory debt if needed
        if (r.faturaDurumu === 'BEKLIYOR') {
          const factory = factories.find(f => f.id === r.fabrikaId);
          if (factory) {
            await apiService.updateFactory(factory.id, { ...factory, borc: factory.borc + toplamTutar });
          }
        }

        setInvoices(prev => [newInvoice, ...prev]);
        setReadings(prev => prev.map(item => item.id === r.id ? updatedReading : item));
      }
      
      // Refresh factories to get updated debts
      const updatedFactories = await apiService.getFactories();
      setFactories(updatedFactories);
      
      addLog('Toplu Fatura', `${pendingReadings.length} adet yeni fatura oluşturuldu ve carilere yansıtıldı.`);
      showNotification('success', 'Toplu faturalandırma işlemi tamamlandı.');
    } catch (error) {
      showNotification('error', 'Faturalandırma sırasında bir hata oluştu.');
    }
  };

  const handleGenerateAidat = async () => {
    if (!settings) return;
    const activeFactories = factories.filter(f => f.aktif);
    const donem = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formattedDueDate = lastDayOfMonth.toLocaleDateString('tr-TR');

    let count = 0;
    try {
      for (const fab of activeFactories) {
        const exists = invoices.some(inv => inv.fabrikaId === fab.id && inv.donem === donem && inv.tip === 'AIDAT');
        
        if (!exists) {
          const tutar = settings.aidatBirimFiyat;
          const kdv = tutar * 0.20;
          const toplamTutar = tutar + kdv;

          const newInvoice = await apiService.createInvoice({
            fabrikaId: fab.id,
            donem,
            tutar,
            kdv,
            toplamTutar,
            sonOdemeTarihi: formattedDueDate,
            durum: 'BEKLIYOR',
            tip: 'AIDAT'
          });

          await apiService.updateFactory(fab.id, { ...fab, borc: fab.borc + toplamTutar });
          setInvoices(prev => [newInvoice, ...prev]);
          count++;
        }
      }

      if (count > 0) {
        const updatedFactories = await apiService.getFactories();
        setFactories(updatedFactories);
        addLog('Aidat Tahakkuku', `${count} adet yeni aidat kaydı oluşturuldu.`);
        showNotification('success', `${count} adet yeni aidat kaydı başarıyla oluşturuldu.`);
      } else {
        showNotification('error', 'Bu dönemin aidatları zaten tüm işletmeler için oluşturulmuş.');
      }
    } catch (error) {
      showNotification('error', 'Aidat tahakkuku sırasında bir hata oluştu.');
    }
  };

  const renderContent = () => {
    if (!currentUser || !settings) return null;
    
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
          factories={factories} 
          readings={readings} 
          invoices={invoices} 
          user={currentUser} 
          notifications={notifications} 
          onCloseNotification={async id => {
            await apiService.deleteNotification(id);
            setNotifications(prev => prev.filter(x => x.id !== id));
          }} 
        />;
      
      case 'fabrikalar': 
        return <FactoryList 
          factories={factories} 
          readings={readings} 
          onAdd={async f => { 
            const newFab = await apiService.createFactory(f);
            setFactories(prev => [newFab, ...prev]); 
            addLog('Fabrika Ekleme', `${f.ad} eklendi.`); 
            showNotification('success', 'İşletme başarıyla kaydedildi.'); 
          }} 
          onUpdate={async f => { 
            const updatedFab = await apiService.updateFactory(f.id, f);
            setFactories(prev => prev.map(i => i.id === f.id ? updatedFab : i)); 
            addLog('Fabrika Güncelleme', `${f.ad} güncellendi.`); 
            showNotification('success', 'İşletme bilgileri güncellendi.'); 
          }} 
          onDelete={async id => { 
            const isRoot = currentUser.id === 'root' || currentUser.rol === 'ROOT';
            if (window.confirm('İşletmeyi silmek istediğinize emin misiniz?')) {
              await apiService.deleteFactory(id);
              setFactories(prev => prev.filter(i => i.id !== id));
              setReadings(prev => prev.filter(r => r.fabrikaId !== id));
              setInvoices(prev => prev.filter(i => i.fabrikaId !== id));
              addLog('Fabrika Silme', `ID: ${id} silindi.`); 
              showNotification('success', 'İşletme sistemden silindi.'); 
            }
          }} 
          onAddReading={async r => {
            const newReading = await apiService.createReading(r);
            setReadings(prev => [newReading, ...prev]);
          }} 
          currentUser={currentUser} 
        />;
      
      case 'sayac': 
        return <MeterReading 
          factories={factories} 
          readings={readings} 
          settings={settings} 
          currentUser={currentUser}
          onAddReading={async r => { 
            const newReading = await apiService.createReading(r);
            setReadings(prev => [newReading, ...prev]); 
            addLog('Sayaç Okuma', 'Yeni kayıt girildi.'); 
            showNotification('success', 'Sayaç okuma kaydı başarıyla eklendi.'); 
          }} 
          onUpdateReading={async r => { 
            const updatedReading = await apiService.updateReading(r.id, r);
            setReadings(prev => prev.map(i => i.id === r.id ? updatedReading : i)); 
            addLog('Sayaç Güncelleme', 'Kayıt düzeltildi.'); 
            showNotification('success', 'Sayaç okuma kaydı güncellendi.'); 
          }} 
          onDeleteReading={async id => { 
            if(window.confirm('Kayıt silinsin mi?')) { 
              await apiService.deleteReading(id);
              setReadings(prev => prev.filter(i => i.id !== id)); 
              addLog('Sayaç Silme', `ID: ${id} silindi.`); 
              showNotification('success', 'Kayıt silindi.'); 
            } 
          }} 
          onAddNotification={async n => {
            const newNotification = await apiService.createNotification(n);
            setNotifications(prev => [newNotification, ...prev]);
          }} 
          onUpdateFactoryDebt={async (id, tutar) => {
            const factory = factories.find(f => f.id === id);
            if (factory) {
              const updatedFab = await apiService.updateFactory(id, { ...factory, borc: factory.borc + tutar });
              setFactories(prev => prev.map(f => f.id === id ? updatedFab : f));
            }
          }} 
        />;
      
      case 'finans': 
        return <FinanceModule 
          invoices={invoices} 
          readings={readings} 
          factories={factories} 
          settings={settings} 
          onBatchInvoice={handleBatchInvoice} 
          onUpdateInvoice={async inv => { 
            const updatedInv = await apiService.updateInvoice(inv.id, inv);
            setInvoices(prev => prev.map(i => i.id === inv.id ? updatedInv : i)); 
            showNotification('success', 'Fatura güncellendi.'); 
          }} 
          onBatchUpdateInvoices={async (updatedInvoices) => {
            for (const inv of updatedInvoices) {
              await apiService.updateInvoice(inv.id, inv);
            }
            const freshInvoices = await apiService.getInvoices();
            setInvoices(freshInvoices);
            addLog('Toplu Muhasebe', `${updatedInvoices.length} adet fatura muhasebeye aktarıldı.`);
          }} 
          onBatchUpdateReadings={async (updatedReadings) => {
            for (const r of updatedReadings) {
              await apiService.updateReading(r.id, r);
            }
            const freshReadings = await apiService.getReadings();
            setReadings(freshReadings);
            addLog('Toplu Muhasebe (Okuma)', `${updatedReadings.length} adet okuma raporu muhasebeye aktarıldı.`);
          }} 
          onGenerateAidat={handleGenerateAidat} 
        />;
      
      case 'logs': 
        return <SystemLogs 
          logs={logs} 
          onClearLogs={async () => { 
            await apiService.clearLogs();
            setLogs([]); 
            addLog('Logları Temizleme', 'Tüm sistem logları root tarafından temizlendi.'); 
          }} 
          onDeleteLog={async (id: string) => {
            // No specific delete log in API yet, just refresh
            setLogs(logs.filter(l => l.id !== id));
          }} 
          currentUser={currentUser} 
        />;
      
      case 'users': 
        return (currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') ? <UserManagement 
          users={users} 
          onAdd={async u => { 
            const newUser = await apiService.createUser(u);
            setUsers([newUser, ...users]); 
            addLog('Kullanıcı Ekleme', `${u.adSoyad} oluşturuldu.`); 
          }} 
          onDelete={async (id: string) => { 
            await apiService.deleteUser(id);
            setUsers(users.filter(i => i.id !== id)); 
            addLog('Kullanıcı Silme', `ID: ${id} silindi.`); 
          }} 
          onUpdate={async u => { 
            const updatedUser = await apiService.updateUser(u.id, u);
            setUsers(users.map(i => i.id === u.id ? updatedUser : i)); 
            addLog('Kullanıcı Güncelleme', `${u.adSoyad} güncellendi.`); 
          }} 
          currentUser={currentUser} 
        /> : null;
      
      case 'settings': 
        return (currentUser.rol === 'ROOT' || currentUser.rol === 'OSB_MUDURU') ? <SystemSettings 
          settings={settings} 
          onUpdateSettings={async s => { 
            const updatedSettings = await apiService.updateSettings(settings.id, s);
            setSettings(updatedSettings); 
            addLog('Sistem Ayarları', 'Ayarlar güncellendi.'); 
            showNotification('success', 'Ayarlar güncellendi.');
          }} 
        /> : null;
      
      default: return null;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} onUpdateUser={async u => {
      const updatedUser = await apiService.updateUser(u.id, u);
      setUsers(users.map(i => i.id === u.id ? updatedUser : i));
    }} />;
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <Loader2 className="animate-spin" size={48} color="#c28247" />
        <p style={{ marginTop: '16px', fontSize: '1.1rem', color: '#94a3b8' }}>Veriler Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '200px', height: '200px', margin: '0 auto', overflow: 'hidden' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>ŞUHUT OSB</h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', margin: 0 }}>Yönetim Platformu</p>
          </div>
        </div>
        <nav style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Ana Sayfa" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<Factory size={20} />} label="Fabrika Yönetimi" active={activeTab === 'fabrikalar'} onClick={() => setActiveTab('fabrikalar')} />
          <SidebarItem icon={<Zap size={20} />} label="Sayaç Okuma" active={activeTab === 'sayac'} onClick={() => setActiveTab('sayac')} />
          <SidebarItem icon={<Receipt size={20} />} label="Finans & Aidat" active={activeTab === 'finans'} onClick={() => setActiveTab('finans')} />
          <SidebarItem icon={<History size={20} />} label="Sistem Logları" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          {(currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') && (
            <>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }}></div>
              <SidebarItem icon={<ShieldCheck size={20} />} label="Kullanıcı Yönetimi" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            </>
          )}
          {(currentUser.rol === 'ROOT' || currentUser.rol === 'OSB_MUDURU') && (
            <SidebarItem icon={<Settings size={20} />} label="Sistem Ayarları" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          )}
        </nav>
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={handleLogout} className="glass-card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--secondary)', border: 'none' }}>
            <LogOut size={20} /> Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="main-content">
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
            animation: 'slideDown 0.3s ease-out'
          }}>
            {notification.type === 'success' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            {notification.message}
          </div>
        )}
        <header className="header" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentUser.adSoyad}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') ? 'System Manager' : currentUser.unvan}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {currentUser.adSoyad?.[0] || '?'}
            </div>
          </div>
        </header>
        <div style={{ marginTop: '20px' }}>{renderContent()}</div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', background: active ? 'rgba(194, 130, 71, 0.15)' : 'transparent', color: active ? 'white' : 'var(--text-muted)' }}>
      {icon}
      <span style={{ fontSize: '0.95rem' }}>{label}</span>
    </div>
  );
}

export default App;

