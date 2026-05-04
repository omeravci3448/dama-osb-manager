import React, { useState } from 'react';
import { Settings, Save, AlertCircle, Zap, DollarSign, Calendar, HelpCircle, X } from 'lucide-react';
import { Ayarlar } from '../../types';

interface Props {
  settings: Ayarlar;
  onUpdateSettings: (s: Ayarlar) => void;
}

const SystemSettings: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<Ayarlar>(settings);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [tempToggle, setTempToggle] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAutoTahakkukToggle = (checked: boolean) => {
    setTempToggle(checked);
    setShowConfirm(true);
  };

  const confirmToggle = () => {
    setFormData({ ...formData, otomatikTahakkuk: tempToggle });
    setShowConfirm(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Sistem Ayarları</h1>
        <p style={{ color: 'var(--text-muted)' }}>Müdüriyet ve Finans yapılandırmaları.</p>
      </div>

      {message.text && (
        <div className="glass-card" style={{ 
          background: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10b981',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle color="#10b981" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--primary)" /> Fiyatlandırma
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Su Birim Fiyatı (TL/m³)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.suBirimFiyat} 
                onChange={e => setFormData({...formData, suBirimFiyat: parseFloat(e.target.value)})} 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Atık Su Bedeli (TL/m³)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.atikSuBirimFiyat} 
                onChange={e => setFormData({...formData, atikSuBirimFiyat: parseFloat(e.target.value)})} 
                style={inputStyle} 
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Elektrik Birim Fiyatı (TL/kWh)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.elektrikBirimFiyat} 
                onChange={e => setFormData({...formData, elektrikBirimFiyat: parseFloat(e.target.value)})} 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Aylık Sabit Aidat (TL)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.aidatBirimFiyat} 
                onChange={e => setFormData({...formData, aidatBirimFiyat: parseFloat(e.target.value)})} 
                style={inputStyle} 
              />
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

        <div>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#3b82f6" /> Vade ve Ödeme Takvimi
          </h3>
          <div style={{ maxWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Ödeme Vadesi (Gün)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                value={formData.odemeVadesi} 
                onChange={e => setFormData({...formData, odemeVadesi: parseInt(e.target.value)})} 
                style={{ ...inputStyle, paddingRight: '45px' }} 
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>GÜN</span>
            </div>
          </div>
          <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Faturalar okuma tarihinden itibaren burada belirtilen gün kadar sonra son ödeme tarihine sahip olacaktır.
          </p>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

        <div>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="var(--accent)" /> Tahakkuk Politikası
          </h3>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              checked={formData.otomatikTahakkuk} 
              onChange={e => handleAutoTahakkukToggle(e.target.checked)} 
              style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
            />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Otomatik Tahakkuk (Anında Cari İşleme)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Açık ise: Sayaç okunduğu an hesaplanan borç firmanın carisine yansır.
              </div>
            </div>
          </label>
        </div>

        <button type="submit" className="glow-btn" style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <Save size={20} /> Ayarları Kaydet
        </button>

      </form>

      {/* Onay Modalı */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px', border: '1px solid #fbbf24' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24' }}>
                <HelpCircle size={24} /> Emin Misiniz?
              </h3>
              <button onClick={() => setShowConfirm(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X /></button>
            </div>
            <p style={{ marginBottom: '24px', lineHeight: '1.5' }}>
              <strong>Otomatik Tahakkuk</strong> ayarını değiştirmek üzeresiniz. Bu işlem, sayaç okuma sonrası borçlandırma iş akışını doğrudan etkiler.
              <br /><br />
              Bu değişikliği onaylıyor musunuz?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={confirmToggle} className="glow-btn" style={{ flex: 1, background: '#fbbf24' }}>Evet, Onaylıyorum</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  color: 'white',
  outline: 'none'
};

export default SystemSettings;
