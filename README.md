# EstAi 🏠🤖 — AI-Enhanced Real Estate Platform

<div align="center">

![EstAi Banner](https://img.shields.io/badge/EstAi-AI%20Real%20Estate%20Platform-10b981?style=for-the-badge)

**Smarter buying, selling, and renting — powered by AI.**

[![Next.js](https://img.shields.io/badge/Next.js-Framework-black?logo=next.js)](https://nextjs.org/)

[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange?logo=firebase)](https://firebase.google.com/)

[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-AI%20Models-orange?logo=google)](https://ai.google.dev/)

[![Google Maps](https://img.shields.io/badge/Google%20Maps-Map%20Integration-34a853?logo=googlemaps)](https://developers.google.com/maps)
</div>

---

## Overview

EstAi is a next-generation, AI-enhanced real estate platform designed to bridge the gap between property seekers and their dream homes. By blending machine learning with a seamless user experience, EstAi makes buying, selling, and renting smarter, faster, and more transparent — for everyone from first-time renters to seasoned investors.

---

## Features

### 🗺️ Interactive Map Integration
Explore neighborhoods visually with intuitive, interactive map layers. Filter properties by location, proximity to amenities, and more — all directly on the map.

### 🤖 AI Price Estimation
Take the guesswork out of the market. EstAi's intelligent valuation engine analyzes comparable listings, market trends, and property attributes to deliver accurate, data-backed price estimates in seconds.

### 📋 Property Listing
List properties for sale or rent effortlessly with a clean, high-conversion interface. Built for both individual sellers and agencies.

### ✨ Curated Showcases
Stay ahead of the market with a dedicated section spotlighting trending properties, new developments, and upcoming projects curated for every type of buyer.

---

## Why EstAi?

Traditional real estate can feel opaque and overwhelming. EstAi exists to change that.

> *Whether you're a first-time renter or a seasoned investor, EstAi gives you the tools to make confident, informed decisions — backed by real data.*

- ✅ **Transparent** — No hidden fees, no inflated estimates. Just honest, AI-driven insights.
- ✅ **Accessible** — Designed for everyone, regardless of real estate experience.
- ✅ **Data-Driven** — Machine learning models trained on real market data, not guesswork.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Map Integration** | [Mapbox](https://www.mapbox.com/) / [Google Maps API](https://developers.google.com/maps) |
| **AI / ML** | [Genkit](https://github.com/firebase/genkit) / Custom Models |
| **Backend & Database** | [Firebase](https://firebase.google.com/) — Firestore & Authentication |

> Update this table to reflect your actual stack.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- API keys for your map provider (Mapbox or Google Maps)
- A [Firebase](https://firebase.google.com/) project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/I-MZN-I/EstAi.git
   cd estai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
   GEMINI_API_KEY
   NEXT_PUBLIC_FIREBASE_API_KEY

   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Project Structure

```
estai/
├── app/                  # Next.js App Router pages & layouts
├── components/           # Reusable UI components
├── lib/                  # Firebase config, utilities, helpers
├── ai/                   # AI flows, prompts, and valuation models
├── public/               # Static assets
└── ...
```

> Update this section to reflect your actual folder structure.

---

## Roadmap

- [ ] Saved search alerts & notifications
- [ ] Mortgage calculator with AI recommendations
- [ ] Agent & agency profile pages
- [ ] Advanced neighborhood scoring (schools, safety, transit)
- [ ] Mobile app (React Native / Expo)

---

## Contributing

Contributions are welcome! If you'd like to improve EstAi, please open an issue first to discuss your idea, then submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">
  Built with ❤️ to make real estate smarter for everyone.
</div>