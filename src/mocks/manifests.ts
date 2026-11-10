export interface ExportManifest {
  manifestId: string;
  batchId: string;
  exporter: string;
  commodity: string;
  weightMt: number;
  containerNo: string;
  destination: string;
  customsStatus: 'NPE RELEASED' | 'PEB FILED' | 'INSPECTION REQUIRED';
  quarantineStatus: 'KT-12 ISSUED' | 'INSPECTION PENDING' | 'HOLD';
  vesselEta: string;
}

export const mockManifests: ExportManifest[] = [
  {
    manifestId: 'EXP-2026-LPG-0091',
    batchId: '#KOP-LBG-2026-0891',
    exporter: 'Koperasi Produsen Kopi Ulubelu Tanggamus',
    commodity: 'Kopi Robusta Grade 1',
    weightMt: 24.5,
    containerNo: 'TGHU 710294-2',
    destination: 'Rotterdam (NLRTM)',
    customsStatus: 'NPE RELEASED',
    quarantineStatus: 'KT-12 ISSUED',
    vesselEta: '11 Nov 04:00 WIB',
  },
  {
    manifestId: 'EXP-2026-LPG-0092',
    batchId: '#KOP-LBG-2026-0892',
    exporter: 'CV Bukit Barisan Mandiri Liwa',
    commodity: 'Kopi Robusta Asalan',
    weightMt: 22.0,
    containerNo: 'MSKU 882103-9',
    destination: 'Hamburg (DEHAM)',
    customsStatus: 'PEB FILED',
    quarantineStatus: 'INSPECTION PENDING',
    vesselEta: '11 Nov 08:30 WIB',
  },
  {
    manifestId: 'EXP-2026-LPG-0093',
    batchId: '#LAD-SKD-2026-0120',
    exporter: 'PT Lada Nusantara Jaya Sukadana',
    commodity: 'Lada Hitam Lampung',
    weightMt: 18.4,
    containerNo: 'CMAU 440918-1',
    destination: 'Antwerp (BEANR)',
    customsStatus: 'NPE RELEASED',
    quarantineStatus: 'KT-12 ISSUED',
    vesselEta: '11 Nov 12:00 WIB',
  },
  {
    manifestId: 'EXP-2026-LPG-0094',
    batchId: '#KAK-TGG-2026-0341',
    exporter: 'Koperasi Kakao Sejahtera Tanggamus',
    commodity: 'Biji Kakao Fermentasi',
    weightMt: 20.0,
    containerNo: 'TCKU 551092-4',
    destination: 'Genoa (ITGOA)',
    customsStatus: 'NPE RELEASED',
    quarantineStatus: 'KT-12 ISSUED',
    vesselEta: '12 Nov 02:00 WIB',
  },
  {
    manifestId: 'EXP-2026-LPG-0095',
    batchId: '#CPO-MES-2026-0044',
    exporter: 'PT Agro Sawit Perkasa Mesuji',
    commodity: 'Crude Palm Oil (CPO)',
    weightMt: 28.0,
    containerNo: 'ISO-TANK 99214',
    destination: 'Rotterdam (NLRTM)',
    customsStatus: 'NPE RELEASED',
    quarantineStatus: 'KT-12 ISSUED',
    vesselEta: '12 Nov 06:00 WIB',
  },
];

