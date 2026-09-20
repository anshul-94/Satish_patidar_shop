# स्वर्णी पशु आहार / Swarni Pashu Aahar

एक आधुनिक, मोबाइल-फर्स्ट वेब एप्लिकेशन जो किसानों को उच्च गुणवत्ता वाले पशु आहार (Swarni Pashu Aahar) और कृषि मशीनरी ग्रेडिंग सेवाएं प्रदान करता है।

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with CSS Variables), Vanilla JavaScript (ES6+)
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Supabase Storage
- **Hosting**: Cloudflare Pages (Static Web Hosting)

## 📱 Features

- **किसान प्रोडक्ट ब्राउज़िंग**: पशु आहार कैटलॉग, dynamic total, कार्ट एवं आसान चेकआउट।
- **मशीन ग्रेडिंग बुकिंग**: गेहूँ, सोयाबीन एवं चना ग्रेडिंग सेवा बुकिंग।
- **किसान रजिस्ट्रेशन / लॉगिन**: मोबाइल नंबर एवं पासवर्ड आधारित सुरक्षित लॉगिन।
- **एडमिन डैशबोर्ड**: मोबाइल-फर्स्ट उत्पाद, सेवा, ऑर्डर, बुकिंग एवं टाइम स्लॉट प्रबंधन।
- **सुरक्षित इमेज अपलोड**: Supabase Storage आधारित फोटो अपलोड एवं ऑटोमेटिक पब्लिक URL मैपिंग।

## 📁 Repository Structure

```
.
├── index.html            # मुख्य होम पेज
├── products.html         # उत्पाद कैटलॉग
├── services.html         # मशीन ग्रेडिंग सेवाएं
├── booking.html          # सेवा बुकिंग पेज
├── cart.html             # कार्ट पेज
├── checkout.html         # चेकआउट पेज
├── login.html            # किसान लॉगिन
├── signup.html           # किसान रजिस्ट्रेशन
├── admin.html            # एडमिन डैशबोर्ड
├── admin-login.html      # एडमिन लॉगिन
├── assets/               # इमेजेस एवं स्टेटिक मीडिया
├── css/                  # स्टाइलशीट्स (design system & responsive)
├── js/                   # Supabase integration & app logic
└── supabase/             # Schema, RLS policies, and storage configs
```

## ⚙️ Deployment Instructions (Cloudflare Pages)

1. Connect GitHub repository to **Cloudflare Pages**.
2. Set **Framework preset**: `None`.
3. Set **Build command**: (Leave empty).
4. Set **Build output directory**: `/`.
