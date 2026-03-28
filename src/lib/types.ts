export type Property = {
  id: string;
  ownerId: string;
  status: 'active' | 'inactive' | 'sold' | 'rented';
  mode: 'sale' | 'rent';
  type: 'apartment' | 'villa' | 'plot' | 'commercial';
  title: string;
  description: string;
  price?: number;
  rentMonthly?: number;
  areaSqft: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  parking: string;
  floor: number;
  ageYears: number;
  facing: string;
  amenities: string[];
  location: {
    lat: number;
    lng: number;
    geohash: string;
    locality: string;
    city: string;
    state: string;
  };
  media: {
    coverUrl: string;
    imageHint: string;
    urls: string[];
  };
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  builder: string;
  locality: string;
  city: string;
  expectedHandoverDate: string;
  priceRangeMin: number;
  priceRangeMax: number;
  amenities: string[];
  media: {
    coverUrl: string;
    imageHint: string;
    urls: string[];
  };
  createdAt: string;
};

export type PostedProperty = {
  id: string;
  userId?: string; // Firebase Auth UID of the user who posted
  propertyType: string;
  mode: 'sale' | 'rent';
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  rooms: number;
  cent: number;
  sqft: number;
  totalFloors: number;
  nearestLandmark: string;
  roadFacility: string;
  totalPrice: number;
  pricePerCent: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images: string[]; // base64 encoded
  lat: number;
  lng: number;
  city: string;
  state?: string;
  distanceFromTown: number; // in metres
  nearestTownName: string;
  furnished: number; // 0=unfurnished, 1=semi, 2=fully
  currency: '₹' | '$'; // selected currency symbol
  createdAt: string;
};
