import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Fabrika, SayacOkuma, Fatura } from '../types';
import { ROBOTO_FONT, ROBOTO_BOLD_FONT } from './font';

// Türkçe karakterleri PDF uyumlu hale getiren yardımcı fonksiyon
const tr = (text: any = '') => {
  if (text === null || text === undefined) return '';
  return text.toString();
};

const setupTurkishFont = (doc: any) => {
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_FONT);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_FONT);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  
  doc.setFont('Roboto', 'normal');
};

// Türkçe karakterleri desteklemek için font ayarı ve logo desteği
export const generateEndeksKarti = (reading: SayacOkuma, factory: Fabrika) => {
  try {
    const doc = new jsPDF();
    setupTurkishFont(doc);
    const now = new Date().toLocaleString('tr-TR');



    // Logo Kısmı (Gerçek logo.png)
    try {
      doc.addImage('/logo.png', 'PNG', 15, 8, 20, 20);
    } catch (e) {
      // Fallback
      doc.setFillColor(194, 130, 71);
      doc.rect(15, 12, 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('OSB', 16, 20);
    }

    // Header - Antet
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(tr('ŞUHUT OSB YÖNETİM PLATFORMU'), 105, 20, { align: 'center' });



    
    doc.setFontSize(14);
    doc.text(tr('ENDEKS DETAY BILGI KARTI'), 105, 30, { align: 'center' });
    
    doc.setDrawColor(194, 130, 71);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Fabrika Bilgileri
    doc.setFontSize(12);
    doc.text(tr('FABRIKA BILGILERI'), 20, 45);
    
    const factoryData = [
      [tr('Fabrika Adı'), tr(factory.ad)],
      [tr('Sayaç No'), tr(factory.sayacNo)],
      [tr('Çarpan'), `x${factory.carpan}`],
      [tr('İşletme Sahibi'), tr(factory.sahibi)],
      [tr('Adres'), tr(factory.adres || 'Şuhut OSB')]
    ];

    autoTable(doc, {
      startY: 50,
      body: factoryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, font: 'Roboto' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // Okuma Bilgileri
    const currentY = (doc as any).lastAutoTable?.finalY || 100;
    doc.text(tr('OKUMA DETAYLARI'), 20, currentY + 15);

    const readingData = [
      [tr('Okuma Tarihi'), reading.okumaTarihi],
      [tr('İlk Endeks'), `${reading.ilkEndeks.toLocaleString()} (Index)`],
      [tr('Son Endeks'), `${reading.sonEndeks.toLocaleString()} (Index)`],
      [tr('Toplam Tüketim'), `${reading.tuketim.toLocaleString()} m³`],
      [tr('Okuyan Personel'), tr(reading.okuyanPersonel)]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 20 || 120,
      head: [[tr('Açıklama'), tr('Değer')]],
      body: readingData,
      theme: 'striped',
      headStyles: { fillColor: [194, 130, 71] },
      styles: { fontSize: 10, font: 'Roboto' }
    });

    // Alt Bilgi
    const finalY = (doc as any).lastAutoTable?.finalY + 20 || 200;
    doc.setFontSize(10);
    doc.text(tr('Bu belge bilgi amaclidir ve muhasebe islemleri icin duzenlenmistir.'), 20, finalY);
    doc.text(tr(`Olusturma Tarihi: ${now}`), 20, finalY + 6);
    
    // Save PDF
    doc.save(`${tr(factory.ad).replace(/\s/g, '_')}_Endeks_Karti.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  }
};

export const generateTahakkukRaporu = (invoices: Fatura[], factories: Fabrika[], readings: SayacOkuma[]) => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    setupTurkishFont(doc);
    const now = new Date().toLocaleString('tr-TR');



    // Sayfa Kenarlığı
    doc.setDrawColor(194, 130, 71);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 287, 200);

    // Header Arka Planı
    doc.setFillColor(30, 41, 59);
    doc.rect(5, 5, 287, 35, 'F');

    // Logo Kısmı
    try {
      doc.addImage('/logo.png', 'PNG', 15, 8, 24, 24);
    } catch (e) {
      doc.setFillColor(194, 130, 71);
      doc.rect(15, 12, 12, 12, 'F');
    }

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(tr('ŞUHUT OSB YÖNETİM PLATFORMU'), 148, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(194, 130, 71);
    doc.text(tr('TOPLU TAHAKKUK VE MUHASEBE AKTARIM RAPORU'), 148, 30, { align: 'center' });


    // Rapor Bilgileri
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.text(tr('RAPOR DETAYLARI'), 10, 50);
    doc.setFont('Roboto', 'normal');
    doc.text(tr(`Olusturma Tarihi: ${now}`), 10, 56);
    doc.text(tr(`Islenen Kayit Sayisi: ${invoices.length}`), 10, 62);

    const tableData = invoices.map(inv => {
      const fab = factories.find(f => f.id === inv.fabrikaId);
      // Faturaya ait okumayı bul (Dönem bazlı eşleştirme)
      const read = readings.find(r => 
        r.fabrikaId === inv.fabrikaId && 
        (r.okumaTarihi.includes(inv.donem.split(' ')[0]) || r.okumaTarihi.includes(inv.donem.split(' ')[1]))
      );
      
      return [
        tr(fab?.ad || '-'),
        tr(inv.donem),
        read?.ilkEndeks.toLocaleString() || '-',
        read?.sonEndeks.toLocaleString() || '-',
        `x${fab?.carpan || 1}`,
        `${read?.tuketim.toLocaleString() || '0'} m³`,
        `${inv.tutar.toLocaleString('tr-TR')} TL`,
        `${inv.kdv.toLocaleString('tr-TR')} TL`,
        `${inv.toplamTutar.toLocaleString('tr-TR')} TL`,
        read?.okumaTarihi || '-',
        inv.sonOdemeTarihi
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [[tr('Fabrika Adı'), tr('Dönem'), tr('İlk Endeks'), tr('Son Endeks'), tr('Çarpan'), tr('Tüketim'), tr('Matrah'), tr('KDV'), tr('Toplam'), tr('Okuma Tarihi'), tr('Son Ödeme')]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [194, 130, 71], 
        textColor: 255, 
        fontSize: 8,
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle',
        font: 'Roboto'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' },
        9: { halign: 'center' },
        10: { halign: 'center' }
      }
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.toplamTutar, 0);
    const finalY = (doc as any).lastAutoTable?.finalY + 15 || 250;
    
    // Toplam Kutusu
    doc.setFillColor(248, 250, 252);
    doc.rect(210, finalY - 8, 80, 15, 'F');
    doc.setDrawColor(194, 130, 71);
    doc.rect(210, finalY - 8, 80, 15, 'S');

    doc.setFontSize(12);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(tr(`GENEL TOPLAM: ${totalAmount.toLocaleString('tr-TR')} TL`), 285, finalY, { align: 'right' });

    // İmza Alanı
    const signY = finalY + 40;
    doc.setFontSize(10);
    doc.text(tr('OSB MUDURU'), 40, signY, { align: 'center' });
    doc.text(tr('MUHASEBE ONAY'), 160, signY, { align: 'center' });
    doc.line(20, signY + 2, 60, signY + 2);
    doc.line(140, signY + 2, 180, signY + 2);

    doc.save(`Muhasebe_Aktarim_Raporu_${now.replace(/[:\s]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Report Generation Error:', error);
    alert('Rapor oluşturulurken bir hata oluştu.');
  }
};

const addDetailedPage = (doc: jsPDF, inv: Fatura, fab: Fabrika, reading?: SayacOkuma, unitPrice: number = 7.70) => {
  doc.addPage();
  
  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 40, 'F');
  
  try {
    doc.addImage('/logo.png', 'PNG', 15, 8, 24, 24);
  } catch (e) {}

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  const isAidat = inv.tip === 'AIDAT';
  doc.text(tr(isAidat ? 'ŞUHUT OSB AİDAT TAHAKKUK BELGESİ' : 'ŞUHUT OSB FATURA DETAYI'), 115, 25, { align: 'center' });

  // Bilgiler
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(tr('ABONE:'), 20, 55);
  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text(tr(fab.ad), 20, 62);
  
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(tr(`SAYAC NO: ${fab.sayacNo}`), 20, 68);
  doc.text(tr(`ADRES: ${fab.adres || 'ŞUHUT OSB'}`), 20, 74);

  doc.text(tr('DETAYLAR'), 140, 55);
  doc.text(tr(`ID: ${inv.id}`), 140, 62);
  doc.text(tr(`DÖNEM: ${inv.donem}`), 140, 68);
  doc.text(tr(`VADE: ${inv.sonOdemeTarihi}`), 140, 74);


  const tableBody = isAidat ? [
    [tr('İşlem Tipi'), tr('AYLIK SABİT AİDAT')],
    [tr('Hizmet Dönemi'), tr(inv.donem)],
    [tr('Açıklama'), tr('Yönetim Giderleri ve Aidat Bedeli')],
    [tr('Matrah'), `${inv.tutar.toLocaleString('tr-TR')} TL`],
    [tr('KDV (%20)'), `${inv.kdv.toLocaleString('tr-TR')} TL`],
    [{ content: tr('GENEL TOPLAM'), styles: { fontStyle: 'bold' } }, { content: `${inv.toplamTutar.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
  ] : [
    [tr('İlk Endeks'), reading ? `${reading.ilkEndeks.toLocaleString()} (Index)` : '-'],
    [tr('Son Endeks'), reading ? `${reading.sonEndeks.toLocaleString()} (Index)` : '-'],
    [tr('Çarpan Katsayısı'), `x${fab.carpan}`],
    [tr('Toplam Tüketim'), reading ? `${reading.tuketim.toLocaleString()} m³` : '-'],
    [tr('Birim Fiyat'), `${unitPrice.toLocaleString('tr-TR')} TL/m³`], 
    [tr('Matrah'), `${inv.tutar.toLocaleString('tr-TR')} TL`],
    [tr('KDV (%20)'), `${inv.kdv.toLocaleString('tr-TR')} TL`],
    [{ content: tr('TOPLAM'), styles: { fontStyle: 'bold' } }, { content: `${inv.toplamTutar.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
  ];

  autoTable(doc, {
    startY: 85,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [194, 130, 71] },
    columnStyles: { 1: { halign: 'right' } },
    styles: { fontSize: 9, font: 'Roboto' }
  });
};

export const generateMuhasebeAktarimRaporu = (invoices: Fatura[], factories: Fabrika[], readings: SayacOkuma[]) => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Yatay yapalım ki tüm kolonlar sığsın
    setupTurkishFont(doc);
    const now = new Date().toLocaleString('tr-TR');

    // Kapak / Özet Sayfası
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 50, 'F');
    
    try {
      doc.addImage('/logo.png', 'PNG', 15, 10, 30, 30);
    } catch (e) {}

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(tr('ŞUHUT OSB MUHASEBE AKTARIM RAPORU'), 148, 25, { align: 'center' });
    doc.setFontSize(14);
    doc.text(tr(`Tarih: ${now} | Toplam Aktarilan Kayit: ${invoices.length}`), 148, 38, { align: 'center' });

    const summaryData = invoices.map(inv => {
      const fab = factories.find(f => f.id === inv.fabrikaId);
      const isAidat = inv.tip === 'AIDAT';
      
      const donemParts = (inv.donem || '').split(' ');
      const read = !isAidat ? readings.find(r => 
        r.fabrikaId === inv.fabrikaId && 
        (r.okumaTarihi.includes(donemParts[0]) || (donemParts[1] && r.okumaTarihi.includes(donemParts[1])) || r.okumaTarihi.includes(inv.donem))
      ) : null;
      
      return [
        tr(fab?.ad || '-'),
        tr(inv.donem),
        isAidat ? tr('SABIT') : `${read?.tuketim.toLocaleString('tr-TR') || '0'} m³`,
        `${inv.tutar.toLocaleString('tr-TR')} TL`,
        `${inv.kdv.toLocaleString('tr-TR')} TL`,
        `${inv.toplamTutar.toLocaleString('tr-TR')} TL`,
        tr(inv.tip === 'AIDAT' ? 'Aidat' : 'Su')
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: [[tr('Fabrika'), tr('Dönem'), tr('Tüketim'), tr('Matrah'), tr('KDV'), tr('Toplam Tutar'), tr('Tip')]],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [194, 130, 71], halign: 'center' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' }
      },
      styles: { font: 'Roboto', fontSize: 9 }
    });

    const total = invoices.reduce((sum, inv) => sum + inv.toplamTutar, 0);
    const finalY = (doc as any).lastAutoTable?.finalY + 15;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(200, finalY - 8, 87, 15, 'F');
    doc.setDrawColor(194, 130, 71);
    doc.rect(200, finalY - 8, 87, 15, 'S');

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(tr(`GENEL TOPLAM: ${total.toLocaleString('tr-TR')} TL`), 282, finalY, { align: 'right' });

    // Detay Sayfaları (Detay sayfaları dikey formatta olsun)
    invoices.forEach(inv => {
      const fab = factories.find(f => f.id === inv.fabrikaId);
      const isAidat = inv.tip === 'AIDAT';
      const donemParts = (inv.donem || '').split(' ');
      
      const reading = !isAidat ? readings.find(r => 
        r.fabrikaId === inv.fabrikaId && 
        (r.okumaTarihi.includes(donemParts[0]) || (donemParts[1] && r.okumaTarihi.includes(donemParts[1])) || r.okumaTarihi.includes(inv.donem))
      ) : undefined;

      if (fab) {
        doc.addPage('a4', 'p'); // Dikey sayfa ekle
        addDetailedPage(doc, inv, fab, reading, 7.70); // 7.70 varsayılan su bedeli
      }
    });

    doc.save(`Muhasebe_Aktarim_Raporu_${now.replace(/[:\s]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Muhasebe Rapor Hatası:', error);
    alert('Rapor PDF dosyası oluşturulurken bir teknik hata oluştu.');
  }
};

export const generateFaturaPDF = (invoice: Fatura, factory: Fabrika, reading?: SayacOkuma, unitPrice: number = 7.70) => {
  try {
    const doc = new jsPDF();
    setupTurkishFont(doc);




    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo Kısmı (Gerçek logo.png)
    try {
      doc.addImage('/logo.png', 'PNG', 15, 8, 24, 24);
    } catch (e) {
      // Fallback if logo not found
      doc.setFillColor(194, 130, 71);
      doc.rect(15, 12, 12, 12, 'F');
    }

    const isAidat = invoice.tip === 'AIDAT';
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(tr(isAidat ? 'ŞUHUT OSB AİDAT TAHAKKUK BELGESİ' : 'ŞUHUT OSB SU FATURASI DÖKÜMÜ'), 115, 25, { align: 'center' });


    // Bilgiler
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(tr('SAYIN ABONE:'), 20, 55);
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text(tr(factory.ad), 20, 65);
    
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(tr(`SAYAC NO: ${factory.sayacNo}`), 20, 72);
    doc.text(tr(`ADRES: ${factory.adres || 'ŞUHUT OSB'}`), 20, 78);

    doc.text(tr('FATURA DETAYLARI'), 140, 55);
    doc.text(tr(`FATURA NO: ${invoice.id}`), 140, 62);
    doc.text(tr(`DÖNEM: ${invoice.donem}`), 140, 68);
    doc.text(tr(`SON ÖDEME: ${invoice.sonOdemeTarihi}`), 140, 74);

    // Tablo (Endeks Bilgileri Dahil)
    const tableBody = isAidat ? [
      [tr('İşlem Tipi'), tr('AYLIK SABİT AİDAT')],
      [tr('Hizmet Dönemi'), tr(invoice.donem)],
      [tr('Açıklama'), tr('Yönetim Giderleri ve Aidat Bedeli')],
      [tr('Matrah'), `${invoice.tutar.toLocaleString('tr-TR')} TL`],
      [tr('KDV (%20)'), `${invoice.kdv.toLocaleString('tr-TR')} TL`],
      [{ content: tr('GENEL TOPLAM'), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, { content: `${invoice.toplamTutar.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }]
    ] : [
      [tr('İlk Endeks'), reading ? `${reading.ilkEndeks.toLocaleString()} (Index)` : '-'],
      [tr('Son Endeks'), reading ? `${reading.sonEndeks.toLocaleString()} (Index)` : '-'],
      [tr('Çarpan Katsayısı'), `x${factory.carpan}`],
      [tr('Toplam Tüketim'), reading ? `${reading.tuketim.toLocaleString()} m³` : '-'],
      [tr('Birim Fiyat'), `${unitPrice.toLocaleString('tr-TR')} TL/m³`], 
      [tr('Su Tüketim Bedeli (Matrah)'), `${invoice.tutar.toLocaleString('tr-TR')} TL`],
      [tr('KDV (%20)'), `${invoice.kdv.toLocaleString('tr-TR')} TL`],
      [{ content: tr('GENEL TOPLAM'), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, { content: `${invoice.toplamTutar.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }]
    ];

    autoTable(doc, {
      startY: 90,
      head: [[tr('AÇIKLAMA'), tr('BİLGİ / TUTAR')]],

      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [194, 130, 71] },
      columnStyles: { 1: { halign: 'right' } },
      styles: { fontSize: 9, font: 'Roboto' }
    });

    const finalY = (doc as any).lastAutoTable?.finalY + 20 || 180;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('Roboto', 'normal');
    doc.text(tr('Bu fatura sistem tarafından otomatik oluşturulmuştur.'), 105, finalY, { align: 'center' });

    doc.save(`${tr(factory.ad).replace(/\s/g, '_')}_Fatura.pdf`);
  } catch (error) {
    console.error('Invoice PDF Error:', error);
  }
};

export const sendWhatsAppMessage = (phone: string, message: string) => {
  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone.startsWith('90') ? '' : '90'}${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
