import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Factory, Zap, Receipt, Settings, Search, Bell, Users, LogOut, ShieldCheck, History, AlertTriangle } from 'lucide-react';
import Dashboard from './components/dashboard/Dashboard';
import FactoryList from './components/factories/FactoryList';
import FinanceModule from './components/finance/FinanceModule';
import MeterReading from './components/meters/MeterReading';
import UserManagement from './components/users/UserManagement';
import SystemLogs from './components/logs';
import Login from './components/auth/Login';
import { MOCK_FABRIKALAR, MOCK_OKUMALAR, MOCK_FATURALAR } from './data/mockData';
import { Fabrika, SayacOkuma, Fatura, Kullanici, LogKaydi, Bildirim, Ayarlar } from './types';
import SystemSettings from './components/settings/SystemSettings';
import { generateTahakkukRaporu } from './utils/helpers';

function App() {
  const [currentUser, setCurrentUser] = useState<Kullanici | null>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Güvenli State Başlatma
  const [factories, setFactories] = useState<Fabrika[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_factories');
      return saved ? JSON.parse(saved) : MOCK_FABRIKALAR;
    } catch { return MOCK_FABRIKALAR; }
  });

  const [readings, setReadings] = useState<SayacOkuma[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_readings');
      return saved ? JSON.parse(saved) : MOCK_OKUMALAR;
    } catch { return MOCK_OKUMALAR; }
  });

  const [invoices, setInvoices] = useState<Fatura[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_invoices');
      return saved ? JSON.parse(saved) : MOCK_FATURALAR;
    } catch { return MOCK_FATURALAR; }
  });

  const [users, setUsers] = useState<Kullanici[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_users');
      const initialUsers: Kullanici[] = [
        { id: 'root', kullaniciAdi: 'root', sifre: '11223344.', adSoyad: 'Ömer AVCI', unvan: 'System Manager', rol: 'ROOT', sifreDegistirilmeli: false }
      ];
      return saved ? JSON.parse(saved) : initialUsers;
    } catch { return []; }
  });

  const [logs, setLogs] = useState<LogKaydi[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_logs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [notifications, setNotifications] = useState<Bildirim[]>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [settings, setSettings] = useState<Ayarlar>(() => {
    try {
      const saved = localStorage.getItem('osb_v2_settings');
      return saved ? JSON.parse(saved) : { otomatikTahakkuk: false, elektrikBirimFiyat: 2.45, aidatBirimFiyat: 1000, odemeVadesi: 10 };
    } catch { return { otomatikTahakkuk: false, elektrikBirimFiyat: 2.45, aidatBirimFiyat: 1000, odemeVadesi: 10 }; }
  });

  useEffect(() => {
    // Bir kerelik temizlik işlemi (Deneme verilerini siler)
    const isCleaned = localStorage.getItem('osb_v2_presentation_ready');
    if (!isCleaned) {
      setFactories([]);
      setReadings([]);
      setInvoices([]);
      setLogs([]);
      setNotifications([]);
      localStorage.setItem('osb_v2_presentation_ready', 'true');
      localStorage.removeItem('osb_v2_factories');
      localStorage.removeItem('osb_v2_readings');
      localStorage.removeItem('osb_v2_invoices');
      localStorage.removeItem('osb_v2_logs');
      localStorage.removeItem('osb_v2_notifications');
    }
  }, []);

  // Root kullanıcı unvanını güncelle (Eski veri kalmışsa)
  useEffect(() => {
    if (currentUser?.id === 'root' && currentUser.unvan !== 'System Manager') {
      const updatedRoot = { ...currentUser, unvan: 'System Manager' };
      setCurrentUser(updatedRoot);
      setUsers(prev => prev.map(u => u.id === 'root' ? updatedRoot : u));
    }
  }, [currentUser]);

  // Kalıcılık
  useEffect(() => {
    localStorage.setItem('osb_v2_factories', JSON.stringify(factories));
    localStorage.setItem('osb_v2_readings', JSON.stringify(readings));
    localStorage.setItem('osb_v2_invoices', JSON.stringify(invoices));
    localStorage.setItem('osb_v2_users', JSON.stringify(users));
    localStorage.setItem('osb_v2_logs', JSON.stringify(logs));
    localStorage.setItem('osb_v2_notifications', JSON.stringify(notifications));
    localStorage.setItem('osb_v2_settings', JSON.stringify(settings));
    if (currentUser) {
      localStorage.setItem('osb_v2_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('osb_v2_current_user');
    }
  }, [factories, readings, invoices, users, logs, notifications, currentUser]);

  const addLog = (islem: string, detay: string, userOverride?: Kullanici) => {
    const user = userOverride || currentUser;
    if (!user || user.id === 'root') return;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('tr-TR')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newLog: LogKaydi = { id: Math.random().toString(36).substr(2, 9), kullaniciId: user.id, kullaniciAdSoyad: user.adSoyad, islem, detay, tarih: dateStr };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (user: Kullanici) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    addLog('Sisteme Giriş', `${user.adSoyad} sisteme giriş yaptı.`, user);
  };

  const handleLogout = () => {
    if (currentUser) addLog('Sistemden Çıkış', `${currentUser.adSoyad} sistemden güvenli çıkış yaptı.`);
    setCurrentUser(null);
    localStorage.removeItem('osb_current_user');
  };

  const handleBatchInvoice = (selectedIds?: string[]) => {
    const pendingReadings = readings.filter(r => {
      const isPending = r.faturaDurumu === 'BEKLIYOR' || r.faturaDurumu === 'TAHAKKUK_EDILDI';
      if (!isPending) return false;
      if (selectedIds && selectedIds.length > 0) {
        return selectedIds.includes(r.id);
      }
      return true;
    });

    if (pendingReadings.length === 0) return;

    const newInvoices: Fatura[] = [];
    let updatedFactories = [...factories];

    const updatedReadings: SayacOkuma[] = readings.map(r => {
      // Sadece seçili olanları işle
      const isSelected = pendingReadings.some(pr => pr.id === r.id);
      
      if (isSelected) {
        const tutar = r.hesaplananTutar || (r.tuketim * settings.elektrikBirimFiyat);
        const kdv = tutar * 0.20;
        const toplamTutar = tutar + kdv;
        
        // Ödeme vadesini ayarlara göre hesapla
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + settings.odemeVadesi);
        const formattedDueDate = dueDate.toLocaleDateString('tr-TR');
        
        const newInvoice: Fatura = {
          id: Math.random().toString(36).substr(2, 9),
          fabrikaId: r.fabrikaId,
          donem: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
          tutar: tutar,
          kdv: kdv,
          toplamTutar: toplamTutar,
          sonOdemeTarihi: formattedDueDate,
          durum: 'BEKLIYOR',
          tip: 'ELEKTRIK'
        };
        newInvoices.push(newInvoice);

        if (r.faturaDurumu === 'BEKLIYOR') {
          // Hiç tahakkuk etmemişse (otomatik kapalıysa), KDV dahil tam tutarı carisine ekle
          updatedFactories = updatedFactories.map(f => f.id === r.fabrikaId ? { ...f, borc: f.borc + toplamTutar } : f);
        } else if (r.faturaDurumu === 'TAHAKKUK_EDILDI') {
          // Zaten otomatik tahakkuk ile KDV dahil tutar carisine eklenmişti. 
          // Sadece faturayı oluşturuyoruz, caride ek işlem yapmıyoruz.
        }

        return { ...r, faturaDurumu: 'FATURALANDI' };
      }
      return r;
    });

    setReadings(updatedReadings);
    setInvoices([...newInvoices, ...invoices]);
    setFactories(updatedFactories);
    addLog('Toplu Fatura', `${newInvoices.length} adet yeni fatura oluşturuldu ve carilere yansıtıldı.`);
  };

  const handleBatchUpdateInvoices = (updatedInvoices: Fatura[]) => {
    setInvoices(prev => prev.map(inv => {
      const updated = updatedInvoices.find(u => u.id === inv.id);
      return updated ? updated : inv;
    }));
    addLog('Toplu Muhasebe', `${updatedInvoices.length} adet fatura muhasebeye aktarıldı.`);
  };

  const handleBatchUpdateReadings = (updatedReadings: SayacOkuma[]) => {
    setReadings(prev => prev.map(r => {
      const updated = updatedReadings.find(u => u.id === r.id);
      return updated ? updated : r;
    }));
    addLog('Toplu Muhasebe (Okuma)', `${updatedReadings.length} adet okuma raporu muhasebeye aktarıldı.`);
  };

  const handleGenerateAidat = () => {
    const activeFactories = factories.filter(f => f.aktif);
    const donem = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    
    // Son ödeme tarihini ilgili ayın son günü yapalım
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formattedDueDate = lastDayOfMonth.toLocaleDateString('tr-TR');

    const newAidatInvoices: Fatura[] = [];
    let updatedFactories = [...factories];

    activeFactories.forEach(fab => {
      const exists = invoices.some(inv => inv.fabrikaId === fab.id && inv.donem === donem && inv.tip === 'AIDAT');
      
      if (!exists) {
        const tutar = settings.aidatBirimFiyat;
        const kdv = tutar * 0.20;
        const toplamTutar = tutar + kdv;

        newAidatInvoices.push({
          id: Math.random().toString(36).substr(2, 9),
          fabrikaId: fab.id,
          donem: donem,
          tutar: tutar,
          kdv: kdv,
          toplamTutar: toplamTutar,
          sonOdemeTarihi: formattedDueDate,
          durum: 'BEKLIYOR',
          tip: 'AIDAT'
        });

        updatedFactories = updatedFactories.map(f => f.id === fab.id ? { ...f, borc: f.borc + toplamTutar } : f);
      }
    });

    if (newAidatInvoices.length > 0) {
      setInvoices(prev => [...newAidatInvoices, ...prev]);
      setFactories(updatedFactories);
      addLog('Aidat Tahakkuku', `${newAidatInvoices.length} adet yeni aidat kaydı oluşturuldu.`);
      alert(`${newAidatInvoices.length} adet yeni aidat kaydı başarıyla oluşturuldu.`);
    } else {
      alert('Bu dönemin aidatları zaten tüm işletmeler için oluşturulmuş.');
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    try {
      switch (activeTab) {
        case 'dashboard': return <Dashboard factories={factories} readings={readings} invoices={invoices} user={currentUser} notifications={notifications} onCloseNotification={id => setNotifications(n => n.filter(x => x.id !== id))} />;
        case 'fabrikalar': return <FactoryList 
          factories={factories} 
          readings={readings} 
          onAdd={f => { try { setFactories(prev => [f, ...prev]); addLog('Fabrika Ekleme', `${f.ad} eklendi.`); showNotification('success', 'İşletme başarıyla kaydedildi.'); } catch (e) { showNotification('error', 'Kayıt sırasında bir hata oluştu.'); } }} 
          onUpdate={f => { try { setFactories(prev => prev.map(i => i.id === f.id ? f : i)); addLog('Fabrika Güncelleme', `${f.ad} güncellendi.`); showNotification('success', 'İşletme bilgileri güncellendi.'); } catch (e) { showNotification('error', 'Güncelleme sırasında bir hata oluştu.'); } }} 
          onDelete={id => { 
            const isRoot = currentUser.id === 'root' || currentUser.rol === 'ROOT';
            const hasReadings = readings.some(r => r.fabrikaId === id);
            const hasInvoices = invoices.some(i => i.fabrikaId === id);

            if (!isRoot && (hasReadings || hasInvoices)) {
              showNotification('error', 'Bu işletmeye ait sayaç okuma veya fatura kaydı bulunduğu için silemezsiniz. Lütfen Root yöneticisine başvurun.');
              return;
            }

            if (window.confirm(isRoot ? 'Bu işletmeyi ve tüm ilişkili verilerini (sayaç okumaları, faturalar) silmek istediğinize emin misiniz? BU İŞLEM GERİ ALINAMAZ!' : 'İşletmeyi silmek istediğinize emin misiniz?')) {
              try {
                // Eğer root siliyorsa ilişkili her şeyi sil
                if (isRoot) {
                  setReadings(prev => prev.filter(r => r.fabrikaId !== id));
                  setInvoices(prev => prev.filter(i => i.fabrikaId !== id));
                }
                setFactories(prev => prev.filter(i => i.id !== id));
                addLog('Fabrika Silme', `ID: ${id} silindi.`); 
                showNotification('success', 'İşletme ' + (isRoot ? 've tüm ilişkili verileri ' : '') + 'sistemden silindi.'); 
              } catch (err) {
                console.error('Silme hatası:', err);
                showNotification('error', 'Silme işlemi başarısız oldu.');
              }
            }
        }} onAddReading={r => setReadings(prev => [r, ...prev])} currentUser={currentUser} />;
        case 'sayac': return <MeterReading 
          factories={factories} 
          readings={readings} 
          settings={settings} 
          currentUser={currentUser}
          onAddReading={r => { try { setReadings(prev => [r, ...prev]); addLog('Sayaç Okuma', 'Yeni kayıt girildi.'); showNotification('success', 'Sayaç okuma kaydı başarıyla eklendi.'); } catch (e) { showNotification('error', 'Kayıt eklenirken bir hata oluştu.'); } }} 
          onUpdateReading={r => { try { setReadings(prev => prev.map(i => i.id === r.id ? r : i)); addLog('Sayaç Güncelleme', 'Kayıt düzeltildi.'); showNotification('success', 'Sayaç okuma kaydı güncellendi.'); } catch (e) { showNotification('error', 'Güncelleme sırasında bir hata oluştu.'); } }} 
          onDeleteReading={id => { 
            const reading = readings.find(r => r.id === id);
            if (!reading) return;
            const isRoot = currentUser.id === 'root' || currentUser.rol === 'ROOT';
            const isLocked = reading.faturaDurumu === 'FATURALANDI';

            if (isLocked && !isRoot) {
              showNotification('error', 'Faturalanmış kayıtları sadece Root yetkilisi silebilir.');
              return;
            }

            if(window.confirm('Kayıt silinsin mi?')) { 
              setReadings(prev => prev.filter(i => i.id !== id)); 
              addLog('Sayaç Silme', `ID: ${id} silindi.`); 
              showNotification('success', 'Kayıt silindi.'); 
            } 
          }} 
          onAddNotification={n => setNotifications(prev => [n, ...prev])} 
          onUpdateFactoryDebt={(id, tutar) => setFactories(prev => prev.map(f => f.id === id ? { ...f, borc: f.borc + tutar } : f))} 
        />;
        case 'finans': return <FinanceModule invoices={invoices} readings={readings} factories={factories} settings={settings} onBatchInvoice={() => { handleBatchInvoice(); showNotification('success', 'Toplu faturalandırma işlemi tamamlandı.'); }} onUpdateInvoice={inv => { setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i)); showNotification('success', 'Fatura güncellendi.'); }} onBatchUpdateInvoices={handleBatchUpdateInvoices} onBatchUpdateReadings={handleBatchUpdateReadings} onGenerateAidat={() => { handleGenerateAidat(); showNotification('success', 'Aidat tahakkukları oluşturuldu.'); }} />;
        case 'logs': return <SystemLogs logs={logs} onClearLogs={() => { setLogs([]); addLog('Logları Temizleme', 'Tüm sistem logları root tarafından temizlendi.'); }} onDeleteLog={(id: string) => setLogs(logs.filter(l => l.id !== id))} currentUser={currentUser} />;
        case 'users': return currentUser.id === 'root' ? <UserManagement users={users} onAdd={u => { setUsers([u, ...users]); addLog('Kullanıcı Ekleme', `${u.adSoyad} oluşturuldu.`); }} onDelete={(id: string) => { setUsers(users.filter(i => i.id !== id)); addLog('Kullanıcı Silme', `ID: ${id} silindi.`); }} onUpdate={u => { setUsers(users.map(i => i.id === u.id ? u : i)); addLog('Kullanıcı Güncelleme', `${u.adSoyad} güncellendi.`); }} currentUser={currentUser} /> : null;
        case 'settings': return (currentUser.rol === 'ROOT' || currentUser.rol === 'OSB_MUDURU') ? <SystemSettings settings={settings} onUpdateSettings={s => { setSettings(s); addLog('Sistem Ayarları', 'Ayarlar güncellendi.'); }} /> : null;
        default: return <Dashboard factories={factories} readings={readings} invoices={invoices} user={currentUser} notifications={notifications} onCloseNotification={(id: string) => setNotifications(n => n.filter(x => x.id !== id))} />;
      }
    } catch (err) {
      return <div style={{ color: 'white', padding: '20px' }}>Bir hata oluştu: {String(err)}</div>;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} onUpdateUser={u => setUsers(users.map(i => i.id === u.id ? u : i))} />;
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
          {currentUser.id === 'root' && (
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
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentUser.id === 'root' ? 'System Manager' : currentUser.unvan}</p>
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
