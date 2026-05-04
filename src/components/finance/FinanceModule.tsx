import React, { useState, useEffect } from 'react';
import { Receipt, DollarSign, Download, MessageSquare, Plus, Search, Filter, X, Check } from 'lucide-react';
import { Fatura, SayacOkuma, Fabrika, Ayarlar } from '../../types';
import { sendWhatsAppMessage, generateFaturaPDF, generateMuhasebeAktarimRaporu } from '../../utils/helpers';

interface Props {
  invoices: Fatura[];
  readings: SayacOkuma[];
  factories: Fabrika[];
  settings: Ayarlar;
  onBatchInvoice: () => void;
  onUpdateInvoice?: (inv: Fatura) => void;
  onBatchUpdateInvoices?: (invoices: Fatura[]) => void;
  onBatchUpdateReadings?: (readings: SayacOkuma[]) => void;
  onGenerateAidat?: () => void;
}

const FinanceModule: React.FC<Props> = ({ invoices, readings, factories, settings, onBatchInvoice, onUpdateInvoice, onBatchUpdateInvoices, onBatchUpdateReadings, onGenerateAidat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING'>('PENDING');


  // Dinamik İstatistik Hesaplamaları
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('.');
    if (parts.length !== 3) return new Date();
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  
  // Birleştirilmiş veri seti (Faturalar + Tahakkuk eden ama henüz faturalanmamış okumalar)
  const allFinanceRecords = [
    ...invoices.map(inv => ({ ...inv, recordType: 'INVOICE' as const })),
    ...readings
      .filter(r => r.faturaDurumu === 'TAHAKKUK_EDILDI')
      .map(r => {
        const tutar = r.hesaplananTutar || (r.tuketim * (factories.find(f => f.id === r.fabrikaId)?.carpan || 1));
        const kdv = tutar * 0.20;
        return {
          id: `acc-${r.id}`,
          fabrikaId: r.fabrikaId,
          donem: r.okumaTarihi.split('.').slice(1).join('.'), // Ay.Yıl formatı
          tutar: tutar,
          kdv: kdv,
          toplamTutar: tutar + kdv,
          sonOdemeTarihi: r.okumaTarihi, // Geçici tarih
          durum: 'TAHAKKUK' as const,
          tip: 'SU' as const,
          muhasebeAktarildi: r.muhasebeAktarildi || false,
          recordType: 'ACCRUAL' as const,
          originalReadingId: r.id
        };
      })
  ];

  const totalReceived = invoices
    .filter(inv => inv.durum === 'ODENDI')
    .reduce((sum, inv) => sum + inv.toplamTutar, 0);

  const pendingPayments = allFinanceRecords
    .filter(rec => (rec.durum === 'BEKLIYOR' && parseDate(rec.sonOdemeTarihi) >= today) || rec.durum === 'TAHAKKUK')
    .reduce((sum, rec) => sum + rec.toplamTutar, 0);

  const delayedInvoices = invoices
    .filter(inv => inv.durum === 'GECIKMIS' || (inv.durum === 'BEKLIYOR' && parseDate(inv.sonOdemeTarihi) < today));
  
  const delayedAmount = delayedInvoices.reduce((sum, inv) => sum + inv.toplamTutar, 0);
  const riskyFactoriesCount = new Set(delayedInvoices.map(inv => inv.fabrikaId)).size;

  const handleWhatsAppPaymentRemind = (invoice: Fatura) => {
    const fab = factories.find(f => f.id === invoice.fabrikaId);
    const msg = `Sayın yetkili, ${invoice.donem} dönemine ait ${invoice.toplamTutar.toLocaleString()} TL tutarındaki faturanızın son ödeme tarihi ${invoice.sonOdemeTarihi}'dir. Bilginize sunarız.`;
    sendWhatsAppMessage(fab?.yetkililer?.[0]?.telefon || '', msg);
  };

  const handleBatchAccounting = () => {
    const selectedRecords = allFinanceRecords.filter(rec => selectedInvoiceIds.includes(rec.id));
    if (selectedRecords.length === 0) return;

    if (window.confirm(`${selectedRecords.length} adet kaydı muhasebeye aktarmak istediğinize emin misiniz? Okuma detay raporu fiziksel çıktı için hazırlanacaktır.`)) {
      // Faturaları güncelle
      const invoicesToUpdate = selectedRecords
        .filter(r => r.recordType === 'INVOICE')
        .map(inv => ({ ...inv, recordType: undefined, muhasebeAktarildi: true } as unknown as Fatura));
      
      if (invoicesToUpdate.length > 0) {
        onBatchUpdateInvoices?.(invoicesToUpdate);
      }

      // Okumaları güncelle
      const readingsToUpdate = selectedRecords
        .filter(r => r.recordType === 'ACCRUAL')
        .map(acc => {
          const original = readings.find(r => r.id === (acc as any).originalReadingId);
          return original ? { ...original, muhasebeAktarildi: true, faturaDurumu: 'FATURALANDI' } : null;
        })
        .filter(Boolean) as SayacOkuma[];

      if (readingsToUpdate.length > 0) {
        onBatchUpdateReadings?.(readingsToUpdate);
      }

      // Rapor oluştur (Hem faturalar hem de tahakkuklar için)
      generateMuhasebeAktarimRaporu(selectedRecords as any, factories, readings);
      setSelectedInvoiceIds([]);
    }
  };

  const filteredInvoices = allFinanceRecords.filter(rec => {
    const matchesSearch = factories.find(f => f.id === rec.fabrikaId)?.ad.toLowerCase().includes(searchTerm.toLowerCase()) || rec.donem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'SENT' ? rec.muhasebeAktarildi : !rec.muhasebeAktarildi);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Finans ve Aidat Yönetimi</h1>
          <p style={{ color: 'var(--text-muted)' }}>Faturaları ve muhasebe aktarımlarını buradan yönetin.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onGenerateAidat?.()} 
            className="glow-btn" 
            style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <DollarSign size={20} /> Toplu Aidat Tahakkuku
          </button>
          {selectedInvoiceIds.length > 0 && (
            <button 
              onClick={handleBatchAccounting}
              className="glow-btn" 
              style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Check size={20} /> Seçilenleri Muhasebeye Gönder ({selectedInvoiceIds.length})
            </button>
          )}
          <button onClick={() => onBatchInvoice()} className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
            <Receipt size={20} /> Toplu Tahakkuk (Su)
          </button>
        </div>
      </div>


      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Toplam Tahsilat</span>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '12px', color: '#10b981' }}>₺{totalReceived.toLocaleString('tr-TR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>Sistemdeki tüm ödenmiş faturalar</div>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b', background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Bekleyen Ödemeler</span>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '12px', color: '#f59e0b' }}>₺{pendingPayments.toLocaleString('tr-TR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>{invoices.filter(i => i.durum === 'BEKLIYOR' && parseDate(i.sonOdemeTarihi) >= today).length} aktif fatura</div>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444', background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.05), transparent)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Gecikmiş Ödemeler</span>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '12px', color: '#ef4444' }}>₺{delayedAmount.toLocaleString('tr-TR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>Riskli {riskyFactoriesCount} işletme</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Fabrika veya dönem ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle} 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ ...filterBtnStyle, padding: '0 12px' }}
        >
          <option value="ALL">Tümü (Muhasebe)</option>
          <option value="PENDING">Gönderilmeyenler</option>
          <option value="SENT">Gönderilenler</option>
        </select>
        <button style={filterBtnStyle}><Filter size={18} /> Gelişmiş</button>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px' }}>
                <input 
                  type="checkbox" 
                  checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
                    else setSelectedInvoiceIds([]);
                  }}
                />
              </th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Fabrika</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Dönem / Tip</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Tutar</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Muhasebe</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Durum</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((rec: any) => (
              <tr key={rec.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', background: selectedInvoiceIds.includes(rec.id) ? 'rgba(194, 130, 71, 0.05)' : 'transparent' }}>
                <td style={{ padding: '16px 20px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedInvoiceIds.includes(rec.id)}
                    onChange={() => {
                      if (selectedInvoiceIds.includes(rec.id)) setSelectedInvoiceIds(prev => prev.filter(id => id !== rec.id));
                      else setSelectedInvoiceIds(prev => [...prev, rec.id]);
                    }}
                  />
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: '600' }}>{factories.find(f => f.id === rec.fabrikaId)?.ad || `Fabrika ${rec.fabrikaId}`}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.recordType === 'ACCRUAL' ? 'Tahakkuk Kaydı' : `ID: ${rec.id}`}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div>{rec.donem}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{rec.tip}</div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>
                  {rec.toplamTutar.toLocaleString()} TL
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {rec.muhasebeAktarildi ? (
                    <span style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Gönderildi
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        if (rec.recordType === 'ACCRUAL') {
                          const original = readings.find(r => r.id === rec.originalReadingId);
                          if (original) {
                            const updatedReading = { ...original, muhasebeAktarildi: true, faturaDurumu: 'FATURALANDI' as const };
                            onBatchUpdateReadings?.([updatedReading]);
                            generateMuhasebeAktarimRaporu([{ ...rec, muhasebeAktarildi: true }], factories, readings);
                          }
                        } else {
                          const updatedInvoice = { ...rec, muhasebeAktarildi: true };
                          onUpdateInvoice?.(updatedInvoice);
                          generateMuhasebeAktarimRaporu([updatedInvoice], factories, readings);
                        }
                      }}
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      Muhasebeye Gönder
                    </button>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    background: rec.durum === 'ODENDI' ? 'rgba(16, 185, 129, 0.1)' : (rec.durum === 'TAHAKKUK' ? 'rgba(194, 130, 71, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                    color: rec.durum === 'ODENDI' ? '#10b981' : (rec.durum === 'TAHAKKUK' ? 'var(--primary)' : '#f59e0b'),
                    border: `1px solid ${rec.durum === 'ODENDI' ? '#10b981' : (rec.durum === 'TAHAKKUK' ? 'var(--primary)' : '#f59e0b')}`
                  }}>
                    {rec.muhasebeAktarildi ? 'GÖNDERİLDİ' : (rec.durum === 'TAHAKKUK' ? 'BEKLEYEN' : rec.durum)}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {rec.recordType === 'INVOICE' && (
                      <>
                        <button onClick={() => handleWhatsAppPaymentRemind(rec)} style={actionBtnStyle} title="Hatırlatma Gönder">
                          <MessageSquare size={16} color="#25D366" />
                        </button>
                        <button 
                          onClick={() => {
                            const fab = factories.find(f => f.id === rec.fabrikaId);
                            const reading = readings.find(r => 
                              r.fabrikaId === rec.fabrikaId && 
                              (r.okumaTarihi.includes(rec.donem.split(' ')[0]) || r.okumaTarihi.includes(rec.donem.split(' ')[1]))
                            );
                            if (fab) generateFaturaPDF(rec, fab, reading, settings.suBirimFiyat + settings.atikSuBirimFiyat);
                          }} 
                          style={actionBtnStyle} 
                          title="PDF İndir"
                        >
                          <Download size={16} />
                        </button>
                        <button style={{ ...actionBtnStyle, background: 'var(--primary)', color: 'white' }}>
                          Ödeme Al
                        </button>
                      </>
                    )}
                    {rec.recordType === 'ACCRUAL' && (
                      <button 
                        onClick={() => {
                          generateMuhasebeAktarimRaporu([rec], factories, readings);
                        }}
                        style={actionBtnStyle}
                        title="Okuma Raporu Al"
                      >
                        <Download size={16} /> <span style={{fontSize: '0.7rem', marginLeft: '4px'}}>PDF Rapor</span>
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
  );
};

const inputStyle = { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' };
const filterBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRadius: '12px', background: 'var(--surface-lighter)', color: 'white', border: 'none' };
const actionBtnStyle = { padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default FinanceModule;
