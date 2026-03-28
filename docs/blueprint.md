# **App Name**: EstAi

## Core Features:

- Property Listing Management: Enables signed-in users to create, update, and manage their properties for sale or rent, including detailed specifications, amenities, and multi-media uploads. Storage and retrieval of listing data use Firebase Firestore and Storage.
- Property Discovery & Search: Allows all users (guest and signed-in) to browse properties through curated 'Trending', 'Most Viewed', and 'Upcoming Projects' feeds, and offers powerful filtering and sorting options including locality, price, bedrooms, and type, with data powered by Firestore.
- Interactive Map Exploration: Integrates a map provider (Mapbox or Google Maps) to visually explore properties with clustered pins, a toggle between map and list views, and location-based searching, all through an abstracted MapProvider.
- AI Price Estimation Tool: Provides signed-in users with a tool to obtain AI-generated price or rent estimations for properties, including a confidence band, score, and an explanation of top contributing factors, powered by a Cloud Functions-accessed ML inference service.
- User Authentication & Guest Mode: Manages user sign-in/creation via Firebase Auth, distinguishing between guest (browse-only) and signed-in users, with clear UI indicators and modal prompts to 'Unlock EstAi' for premium features.
- Listing Interaction & Seller Contact: Enables signed-in users to save/favorite properties for later access and directly contact property sellers, with all user interactions persisted in Firestore.

## Style Guidelines:

- Primary accent color: A rich 'Champagne Gold' (#C9A86A) to denote luxury and interactive elements.
- Background colors: Deep 'Midnight Onyx' dark (#07080B) for the main background and a slightly lighter surface dark (#0E1116) to establish a premium, high-contrast base.
- Secondary accent color: A vibrant 'Sapphire Blue' (#7AA7FF) used for distinct highlights and complementary UI elements.
- Glassmorphism elements: Use translucent white 'Glass' (rgba(255,255,255,0.06)) with a subtle blur effect to create modern, minimal UI accents.
- Text colors: High-contrast light text, with primary (#F5F6F7) and secondary (#B8BDC7) variants, ensuring readability against dark backgrounds. Borders are a subtle light (rgba(255,255,255,0.10)).
- Headlines: 'Playfair' (modern serif) for an elegant, high-end, and fashionable feel, aligning with the 'magazine-like' aesthetic. Body text: 'PT Sans' (humanist sans-serif) for clean readability in longer content blocks, ensuring a modern yet personable feel.
- Abstract, minimalist line icons, possibly with a subtle gradient effect matching the Champagne Gold accent, to maintain visual cleanliness and a premium, uncluttered look.
- Spacious, minimalist layouts with generous negative space to highlight content. Content sections are designed to emulate a 'magazine-like' reading experience, utilizing full-bleed galleries and floating glass CTA bars for engagement.
- Smooth micro-animations, including subtle animated gradients on splash screens, a gold shimmer micro-animation for the logo, skeleton shimmer loaders, and interactive micro-animations for card presses, bottom sheet slides, and carousel snaps, for a fluid and responsive user experience.