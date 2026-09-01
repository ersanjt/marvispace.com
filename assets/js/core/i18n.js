/**
 * Storefront i18n — Turkey sees Turkish, everyone else English.
 */

export const LANG_COOKIE = 'marvispace_lang';

const STRINGS = {
  en: {
    skip: 'Skip to main content',
    homeAria: 'MARVISPACE home',
    filtersAria: 'Product filters',
    filterNew: 'NEW',
    filterMens: 'MENS',
    filterWomens: 'WOMENS',
    filterFootwear: 'JACKETS',
    filterAccessories: 'ACCESSORIES',
    filterSale: 'SALE',
    cartAria: 'Cart',
    cartDrawerAria: 'Shopping cart',
    closeCart: 'Close cart',
    orderSummary: 'Order Summary',
    cartEmpty: 'Your cart is empty',
    discountCode: 'MARVISPACE code',
    discountPlaceholder: 'Enter code',
    discountAria: 'Discount code',
    apply: 'Apply',
    checkout: 'Checkout',
    catalogAria: 'Product catalog',
    previewAria: 'Product detail',
    prevProduct: 'Previous product',
    nextProduct: 'Next product',
    addToCart: 'Add to cart',
    selectSize: 'SELECT SIZE',
    adding: 'ADDING',
    restocks: 'RESTOCKS IN 4 WEEKS',
    sizeGuide: 'Size guide',
    closeSize: 'Close size selector',
    confirmSize: 'Confirm size',
    back: 'Back',
    morePerRow: 'Show more products per row',
    fewerPerRow: 'Show fewer products per row',
    storeUnavailable: 'Store is temporarily unavailable.',
    legal: 'Legal',
    social: 'Social',
    help: 'Help',
    contact: 'Contact',
    contactSupport: 'Contact support',
    orderStatus: 'Order Status',
    terms: 'Terms',
    privacy: 'Privacy',
    accessibility: 'Accessibility',
    cookies: 'Cookies',
    tagline: 'Premium Leather Apparel',
    langAria: 'Language',
    filterEmpty: 'No products in this collection yet.',
    seoStoryTitle: 'Istanbul leather apparel',
    seoStoryLead: 'MARVISPACE designs premium leather jackets, coats, shirts and accessories in Istanbul. Shop men’s and women’s collections with 3D Secure checkout and a 14-day return window.',
    seoFaq1Q: 'Where are MARVISPACE leather jackets made?',
    seoFaq1A: 'The collection is made in our Istanbul workshop. Orders usually ship within 3–7 business days.',
    seoFaq2Q: 'What is the return window?',
    seoFaq2A: 'You can withdraw and return within 14 days of delivery. Full terms are on the returns page.',
    seoFaq3Q: 'Is checkout secure?',
    seoFaq3A: 'Card payments run through 3D Secure with Ziraat Bank or iyzico Paynet. Card details are not stored on our servers.',
    seoFaq4Q: 'Which sizes do you sell?',
    seoFaq4A: 'Jackets and coats are available in XS–XXL (EU 34–44). Choose a size on each product page.',
    trust: 'Istanbul leather workshop · 14-day returns · Secure 3D payment',
    places: 'Istanbul workshop · Alanya · Antalya',
    etbis: 'ETBİS Registry',
    returns: 'Returns',
    newsletterAria: 'Receive website updates',
    newsletterTitle: 'Receive website updates',
    newsletterClose: 'Close',
    newsletterEmail: 'Email address',
    newsletterPlaceholder: 'Email Address',
    newsletterConsent: 'I consent to receive MARVISPACE email marketing. Consent is not required for purchase. Read our privacy policy to learn about your rights and our use of your personal information.',
    newsletterPrivacy: 'privacy policy',
    subscribe: 'Subscribe',
    newsletterInvalid: 'Please enter a valid email address.',
    newsletterThanks: 'Thanks — you are subscribed.',
    newsletterError: 'Could not subscribe. Please try again.',
    cookieAria: 'Cookie notice',
    cookieText: 'This site uses cookies for service quality and traffic analysis. See the Privacy Notice and Cookie Policy for details.',
    cookieAccept: 'Accept',
    cookieReject: 'Essential only',
    cookiePrivacy: 'Privacy Notice',
    cookiePolicy: 'Cookie Policy',
    whatsapp: 'Support',
    whatsappAria: 'WhatsApp support',
    whatsappHello: 'Hello, I need help with my MARVISPACE order.',
    size: 'Size',
    qty: 'Qty',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shippingNext: '3–7 BUSINESS DAYS',
    shippingPromise: '3–7 business days from Istanbul',
    vatIncluded: 'VAT included',
    taxes: 'Taxes',
    total: 'Total',
    materials: '100% PREMIUM MATERIALS',
    ships: 'SHIPS FROM ISTANBUL · 3–7 BUSINESS DAYS · VAT INCLUDED',
    imageN: 'Image',
    sizeUs: 'Size US',
    langTr: 'TR',
    langEn: 'EN',
    checkoutLoading: 'Loading your cart…',
    checkoutContact: 'Contact Information',
    checkoutEmail: 'Email Address',
    checkoutSubscribe: 'Subscribe to updates and notifications',
    checkoutShipping: 'Shipping Address',
    checkoutFirst: 'First Name',
    checkoutLast: 'Last Name',
    checkoutAddress: 'Address',
    checkoutAddress2: 'Apartment, Suite, Unit, etc. (Optional)',
    checkoutCity: 'City',
    checkoutCountry: 'Country',
    checkoutState: 'State / Province',
    checkoutZip: 'Zip / Postal Code',
    checkoutPhone: 'Phone Number',
    checkoutPayment: 'Payment',
    checkoutBilling: 'Billing Address',
    checkoutLegal: 'Legal consents',
    checkoutPlace: 'Place order',
    checkoutPayUnavailable: 'Payment unavailable',
    checkoutCompleteDetails: 'Complete details to pay',
    checkoutEnterCard: 'Enter card details',
    checkoutAddressPh: 'Start typing your address…',
    checkoutAddress2Ph: 'Apartment, suite, unit, floor, etc.',
    checkoutCardUnavailable: 'Card payment is not available yet',
    checkoutCardUnavailableText: 'We are finishing payment setup. Please check back soon or email support if you need help.',
    checkoutPaymentNotice: 'Complete your shipping details above to continue to payment.',
    checkoutCard: 'Credit / Debit Card',
    checkoutCardHolder: 'Cardholder name',
    checkoutCardNumber: 'Card number',
    checkoutExpiryMonth: 'Expiry month',
    checkoutExpiryYear: 'Expiry year',
    checkoutSecurity: 'Security code',
    checkoutBillingWarn: 'Billing address must match that on file with your card issuer to successfully proceed.',
    checkoutBillingSame: 'Use shipping address as billing address',
    checkoutDeliveryNote: 'Turkey cargo, 3–7 business days from our Istanbul workshop. Prices include VAT.',
    checkoutAcceptRead: '— I have read and accept.',
    checkoutAcceptKvkk: '— I have read this notice and consent to processing of my personal data.',
    checkoutLegalNeeded: 'Please accept the legal documents to continue.',
    checkoutPaymentFailed: 'Payment was not completed. Please review your card details and try again.',
    checkoutCardInvalid: 'Enter valid card details to continue.',
    checkoutLoadError: 'Could not load checkout.',
    checkoutCartError: 'Could not load cart.',
    checkoutItemOne: '1 item',
    checkoutItems: '{n} items',
    checkoutTaxId: 'Tax ID (Optional)',
    checkoutTaxNote: 'Turkish ID number (TCKN) or VAT number required',
    checkoutTaxWarn: 'You must include tax ID for your order to ship. If you do not include it now, we will send an email requesting it before your order is released.',
    backAria: 'Back to store',
    contactPageTitle: 'Contact',
    contactKicker: 'Atelier',
    contactHeadline: 'Visit the workshop.',
    contactLead: 'Leather is cut in Kağıthane. See it in Alanya and Antalya. We reply within 1–2 business days.',
    contactName: 'Name',
    contactEmail: 'Email',
    contactMessage: 'Message',
    contactSend: 'Send',
    contactHours: 'Hours: Monday–Friday 09:00–18:00 (TR)',
    contactHoursShort: 'Mon–Fri 09:00–18:00 (TR)',
    contactHoursLabel: 'Hours',
    contactPhoneLabel: 'Phone',
    contactFormTitle: 'Write to us',
    contactDirectAria: 'Phone, email, and hours',
    contactWhatsApp: 'WhatsApp',
    contactWhatsAppAction: 'Chat',
    contactBack: 'Shop',
    contactNavLine: 'Istanbul · Alanya · Antalya',
    contactStillAlt: 'MARVISPACE red leather jacket',
    contactLookbookKicker: 'Look',
    contactLookbookAria: 'Collection lookbook',
    contactLookbookPause: 'Pause',
    contactLookbookPlay: 'Play',
    contactMerchantSummary: 'Seller information',
    locationWorkshop: 'Workshop',
    locationShowroom: 'Showroom',
    contactRequired: 'Please enter your name.',
    contactEmailInvalid: 'Please enter a valid email address.',
    contactMessageShort: 'Please write a little more so we can help.',
    contactSending: 'Sending…',
    contactThanks: 'Your message was sent. We will reply within 1–2 business days.',
    contactError: 'Could not send. Please email support@marvispace.com.',
    locationsAria: 'MARVISPACE locations',
    locationsTitle: 'Workshop & stores',
    locationsLead: 'MARVISPACE sells online. Leather is made at the Istanbul Kağıthane workshop; Alanya and Antalya are showrooms.',
    locationMap: 'Map',
    legalNavAria: 'Legal documents',
    legalDistanceSales: 'Distance sales',
    legalPreInfo: 'Pre-contract information',
    merchantAria: 'Seller information',
    merchantTitle: 'Seller information',
    merchantTrade: 'Legal name',
    merchantBrand: 'Brand',
    merchantAddress: 'Address',
    merchantPhone: 'Phone',
    merchantEmail: 'Email',
    merchantTax: 'Tax office / No',
    merchantMersis: 'MERSİS',
    merchantRegistry: 'Trade registry',
    merchantKep: 'KEP',
    merchantAuthorized: 'Authorized person',
    privacyPageTitle: 'Privacy',
    privacyLead: 'This notice explains how MARVISPACE processes personal data as data controller, including under Turkish Law No. 6698 (KVKK).',
    privacyH2Data: '1. Personal data we process',
    privacyData1: 'Identity and contact: name, email, phone, address',
    privacyData2: 'Order and payment: order details, invoice data, payment verification records (card details are not stored on our servers)',
    privacyData3: 'Security: IP, browser, session, and 3D Secure logs',
    privacyData4: 'Marketing (with consent): newsletter signups',
    privacyH2Purpose: '2. Purpose and legal basis',
    privacyPurpose1: 'Forming and performing the contract (distance sales, delivery, invoicing)',
    privacyPurpose2: 'Payment provider and bank integration, fraud prevention',
    privacyPurpose3: 'Legal obligations (consumer law, e-commerce, tax)',
    privacyPurpose4: 'Marketing communications with your explicit consent',
    privacyH2Transfer: '3. Transfers',
    privacyTransfer: 'Your data may be shared with payment providers (Ziraat Bankası Virtual POS, iyzico/Paynet), cargo companies, e-invoice providers, and public authorities when required by law. We do not sell personal data to third parties.',
    privacyH2Retention: '4. Retention',
    privacyRetention: 'Order and accounting records are kept for the periods required by law; marketing records until you withdraw consent.',
    privacyH2Rights: '5. Your rights (KVKK Art. 11)',
    privacyRights1: 'Learn whether your data is processed',
    privacyRights2: 'Request correction, deletion, or anonymization',
    privacyRights3: 'Object to processing and claim compensation for damage',
    privacyRightsHow: 'Send requests to support@marvispace.com. We reply within 30 days.',
    privacyCookies: 'Essential cookies keep your cart, checkout, and session working. Analytics cookies load only after you accept the cookie banner.',
    privacyKvkkLink: 'KVKK privacy notice',
    kvkkPageTitle: 'KVKK Privacy Notice',
    kvkkLead: 'Official privacy notice under Turkish Law No. 6698 (KVKK). MARVISPACE is the data controller.',
    a11yPageTitle: 'Accessibility',
    a11yLead: 'MARVISPACE is committed to providing an accessible shopping experience with keyboard navigation, readable typography, and semantic page structure.',
    a11yContact: 'If you encounter accessibility barriers, contact',
    cookiePageTitle: 'Cookie Policy',
    cookiePageLead: 'This page explains how MARVISPACE uses cookies on marvispace.com.',
    cookiePageEssentialTitle: 'Essential cookies',
    cookiePageEssential: 'Essential cookies keep your cart, checkout session, language preference, and security features working. They load without extra consent because the store cannot function without them.',
    cookiePageAnalyticsTitle: 'Analytics cookies',
    cookiePageAnalytics: 'Analytics cookies (Google Analytics) load only after you choose Accept on the cookie banner. If you choose Essential only, analytics scripts are not loaded.',
    cookiePageChoiceTitle: 'Your choices',
    cookiePageChoice: 'You can accept all cookies or keep essential cookies only. To change a previous choice, clear this site’s data in your browser and reload the page — the banner will appear again.',
    cookiePagePrivacyLink: 'Privacy policy',
    cookiePageMore: 'Read the cookie policy',
    termsPageTitle: 'Terms',
    termsLead: 'By using marvispace.com you agree to our store policies including accurate product information, secure checkout, and lawful use of the website.',
    termsTrNote: 'For distance sales in Turkey, these documents also apply:',
    termsVat: 'Prices include VAT where applicable (KDV dahil).',
    termsConfirm: 'Orders are confirmed after successful checkout and 3D Secure verification.',
    termsCancel: 'We reserve the right to cancel orders affected by stock or verification issues.',
    returnsPageTitle: 'Returns & Withdrawal',
    returnsLead: 'Consumer rights and the return process under Turkish Law No. 6502.',
    returnsH2Withdraw: 'Right of withdrawal (14 days)',
    returnsWithdraw: 'You may withdraw from the purchase within 14 days of receiving the product, without giving a reason.',
    returnsWithdraw1: 'Send your withdrawal notice to support@marvispace.com',
    returnsWithdraw2: 'The product must be unused, with tags attached, in its original packaging',
    returnsWithdraw3: 'Return shipping costs are applied in line with applicable law when you use the right of withdrawal',
    returnsH2Excluded: 'Products excluded from withdrawal',
    returnsEx1: 'Products customized to the consumer’s specifications',
    returnsEx2: 'Goods that cannot be returned for hygiene reasons once the packaging is opened (where applicable)',
    returnsEx3: 'Discounted / outlet items sold with a notice that withdrawal does not apply',
    returnsH2Process: 'Return process',
    returnsStep1: 'Email your withdrawal request (order number + full name)',
    returnsStep2: 'We send the return address and shipping instructions',
    returnsStep3: 'After the product arrives at our warehouse, we refund within 14 days',
    returnsStep4: 'The refund goes to the card or account you paid with (bank times may vary)',
    returnsH2Damage: 'Damaged or defective goods',
    returnsDamage: 'If you find damage on delivery, have the courier record a report and notify us with photos within 48 hours.',
    distancePageTitle: 'Distance Sales Agreement',
    distanceLead: 'Issued under Turkish Law No. 6502 on Consumer Protection and the Distance Contracts Regulation.',
    distanceH2Parties: 'Article 1 — Parties',
    distanceParties: 'Seller details are listed above. The buyer is the natural or legal person who places an order on this website.',
    distanceH2Subject: 'Article 2 — Subject',
    distanceSubject: 'This agreement sets out the rights and obligations for the sale and delivery of products ordered electronically on marvispace.com.',
    distanceH2Price: 'Article 3 — Product and price',
    distancePrice1: 'Product features and images are shown on the product page',
    distancePrice2: 'Prices include VAT unless stated otherwise',
    distancePrice3: 'Payment is taken by credit or debit card with 3D Secure',
    distancePrice4: 'Any cargo fee is shown in the order summary',
    distanceH2Delivery: 'Article 4 — Delivery',
    distanceDelivery: 'Goods are delivered to the address you provide by a contracted cargo company. Estimated delivery is 3–7 business days after order confirmation; stock or force majeure may extend this.',
    distanceH2Withdraw: 'Article 5 — Right of withdrawal',
    distanceWithdraw: 'You may withdraw within 14 days of delivery without giving a reason. See',
    distanceWithdrawEx: 'Withdrawal may not apply to made-to-order, hygiene-sensitive, or customized leather goods (Regulation Art. 15).',
    distanceH2Dispute: 'Article 6 — Disputes',
    distanceDispute: 'Consumers may apply to Consumer Arbitration Committees and Consumer Courts. Monetary thresholds are updated yearly by the Ministry of Trade.',
    preinfoPageTitle: 'Pre-contract Information',
    preinfoLead: 'Required information before a distance sale, under the Distance Contracts Regulation Art. 5.',
    preinfoH2Product: '1. Product / service',
    preinfoProduct: 'Orders cover leather apparel and accessories shown on this site with images and descriptions. Core features are listed on each product page.',
    preinfoH2Price: '2. Total price',
    preinfoPrice1: 'Product price: unit price in the cart × quantity',
    preinfoPrice2: 'Cargo fee: shown in the order summary when it applies',
    preinfoPrice3: 'VAT: included in prices unless stated otherwise',
    preinfoPrice4: 'Amount payable: shown on the checkout screen',
    preinfoH2Pay: '3. Payment and delivery',
    preinfoPay1: 'Payment: credit or debit card with 3D Secure',
    preinfoPay2: 'Payment providers: Ziraat Bankası Virtual POS and/or iyzico (Paynet)',
    preinfoPay3: 'Delivery: Turkey cargo to the buyer’s address',
    preinfoPay4: 'Estimated time: 3–7 business days from Istanbul',
    preinfoH2Withdraw: '4. Right of withdrawal',
    preinfoWithdraw: 'You may withdraw within 14 days of delivery. Return terms:',
    preinfoH2Complaints: '5. Complaints',
    preinfoComplaints: 'Send complaints to support@marvispace.com or our phone number. You may also apply to Consumer Arbitration Committees and Consumer Courts.',
  },
  tr: {
    skip: 'Ana içeriğe geç',
    homeAria: 'MARVISPACE ana sayfa',
    filtersAria: 'Ürün filtreleri',
    filterNew: 'YENİ',
    filterMens: 'ERKEK',
    filterWomens: 'KADIN',
    filterFootwear: 'CEKET',
    filterAccessories: 'AKSESUAR',
    filterSale: 'İNDİRİM',
    cartAria: 'Sepet',
    cartDrawerAria: 'Alışveriş sepeti',
    closeCart: 'Sepeti kapat',
    orderSummary: 'Sipariş Özeti',
    cartEmpty: 'Sepetiniz boş',
    discountCode: 'MARVISPACE kodu',
    discountPlaceholder: 'Kodu girin',
    discountAria: 'İndirim kodu',
    apply: 'Uygula',
    checkout: 'Ödeme',
    catalogAria: 'Ürün kataloğu',
    previewAria: 'Ürün detayı',
    prevProduct: 'Önceki ürün',
    nextProduct: 'Sonraki ürün',
    addToCart: 'Sepete ekle',
    selectSize: 'BEDEN SEÇİN',
    adding: 'EKLENİYOR',
    restocks: '4 HAFTA İÇİNDE GELİR',
    sizeGuide: 'Beden rehberi',
    closeSize: 'Beden seçimini kapat',
    confirmSize: 'Bedeni onayla',
    back: 'Geri',
    morePerRow: 'Satırda daha fazla ürün göster',
    fewerPerRow: 'Satırda daha az ürün göster',
    storeUnavailable: 'Mağaza geçici olarak kullanılamıyor.',
    legal: 'Yasal',
    social: 'Sosyal',
    help: 'Yardım',
    contact: 'İletişim',
    contactSupport: 'Destek',
    orderStatus: 'Sipariş Durumu',
    terms: 'Kullanım Koşulları',
    privacy: 'Gizlilik',
    accessibility: 'Erişilebilirlik',
    cookies: 'Çerezler',
    tagline: 'Premium Deri Giyim',
    langAria: 'Dil',
    filterEmpty: 'Bu koleksiyonda henüz ürün yok.',
    seoStoryTitle: 'İstanbul deri giyim',
    seoStoryLead: 'MARVISPACE, İstanbul’da premium deri ceket, palto, gömlek ve aksesuar tasarlar. Erkek ve kadın koleksiyonu, 3D Secure ödeme ve 14 gün iade.',
    seoFaq1Q: 'MARVISPACE deri ceketler nerede üretiliyor?',
    seoFaq1A: 'Koleksiyon İstanbul atölyesinde üretilir. Siparişler 3–7 iş gününde kargoya verilir.',
    seoFaq2Q: 'İade süresi nedir?',
    seoFaq2A: 'Teslimattan sonra 14 gün içinde cayma ve iade hakkınız vardır. Koşullar iade sayfasındadır.',
    seoFaq3Q: 'Ödeme güvenli mi?',
    seoFaq3A: 'Kart ödemeleri 3D Secure ile Ziraat Bankası veya iyzico Paynet üzerinden alınır. Kart bilgileri sunucularımızda saklanmaz.',
    seoFaq4Q: 'Hangi bedenleri satıyorsunuz?',
    seoFaq4A: 'Ceket ve paltolar XS–XXL (EU 34–44) bedenlerdedir. Ürün sayfasında beden seçimi vardır.',
    trust: 'İstanbul deri atölyesi · 14 gün iade · Güvenli 3D ödeme',
    places: 'İstanbul atölye · Alanya · Antalya',
    etbis: 'ETBİS Kayıt',
    returns: 'İade & Cayma',
    newsletterAria: 'Website güncellemelerini alın',
    newsletterTitle: 'Website güncellemelerini alın',
    newsletterClose: 'Kapat',
    newsletterEmail: 'E-posta adresi',
    newsletterPlaceholder: 'E-posta Adresi',
    newsletterConsent: 'MARVISPACE e-posta pazarlamasını almayı kabul ediyorum. Satın alma için onay zorunlu değildir. Haklarınız ve kişisel verilerinizin kullanımı için gizlilik politikamızı okuyun.',
    newsletterPrivacy: 'gizlilik politikası',
    subscribe: 'Abone ol',
    newsletterInvalid: 'Lütfen geçerli bir e-posta adresi girin.',
    newsletterThanks: 'Teşekkürler — abone oldunuz.',
    newsletterError: 'Abone olunamadı. Lütfen tekrar deneyin.',
    cookieAria: 'Çerez bildirimi',
    cookieText: 'Bu site, hizmet kalitesi ve trafik analizi için çerezler kullanır. Detaylar için KVKK Aydınlatma Metni ve Çerez Politikası.',
    cookieAccept: 'Kabul Et',
    cookieReject: 'Sadece Zorunlu',
    cookiePrivacy: 'KVKK Aydınlatma Metni',
    cookiePolicy: 'Çerez Politikası',
    whatsapp: 'Destek',
    whatsappAria: 'WhatsApp destek',
    whatsappHello: 'Merhaba, MARVISPACE siparişim hakkında yardım istiyorum.',
    size: 'Beden',
    qty: 'Adet',
    subtotal: 'Ara toplam',
    shipping: 'Kargo',
    shippingNext: '3–7 İŞ GÜNÜ',
    shippingPromise: 'İstanbul’dan 3–7 iş günü',
    vatIncluded: 'KDV dahil',
    taxes: 'Vergiler',
    total: 'Toplam',
    materials: '%100 PREMIUM MALZEME',
    ships: 'İSTANBUL’DAN 3–7 İŞ GÜNÜ · KDV DAHİL',
    imageN: 'Görsel',
    sizeUs: 'Beden US',
    langTr: 'TR',
    langEn: 'EN',
    checkoutLoading: 'Sepetiniz yükleniyor…',
    checkoutContact: 'İletişim Bilgileri',
    checkoutEmail: 'E-posta Adresi',
    checkoutSubscribe: 'Güncelleme ve bildirimlere abone ol',
    checkoutShipping: 'Teslimat Adresi',
    checkoutFirst: 'Ad',
    checkoutLast: 'Soyad',
    checkoutAddress: 'Adres',
    checkoutAddress2: 'Daire, kat vb. (isteğe bağlı)',
    checkoutCity: 'Şehir',
    checkoutCountry: 'Ülke',
    checkoutState: 'Eyalet / İl',
    checkoutZip: 'Posta Kodu',
    checkoutPhone: 'Telefon',
    checkoutPayment: 'Ödeme',
    checkoutBilling: 'Fatura Adresi',
    checkoutLegal: 'Yasal onaylar',
    checkoutPlace: 'Siparişi tamamla',
    checkoutPayUnavailable: 'Ödeme kullanılamıyor',
    checkoutCompleteDetails: 'Ödemek için bilgileri tamamlayın',
    checkoutEnterCard: 'Kart bilgilerini girin',
    checkoutAddressPh: 'Adresinizi yazmaya başlayın…',
    checkoutAddress2Ph: 'Daire, kat, ofis vb.',
    checkoutCardUnavailable: 'Kart ödemesi henüz kullanılamıyor',
    checkoutCardUnavailableText: 'Ödeme altyapısını tamamlıyoruz. Lütfen daha sonra tekrar deneyin veya destek için e-posta gönderin.',
    checkoutPaymentNotice: 'Ödemeye geçmek için yukarıdaki teslimat bilgilerini tamamlayın.',
    checkoutCard: 'Kredi / Banka Kartı',
    checkoutCardHolder: 'Kart üzerindeki isim',
    checkoutCardNumber: 'Kart numarası',
    checkoutExpiryMonth: 'Son kullanma ayı',
    checkoutExpiryYear: 'Son kullanma yılı',
    checkoutSecurity: 'Güvenlik kodu',
    checkoutBillingWarn: 'Fatura adresi, kartınızın kayıtlı adresi ile aynı olmalıdır.',
    checkoutBillingSame: 'Teslimat adresini fatura adresi olarak kullan',
    checkoutDeliveryNote: 'Türkiye içi kargo, İstanbul atölyemizden 3–7 iş günü. Fiyatlara KDV dahildir.',
    checkoutAcceptRead: '— okudum ve kabul ediyorum.',
    checkoutAcceptKvkk: '— okudum; kişisel verilerimin işlenmesine onay veriyorum.',
    checkoutLegalNeeded: 'Devam etmek için yasal onay kutularını işaretleyin.',
    checkoutPaymentFailed: 'Ödeme tamamlanmadı. Kart bilgilerinizi kontrol edip tekrar deneyin.',
    checkoutCardInvalid: 'Devam etmek için geçerli kart bilgilerini girin.',
    checkoutLoadError: 'Ödeme sayfası yüklenemedi.',
    checkoutCartError: 'Sepet yüklenemedi.',
    checkoutItemOne: '1 ürün',
    checkoutItems: '{n} ürün',
    checkoutTaxId: 'Vergi numarası (isteğe bağlı)',
    checkoutTaxNote: 'T.C. kimlik numarası (TCKN) veya vergi numarası gerekir',
    checkoutTaxWarn: 'Siparişin kargoya verilmesi için vergi numarası gereklidir. Şimdi eklemezseniz, sipariş gönderilmeden önce e-posta ile isteyeceğiz.',
    backAria: 'Mağazaya dön',
    contactPageTitle: 'İletişim',
    contactKicker: 'Atölye',
    contactHeadline: 'Atölyeyi ziyaret edin.',
    contactLead: 'Deri Kağıthane’de kesilir. Alanya ve Antalya’da yerinde görün. 1–2 iş günü içinde yanıtlarız.',
    contactName: 'Ad',
    contactEmail: 'E-posta',
    contactMessage: 'Mesaj',
    contactSend: 'Gönder',
    contactHours: 'Çalışma saatleri: Pazartesi–Cuma 09:00–18:00 (TR)',
    contactHoursShort: 'Pzt–Cuma 09:00–18:00 (TR)',
    contactHoursLabel: 'Saat',
    contactPhoneLabel: 'Telefon',
    contactFormTitle: 'Bize yazın',
    contactDirectAria: 'Telefon, e-posta ve saatler',
    contactWhatsApp: 'WhatsApp',
    contactWhatsAppAction: 'Sohbet',
    contactBack: 'Mağaza',
    contactNavLine: 'İstanbul · Alanya · Antalya',
    contactStillAlt: 'MARVISPACE kırmızı deri ceket',
    contactLookbookKicker: 'Look',
    contactLookbookAria: 'Koleksiyon lookbook',
    contactLookbookPause: 'Duraklat',
    contactLookbookPlay: 'Oynat',
    contactMerchantSummary: 'Satıcı bilgileri',
    locationWorkshop: 'Atölye',
    locationShowroom: 'Showroom',
    contactRequired: 'Lütfen adınızı yazın.',
    contactEmailInvalid: 'Lütfen geçerli bir e-posta adresi girin.',
    contactMessageShort: 'Yardım edebilmemiz için lütfen biraz daha yazın.',
    contactSending: 'Gönderiliyor…',
    contactThanks: 'Mesajınız iletildi. 1–2 iş günü içinde yanıtlarız.',
    contactError: 'Gönderilemedi. Lütfen support@marvispace.com adresine yazın.',
    locationsAria: 'MARVISPACE konumları',
    locationsTitle: 'Atölye ve mağazalar',
    locationsLead: 'MARVISPACE online satıştır. Deri İstanbul Kağıthane atölyesinde üretilir; Alanya ve Antalya’da showroom’da görebilirsiniz.',
    locationMap: 'Harita',
    legalNavAria: 'Yasal metinler',
    legalDistanceSales: 'Mesafeli Satış',
    legalPreInfo: 'Ön Bilgilendirme',
    merchantAria: 'Satıcı bilgileri',
    merchantTitle: 'Satıcı / Veri Sorumlusu Bilgileri',
    merchantTrade: 'Ticari Unvan',
    merchantBrand: 'Marka',
    merchantAddress: 'Adres',
    merchantPhone: 'Telefon',
    merchantEmail: 'E-posta',
    merchantTax: 'Vergi Dairesi / No',
    merchantMersis: 'MERSİS',
    merchantRegistry: 'Ticaret Sicil No',
    merchantKep: 'KEP',
    merchantAuthorized: 'Yetkili',
    privacyPageTitle: 'Gizlilik',
    privacyLead: '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla bilgilendirme metnidir.',
    privacyH2Data: '1. İşlenen kişisel veriler',
    privacyData1: 'Kimlik ve iletişim: ad, soyad, e-posta, telefon, adres',
    privacyData2: 'Sipariş ve ödeme: sipariş detayları, fatura bilgileri, ödeme doğrulama kayıtları (kart bilgileri sunucularımızda saklanmaz)',
    privacyData3: 'İşlem güvenliği: IP, tarayıcı, oturum ve 3D Secure doğrulama logları',
    privacyData4: 'Pazarlama (açık rıza ile): e-posta bülteni kayıtları',
    privacyH2Purpose: '2. Amaç ve hukuki sebep',
    privacyPurpose1: 'Sözleşmenin kurulması ve ifası (mesafeli satış, teslimat, faturalama)',
    privacyPurpose2: 'Ödeme kuruluşu ve banka entegrasyonu, dolandırıcılık önleme',
    privacyPurpose3: 'Mevzuattan kaynaklanan yükümlülükler (Tüketici Kanunu, e-ticaret, vergi)',
    privacyPurpose4: 'Açık rızanız ile pazarlama iletişimi',
    privacyH2Transfer: '3. Aktarım',
    privacyTransfer: 'Verileriniz; ödeme kuruluşları (Ziraat Bankası Sanal POS, iyzico/Paynet), kargo firmaları, e-fatura/e-arşiv hizmet sağlayıcıları ve yasal zorunluluk halinde yetkili kamu kurumları ile paylaşılabilir. Kişisel verileri üçüncü taraflara satmayız.',
    privacyH2Retention: '4. Saklama süresi',
    privacyRetention: 'Sipariş ve muhasebe kayıtları ilgili mevzuat süresince; pazarlama kayıtları rızanızın geri alınmasına kadar saklanır.',
    privacyH2Rights: '5. Haklarınız (KVKK m.11)',
    privacyRights1: 'Verilerinizin işlenip işlenmediğini öğrenme',
    privacyRights2: 'Düzeltme, silme, anonimleştirme talep etme',
    privacyRights3: 'İşlemeye itiraz ve zararın giderilmesini talep etme',
    privacyRightsHow: 'Taleplerinizi support@marvispace.com adresine iletebilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.',
    privacyCookies: 'Zorunlu çerezler sepet, ödeme ve oturum için kullanılır. Analitik çerezler yalnızca çerez bildirimini kabul ettikten sonra yüklenir.',
    privacyKvkkLink: 'KVKK Aydınlatma Metni',
    kvkkPageTitle: 'KVKK Aydınlatma Metni',
    kvkkLead: '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla resmi aydınlatma metnidir.',
    a11yPageTitle: 'Erişilebilirlik',
    a11yLead: 'MARVISPACE, klavye ile gezinme, okunabilir yazı ve semantik sayfa yapısı ile erişilebilir bir alışveriş deneyimi sunmayı hedefler.',
    a11yContact: 'Erişilebilirlik engeliyle karşılaşırsanız yazın:',
    cookiePageTitle: 'Çerez Politikası',
    cookiePageLead: 'Bu sayfa, MARVISPACE’in marvispace.com’da çerezleri nasıl kullandığını açıklar.',
    cookiePageEssentialTitle: 'Zorunlu çerezler',
    cookiePageEssential: 'Zorunlu çerezler sepet, ödeme oturumu, dil tercihi ve güvenlik için kullanılır. Mağaza bunlarsız çalışamayacağı için ek onay olmadan yüklenir.',
    cookiePageAnalyticsTitle: 'Analitik çerezler',
    cookiePageAnalytics: 'Analitik çerezler (Google Analytics) yalnızca çerez bildiriminden Kabul Et seçilince yüklenir. Sadece Zorunlu seçilirse analitik script yüklenmez.',
    cookiePageChoiceTitle: 'Tercihleriniz',
    cookiePageChoice: 'Tüm çerezleri kabul edebilir veya yalnızca zorunlu çerezleri bırakabilirsiniz. Önceki tercihi değiştirmek için tarayıcıda bu siteye ait verileri silip sayfayı yenileyin — bildirim yeniden görünür.',
    cookiePagePrivacyLink: 'Gizlilik politikası',
    cookiePageMore: 'Çerez politikasını oku',
    termsPageTitle: 'Kullanım Koşulları',
    termsLead: 'marvispace.com’u kullanarak doğru ürün bilgisi, güvenli ödeme ve sitenin yasal kullanımını içeren mağaza politikalarını kabul etmiş olursunuz.',
    termsTrNote: 'Türkiye’deki mesafeli satışlar için ayrıca şu metinler geçerlidir:',
    termsVat: 'Fiyatlar geçerli olduğu yerde KDV dahildir.',
    termsConfirm: 'Siparişler başarılı ödeme ve 3D Secure doğrulamasından sonra onaylanır.',
    termsCancel: 'Stok veya doğrulama sorunlarında siparişi iptal etme hakkımız saklıdır.',
    returnsPageTitle: 'İade ve Cayma Hakkı',
    returnsLead: '6502 sayılı Kanun kapsamında tüketici hakları ve iade süreci.',
    returnsH2Withdraw: 'Cayma hakkı (14 gün)',
    returnsWithdraw: 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde, gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz.',
    returnsWithdraw1: 'Cayma bildirimi: support@marvispace.com',
    returnsWithdraw2: 'Ürün kullanılmamış, etiketleri çıkarılmamış ve orijinal ambalajında olmalıdır',
    returnsWithdraw3: 'İade kargo bedeli: cayma hakkı kullanımında yasal düzenlemeye uygun şekilde uygulanır',
    returnsH2Excluded: 'Cayma hakkı kullanılamayan ürünler',
    returnsEx1: 'Tüketicinin istekleri doğrultusunda kişiselleştirilen ürünler',
    returnsEx2: 'Hijyen açısından iadesi uygun olmayan ve ambalajı açılmış ürünler (varsa)',
    returnsEx3: 'İndirimli / outlet olarak “cayma hakkı yoktur” ibaresi ile satılan ürünler',
    returnsH2Process: 'İade süreci',
    returnsStep1: 'Cayma talebinizi e-posta ile iletin (sipariş no + ad soyad)',
    returnsStep2: 'Size iade adresi ve kargo talimatı gönderilir',
    returnsStep3: 'Ürün depomuza ulaştıktan sonra 14 gün içinde ödeme iadesi yapılır',
    returnsStep4: 'İade, ödeme yaptığınız kart/hesaba yansır (banka süreleri değişebilir)',
    returnsH2Damage: 'Ayıplı / hasarlı ürün',
    returnsDamage: 'Teslimatta hasar tespit ederseniz kargo görevlisine tutanak tutturun ve 48 saat içinde fotoğraflarla birlikte bize bildirin.',
    distancePageTitle: 'Mesafeli Satış Sözleşmesi',
    distanceLead: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında düzenlenmiştir.',
    distanceH2Parties: 'Madde 1 — Taraflar',
    distanceParties: 'Satıcı bilgileri yukarıda yer almaktadır. Alıcı, sitede sipariş veren gerçek veya tüzel kişidir.',
    distanceH2Subject: 'Madde 2 — Konu',
    distanceSubject: 'İşbu sözleşme; alıcının marvispace.com üzerinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimine ilişkin hak ve yükümlülükleri düzenler.',
    distanceH2Price: 'Madde 3 — Ürün ve fiyat',
    distancePrice1: 'Ürün özellikleri ve görselleri ilgili ürün sayfasında yer alır',
    distancePrice2: 'Fiyatlar KDV dahil olarak gösterilir (aksi belirtilmedikçe)',
    distancePrice3: 'Ödeme, 3D Secure destekli kredi/banka kartı ile alınır',
    distancePrice4: 'Kargo bedeli sipariş özetinde ayrıca gösterilir',
    distanceH2Delivery: 'Madde 4 — Teslimat',
    distanceDelivery: 'Ürünler, alıcının bildirdiği adrese anlaşmalı kargo firması aracılığıyla teslim edilir. Tahmini teslimat süresi sipariş onayından sonra 3–7 iş günüdür; stok veya force majeure durumunda süre uzayabilir.',
    distanceH2Withdraw: 'Madde 5 — Cayma hakkı',
    distanceWithdraw: 'Teslimden itibaren 14 gün içinde gerekçe göstermeksizin cayma hakkınız vardır. Bakınız:',
    distanceWithdrawEx: 'Kişiye özel üretim, hijyen ve tüketicinin istekleri doğrultusunda kişiselleştirilen deri ürünlerinde cayma hakkı istisnası uygulanabilir (Yönetmelik m.15).',
    distanceH2Dispute: 'Madde 6 — Uyuşmazlık',
    distanceDispute: 'Tüketici; Tüketici Hakem Heyetlerine ve Tüketici Mahkemelerine başvurabilir. Parasal sınırlar her yıl Ticaret Bakanlığı tarafından güncellenir.',
    preinfoPageTitle: 'Ön Bilgilendirme Formu',
    preinfoLead: 'Mesafeli Sözleşmeler Yönetmeliği m.5 kapsamında, sipariş öncesi sunulması zorunlu bilgiler.',
    preinfoH2Product: '1. Ürün / hizmet bilgisi',
    preinfoProduct: 'Sipariş konusu ürünler; deri giyim ve aksesuar kategorilerinde yer alan, sitede görsel ve açıklaması bulunan ürünlerdir. Temel özellikler ürün sayfasında listelenir.',
    preinfoH2Price: '2. Toplam fiyat',
    preinfoPrice1: 'Ürün bedeli: sepette gösterilen birim fiyat × adet',
    preinfoPrice2: 'Kargo ücreti: sipariş özetinde ayrıca belirtilir (varsa)',
    preinfoPrice3: 'KDV: fiyatlara dahildir (aksi belirtilmedikçe)',
    preinfoPrice4: 'Toplam ödenecek tutar: checkout ekranında gösterilir',
    preinfoH2Pay: '3. Ödeme ve teslimat',
    preinfoPay1: 'Ödeme: 3D Secure destekli kredi/banka kartı',
    preinfoPay2: 'Ödeme kuruluşu: Ziraat Bankası Sanal POS ve/veya iyzico (Paynet)',
    preinfoPay3: 'Teslimat: Türkiye içi kargo ile alıcı adresine',
    preinfoPay4: 'Tahmini süre: İstanbul’dan 3–7 iş günü',
    preinfoH2Withdraw: '4. Cayma hakkı',
    preinfoWithdraw: 'Teslimden itibaren 14 gün içinde cayma hakkınız vardır. İade koşulları:',
    preinfoH2Complaints: '5. Şikâyet ve başvuru',
    preinfoComplaints: 'Şikâyetlerinizi support@marvispace.com ve telefon numaramız üzerinden iletebilirsiniz. Tüketici Hakem Heyeti ve Tüketici Mahkemelerine başvuru hakkınız saklıdır.',
  },
};

function readCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

function writeCookie(name, value) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(name, value);
  } catch {
    /* ignore */
  }
}

export function getLang() {
  const path = window.location.pathname.match(/^\/(tr|en)(?:\/|$)/);
  if (path) return path[1];
  const cookie = readCookie(LANG_COOKIE) || (typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_COOKIE) : '');
  if (cookie === 'tr' || cookie === 'en') return cookie;
  const html = (document.documentElement.lang || '').toLowerCase();
  if (html.startsWith('tr')) return 'tr';
  return 'en';
}

export function t(key) {
  const lang = getLang();
  return STRINGS[lang]?.[key] || STRINGS.en[key] || key;
}

export function homePath(lang = getLang()) {
  return `/${lang}/`;
}

export function withLang(path, lang = getLang()) {
  const clean = String(path || '/').replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
  const suffix = clean.startsWith('/') ? clean : `/${clean}`;
  if (suffix === '/') return `/${lang}/`;
  return `/${lang}${suffix}`;
}

const PAGE_SLUGS = {
  contact: { en: '/contact', tr: '/iletisim' },
  privacy: { en: '/privacy', tr: '/gizlilik' },
  accessibility: { en: '/accessibility', tr: '/erisilebilirlik' },
  cookies: { en: '/cookies', tr: '/cerez-politikasi' },
  terms: { en: '/terms', tr: '/kullanim-kosullari' },
  returns: { en: '/returns', tr: '/iade-ve-iptal' },
  kvkk: { en: '/kvkk', tr: '/kvkk' },
  distance: { en: '/distance-sales', tr: '/mesafeli-satis-sozlesmesi' },
  preinfo: { en: '/pre-contract', tr: '/on-bilgilendirme' },
};

