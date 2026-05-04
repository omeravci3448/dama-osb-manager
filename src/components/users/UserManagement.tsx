import React, { useState } from 'react';
import { UserPlus, Shield, Key, Trash2, Edit2, UserCheck, AlertTriangle } from 'lucide-react';
import { Kullanici } from '../../types';

interface Props {
  users: Kullanici[];
  onAdd: (u: Kullanici) => void;
  onDelete: (id: string) => void;
  onUpdate: (u: Kullanici) => void;
  currentUser: Kullanici;
}

const UserManagement: React.FC<Props> = ({ users, onAdd, onDelete, onUpdate, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Kullanici | null>(null);
  const [formData, setFormData] = useState<Partial<Kullanici>>({
    kullaniciAdi: '',
    sifre: '',
    adSoyad: '',
    unvan: '',
    rol: 'SAHA_PERSONELI',
    sifreDegistirilmeli: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isPasswordChanged = editingUser ? (editingUser.sifre !== formData.sifre) : true;

    const finalUserData = {
      ...formData,
      sifreDegistirilmeli: isPasswordChanged ? true : formData.sifreDegistirilmeli
    };

    if (editingUser) {
      onUpdate({ ...editingUser, ...finalUserData } as Kullanici);
    } else {
      onAdd({
        ...finalUserData,
        id: Math.random().toString(36).substr(2, 9),
      } as Kullanici);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Kullanıcı & Yetki Yönetimi</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sisteme erişimi olan personelleri ve şifrelerini yönetin.</p>
        </div>
        <button className="glow-btn" onClick={() => { setEditingUser(null); setFormData({ rol: 'SAHA_PERSONELI', sifreDegistirilmeli: false }); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} /> Yeni Kullanıcı Ekle
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Ad Soyad / Unvan</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Kullanıcı Adı</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Şifre</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Durum</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Yetki Rolü</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: '600' }}>{user.adSoyad}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.unvan}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>{user.kullaniciAdi}</td>
                <td style={{ padding: '16px 20px' }}>
                  <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)' }}>
                    {user.sifre}
                  </code>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {user.sifreDegistirilmeli ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.8rem' }}>
                      <AlertTriangle size={14} /> Şifre Yenileme Bekliyor
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.8rem' }}>
                      <UserCheck size={14} /> Aktif
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    background: user.rol === 'ROOT' ? 'rgba(194, 130, 71, 0.1)' : user.rol === 'OSB_MUDURU' || user.rol === 'YONETIM_KURULU' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(62, 158, 94, 0.1)',
                    color: user.rol === 'ROOT' ? 'var(--primary)' : user.rol === 'OSB_MUDURU' || user.rol === 'YONETIM_KURULU' ? '#3b82f6' : 'var(--accent)',
                    border: `1px solid ${user.rol === 'ROOT' ? 'var(--primary)' : user.rol === 'OSB_MUDURU' || user.rol === 'YONETIM_KURULU' ? '#3b82f6' : 'var(--accent)'}`
                  }}>
                    {user.rol === 'ROOT' ? 'Süper Yönetici' : user.rol === 'YONETIM_KURULU' ? 'Yönetim Kurulu' : user.rol === 'OSB_MUDURU' ? 'OSB Müdürü' : user.rol === 'IDARI_PERSONEL' ? 'İdari Personel' : 'Saha Personeli'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEditingUser(user); setFormData(user); setIsModalOpen(true); }} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      <Edit2 size={16} />
                    </button>
                    {user.kullaniciAdi !== 'root' && user.id !== currentUser.id && (
                      <button onClick={() => onDelete(user.id)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--secondary)' }}>
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

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>{editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ad Soyad</label>
                <input type="text" required value={formData.adSoyad} onChange={e => setFormData({...formData, adSoyad: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Unvan</label>
                <input type="text" required value={formData.unvan} onChange={e => setFormData({...formData, unvan: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Kullanıcı Adı</label>
                <input type="text" required value={formData.kullaniciAdi} onChange={e => setFormData({...formData, kullaniciAdi: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Şifre</label>
                <input type="text" required value={formData.sifre} onChange={e => setFormData({...formData, sifre: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Yetki Rolü</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})} style={inputStyle}>
                  <option value="YONETIM_KURULU">Yönetim Kurulu</option>
                  <option value="OSB_MUDURU">OSB Müdürü</option>
                  <option value="IDARI_PERSONEL">İdari Personel</option>
                  <option value="SAHA_PERSONELI">Saha Personeli</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>Kaydet</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px' }}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  color: 'white',
  outline: 'none'
};

export default UserManagement;
