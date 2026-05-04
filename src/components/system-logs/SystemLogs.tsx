import React from 'react';
import { History, Search, Filter, Download, Trash2, X } from 'lucide-react';
import { LogKaydi, Kullanici } from '../../types';

interface Props {
  logs: LogKaydi[];
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
  currentUser: Kullanici;
}

const SystemLogs: React.FC<Props> = ({ logs, onClearLogs, onDeleteLog, currentUser }) => {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Sistem İşlem Logları</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sistemde yapılan tüm giriş, çıkış ve veri değişikliklerini takip edin.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') && logs.length > 0 && (
            <button 
              onClick={() => window.confirm('Tüm sistem loglarını kalıcı olarak silmek istediğinize emin misiniz?') && onClearLogs()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '12px' }}
            >
              <Trash2 size={18} /> Tümünü Temizle
            </button>
          )}
          <button className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', border: '1px solid var(--border-color)', padding: '10px 16px' }}>
            <Download size={18} /> Raporu İndir
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="İşlem veya kullanıcı ara..." style={inputStyle} />
        </div>
        <button style={filterBtnStyle}><Filter size={18} /> Filtrele</button>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Tarih / Saat</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Kullanıcı</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>İşlem</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Detay</th>
              {(currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') && <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Henüz bir işlem kaydı bulunmuyor.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{log.tarih}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600' }}>{log.kullaniciAdSoyad}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      background: getLogBg(log.islem),
                      color: 'white'
                    }}>
                      {log.islem}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {log.detay}
                  </td>
                  {(currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') && (
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => onDeleteLog(log.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        title="Kaydı Sil"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getLogBg = (islem: string) => {
  if (islem.includes('Giriş')) return '#10b981';
  if (islem.includes('Çıkış')) return '#ef4444';
  if (islem.includes('Silme')) return '#B92E2E';
  if (islem.includes('Güncelleme')) return '#3b82f6';
  return 'var(--primary)';
};

const inputStyle = {
  width: '100%',
  padding: '12px 12px 12px 40px',
  borderRadius: '12px',
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  color: 'white',
  outline: 'none'
};

const filterBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 20px',
  borderRadius: '12px',
  background: 'var(--surface-lighter)',
  color: 'white'
};

export default SystemLogs;
