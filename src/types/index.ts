export interface Yetkili {
  adSoyad: string;
  telefon: string;
}

export interface Fabrika {
  id: string;
  ad: string;
  sahibi: string;
  yetkililer: Yetkili[];
  sayacNo: string;
  carpan: number;
  aktif: boolean;
  borc: number;
  sonOkumaTarihi: string;
  acilisEndeksi?: number;
  adres?: string;
  telefon?: string;
  tarifeler?: TarifeDilimi[];
}

export interface TarifeDilimi {
  ad: 'Gunduz' | 'Puant' | 'Gece';
  baslangicSaat: string;
  bitisSaat: string;
  carpan: number;
}

export interface SayacOkuma {
  id: string;
  fabrikaId: string;
  okumaTarihi: string;
  ilkEndeks: number;
  sonEndeks: number;
  tuketim: number;
  okuyanPersonel: string;
  faturaDurumu: 'BEKLIYOR' | 'TAHAKKUK_EDILDI' | 'FATURALANDI';
  hesaplananTutar?: number;
  muhasebeAktarildi?: boolean;
  tarifeliTuketim?: {
    gunduz: number;
    puant: number;
    gece: number;
  };
}

export interface Fatura {
  id: string;
  fabrikaId: string;
  donem: string;
  tutar: number;
  kdv: number;
  toplamTutar: number;
  sonOdemeTarihi: string;
  durum: 'ODENDI' | 'BEKLIYOR' | 'GECIKMIS';
  tip: 'ELEKTRIK' | 'AIDAT';
  muhasebeAktarildi?: boolean;
}

export interface Odeme {
  id: string;
  fabrikaId: string;
  tutar: number;
  tarih: string;
  yontem: 'BANKA' | 'NAKIT';
  faturaId?: string;
}

export interface Kullanici {
  id: string;
  kullaniciAdi: string;
  sifre: string;
  adSoyad: string;
  unvan: string;
  rol: 'ROOT' | 'YONETIM_KURULU' | 'OSB_MUDURU' | 'IDARI_PERSONEL' | 'SAHA_PERSONELI';
  sifreDegistirilmeli: boolean;
}

export interface Bildirim {
  id: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  ilgiliFabrikaId?: string;
  ilgiliSayacOkumaId?: string;
}

export interface LogKaydi {
  id: string;
  kullaniciId: string;
  kullaniciAdSoyad: string;
  islem: string;
  detay: string;
  tarih: string; // GG.AA.YYYY SS:DD
}

export interface Ayarlar {
  otomatikTahakkuk: boolean;
  elektrikBirimFiyat: number;
  aidatBirimFiyat: number;
  odemeVadesi: number; // Gün cinsinden
}