export function pagePath(name, lang = getLang()) {
  const code = lang === 'tr' ? 'tr' : 'en';
  const slugs = PAGE_SLUGS[name];
  if (!slugs) return withLang(`/${name}`, code);
  return `/${code}${slugs[code]}`;
}

export function contactPath(lang = getLang()) {
  return pagePath('contact', lang);
}

export function privacyPath(lang = getLang()) {
  return pagePath('privacy', lang);
}

export function accessibilityPath(lang = getLang()) {
  return pagePath('accessibility', lang);
}

export function cookiesPath(lang = getLang()) {
  return pagePath('cookies', lang);
}

export function termsPath(lang = getLang()) {
  return pagePath('terms', lang);
}

export function returnsPath(lang = getLang()) {
  return pagePath('returns', lang);
}

export function kvkkPath(lang = getLang()) {
  return pagePath('kvkk', lang);
}

export function distancePath(lang = getLang()) {
  return pagePath('distance', lang);
}

export function preinfoPath(lang = getLang()) {
  return pagePath('preinfo', lang);
}

function localizeBarePath(path, lang) {
  const clean = String(path || '/').replace(/\/+$/, '') || '/';
  const code = lang === 'tr' ? 'tr' : 'en';
  for (const slugs of Object.values(PAGE_SLUGS)) {
    if (clean === slugs.en || clean === slugs.tr) return slugs[code];
  }
  return clean === '/' ? '/' : clean;
}

