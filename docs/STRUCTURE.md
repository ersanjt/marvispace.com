# MARVISPACE — Project Structure

```
marvispace.com/
├── index.html                 # Storefront entry
├── checkout.html              # Checkout flow
├── admin.html                 # Admin panel
├── contact.html               # Static pages
├── terms.html
├── privacy.html
├── accessibility.html
├── order-status.html
├── order-confirmation.html
├── privacy-right-center.html
├── README.md
├── robots.txt
├── sitemap.xml
├── .htaccess                  # Clean URLs + legacy redirects
├── package.json
├── deploy.sh
│
├── assets/
│   ├── css/                   # Stylesheets
│   │   ├── fonts.css
│   │   ├── styles.css         # Main storefront
│   │   ├── cart-ui.css        # Cart & order summary
│   │   ├── checkout.css
│   │   ├── admin.css
│   │   └── page.css           # Static content pages
│   ├── js/
│   │   ├── config/site.js     # Site & developer metadata
│   │   ├── core/
│   │   │   ├── storage.js     # localStorage layer
│   │   │   ├── site-footer.js # Shared footer
│   │   │   └── credits.js     # Developer attribution
│   │   ├── modules/cart-ui.js # Shared cart UI
│   │   ├── data/products.js   # Product catalog seed
│   │   └── pages/
│   │       ├── home.js        # Storefront logic
│   │       ├── checkout.js
│   │       ├── order-confirmation.js
│   │       ├── order-status.js
│   │       └── admin.js
│   └── images/products/       # Product photography
│
├── tools/                     # Dev-only (not required at runtime)
│   ├── scrape-ottimo.mjs
│   ├── generate-sitemap.mjs
│   └── translate-products.mjs
│
└── docs/
    ├── DEPLOY.md
    └── STRUCTURE.md
```

**Author:** [Ersan JT](https://github.com/ersanjt)
