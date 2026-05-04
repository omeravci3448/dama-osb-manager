import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Phone, MapPin, Hash, Search, Users } from 'lucide-react';
import { Fabrika, Yetkili, SayacOkuma, Kullanici } from '../../types';

interface Props {
  factories: Fabrika[];
  readings: SayacOkuma[];
  currentUser: Kullanici;
  onAdd: (f: Fabrika) => void;
  onUpdate: (f: Fabrika) => void;
  onDelete: (id: string) => void;
  onAddReading: (r: SayacOkuma) => void;
}

const FactoryList: React.FC<Props> = ({ factories, readings, currentUser, onAdd, onUpdate, onDelete, onAddReading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // ... (rest of the states)

  const getLastReading = (factoryId: string) => {
    return readings
      .filter(r => r.fabrikaId === factoryId)
      .sort((a, b) => new Date(b.okumaTarihi).getTime() - new Date(a.okumaTarihi).getTime())[0];
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Fabrika | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const initialYetkililer: Yetkili[] = [
    { adSoyad: '', telefon: '' },
    { adSoyad: '', telefon: '' },
    { adSoyad: '', telefon: '' },
    { adSoyad: '', telefon: '' },
  ];

  const [formData, setFormData] = useState<Partial<Fabrika>>({
    ad: '',
    sahibi: '',
    yetkililer: [...initialYetkililer],
    sayacNo: '',
    carpan: 1,
    aktif: true,
    borc: 0,
    adres: '',
    acilisEndeksi: 0,
    sonOkumaTarihi: new Date().toISOString().split('T')[0]
  });

  const filteredFactories = factories.filter(f => 
    f.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sahibi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Boş yetkilileri temizle
      const cleanYetkililer = (formData.yetkililer || []).filter(y => y.adSoyad.trim() !== '' || y.telefon.trim() !== '');
      
      // Kaydedilecek veri paketi
      const updatedData = {
        ad: formData.ad || '',
        sahibi: formData.sahibi || '',
        yetkililer: cleanYetkililer,
        sayacNo: formData.sayacNo || '',
        carpan: formData.carpan || 1,
        adres: formData.adres || '',
        telefon: formData.telefon || '',
        aktif: formData.aktif !== false,
        acilisEndeksi: Number(formData.acilisEndeksi) || 0,
        sonOkumaTarihi: formData.sonOkumaTarihi || new Date().toISOString().split('T')[0]
      };

      if (editingFactory) {
        // GÜNCELLEME
        const finalFactory = { ...editingFactory, ...updatedData };
        onUpdate(finalFactory);
        
        // Eğer hiç gerçek okuma yoksa ve ilk endeks girilmişse/değişmişse sistem okuması oluştur/güncelle
        const hasRealReadings = readings.some(r => r.fabrikaId === editingFactory.id && r.okuyanPersonel !== 'Sistem (Acilis)');
        if (!hasRealReadings && updatedData.acilisEndeksi > 0) {
          const existingOpening = readings.find(r => r.fabrikaId === editingFactory.id && r.okuyanPersonel === 'Sistem (Acilis)');
          const openingReading = {
            id: existingOpening ? existingOpening.id : Math.random().toString(36).substr(2, 9),
            fabrikaId: editingFactory.id,
            okumaTarihi: updatedData.sonOkumaTarihi,
            ilkEndeks: updatedData.acilisEndeksi,
            sonEndeks: updatedData.acilisEndeksi,
            tuketim: 0,
            okuyanPersonel: 'Sistem (Acilis)',
            faturaDurumu: 'FATURALANDI' as const
          };
          onAddReading(openingReading);
        }
      } else {
        // YENİ KAYIT
        const newId = Math.random().toString(36).substr(2, 9);
        const newFactory = {
          ...updatedData,
          id: newId,
          borc: 0
        } as Fabrika;

        onAdd(newFactory);

        if (updatedData.acilisEndeksi > 0) {
          onAddReading({
            id: Math.random().toString(36).substr(2, 9),
            fabrikaId: newId,
            okumaTarihi: updatedData.sonOkumaTarihi,
            ilkEndeks: updatedData.acilisEndeksi,
            sonEndeks: updatedData.acilisEndeksi,
            tuketim: 0,
            okuyanPersonel: 'Sistem (Acilis)',
            faturaDurumu: 'FATURALANDI' as const
          });
        }
      }
      closeModal();
    } catch (err) {
      console.error('Kayıt hatası:', err);
      alert('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const openModal = (factory?: Fabrika) => {
    if (factory) {
      setEditingFactory(factory);
      // Eksik yetkilileri 4'e tamamla ki formda hepsi çıksın
      const currentYetkililer = [...(factory.yetkililer || [])];
      while (currentYetkililer.length < 4) {
        currentYetkililer.push({ adSoyad: '', telefon: '' });
      }
      setFormData({ ...factory, yetkililer: currentYetkililer });
    } else {
      setEditingFactory(null);
      setFormData({
        ad: '',
        sahibi: '',
        yetkililer: [...initialYetkililer],
        sayacNo: '',
        carpan: 1,
        aktif: true,
        borc: 0,
        adres: '',
        acilisEndeksi: 0,
        sonOkumaTarihi: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFactory(null);
  };

  const updateYetkili = (index: number, field: keyof Yetkili, value: string) => {
    const newYetkililer = [...(formData.yetkililer || [])];
    newYetkililer[index] = { ...newYetkililer[index], [field]: value };
    setFormData({ ...formData, yetkililer: newYetkililer });
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 className="text-gradient">Fabrika Yönetimi</h1>
            <p style={{ color: 'var(--text-muted)' }}>Toplam {factories.length} kayıtlı işletme bulunuyor.</p>
          </div>
          <button className="glow-btn" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Yeni Fabrika Ekle
          </button>
        </div>

        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Fabrika adı veya sahip ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' }} 
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Fabrika Adı</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>İşletme Sahibi</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Yetkililer</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Son Okuma</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Sayaç / Çarpan</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Güncel Borç</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500' }}>Durum</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactories.map((factory) => (
                <tr key={factory.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600' }}>{factory.ad}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {factory.adres || 'Şuhut OSB'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>{factory.sahibi}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="var(--primary)" />
                      <span style={{ fontSize: '0.9rem' }}>{factory.yetkililer?.length || 0} Kişi</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {getLastReading(factory.id) ? (
                      <>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{getLastReading(factory.id)?.okumaTarihi}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getLastReading(factory.id)?.sonEndeks} Endeks</div>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Henüz Okunmadı</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.9rem' }}>{factory.sayacNo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>x{factory.carpan}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: '700', 
                      color: (factory.borc || 0) > 0 ? '#ef4444' : 'var(--accent)' 
                    }}>
                      ₺{(factory.borc || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      background: factory.aktif ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: factory.aktif ? 'var(--accent)' : 'var(--secondary)',
                      border: `1px solid ${factory.aktif ? 'var(--accent-glow)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {factory.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button onClick={() => openModal(factory)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} title="Düzenle">
                        <Edit2 size={16} />
                      </button>
                      
                      {confirmDeleteId === factory.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold', padding: '0 4px' }}>Emin misiniz?</span>
                          <button 
                            onClick={() => { onDelete(factory.id); setConfirmDeleteId(null); }} 
                            style={{ padding: '4px 8px', borderRadius: '6px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}
                          >
                            Sil
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)} 
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }}
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(factory.id)} 
                          style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--secondary)' }}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 28, 0.95)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2vh 0' }} onClick={closeModal}>
          <div 
            className="glass-card animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '850px', 
              minHeight: '90vh',
              background: 'var(--surface-color)', 
              border: '1px solid var(--primary-glow)', 
              display: 'flex', 
              flexDirection: 'column',
              padding: '0',
              marginTop: '10px',
              marginBottom: '20px',
              boxShadow: '0 30px 100px rgba(0,0,0,0.8)' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }} className="text-gradient">
                  {editingFactory ? 'İşletme Bilgilerini Güncelle' : 'Yeni İşletme Kayıt Paneli'}
                </h3>
              </div>
              <button type="button" onClick={closeModal} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Fabrika Adı</label>
                  <input type="text" required value={formData.ad} onChange={e => setFormData({...formData, ad: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>İşletme Sahibi</label>
                  <input type="text" required value={formData.sahibi} onChange={e => setFormData({...formData, sahibi: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <Users size={16} /> İletişim Yetkilileri
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input type="text" placeholder="Ad Soyad" value={formData.yetkililer?.[idx]?.adSoyad || ''} onChange={e => updateYetkili(idx, 'adSoyad', e.target.value)} style={inputStyle} />
                      <input type="text" placeholder="Telefon" value={formData.yetkililer?.[idx]?.telefon || ''} onChange={e => updateYetkili(idx, 'telefon', e.target.value)} style={inputStyle} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Sayaç No</label>
                  <input type="text" required value={formData.sayacNo} onChange={e => setFormData({...formData, sayacNo: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Çarpan</label>
                  <input type="number" required value={formData.carpan} onChange={e => setFormData({...formData, carpan: Number(e.target.value)})} style={inputStyle} />
                </div>
                {(!editingFactory || !getLastReading(editingFactory.id)) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '6px' }}>İlk Endeks</label>
                    <input type="number" value={formData.acilisEndeksi || ''} onChange={e => setFormData({...formData, acilisEndeksi: Number(e.target.value)})} style={{ ...inputStyle, borderColor: 'var(--primary-glow)' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Adres</label>
                <textarea value={formData.adres} onChange={e => setFormData({...formData, adres: e.target.value})} style={{ ...inputStyle, height: '70px', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginTop: 'auto' }}>
                <input type="checkbox" id="status-toggle" checked={formData.aktif} onChange={e => setFormData({...formData, aktif: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="status-toggle" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>İşletme Aktif (Sayaç okuması yapılabilir)</label>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: '12px', fontSize: '1rem' }}>Değişiklikleri Kaydet</button>
                <button type="button" onClick={closeModal} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px' }}>Vazgeç</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  color: 'white',
  outline: 'none',
  fontSize: '0.9rem'
};

const largeInputStyle = {
  ...inputStyle,
  padding: '16px 20px',
  fontSize: '1.1rem',
  borderRadius: '12px'
};

export default FactoryList;
