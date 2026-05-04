import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Factory, Zap, DollarSign, Users, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Fabrika, SayacOkuma, Fatura, Kullanici, Bildirim } from '../../types';

interface Props {
  factories: Fabrika[];
  readings: SayacOkuma[];
  invoices: Fatura[];
  user: Kullanici;
  notifications: Bildirim[];
  onCloseNotification: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ factories, readings, invoices, user, notifications, onCloseNotification }) => {
  // İstatistikleri dinamik hesapla
  const activeFactories = factories.filter(f => f.aktif).length;
  const totalConsumption = readings.reduce((sum, r) => sum + r.tuketim, 0);
  const totalRevenue = invoices.filter(i => i.durum === 'ODENDI').reduce((sum, i) => sum + i.toplamTutar, 0);
  const pendingInvoices = invoices.filter(i => i.durum === 'BEKLIYOR').length;

  const data = [
    { name: 'Ocak', tüketim: 4000 },
    { name: 'Şubat', tüketim: 3000 },
    { name: 'Mart', tüketim: 2000 },
    { name: 'Nisan', tüketim: 2780 },
    { name: 'Mayıs', tüketim: 1890 },
    { name: 'Haziran', tüketim: 2390 },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">
          {user.rol === 'ROOT' ? 'Hoş Geldin Patron' : `Hoş Geldiniz, ${user.adSoyad}`}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Şuhut OSB genel durumu ve güncel sayaç verileri.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Aktif Fabrikalar" value={activeFactories} icon={<Factory color="var(--primary)" />} trend="+2" isUp={true} />
        <StatCard title="Aylık Tüketim" value={`${totalConsumption.toLocaleString()} kWh`} icon={<Zap color="var(--accent)" />} trend="%12" isUp={false} />
        <StatCard title="Toplam Tahsilat" value={`₺${totalRevenue.toLocaleString()}`} icon={<DollarSign color="#fbbf24" />} trend="%5" isUp={true} />
        <StatCard title="Bekleyen Fatura" value={pendingInvoices} icon={<Users color="#ec4899" />} trend="5" isUp={true} />
      </div>

      {/* Bildirimler (OSB Müdürü için) */}
      {(user.rol === 'ROOT' || user.rol === 'OSB_MUDURU') && notifications.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#fbbf24' }}>Bekleyen Bildirimler</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(n => (
              <div key={n.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #fbbf24', padding: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{n.mesaj}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.tarih}</p>
                </div>
                <button onClick={() => onCloseNotification(n.id)} className="glow-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>İncelendi & Kapat</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Enerji Tüketim Analizi</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area type="monotone" dataKey="tüketim" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTuk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Son Okumalar</h3>
            <Clock size={18} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {readings.slice(0, 5).map((reading) => (
              <RecentItem 
                key={reading.id}
                title={factories.find(f => f.id === reading.fabrikaId)?.ad || `Silinmiş İşletme (${reading.fabrikaId})`}
                subtitle={reading.okumaTarihi} // Zaten GG.AA.YYYY formatında geliyor
                value={`${reading.tuketim.toLocaleString()} kWh`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ title, value, icon, trend, isUp }: any) {
  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: isUp ? '#10b981' : '#ef4444' }}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{title}</p>
        <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{value}</h2>
      </div>
    </div>
  );
}

function RecentItem({ title, subtitle, value }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
      <div>
        <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{title}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{value}</div>
    </div>
  );
}

export default Dashboard;