export function applyDomI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.documentElement.lang = getLang() === 'tr' ? 'tr' : 'en';
  document.documentElement.dataset.lang = getLang();
  root.querySelectorAll('[data-i18n-home]').forEach(el => {
    el.setAttribute('href', homePath());
  });
  root.querySelectorAll('[data-i18n-contact]').forEach(el => {
    el.setAttribute('href', contactPath());
  });
  root.querySelectorAll('[data-i18n-privacy]').forEach(el => {
    el.setAttribute('href', privacyPath());
  });
  root.querySelectorAll('[data-i18n-accessibility]').forEach(el => {
    el.setAttribute('href', accessibilityPath());
  });
  root.querySelectorAll('[data-i18n-cookies]').forEach(el => {
    el.setAttribute('href', cookiesPath());
  });
  root.querySelectorAll('[data-i18n-terms]').forEach(el => {
    el.setAttribute('href', termsPath());
  });
  root.querySelectorAll('[data-i18n-returns]').forEach(el => {
    el.setAttribute('href', returnsPath());
  });
  root.querySelectorAll('[data-i18n-kvkk]').forEach(el => {
    el.setAttribute('href', kvkkPath());
  });
  root.querySelectorAll('[data-i18n-distance]').forEach(el => {
    el.setAttribute('href', distancePath());
  });
  root.querySelectorAll('[data-i18n-preinfo]').forEach(el => {
    el.setAttribute('href', preinfoPath());
  });
}

