# Stock Corsica - App Mobile de Gestion de Stock

Application PWA de gestion de stock terrain avec upload de photos.

## 🚀 Déploiement sur Vercel

### Option A : Via GitHub (recommandé)

1. Crée un nouveau repo GitHub et pousse ce dossier
2. Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub
3. Clique "New Project" → Importe ton repo
4. Clique "Deploy"
5. C'est prêt ! Tu reçois une URL type `stock-corsica.vercel.app`

### Option B : Via la CLI Vercel

```bash
npm install -g vercel
cd stock-corsica-app
vercel
```

## 📸 Configuration Cloudinary (IMPORTANT)

Pour que l'upload de photos fonctionne :

### Étape 1 : Créer un compte Cloudinary

1. Va sur [cloudinary.com](https://cloudinary.com) et crée un compte gratuit
2. Sur le Dashboard, note ton **Cloud Name** (ex: `dxyz123abc`)

### Étape 2 : Créer un Upload Preset

1. Va dans **Settings** (engrenage) → **Upload**
2. Descends jusqu'à **Upload presets**
3. Clique **Add upload preset**
4. Configure :
   - **Upload preset name** : `stock_photos`
   - **Signing Mode** : `Unsigned` ⚠️ Important !
   - **Folder** : `stock_corsica` (optionnel, pour organiser)
5. Clique **Save**

### Étape 3 : Configurer l'app

Dans le fichier `pages/index.jsx`, ligne ~7, remplace :

```javascript
const CLOUDINARY_CLOUD_NAME = 'VOTRE_CLOUD_NAME'; // ← Mets ton Cloud Name ici
```

Par exemple :
```javascript
const CLOUDINARY_CLOUD_NAME = 'dxyz123abc';
```

## 📱 Installation sur téléphone

Une fois déployé, ouvre l'URL sur le téléphone et :
- **iPhone** : Safari → Partager → "Sur l'écran d'accueil"
- **Android** : Chrome → Menu → "Ajouter à l'écran d'accueil"

## ✨ Fonctionnalités

### Gestion des stocks
- Sélection utilisateur (Michel, Kevin, Alisson, Alex)
- Choix du stock (Corsica / Guadeloupe)
- Navigation par catégories et sous-catégories
- Mode offline avec synchronisation

### Fiche article
- Quantité (+/-)
- État (Bon / Endommagé / À vérifier)
- Dimensions
- Date de péremption
- Localisation (caisse/palette)
- Numéro d'inventaire
- Commentaires
- Traçabilité automatique (qui + quand)

### Module photo
- 📸 Prise de photo directe
- 📉 Compression automatique (max 1200px, -80% de taille)
- 🔍 Analyse qualité :
  - Détection de flou
  - Vérification luminosité
  - Contraste
  - Résolution minimale
- ☁️ Upload vers Cloudinary
- 🔗 Synchronisation avec Airtable
- ✅ Checklist photos intégrée

### Guide des bonnes pratiques
- Accessible via le bouton 📖
- Instructions photos
- Règles de comptage
- Précautions par type de matériel
- Organisation des journées d'inventaire

## 🔒 Sécurité

Le token Airtable est dans `pages/index.jsx`. Pour plus de sécurité en production :

1. Crée un fichier `.env.local` :
```
NEXT_PUBLIC_AIRTABLE_TOKEN=ton_token
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ton_cloud_name
```

2. Remplace dans le code :
```javascript
const AIRTABLE_TOKEN = process.env.NEXT_PUBLIC_AIRTABLE_TOKEN;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
```

## 💻 Développement local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000

## 📋 Limites Cloudinary (gratuit)

- 25 Go de stockage
- 25 Go de bande passante/mois
- Largement suffisant pour un usage normal
