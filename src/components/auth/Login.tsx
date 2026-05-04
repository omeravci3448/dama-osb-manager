import React, { useState } from 'react';
import { Lock, User, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Kullanici } from '../../types';

interface Props {
  onLogin: (user: Kullanici) => void;
  users: Kullanici[];
  onUpdateUser: (user: Kullanici) => void;
}

const Login: React.FC<Props> = ({ onLogin, users, onUpdateUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Şifre değiştirme ekranı için state'ler
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUser, setTempUser] = useState<Kullanici | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleInitialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.kullaniciAdi === username && u.sifre === password);
    
    if (user) {
      if (user.sifreDegistirilmeli) {
        setTempUser(user);
        setShowPasswordChange(true);
      } else {
        onLogin(user);
      }
    } else {
      setError('Geçersiz kullanıcı adı veya şifre!');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('Şifre en az 4 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler uyuşmuyor!');
      return;
    }

    if (tempUser) {
      const updatedUser = { ...tempUser, sifre: newPassword, sifreDegistirilmeli: false };
      onUpdateUser(updatedUser);
      onLogin(updatedUser);
    }
  };

  if (showPasswordChange) {
    return (
      <div style={containerStyle}>
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', borderRadius: '16px', padding: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <Lock size={40} color="#fbbf24" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Şifre Yenileme</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Güvenliğiniz için lütfen yeni bir şifre belirleyin.</p>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="password" 
              placeholder="Yeni Şifre" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              style={inputStyle}
              required 
            />
            <input 
              type="password" 
              placeholder="Yeni Şifre (Tekrar)" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              style={inputStyle}
              required 
            />
            {error && <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" className="glow-btn" style={{ padding: '14px' }}>Şifreyi Güncelle ve Giriş Yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '12px', display: 'inline-block', marginBottom: '16px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '80px' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Sistem Girişi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Şuhut OSB Yönetim Platformu</p>
        </div>

        <form onSubmit={handleInitialLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} color="var(--primary)" />
            <input 
              type="text" 
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', padding: '12px 0', outline: 'none', width: '100%' }}
            />
          </div>

          <div className="glass-card" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={18} color="var(--primary)" />
            <input 
              type="password" 
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', padding: '12px 0', outline: 'none', width: '100%' }}
            />
          </div>

          {error && <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="glow-btn" style={{ padding: '14px', fontSize: '1rem', marginTop: '10px' }}>
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = {
  height: '100vh', 
  width: '100vw', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  background: 'radial-gradient(circle at top right, #1e293b, #0f172a)'
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

export default Login;