let booted = false;

export async function initI18n() {
  if (booted) return getLang();
  booted = true;

  const pathLang = window.location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || '';
  if (pathLang) {
    writeCookie(LANG_COOKIE, pathLang);
    applyDomI18n(document);
    return pathLang;
  }

  let lang = getLang();
  const cookie = readCookie(LANG_COOKIE) || localStorage.getItem(LANG_COOKIE);
  if (cookie !== 'tr' && cookie !== 'en') {
    try {
      const res = await fetch('/api/v1/geo.php', { headers: { Accept: 'application/json' } });
      const body = await res.json();
      const detected = body?.data?.lang;
      if (detected === 'tr' || detected === 'en') lang = detected;
    } catch {
      /* stay with current */
    }
  }

  writeCookie(LANG_COOKIE, lang);
  applyDomI18n(document);
  return lang;
}

export function switchLang(next) {
  const lang = next === 'tr' ? 'tr' : 'en';
  writeCookie(LANG_COOKIE, lang);
  const path = window.location.pathname.replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  window.location.href = withLang(localizeBarePath(path, lang), lang) + search + hash;
}

export function initLangSwitch(root = document) {
  const lang = getLang();
  root.querySelectorAll('[data-lang-switch]').forEach((btn) => {
    const next = btn.getAttribute('data-lang-switch');
    btn.classList.toggle('is-active', next === lang);
    btn.setAttribute('aria-pressed', String(next === lang));
    if (btn.dataset.langBound === '1') return;
    btn.dataset.langBound = '1';
    btn.addEventListener('click', () => switchLang(next));
  });
}
