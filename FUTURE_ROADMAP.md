# Terminal8 - Gelecek Yol Haritası ve Geliştirme Planı (Future Roadmap)

Bu belge, uygulamanın şu anki MVP (Minimum Viable Product - Minimum Çalışır Ürün) aşamasından çıkıp, tam teşekküllü, güvenli ve ölçeklenebilir bir DeFi/Web3 ürününe dönüşmesi için yapılması gereken teknik geliştirmeleri listeler.

---

## 1. Indexer Mimarisi Kurulması (Kritik Öncelik)
Şu anki yapıda kullanıcı işlemlerinin veritabanına işlenmesi, frontend'in `POST /sync` isteğine bağlıdır. Bu durum dışarıdan manipülasyona açıktır ve güvensizdir.

- **Yapılacaklar:**
  - Stellar Horizon'un `transactions` veya `effects` stream'lerini dinleyen arka plan (background) worker'ları veya microservice yazılması.
  - Sadece Terminal8 uygulaması üzerinden değil, dışarıdan (örneğin doğrudan Freighter cüzdanı içinden) yapılan yatırma/çekme işlemlerinin bile yakalanıp `user_positions` tablosuna işlenmesi.
  - Eksik veya yarım kalan işlemleri tamamlayacak "Senkronizasyon (Reconciliation)" CRON job'larının yazılması.

## 2. Soroban (Akıllı Sözleşme) Entegrasyonu
Stellar ağına yeni eklenen Soroban (Smart Contracts) yetenekleriyle, klasik AMM (Otomatik Piyasa Yapıcı) işlemlerini daha akıllı hale getirebiliriz.

- **Yapılacaklar:**
  - Havuzlara yatırılan fonları doğrudan Stellar'ın yerel AMM'lerine değil, kendi yazdığımız özel veya getiri optimize edici (Yield Optimizer/Vault) Soroban sözleşmelerine yönlendirmek.
  - Kullanıcıların fonlarını belirli bir süre kilitli tutmalarını sağlayan (Staking/Locking) veya işlem ücretlerinden ekstra pay aldıran özel mekanizmalar.

## 3. Gerçek Fiyatlama ve Oracle Entegrasyonu (Pricing Service)
Mevcut sistemde fiyatları Stellar Dex üzerinden (Trade history) VWAP (Hacim Ağırlıklı Ortalama) hesaplayarak çekiyoruz. Ancak likiditesi düşük veya hiç işlemi olmayan havuzlarda fiyat "0" veya hatalı gelebilir.

- **Yapılacaklar:**
  - **Band Protocol**, **Pyth Network** veya Stellar destekli diğer merkeziyetsiz Oracle'ların sisteme entegre edilmesi.
  - Fiyat manipülasyonu (Flash Loan vb.) saldırılarına karşı fiyatların farklı merkeziyetsiz borsalardan (DEX) çapraz doğrulanması (Price Aggregation).

## 4. İleri Düzey Risk Skorlaması (Risk Scoring V2)
Sistemin şu anki risk modülü TVL, Yaş, Hacim ve Trustline gibi temel metrikleri analiz ediyor.

- **Yapılacaklar:**
  - Token oluşturan hesapların (Issuer) sicilini analiz eden yapılar (Daha önce rug-pull yapmış bir adres mi?).
  - Varlıkların cüzdan dağılımını (Token Concentration) analiz eden Gini katsayısı hesaplamaları. Örneğin: "Bu havuzdaki tokenların %90'ı tek bir kişinin elinde, riskli!"
  - Sosyal medya ve duyarlılık (Sentiment) analizi (Twitter/Telegram verileri).

## 5. Tam Donanımlı Portföy ve Performans Yönetimi
Mevcut durumda portföy yönetimi, kullanıcının o anki varlıklarını gösteriyor.

- **Yapılacaklar:**
  - **Impermanent Loss (Kalıcı Olmayan Kayıp)** hesaplamalarının geçmiş verilerle grafiğe dökülmesi.
  - Average Cost Basis (Ortalama Maliyet) takibi ile kullanıcının havuzdan anlık olarak yüzde kaç gerçek kâr/zarar (Realized & Unrealized PnL) ettiğinin detaylı analizi.
  - Yatırımların zamana göre değişimini gösteren (Portfolio History) zaman çizelgeleri.

## 6. Güvenli ve Modern Bir Frontend Mimarisi
Test amaçlı yazılan HTML dosyası yerine, büyük çaplı bir modern web uygulaması yapısı.

- **Yapılacaklar:**
  - React, Next.js veya Vue.js kullanılarak component bazlı, tip güvenli (TypeScript) bir mimari kurulması.
  - `@stellar/freighter-api` entegrasyonlarının React Context/Zustand gibi state manager'lar ile tüm uygulamaya güvenli şekilde yayılması.
  - Kullanıcı dostu, animasyonlu, mobil uyumlu (Responsive) dashboard arayüzleri.
