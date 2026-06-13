# Terminal8 - Stellar Liquidity Pool Management System API

Bu doküman, Terminal8 projesinin backend API'sine ait endpoint'leri, bunların ne işe yaradığını ve nasıl kullanılacağını açıklar. Proje genel olarak **NestJS** üzerinde çalışır ve dökümantasyon için aynı zamanda [Swagger UI](http://localhost:3000/api/docs) kullanılmaktadır.

---

## 1. Yetkilendirme (Auth) Modülü

Terminal8 geleneksel e-posta/şifre yerine, **Stellar Public Key** ve imza (SEP-10 benzeri) mekanizması ile çalışır.

### `GET /auth/challenge`
Kullanıcının cüzdanıyla giriş yapabilmesi için imzalaması gereken rastgele bir işlem (challenge transaction) üretir.
- **Parametre:** `?publicKey=<STELLAR_PUBLIC_KEY>`
- **Yanıt:** Base64 formatında imzalanmamış XDR `transaction` ve `networkPassphrase`.

### `POST /auth/verify`
Kullanıcının cüzdanında (örn: Freighter) imzaladığı işlemi doğrular ve geçerliyse sisteme erişim için JWT Token döner. Diğer tüm güvenli endpoint'lere (`/api/v1/transactions/build`, `/api/v1/portfolio/*`) bu token ile istek atılır.
- **Body:**
  ```json
  {
    "signedXdr": "AAAAAgAAAAB..."
  }
  ```
- **Yanıt:** `{ "accessToken": "eyJhb..." }`

---

## 2. Scout Modülü (Havuz Verileri)

Horizon API'den çekilen havuzların ve günlük durumlarının (snapshot) yönetildiği yerdir.

### `GET /api/v1/pools`
Tüm aktif likidite havuzlarını sayfalayarak listeler. En çok güven hattına (trustline) sahip havuzlar en üstte gelir.
- **Parametreler (İsteğe Bağlı):** `?page=1&limit=50`
- **Örnek İstek:** `GET /api/v1/pools?page=1&limit=10`

### `GET /api/v1/pools/:id`
Sadece belirli bir havuzun güncel verilerini getirir.
- **Parametre:** `id` (Havuzun 64 karakterlik ID'si)

### `POST /api/v1/pools/snapshot`
Horizon ağındaki ticaret (trade) hacimlerinden gerçek piyasa fiyatlarını (VWAP) hesaplayarak tüm aktif havuzlar için anlık bir TVL ve Hacim fotoğrafı (snapshot) alır. Normalde her gece yarısı otomatik çalışır, ancak manuel tetiklemek için bu endpoint kullanılır.
- **Girdi:** Yok. Süreç arka planda asenkron başlar.

---

## 3. Risk Modülü

Havuzların güvenilirliğini Trust (Güven), TVL (Derinlik), Volatilite ve APY skorlarına göre hesaplar.

### `GET /api/v1/pools/:id/risk`
Belirli bir havuzun detaylı risk karnesini döner. Eğer skor veritabanında yoksa, anında (on-the-fly) hesaplar.
- **Yanıt:**
  ```json
  {
    "trustScore": 100,
    "tvlScore": 80,
    "volatilityScore": 95,
    "apyScore": 50,
    "compositeScore": 85.5,
    "riskLevel": "LOW",
    "estimatedApy": 0.15
  }
  ```

### `GET /api/v1/pools/level/:level`
Sadece belirli bir risk sınıfına (`LOW`, `MEDIUM`, `HIGH`) sahip havuzları listeler. Sayfalama destekler. En güvenliden en riskliye doğru sıralar.
- **Örnek İstek:** `GET /api/v1/pools/level/LOW?page=1&limit=20`

---

## 4. Orchestrator Modülü (İşlem İnşası)

Yatırım yapma (Deposit) veya yatırımı geri çekme (Withdraw) işlemleri için ham XDR inşa eder. Bu modül özel anahtar (Private Key) barındırmaz, işlemleri kullanıcının cüzdanının imzalaması için hazırlar.
*(Bu endpoint JWT Token gerektirir)*

### `POST /api/v1/transactions/build`
Slippage (fiyat kayması) toleransını hesaplayarak, ilgili havuza güvenli bir giriş veya çıkış işlemi oluşturur. Havuzun risk seviyesi `HIGH` ise güvenlik duvarı işlemi reddeder.

- **Header:** `Authorization: Bearer <TOKEN>`

#### Örnek 1: Havuza Likidite Ekleme (DEPOSIT)
Yatırım yaparken havuza eklemek istediğiniz maksimum A ve B varlığı miktarını belirtirsiniz. Havuzun mevcut oranına göre bu varlıkların bir kısmı kullanılır. `slippageBps` (baz puan, 50 = %0.5) ile havuz oranındaki ani değişimlere karşı tolerans belirlenir.
- **Body:**
  ```json
  {
    "poolId": "e1f3... (64 karakterlik havuz ID)",
    "action": "DEPOSIT",
    "amountA": "100.5",     // Eklenmek istenen A varlığı (Örn: XLM)
    "amountB": "250.0",     // Eklenmek istenen B varlığı (Örn: USDC)
    "slippageBps": 50       // %0.5 opsiyonel fiyat kayması toleransı
  }
  ```

#### Örnek 2: Havuzdan Çıkış Yapma (WITHDRAW)
Likiditeyi geri çekerken, A veya B varlığının miktarını DEĞİL, iade etmek istediğiniz **havuz payı miktarını (shares)** belirtirsiniz. `slippageBps` parametresi, bu pay karşılığında almayı beklediğiniz minimum A ve B miktarlarını sizin yerinize otomatik hesaplar ve işlemi bu sınırlarla korumaya alır.
- **Body:**
  ```json
  {
    "poolId": "e1f3... (64 karakterlik havuz ID)",
    "action": "WITHDRAW",
    "shareAmount": "5.25",  // Havuzdan bozdurmak istediğiniz pay (shares) miktarı
    "slippageBps": 100      // %1 opsiyonel fiyat kayması toleransı (minimum beklenen dönüşü hesaplar)
  }
  ```

- **Yanıt (Her iki işlem için):**
  ```json
  {
    "xdr": "AAAAAgAAAAB...", // Freighter veya Albedo gibi cüzdanlarda imzalanacak ham işlem formatı
    "networkPassphrase": "Public Global Stellar Network ; September 2015" // İşlemin imzalanması gereken ağ
  }
  ```

---

## 5. Portfolio Modülü (Kullanıcı Varlıkları)

Kullanıcının sisteme bağladığı cüzdanla ilişkili pozisyonları, PnL (Kâr/Zarar) ve IL (Kalıcı Olmayan Kayıp) hesaplamalarını yönetir.
*(Bu endpoint JWT Token gerektirir)*

### `GET /api/v1/portfolio/:publicKey`
Belirtilen cüzdan adresinin tüm havuzlardaki mevcut durumunu, toplam USD değerini ve detaylı pozisyon performansını anlık piyasa fiyatlarıyla hesaplayarak döner.
- **Header:** `Authorization: Bearer <TOKEN>`
- **Yanıt:** Toplam Kâr/Zarar, toplam USD değeri ve pozisyonların detaylı listesi.
