---
name: lampung-commodity-hub-design
description: Design system dan panduan UI/UX untuk "Lampung Commodity Hub - Agri-Export GIS Tracker", platform command center logistik ekspor komoditas (kopi robusta, lada hitam, kakao, CPO) di koridor Bandar Lampung - Pelabuhan Panjang - JTTS. Gunakan skill ini setiap kali user meminta membuat, memperluas, mereview, atau mengkode halaman/layar/komponen HTML + Tailwind untuk dashboard City Command & GIS, Driver Console & E-Pass, Port Gate & Inspection Console, EUDR Traceability Portal, Digital Commodity Passport, papan telemetri reefer/IoT/MQTT, peta operasi SVG, antrian virtual gate, manifest karantina (Barantin/BKHIT), atau prompt Google Stitch untuk produk ini. Gunakan juga saat user berkata "buat halaman baru", "tambah modul", "samakan gayanya", "konsisten dengan dashboard sebelumnya", "gaya command center / tactical dashboard", atau meminta UI GIS-logistik-pelabuhan-EUDR bergaya serupa, walaupun nama produk tidak disebut.
---

# Lampung Commodity Hub — Design System

Dashboard operasional bergaya **tactical command center**: padat data, tenang, tegas, dan mudah dipindai petugas dalam hitungan detik. Dibangun dengan **Tailwind CDN + Material Symbols + Inter + JetBrains Mono**. Seluruh halaman memakai token warna Material 3 yang sama, sehingga halaman baru harus terlihat seperti bagian dari satu sistem.

## 1. Prinsip Desain

1. **Borderless depth** — pemisahan area dilakukan dengan *lapisan warna tonal* (`surface-container-*`) dan bayangan halus, **bukan garis border**. Border hanya untuk konteks insiden/error (`border border-error-container`) dan divider tipis dalam header kartu (`border-b border-surface-container-high`).
2. **Data-first** — angka, ID, plat nomor, suhu, koordinat selalu `font-mono-*` (JetBrains Mono). Teks naratif memakai Inter.
3. **Status lewat warna semantik** — hijau-teal = normal/lolos, merah = kritis/ditolak, navy gelap = konteks aktif/netral. Jangan pakai warna lain untuk status.
4. **Padat tapi bernapas** — ukuran teks kecil (10–14px), jarak antar elemen memakai token spacing (xs/sm/md), kartu `rounded-xl`.
5. **Bilingual terkontrol** — label struktural & istilah teknis berbahasa Inggris (Gate Congestion, Cold-Chain, Telemetry); teks operasional/SOP/aksi petugas berbahasa Indonesia (Kunci Gate Pass, Konfirmasi & Eksekusi, Waktu Operasional).
6. **Selalu terasa "live"** — dot berdenyut, ping, jam real-time, badge `LIVE FEED`, hash/checksum, latency (ms). Lihat bagian 8.

## 2. Setup Wajib (head & tailwind config)

Setiap halaman memakai head berikut. Jangan mengganti nama token.

```html
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta content="web_dashboard" name="shell-type"/> <!-- portal publik: "web_standard" -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>@layer base{html,body{margin:0;padding:0;}body{overscroll-behavior:none;}main>:first-child{margin-top:0!important;}main>:last-child{margin-bottom:0!important;}}::-webkit-scrollbar{display:none;}</style>
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">
tailwind.config={darkMode:"class",theme:{extend:{
colors:{
"background":"#f8f9ff","surface":"#f8f9ff","surface-bright":"#f8f9ff","surface-dim":"#cbdbf5",
"surface-container-lowest":"#ffffff","surface-container-low":"#eff4ff","surface-container":"#e5eeff",
"surface-container-high":"#dce9ff","surface-container-highest":"#d3e4fe","surface-variant":"#d3e4fe",
"on-surface":"#0b1c30","on-surface-variant":"#44474d","on-background":"#0b1c30",
"outline":"#75777e","outline-variant":"#c5c6cd","surface-tint":"#515f78",
"inverse-surface":"#213145","inverse-on-surface":"#eaf1ff","inverse-primary":"#b9c7e4",
"primary":"#000000","on-primary":"#ffffff","primary-container":"#0d1c32","on-primary-container":"#76849f",
"primary-fixed":"#d6e3ff","primary-fixed-dim":"#b9c7e4","on-primary-fixed":"#0d1c32","on-primary-fixed-variant":"#39475f",
"secondary":"#006a61","on-secondary":"#ffffff","secondary-container":"#86f2e4","on-secondary-container":"#006f66",
"secondary-fixed":"#89f5e7","secondary-fixed-dim":"#6bd8cb","on-secondary-fixed":"#00201d","on-secondary-fixed-variant":"#005049",
"tertiary":"#000000","on-tertiary":"#ffffff","tertiary-container":"#002113","on-tertiary-container":"#009668",
"tertiary-fixed":"#6ffbbe","tertiary-fixed-dim":"#4edea3","on-tertiary-fixed":"#002113","on-tertiary-fixed-variant":"#005236",
"error":"#ba1a1a","on-error":"#ffffff","error-container":"#ffdad6","on-error-container":"#93000a"},
borderRadius:{"DEFAULT":"0.25rem","lg":"0.5rem","xl":"0.75rem","full":"9999px"},
spacing:{"margin-mobile":"0.75rem","gutter":"1rem","space-xl":"2rem","space-lg":"1.25rem","space-sm":"0.5rem","space-xs":"0.25rem","margin":"1.5rem","space-md":"0.75rem","gutter-mobile":"0.5rem"},
fontFamily:{"label-sm":["JetBrains Mono"],"mono-metric":["JetBrains Mono"],"mono-code":["JetBrains Mono"],"mono-data":["JetBrains Mono"],
"headline-lg":["Inter"],"headline-md":["Inter"],"headline-sm":["Inter"],"body-sm":["Inter"],"body-md":["Inter"],"body-lg":["Inter"],"label-md":["Inter"],"headline-lg-mobile":["Inter"]},
fontSize:{
"label-sm":["10px",{lineHeight:"12px",fontWeight:"600"}],
"mono-metric":["20px",{lineHeight:"24px",fontWeight:"700"}],
"mono-code":["11px",{lineHeight:"14px",fontWeight:"400"}],
"mono-data":["13px",{lineHeight:"18px",fontWeight:"500"}],
"headline-lg":["32px",{lineHeight:"40px",fontWeight:"700"}],
"headline-lg-mobile":["24px",{lineHeight:"32px",fontWeight:"700"}],
"headline-md":["22px",{lineHeight:"28px",fontWeight:"600"}],
"headline-sm":["18px",{lineHeight:"24px",fontWeight:"600"}],
"body-lg":["16px",{lineHeight:"24px",fontWeight:"400"}],
"body-md":["14px",{lineHeight:"20px",fontWeight:"400"}],
"body-sm":["12px",{lineHeight:"16px",fontWeight:"400"}],
"label-md":["12px",{lineHeight:"16px",fontWeight:"600"}]}
}}};
</script></head>
<body class="bg-surface font-body-md text-on-surface antialiased">
```

