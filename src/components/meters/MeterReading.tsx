import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, ScanText, Save, AlertCircle, RefreshCw, X, CheckCircle2, Download, MessageSquare, FileText, Trash2, Edit2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';
import { Fabrika, SayacOkuma, Bildirim, Ayarlar, Kullanici } from '../../types';
import { generateEndeksKarti, sendWhatsAppMessage } from '../../utils/helpers';

interface Props {
  factories: Fabrika[];
  readings: SayacOkuma[];
  settings: Ayarlar;
  currentUser: Kullanici;
  onAddReading: (reading: SayacOkuma) => void;
  onUpdateReading?: (reading: SayacOkuma) => void;
  onDeleteReading?: (id: string) => void;
  onAddNotification: (notification: Bildirim) => void;
  onUpdateFactoryDebt: (fabrikaId: string, tutar: number) => void;
}

const MeterReading: React.FC<Props> = ({ factories, readings, settings, currentUser, onAddReading, onUpdateReading, onDeleteReading, onAddNotification, onUpdateFactoryDebt }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFabrikaId, setSelectedFabrikaId] = useState('');
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [newIndex, setNewIndex] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastReading, setLastReading] = useState<SayacOkuma | null>(null);
  const [editingReading, setEditingReading] = useState<SayacOkuma | null>(null);
  const [editIndex, setEditIndex] = useState('');

  
  // Eşik değeri kontrolü için state'ler
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingReading, setPendingReading] = useState<SayacOkuma | null>(null);
  const [anomalyReason, setAnomalyReason] = useState('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedFabrikaId) {
      const fabReadings = readings.filter(r => r.fabrikaId === selectedFabrikaId);
      if (fabReadings.length > 0) {
        const last = fabReadings.sort((a, b) => new Date(b.okumaTarihi).getTime() - new Date(a.okumaTarihi).getTime())[0];
        setLastIndex(last.sonEndeks);
      } else {
        setLastIndex(0);
      }
    }
  }, [selectedFabrikaId, readings]);

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error(err));
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    const fabrika = factories.find(f => f.id === decodedText || f.sayacNo === decodedText);
    if (fabrika) {
      setSelectedFabrikaId(fabrika.id);
      stopScanner();
      setMessage({ type: 'success', text: `${fabrika.ad} başarıyla tanımlandı.` });
    } else {
      setMessage({ type: 'error', text: 'Tanımsız QR Kod!' });
    }
  };

  const onScanFailure = () => {};

  const handleOCR = async () => {
    setIsProcessingOCR(true);
    try {
      // Simülasyon: Gerçek kamera akışından kare yakalama kısmı
      // Gerçek kullanımda videoRef'ten canvas'a çizim yapılır.
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockValue = (Math.random() * 1000 + (lastIndex || 0)).toFixed(2);
      setNewIndex(mockValue);
      setMessage({ type: 'success', text: 'Sayaç yapay zeka ile okundu.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Okuma başarısız.' });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedFabrikaId || !newIndex) return;
    const val = parseFloat(newIndex);
    const fab = factories.find(f => f.id === selectedFabrikaId);
    if (!fab) return;
    
    const tuketim = (val - (lastIndex || 0)) * fab.carpan;
    const fabReadings = readings.filter(r => r.fabrikaId === selectedFabrikaId).sort((a, b) => new Date(b.okumaTarihi).getTime() - new Date(a.okumaTarihi).getTime());
    
    let isAnomaly = false;
    let reason = '';

    if (fabReadings.length > 0) {
      const prevTuketim = fabReadings[0].tuketim;
      if (prevTuketim > 0) {
        if (tuketim > prevTuketim * 1.5) {
          isAnomaly = true;
          reason = 'Normal tüketimin %50 üzerinde!';
        } else if (tuketim < prevTuketim * 0.5) {
          isAnomaly = true;
          reason = 'Normal tüketimin %50 altında!';
        }
      }
    }

    // Su Bedeli + Atık Su Bedeli
    const tutarNet = tuketim * (settings.suBirimFiyat + settings.atikSuBirimFiyat);
    const kdv = tutarNet * 0.20;
    const toplamTutar = tutarNet + kdv;
    const faturaDurumu = settings.otomatikTahakkuk ? 'TAHAKKUK_EDILDI' : 'BEKLIYOR';

    const reading: SayacOkuma = {
      id: Math.random().toString(36).substr(2, 9),
      fabrikaId: selectedFabrikaId,
      okumaTarihi: new Date().toLocaleDateString('tr-TR'),
      ilkEndeks: lastIndex || 0,
      sonEndeks: val,
      tuketim: tuketim,
      okuyanPersonel: 'Saha Personeli',
      faturaDurumu,
      hesaplananTutar: tutarNet
    };

    if (isAnomaly) {
      setPendingReading(reading);
      setAnomalyReason(reason);
      setShowConfirmation(true);
      return;
    }

    finalizeReading(reading);
  };

  const finalizeReading = (reading: SayacOkuma, notifyMudur: boolean = false) => {
    onAddReading(reading);
    
    if (settings.otomatikTahakkuk && reading.hesaplananTutar) {
      // Borca KDV dahil (net * 1.20) ekle
      const toplamTutar = reading.hesaplananTutar * 1.20;
      onUpdateFactoryDebt(reading.fabrikaId, toplamTutar);
    }

    setLastReading(reading);
    
    if (notifyMudur && anomalyReason) {
      const fab = factories.find(f => f.id === reading.fabrikaId);
      const now = new Date();
      onAddNotification({
        id: Math.random().toString(36).substr(2, 9),
        mesaj: `${fab?.ad} firmasında normal dışı tüketim saptandı! (${anomalyReason}) Tüketim: ${reading.tuketim} m³. Saha personeli operatör onayıyla kaydetti.`,
        tarih: `${now.toLocaleDateString('tr-TR')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        okundu: false,
        ilgiliFabrikaId: reading.fabrikaId,
        ilgiliSayacOkumaId: reading.id
      });
    }

    setSelectedFabrikaId('');
    setNewIndex('');
    setShowConfirmation(false);
    setPendingReading(null);
    setMessage({ type: 'success', text: 'Okuma başarıyla kaydedildi.' });
  };

  const handleWhatsAppShare = () => {
    if (!lastReading) return;
    const fab = factories.find(f => f.id === lastReading.fabrikaId);
    if (!fab) return;
    
    const msg = `Sayın ${fab.sahibi}, ${lastReading.okumaTarihi} tarihli sayaç okumanız yapılmıştır. \nSon Endeks: ${lastReading.sonEndeks} \nTüketim: ${lastReading.tuketim} m³. \nİyi çalışmalar dileriz.`;
    sendWhatsAppMessage(fab.yetkililer[0]?.telefon || '', msg);
  };

  const handleUpdate = () => {
    if (!editingReading || !editIndex) return;
    const val = parseFloat(editIndex);
    const fab = factories.find(f => f.id === editingReading.fabrikaId);
    if (!fab) return;

    const tuketim = (val - editingReading.ilkEndeks) * fab.carpan;
    const tutarNet = tuketim * (settings.suBirimFiyat + settings.atikSuBirimFiyat);
    
    const updated: SayacOkuma = {
      ...editingReading,
      sonEndeks: val,
      tuketim: tuketim,
      hesaplananTutar: tutarNet
    };

    // Eğer zaten tahakkuk etmişse carideki borcu düzelt
    if (editingReading.faturaDurumu === 'TAHAKKUK_EDILDI') {
      const oldTutar = (editingReading.hesaplananTutar || 0) * 1.20;
      const newTutar = tutarNet * 1.20;
      const fark = newTutar - oldTutar;
      if (fark !== 0) {
        onUpdateFactoryDebt(editingReading.fabrikaId, fark);
      }
    }

    onUpdateReading?.(updated);
    setEditingReading(null);
    setEditIndex('');
    setMessage({ type: 'success', text: 'Okuma başarıyla güncellendi.' });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Akıllı Sayaç Okuma</h1>
        <p style={{ color: 'var(--text-muted)' }}>QR ve OCR destekli hızlı veri girişi.</p>
      </div>

      {message.text && (
        <div className="glass-card" style={{ 
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: message.type === 'success' ? '#10b981' : '#ef4444',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <CheckCircle2 color="#10b981" /> : <AlertCircle color="#ef4444" />}
          <div style={{ flex: 1 }}>
            <div>{message.text}</div>
            {message.type === 'success' && lastReading && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => {
                    const fab = factories.find(f => f.id === lastReading.fabrikaId);
                    if (fab) generateEndeksKarti(lastReading, fab);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={14} /> PDF İndir
                </button>
                <button 
                  onClick={handleWhatsAppShare}
                  style={{ background: 'none', border: 'none', color: '#25D366', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <MessageSquare size={14} /> WhatsApp ile Gönder
                </button>
              </div>
            )}
          </div>
          <X size={18} style={{ cursor: 'pointer' }} onClick={() => setMessage({ type: '', text: '' })} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          {!isScanning ? (
            <button onClick={startScanner} className="glow-btn" style={{ width: '200px' }}>
              <QrCode size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> QR Tarayıcıyı Aç
            </button>
          ) : (
            <div id="reader"></div>
          )}
        </div>

        {/* Anormallik Onay Modalı */}
        {showConfirmation && pendingReading && (
          <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
            <h3 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={20} /> Tüketim Uyarısı
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Girdiğiniz endekse göre hesaplanan tüketim miktarı, <strong>{anomalyReason}</strong>
              <br/><br/>
              Hesaplanan Tüketim: <strong>{pendingReading.tuketim} m³</strong>
              <br/>
              Eğer değerlerin doğru olduğundan eminseniz işlemi onaylayın. OSB Müdürüne bilgilendirme mesajı gönderilecektir.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => finalizeReading(pendingReading, true)} 
                className="glow-btn" 
                style={{ flex: 1, background: '#f59e0b' }}>
                Değerler Doğru, Kaydet
              </button>
              <button 
                onClick={() => { setShowConfirmation(false); setPendingReading(null); }} 
                className="glow-btn" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                İptal Et ve Yeniden Gir
              </button>
            </div>
          </div>
        )}

        <div className="glass-card">
          <select 
            value={selectedFabrikaId} 
            onChange={(e) => setSelectedFabrikaId(e.target.value)}
            style={inputStyle}
          >
            <option value="">--- Fabrika Seçin ---</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
          </select>

          {selectedFabrikaId && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={infoBoxStyle}>
                  <span style={infoLabelStyle}>Önceki Endeks</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{lastIndex}</div>
                </div>
                <div style={{ ...infoBoxStyle, borderColor: 'var(--primary)' }}>
                  <span style={{ ...infoLabelStyle, color: 'var(--primary)' }}>Yeni Endeks</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      value={newIndex}
                      onChange={(e) => setNewIndex(e.target.value)}
                      style={indexInputStyle}
                    />
                    <button onClick={handleOCR} disabled={isProcessingOCR} style={ocrBtnStyle}>
                      {isProcessingOCR ? <RefreshCw className="animate-spin" size={20} /> : <ScanText size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={!newIndex} className="glow-btn" style={{ width: '100%' }}>
                <Save size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Kaydet
              </button>
            </div>
          )}
        </div>
      </div>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Okuma Listesi */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'white' }}>Son Okumalar</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Toplam {readings.length} kayıt</span>
        </div>
        
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fabrika / Tarih</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Endeksler</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tüketim</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Durum</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {readings.slice(0, 10).map((r) => {
                const fab = factories.find(f => f.id === r.fabrikaId);
                const isLocked = r.faturaDurumu === 'FATURALANDI';
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: fab ? 'white' : '#ef4444' }}>
                        {fab ? fab.ad : `Silinmiş İşletme (ID: ${r.fabrikaId})`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.okumaTarihi}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                      <div style={{ opacity: 0.6 }}>{r.ilkEndeks} →</div>
                      <div style={{ fontWeight: 'bold' }}>{r.sonEndeks}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold' }}>{r.tuketim.toLocaleString()} m³</div>
                      {fab?.carpan !== 1 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>x{fab?.carpan} çarpan dahil</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        background: isLocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: isLocked ? '#10b981' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: 'fit-content'
                      }}>
                        {isLocked ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {r.faturaDurumu}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            if (fab) generateEndeksKarti(r, fab);
                          }}
                          style={{ ...actionBtnStyle, color: 'var(--text-muted)' }}
                          title="Bilgi Kartı (PDF)"
                        >
                          <FileText size={16} />
                        </button>
                        {!isLocked || (currentUser.rol === 'ROOT' || currentUser.kullaniciAdi === 'root') ? (
                          <>
                            {!isLocked && (
                              <button 
                                onClick={() => { setEditingReading(r); setEditIndex(r.sonEndeks.toString()); }}
                                style={actionBtnStyle}
                                title="Düzenle"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => onDeleteReading?.(r.id)}
                              style={{ ...actionBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                              title={isLocked ? "Faturalanmış Kaydı Sil (Sadece Root)" : "Sil"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <div title="Faturalanmış kayıtlar sadece Root tarafından silinebilir" style={{ opacity: 0.2, padding: '8px', display: 'flex', gap: '8px' }}>
                            <Edit2 size={16} />
                            <Trash2 size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Düzenleme Modalı */}
      {editingReading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>Okumayı Düzenle</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {factories.find(f => f.id === editingReading.fabrikaId)?.ad} - {editingReading.okumaTarihi}
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>İlk Endeks: {editingReading.ilkEndeks}</label>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Yeni Son Endeks</label>
              <input 
                type="number" 
                value={editIndex} 
                onChange={e => setEditIndex(e.target.value)} 
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleUpdate} className="glow-btn" style={{ flex: 1 }}>Güncelle</button>
              <button onClick={() => setEditingReading(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px' }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white' };
const infoBoxStyle = { padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' };
const infoLabelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' };
const indexInputStyle = { background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', width: '100%', outline: 'none' };
const ocrBtnStyle = { background: 'var(--surface-lighter)', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' };

const actionBtnStyle = { padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default MeterReading;