> Catatan: `space-md` = **0.75rem** (bukan 1rem), `space-sm` = 0.5rem, `space-xs` = 0.25rem, `space-lg` = 1.25rem, `space-xl` = 2rem, `margin` = 1.5rem, `gutter` = 1rem. Ingat urutan ini saat menghitung jarak.

## 3. Peran Warna

| Peran | Token | Pemakaian |
|---|---|---|
| Kanvas halaman | `bg-surface` | `body`, `main` |
| Sidebar / strip header halaman / baris tabel hover | `bg-surface-container-low` | Sidebar, console header, sel mini di dalam kartu |
| **Kartu utama** | `bg-surface-container-lowest` (putih) | Semua kartu, panel, modal |
| Chip netral, divider tonal, hover item | `surface-container` / `surface-container-high` | Tombol sekunder, badge netral |
| **Panel gelap (command)** | `bg-primary-container` (#0d1c32) | Command strip, peta GIS, popup telemetri, badge ID batch |
| Normal / sukses / aksi utama | `secondary` (#006a61), `secondary-container` | Angka "OK", badge `OK`, tombol Approve, progress bar |
| Aksen terang di atas panel gelap | `secondary-fixed`, `tertiary-fixed`, `tertiary-fixed-dim` | Teks hijau neon di peta/header gelap |
| Kritis / error | `error`, `error-container`, `on-error-container` | Excursion, Reject, Audit Hold |
| Teks sekunder | `on-surface-variant` | Label, subjudul, metadata |
| Teks di panel gelap | `text-surface-bright`, `text-inverse-on-surface`, `text-on-primary-container` (redup) | |
| CTA primer hitam | `bg-primary text-on-primary` | Tombol "Re-verify", "Download DDS" |

Aturan:
- Latar belakang tinted: gunakan opacity (`bg-error-container/30`, `bg-surface-container-lowest/10`, `bg-primary-container/90`) untuk overlay & baris alert.
- Pada panel gelap peta (`#0c1626`, `#082038`) boleh memakai hex gelap khusus untuk elemen SVG kartografi.
- Jangan memakai warna di luar palet (tanpa biru cerah, oranye, ungu). "Amber/oranye" dalam teks hanya konsep; tampilkan dengan `surface-container-high` atau tanda ikon.

## 4. Tipografi

| Kelas | Ukuran | Dipakai untuk |
|---|---|---|
| `font-headline-lg text-headline-lg` | 32/40 bold | Judul portal publik (H1) |
| `font-headline-md text-headline-md` | 22/28 semibold | Judul section portal, nama komoditas batch |
| `font-headline-sm text-headline-sm` | 18/24 semibold | Judul kartu/panel |
| `font-body-md text-body-md` | 14/20 | Paragraf, nav sidebar |
| `font-body-sm text-body-sm` | 12/16 | Teks tabel, deskripsi kecil |
| `font-label-md text-label-md` | 12/16 semibold (Inter) | Tombol, nama orang, label nav atas |
| `font-label-sm text-label-sm` | 10/12 semibold (**mono**) | Label kecil UPPERCASE, caption, judul KPI |
| `font-mono-metric text-mono-metric` | 20/24 bold | Angka KPI besar, jam, hitungan |
| `font-mono-data text-mono-data` | 13/18 medium | Nilai data di dalam sel/kartu kecil |
| `font-mono-code text-mono-code` | 11/14 regular | ID, plat, koordinat, status pill, log, hash |

Pola teks:
- Judul KPI: `font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant`
- Eyebrow section: `font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold`
- ID/plat: `font-mono-code text-mono-code font-bold text-on-surface`
- Unit di sebelah angka: `font-mono-code text-mono-code text-on-surface-variant` (mis. `MT / 24H`, `/ 5.0 INDEX`)
- Ukuran arbitrer yang dipakai sah: `text-[9px]` (label mikro di popup), `text-[10px]`, `text-[11px]`, `text-[12px]`.

## 5. Layout Shell

### 5.1 Dashboard internal (`shell-type: web_dashboard`)

```
<header>  fixed top-0 w-full z-50 h-16  bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]
<aside>   fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface-container-low z-40
<div class="pl-64"> <main class="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)">…</main> <footer/> </div>
```

**Header** (`px-margin`, `gap-gutter`), urutan kiri→kanan:
1. Logo `h-8` + dua baris teks: `font-label-md uppercase tracking-tight` ("Lampung Commodity Hub") dan `font-label-sm text-on-surface-variant` (subjudul modul, mis. "Agri-Export GIS Tracker").
2. Pill status sistem (`hidden xl:flex`) di `bg-surface-container-low rounded-lg`, isi chip putih: `PostGIS: Active (5.4ms)` dengan dot `bg-secondary animate-pulse`, `MQTT Ingest: 15.2k req/s`, `GPS Fleet Lock: 148 Nodes`.
3. Pill lokasi (`hidden md:flex`): ikon `hub` + "Bandar Lampung Central & Panjang Corridor".
4. Search (`hidden lg:block max-w-xs`): input mono, `bg-surface-container-low`, ikon `search`, placeholder `Batch #KOP-LBG... / BE 8920 YU`.
5. Kanan: badge alert `bg-error-container text-on-error-container` (mis. "2 Temp Alerts"), `WIB UTC+7 / Live Command`, avatar `w-8 h-8 rounded-full`, nama + jabatan (`hidden 2xl:flex`).

**Sidebar**: label seksi "Operational Modules" (`label-sm uppercase tracking-wider`), 4 item nav, lalu kartu status pelabuhan di bawah (`mx-space-sm rounded-lg bg-surface-container-lowest`) berisi `Pelabuhan Panjang` + dot hijau dan status berth (`Berth 04: Loading CPO`, `Berth 02: Kopi Robusta`).

Item nav (urutan & ikon tetap):
| Label | `data-path` | Ikon |
|---|---|---|
| City Command & GIS | `city-command-and-gis-logistics` | `dashboard` |
| Driver Console & E-Pass | `driver-console-and-e-pass` | `local_shipping` |
| Port Gate & Inspection | `port-gate-and-inspection-console` | `dock` |
| EUDR Traceability | `public-and-buyer-eudr-traceability-portal` | `verified` |

- Item biasa: `flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all`
- Item **aktif**: tambahkan kelas dari `data-active-classes` pada `<nav>`: `bg-primary-container text-on-primary-container font-bold rounded-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]` (ganti `text-on-surface-variant`).
- Halaman baru: tambahkan item nav hanya bila memang modul baru, dengan pola identik.

**Footer** (semua halaman): `bg-surface-container-lowest py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]`, kiri: `Pemkot Bandar Lampung • Pelindo Panjang • Universitas Teknokrat Indonesia (UTI)`, kanan: `Copyright © 2026 by Tim Pengembang dan Dr. Erliyan Redy Susanto, M.Kom`.

### 5.2 Portal publik / buyer (`shell-type: web_standard`)

- Header sama, tetapi **tanpa sidebar**; nav horizontal `hidden md:flex` dengan item yang sama (`px-space-sm py-space-xs rounded-lg`), kanan: `WIB UTC+7` + `Verified Portal` (teks `text-secondary`).
- Konten: `max-w-5xl mx-auto`, `px-margin py-space-xl`, jarak antar section `gap-space-xl`.
- Section: `bg-surface-container-lowest rounded-xl shadow-md p-space-lg md:p-space-xl flex flex-col gap-space-lg`.
- Footer ditambah blok hak cipta + "Powered by PostgreSQL/PostGIS, Apache Sedona & IoT Lampung Commodity Telematics Engine."

### 5.3 Kanvas konten dashboard

```html
<div class="flex flex-col w-full">
  <!-- 1. Command Strip / Console Header -->
  <div class="w-full p-margin flex flex-col gap-space-lg"> … grid kartu … </div>
</div>
```
Grid umum: KPI `grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter`; split utama `grid-cols-1 lg:grid-cols-12 gap-gutter items-start` (peta `lg:col-span-7`, panel kanan `lg:col-span-5 flex flex-col gap-space-md`); konsol dua kolom `xl:grid-cols-12` dengan masing-masing `xl:col-span-6`.

## 6. Komponen Inti

### 6.1 Command Strip (sub-bar atas halaman City Command)
`bg-primary-container text-on-primary-container px-margin py-space-sm shadow-md flex flex-wrap items-center justify-between gap-gutter`. Kiri: chip status `bg-surface-container-lowest/10 rounded` dengan dot `bg-secondary-fixed animate-ping` + teks mono uppercase (`Corridor State: TACTICAL DISPATCH LOCK`) dan geo-anchor (`hidden xl:inline`). Kanan: metrik dengan ikon (`radar`, `satellite_alt`), pemisah `h-3 w-px bg-on-primary-container/30`, dan chip `Sync: HH:MM:SS WIB`.

### 6.2 Console Header (halaman operator)
`w-full bg-surface-container-low px-margin py-space-md shadow-sm`. Kiri: kotak ikon `w-10 h-10 rounded-xl bg-primary text-on-primary` + judul `headline-sm` + badge mode `bg-secondary text-on-secondary font-mono-code uppercase tracking-wider` + baris petugas (ikon `badge`, `verified_user`) dengan NIP/instansi mono redup. Kanan: panel putih `rounded-xl shadow-sm` berisi 3 kolom (Waktu Operasional jam `mono-metric`, Giliran Shift, Ingate Hari Ini) dipisah `w-px h-8 bg-surface-container`.

### 6.3 KPI Card
```html
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
  <div class="flex items-start justify-between">
    <div class="flex flex-col">
      <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Daily Export Volume</span>
      <div class="flex items-baseline gap-space-xs mt-space-xs">
        <span class="font-mono-metric text-mono-metric text-on-surface font-bold">14,250</span>
        <span class="font-mono-code text-mono-code text-on-surface-variant font-semibold">MT / 24H</span>
      </div>
    </div>
    <span class="font-mono-code text-mono-code px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">+12.4% vs yday</span>
  </div>
  <!-- opsional: sparkline / mini grid / progress -->
</div>
```
Varian: (a) **sparkline** SVG `viewBox="0 0 200 40" preserveAspectRatio="none"` dengan `stroke="currentColor" text-secondary stroke-width 2.5`, area fill `text-secondary/10`, titik akhir `circle r=3.5`; (b) **mini-stat grid** `grid-cols-2` sel `bg-surface-container-low p-space-xs rounded-lg`; (c) **progress bar** `h-2 bg-surface-container rounded-full` + isi `bg-secondary`; (d) **kartu kritis**: judul dan angka `text-error`, badge `bg-error-container animate-pulse`, daftar item `bg-error-container/30`, tombol aksi `bg-primary-container hover:bg-inverse-surface text-surface-bright`.

### 6.4 Status Pill / Badge
Dasar: `px-space-xs py-0.5 rounded font-mono-code text-mono-code font-bold` (ukuran kecil `text-[10px]`).
| Status | Kelas |
|---|---|
| OK / Verified / Issued | `bg-secondary-container text-on-secondary-container` |
| Netral / Unload / Info | `bg-surface-container-high text-on-surface` |
| Kritis / Excursion | `bg-error text-on-error animate-pulse` |
| Peringatan (error lembut) | `bg-error-container text-error` |
| Aktif/gelap | `bg-primary-container text-surface-bright` |
| Live | `bg-surface-container-high text-secondary` + dot `w-1.5 h-1.5 bg-secondary animate-pulse` |

Mode/jenis lain: pill penuh `rounded-full` (mis. "ZERO DEFORESTATION VERIFIED", `Hydraulic Barrier: LOCKED DOWN`).

### 6.5 Tombol
- Primer hitam: `px-space-sm py-1 bg-primary text-on-primary rounded font-label-md text-label-md flex items-center gap-1`
- Sekunder: `bg-surface-container hover:bg-surface-container-high text-on-surface rounded` (+ ikon `text-sm`)
- Navy/aksi dispatch: `bg-primary-container hover:bg-inverse-surface text-surface-bright`
- Bahaya: `bg-error hover:bg-error/90 text-on-error`
- Filter chip aktif: `bg-secondary-fixed text-on-secondary-fixed` (di panel gelap) atau `bg-primary-container text-surface-bright` (di panel terang); non-aktif: `bg-surface-container-lowest/20` / `bg-surface-container`.
- Selalu sertakan ikon Material Symbols di kiri label; tambahkan `transition-colors`.

### 6.6 Tombol Keputusan Besar (3-way decision matrix)
`grid grid-cols-1 sm:grid-cols-3 gap-space-sm`, tiap tombol `group flex flex-col items-center p-space-md rounded-xl active:scale-[0.98] transition-all`:
1. **Approve** — `bg-secondary text-on-secondary`, ikon `check_circle` di lingkaran `bg-on-secondary/15`, judul UPPERCASE, subjudul Indonesia (`Buka Palang Hijau`), chip bawah (`Fast-Track Lane 3`).
2. **Divert** — `bg-surface-container-high text-on-surface`, ikon `alt_route` di `bg-secondary-container`.
3. **Reject** — `bg-error-container text-on-error-container`, ikon `block` di lingkaran `bg-error text-on-error`.
Ikon dalam: `w-10 h-10 rounded-full … material-symbols-outlined text-2xl group-hover:scale-110 transition-transform`.

### 6.7 Tabel
- Tabel telemetri (mono): `w-full text-left font-mono-code text-mono-code`, `thead tr` `bg-surface-container-low text-on-surface-variant`, `th` `py-space-xs px-space-xs font-semibold`, **tanpa garis antar baris** (`divide-y-0`), baris `hover:bg-surface-container-low transition-colors`.
- Baris alert: `bg-error-container/20 hover:bg-error-container/30`, seluruh teks `text-error`; sel suhu/status `font-bold`.
- Tabel manifest (Inter): `font-body-sm text-body-sm`, header `bg-surface-container text-on-surface-variant font-label-md`, `py-space-xs px-space-sm`; kolom ID `font-mono-code font-bold`, kolom terakhir `text-right`.
- Bungkus selalu `overflow-x-auto w-full`; sel sempit `truncate max-w-[80px]`.
- Sel angka/ID memakai mono; nama koperasi/asal memakai `font-medium` Inter.

### 6.8 Peta Operasi GIS (SVG kartografi)
Kartu `bg-primary-container text-surface-bright rounded-xl overflow-hidden shadow-lg`:
1. **Control strip** `bg-surface-container-lowest/10 backdrop-blur-md`: ikon `public`, judul peta + `PROJ: EPSG:4326 | WGS84 Dynamic Corridor`, filter chip layer (`JTTS Tol`, `Reefer GPS`, `Staging`, `EUDR Forests`).
2. **Kanvas** `relative w-full h-[540px] bg-[#0c1626] overflow-hidden select-none`:
   - grid pattern 40px, stroke `#6bd8cb` width 0.5, `opacity-20`.
   - SVG `viewBox="0 0 800 540"`: air `#082038`, label air mono `letter-spacing=3`; jalan arteri stroke `#39475f` w6 + dash `#89f5e7`; tol JTTS `#005049` w8 + garis `#4edea3` w2.5; dermaga `#1b334d` stroke `#6bd8cb`; zona buffer polygon `#006a61` opacity .35 dash `4 2`; zona EUDR `#002113` opacity .6 stroke `#4edea3`.
   - Node armada: normal `#006a61` r7 stroke `#89f5e7`; kritis `#ba1a1a` r8 stroke `#ffdad6`; masing-masing diberi `circle animate-ping` r14 opacity .2–.4.
   - Label distrik: `#ffffff`/`#b9c7e4`, ukuran 9–10, kelas `font-label-sm`.
3. **Overlay HTML** di atas kanvas: popup telemetri truk (`absolute w-72 bg-primary-container/95 backdrop-blur-md rounded-lg shadow-xl p-space-sm`, grid 2 kolom label `text-[9px] uppercase text-on-primary-container` + nilai), pod status pelabuhan (`absolute bottom-4 right-4`), bar koordinat (`absolute bottom-4 left-4`, `LAT/LON/ZOOM/Corridor Traffic`).
4. **Lower action bar**: `Layers: 6 Vector Active • Spatial Engine: PostGIS 3.4 / pgRouting` + `filter_alt`.

### 6.9 Antrian Virtual Gate
Daftar kartu `p-space-xs bg-surface-container-low rounded-lg hover:bg-surface-container`: lingkaran nomor `w-6 h-6 rounded-full` (1 = `bg-secondary text-on-secondary`, 2 = `bg-primary-container text-surface-bright`, audit = `bg-error-container text-error`), plat bold, komoditas (tonase), jalur (`text-secondary` bila hijau, `text-error` bila hold), kanan: slot waktu mono bold + keterangan (Priority Transit / Buffer Holding / Audit Hold). Footer ringkasan `Buffer Occupancy: 70.8%` dan `Gate Cycle: 4.2 min/truk`.

### 6.10 Pusat Respon Insiden (blok darurat, Bahasa Indonesia)
Kontainer `bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-error-container`.
- Header: kotak ikon `bg-error text-on-error animate-pulse` (`e911_emergency`), judul UPPERCASE bold + badge `REAL-TIME SOP DISPATCH`, subjudul ringkasan insiden dengan dot `animate-ping`, chip `SIAGA TINGKAT 1`, tombol `Broadcast SOP Radio`.
- Dua kartu insiden `bg-surface-container-low rounded-xl p-space-md border border-error-container/40` (kartu non-suhu pakai `border-secondary/20`): badge ID `INSIDEN #INC-TEMP-8412`, tipe, nilai kritis di pill putih, grid detail (Armada & Muatan, Lokasi, Diagnostik IoT), lalu **Protokol Respon SOP Segera** → 3 tombol (1 merah primer `font-bold` + 2 sekunder).
- Footer: status, SLA rata-rata, filter chip (`Semua (3)`, `Suhu (2)`, `Rute/Geofence (1)`, `Segel RFID (0)`), tombol ekspor ke INSW & Dishub.

### 6.11 Panel Kamera ALPR / Scanner
Grid `md:grid-cols-3`: kamera utama `md:col-span-2 relative h-56 rounded-lg overflow-hidden bg-primary-container` + overlay gradien `bg-gradient-to-t from-primary-container/80 via-transparent to-primary-container/30`; plat di plat putih `bg-surface-container-lowest text-primary font-mono-metric`, `OCR CONFIDENCE`, chip `MATCHED`; HUD pojok (`REC // CH-01 INGATE`, `FOV 112° • ISO 200`). Panel QR di samping: gambar + `bg-primary-container/75 backdrop-blur-[2px]`, ikon `qr_code_2`, ID pass, `VALID DRIVER TOKEN`. Di bawahnya dua badge sensor (E-Seal RFID `nfc`, Jembatan Timbang `scale`) `bg-surface-container-low rounded-lg` dengan ikon di kotak `w-9 h-9 bg-surface-container`.

### 6.12 Dossier Batch & Kartu Sertifikasi
- Dossier: badge `BATCH #KOP-LBG-2026-0891` (`bg-primary-container text-inverse-on-surface`) + badge tipe kontainer (`bg-secondary-container`), judul `headline-md`, dua sel `bg-surface-container-low rounded p-space-xs` (Eksportir Terdaftar, Consignee & Pelabuhan Tujuan; baris ketiga mono redup untuk NIB/UN-LOCODE).
- Kartu sertifikasi 3 kolom: header (`KT-12 BKHIT`, `ICO FORM`, `PEB EXPORT` mono `text-secondary font-bold` + ikon `check_circle`), nama dokumen `label-md`, nomor mono redup, footer `border-t border-surface-container` dengan status (`VERIFIED`, `ISSUED`, `NPE RELEASED`) + ikon file.

### 6.13 Kartu EUDR / Polygon
Header kartu: ikon `nature_people` + judul uppercase "EUDR Compliance Engine (EU Reg 2023/1115)" + pill `ZERO DEFORESTATION VERIFIED`. Isi: grid 12 kolom — pratinjau peta `md:col-span-5 h-36 rounded-lg` dengan label centroid dan bar `Polygon Match: KLHK 2020 — 100% OK`; kolom kanan `md:col-span-7` berisi hasil audit (Sentinel-2 & PostGIS, `0.00 Ha`, jarak buffer TNBBS), registri petani, `GeoJSON SHA`, link `Inspect Coordinates`. Status ambigu pakai badge `bg-error-container text-error` + ikon `troubleshoot`.

### 6.14 Grafik Suhu Cold-Chain
Panel `bg-surface-container-low rounded-lg p-space-sm h-24`: label waktu (mono, 3 titik perjalanan) → SVG `viewBox="0 0 600 60" preserveAspectRatio="none"` dengan garis threshold putus-putus (`stroke-dasharray 4 4`, opacity .25), area `fill-opacity .12`, garis spline `stroke-width 2.5`, titik riwayat `fill-surface-container-lowest`, titik terakhir `fill-secondary animate-pulse` → footer (`Zero Excursions Detected`, `SHA-256 IoT Ledger` dengan ikon `lock`). Header kartu menunjukkan `Threshold: Max 22.0°C` dan `CURR: 18.2°C`.

### 6.15 Modal Konfirmasi Keputusan
Overlay `fixed inset-0 z-50 bg-primary-container/60 backdrop-blur-sm hidden items-center justify-center p-space-md`; kotak `bg-surface-container-lowest w-full max-w-md rounded-xl p-space-lg shadow-2xl border border-surface-container-high`. Isi: ikon bulat (warna sesuai aksi), judul `headline-sm`, subjudul mono, paragraf `body-md text-on-surface-variant`, tombol `Batal` (`bg-surface-container-low`) dan tombol konfirmasi berwarna aksi. Buka dengan `classList.remove('hidden'); add('flex')`. Teks konfirmasi selalu menjelaskan **dampak nyata** (palang terbuka 45 detik, tiket oranye dicetak, manifest dibatalkan).

### 6.16 Portal Publik: Hero Passport, Provenance Timeline, Metric Tiles
- Banner atas `bg-primary-container py-space-xs px-margin`: `POSTGIS GEODATA SYNC: OK`, `EU REGULATION (EU) 2023/1115 READY`, `BLOCK HASH: 0x9F41...89A0`, link `Verify Cryptographic Node`.
- Hero: pill `bg-tertiary-container text-tertiary-fixed` "EUDR 100% Compliant • Zero Deforestation", pill DDS ID, H1 "Digital Commodity Passport", ID batch `mono-metric text-secondary`, kotak "Audit Timestamp" kanan; 4 sel ringkasan `grid-cols-2 md:grid-cols-4` (Batch Payload, Protected Origin, Harvest Window, Export Maritime Leg); 3 tombol (primer hitam, sekunder, `bg-secondary-container`).
- Peta geofence: kontainer `min-h-[380px] bg-inverse-surface`, gambar `opacity-80`, polygon SVG `fill-tertiary-fixed/30 stroke-tertiary-fixed dasharray 4 2` dengan titik verteks `stroke-secondary` dan `drop-shadow-[0_0_8px_rgba(78,222,163,0.8)]`; header & footer gradien dari `primary-container`.
- Tabel audit dalam `bg-surface-container-low rounded-lg p-space-sm`; kolom: Audit Parameter, Regulatory Standard, Verified Observation, Compliance State (ikon `check_circle` + teks `text-secondary`).
- **Provenance timeline**: wadah `relative` dengan garis vertikal `before:absolute before:left-4 md:before:left-6 before:w-0.5 before:bg-surface-container-high`; tiap langkah = lingkaran ikon `w-8 h-8 md:w-12 md:h-12 rounded-full bg-secondary text-on-secondary` (langkah terakhir/akan datang `bg-primary text-on-primary`) + kartu `bg-surface-container-low rounded-lg p-space-md` (langkah terakhir `bg-surface-container-high`) berisi judul bernomor, timestamp mono, narasi, dan baris bukti `text-secondary` dengan ikon.
- Metric tiles 4 kolom (Moisture, SCA Cupping Score, Cold-Chain Index, Carbon Footprint): `bg-surface-container-lowest p-space-lg rounded-xl shadow-md`, ikon `text-secondary text-xl`, angka `mono-metric`, caption `text-secondary font-medium`, progress `h-1.5`.
- Sertifikasi: grid 5 kolom, ikon `text-3xl text-secondary` + nama `headline-sm` + kode mono.
- Konsorsium: grid 4 kolom institusi (Pemerintah Kota, Pelindo Regional 2, Univ. Teknokrat Indonesia, Disperindag Lampung) + kotak hash `break-all` mono.

## 7. Spacing, Radius, Elevasi

- Padding halaman: `p-margin` (1.5rem); antar section dashboard: `gap-space-lg`; antar kartu dalam grid: `gap-gutter`; antar elemen dalam kartu: `gap-space-xs` / `gap-space-sm` / `gap-space-md`.
- Padding kartu: `p-space-md` (dashboard) atau `p-space-lg md:p-space-xl` (portal publik).
- Radius: kartu `rounded-xl`, tombol & sel mini `rounded` / `rounded-lg`, pill `rounded-full`.
- Elevasi: kartu `shadow-sm` (hover `shadow-md`), panel gelap `shadow-lg`, popup `shadow-xl`, modal `shadow-2xl`, header `shadow-[0_1px_8px_rgba(0,0,0,0.04)]`. Tidak ada outline/ring pada kartu biasa.
- Scrollbar disembunyikan global (`::-webkit-scrollbar{display:none}`).

## 8. Motion & Interaksi

| Efek | Kelas | Untuk |
|---|---|---|
| Berdenyut lembut | `animate-pulse` | Dot status sistem, `LIVE FEED`, badge CRITICAL, titik data terakhir |
| Ping radar | `animate-ping` | Dot command strip, node armada di peta, kamera REC, insiden aktif |
| Hover kartu | `hover:shadow-md transition-shadow` | KPI card |
| Hover baris/item | `hover:bg-surface-container-low transition-colors` | Tabel, antrian |
| Tekan tombol | `active:scale-[0.98] transition-all` | Tombol keputusan |
| Ikon hover | `group-hover:scale-110 transition-transform` | Ikon tombol besar |

Gunakan animasi hanya pada elemen yang memang "hidup" atau kritis; jangan menganimasikan konten statis.

JS ringan (vanilla, tanpa framework): jam real-time `setInterval(…,1000)` yang menulis `HH:MM:SS <span class="font-label-sm text-label-sm text-secondary">WIB</span>`, simulasi update telemetri, dan modal konfirmasi. Bungkus dalam IIFE atau `DOMContentLoaded`.

## 9. Ikon

Material Symbols Outlined: `<span class="material-symbols-outlined text-sm">nama</span>`. Ukuran: `text-xs` (12), `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl/3xl` untuk tombol/hero. Ikon domain yang dipakai: `dashboard`, `local_shipping`, `dock`, `verified`, `verified_user`, `sensors`, `pin_drop`, `hub`, `search`, `warning`, `radar`, `satellite_alt`, `satellite`, `public`, `thermostat`, `device_thermostat`, `cell_tower`, `local_parking`, `lan`, `forest`, `nature_people`, `park`, `troubleshoot`, `fact_check`, `qr_code_scanner`, `qr_code_2`, `nfc`, `scale`, `alt_route`, `block`, `mic`, `print`, `badge`, `sensor_door`, `check_circle`, `lock`, `lock_open`, `e911_emergency`, `notification_important`, `wrong_location`, `share_location`, `send_to_mobile`, `anchor`, `directions_boat`, `eco`, `precision_manufacturing`, `approval_delegation`, `water_drop`, `award_star`, `co2`, `handshake`, `health_and_safety`, `science`, `apartment`, `school`, `gavel`, `download`, `refresh`, `polyline`, `shield`, `open_in_new`, `lock_clock`, `file_download_done`, `picture_as_pdf`, `groups`.

## 10. Konten & Data Dummy (konsistensi domain)

Pakai data realistis lokal agar halaman baru terasa satu produk:
- **Lokasi**: Bandar Lampung (Tanjung Karang, Rajabasa, Sukarame, Natar), Pelabuhan Panjang (Berth 01–04, Gate 1–3), JTTS Tol Bakauheni–Terbanggi Besar (KM 0–82, KM 42, KM 96), Soekarno-Hatta Bypass, Teluk Lampung; asal komoditas: Liwa/Lampung Barat, Sukadana/Lampung Timur, Tanggamus/Ulubelu, TNBBS.
- **Plat**: format `BE 8920 YU`, `BE 8412 AA`, `BE 9021 BB`, `BE 7731 QA`, `BE 9104 YB`.
- **ID**: batch `#KOP-LBG-2026-0891`, manifest `#EXP-2026-LPG-0091`, insiden `#INC-TEMP-8412` / `#INC-GEO-9021`, pass `PASS-2026-X8919`, seal `SEAL-DIGI-9921`, tag `TAG-991204`, DDS `EU-DDS-2026-ID-09941`, sertifikat `KT-12`, `ICO-ID-26-881`, `NPE-00918-KPU`.
- **Komoditas**: Kopi Robusta (dominan), Lada Hitam, Kakao, Kopi Arabika Ulubelu, CPO.
- **Instansi**: Pelindo, BKHIT/Barantin, Bea Cukai, INSW, Dishub, Ditlantas, KLHK, Disperindag, Pemkot Bandar Lampung, UTI.
- **Regulasi & istilah**: EUDR (EU Reg 2023/1115), cut-off 31 Des 2020, DDS, Sentinel-2, PostGIS 3.4, pgRouting, MQTT, E-Seal RFID, ALPR, TOS, PEB/NPE, phytosanitary, reefer, TEU.
- **Ambang suhu**: normal 17–19°C, batas toleransi 20–22°C; excursion contoh +24.2°C.
- **Zona waktu**: WIB UTC+7; jam format `HH:MM:SS`.
- Angka berformat Inggris dengan koma ribuan (`14,250`, `24,500 KG`), satuan huruf besar mono (`MT / 24H`, `KG`, `TEU/h`, `km/h`).

## 11. Alur Kerja Saat Membuat Halaman Baru

1. **Tentukan shell**: modul internal → `web_dashboard` + sidebar; portal publik/buyer → `web_standard`, `max-w-5xl`.
2. **Salin head + tailwind config** persis dari bagian 2, lalu header/sidebar/footer dari bagian 5 (set item nav aktif sesuai halaman).
3. **Susun konten** dari komponen bagian 6: mulai dari command strip atau console header, lalu baris KPI, lalu split utama, lalu blok sekunder (insiden/manifest).
4. **Pilih warna semantik** (bagian 3) berdasarkan status data; satu halaman minimal menunjukkan satu elemen "hidup" (dot, ping, jam).
5. **Isi data dummy** domain (bagian 10); campur teks Inggris (struktural) dan Indonesia (aksi/SOP).
6. **Responsif**: `grid-cols-1` di mobile → `md:`/`lg:`/`xl:`; tabel dalam `overflow-x-auto`; elemen header sekunder `hidden xl:flex` / `hidden md:flex`. Sidebar dashboard bersifat tetap (desktop-first); jangan membuat varian mobile untuk sidebar kecuali diminta.
7. **Periksa ulang**: tidak ada border dekoratif, semua angka/ID mono, tidak ada warna di luar palet, footer & hak cipta ada.

## 12. Larangan (Anti-pattern)

- Jangan memakai border/outline untuk memisah kartu; gunakan lapisan tonal.
- Jangan memakai font lain selain Inter dan JetBrains Mono, atau ikon selain Material Symbols.
- Jangan memakai gradien dekoratif pada kartu (gradien hanya untuk overlay keterbacaan di atas foto/peta).
- Jangan memakai warna hex ad-hoc di luar token, kecuali di dalam SVG peta/diagram yang sudah memiliki palet kartografi (bagian 6.8).
- Jangan mencampur status: hijau-teal hanya untuk normal/lolos; merah hanya untuk kritis/ditolak/ditahan.
- Jangan menulis angka KPI dengan Inter; jangan menulis paragraf panjang dengan mono.
- Jangan menghapus teks hak cipta footer atau mengganti branding "Lampung Commodity Hub".
- Jangan menambahkan elemen interaktif palsu tanpa umpan balik: tombol aksi berdampak (gate, kunci pass, reject) wajib melalui modal konfirmasi.

## 13. Template Awal Halaman Baru (kerangka minimal)

```html
<body class="bg-surface font-body-md text-on-surface antialiased">
  <header class="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">…</header>
  <aside class="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface-container-low z-40 flex flex-col justify-between py-space-md">…</aside>
  <div class="pl-64">
    <main class="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)]">
      <div class="flex flex-col w-full">
        <!-- Command strip / console header -->
        <div class="w-full p-margin flex flex-col gap-space-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter"><!-- KPI cards --></div>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            <div class="lg:col-span-7"><!-- peta / panel utama --></div>
            <div class="lg:col-span-5 flex flex-col gap-space-md"><!-- tabel & antrian --></div>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm"><!-- tabel manifest / insiden --></div>
        </div>
      </div>
    </main>
    <footer class="w-full bg-surface-container-lowest py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">…</footer>
  </div>
</body>
```

## 14. Prompt Google Stitch (ringkas)

> "Desktop web dashboard, light Material-3 tonal palette (surface #f8f9ff, cards white, command panels navy #0d1c32, teal secondary #006a61 for OK status, red #ba1a1a for critical). Inter for text, JetBrains Mono for all numbers, IDs, plates, coordinates. Borderless cards with tonal layering and soft shadows, rounded-xl. Fixed top header 64px with system-status pills (PostGIS, MQTT, GPS), fixed left sidebar 256px with 4 modules (City Command & GIS, Driver Console & E-Pass, Port Gate & Inspection, EUDR Traceability). Tactical command-center feel: pulsing live dots, mono telemetry tables, dark SVG cartographic map of Bandar Lampung–Pelabuhan Panjang with JTTS toll corridor, reefer truck nodes, EUDR zones. Operational text in Bahasa Indonesia, structural labels in English. Footer: Pemkot Bandar Lampung • Pelindo Panjang • Universitas Teknokrat Indonesia (UTI)."
