"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { PostedProperty } from "@/lib/types";
import { db } from "@/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface PostedPropertiesContextType {
  postedProperties: PostedProperty[];
  addProperty: (property: PostedProperty) => void;
  updateProperty: (property: PostedProperty) => void;
  removeProperty: (id: string) => void;
}

const PostedPropertiesContext = createContext<PostedPropertiesContextType | undefined>(undefined);

export function PostedPropertiesProvider({ children }: { children: React.ReactNode }) {
  const [postedProperties, setPostedProperties] = useState<PostedProperty[]>([]);

  useEffect(() => {
    const fetchPropertiesFromCloud = async () => {
      try {
        const q = query(collection(db, "properties"), orderBy("server_posted_date", "desc"));
        const querySnapshot = await getDocs(q);
        
        const propertiesFromFirestore = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Sync snake_case database schema variables perfectly with expected UI camelCase extensions safely
            propertyType: data.property_type || "",
            totalFloors: data.total_floor || 1,
            bedrooms: data.bedroom || 0,
            bathrooms: data.bathroom || 0,
            distanceFromTown: data.distance_from_town || 0,
            nearestTownName: data.nearest_town || "",
            roadFacility: data.road_facility || "3",
            nearestLandmark: data.nearest_landmark || "",
            totalPrice: data.total_price || 0,
            pricePerCent: data.price_per_cent || 0,
            contactName: data.contact_name || "",
            contactPhone: data.contact_phone || "",
            contactEmail: data.contact_email || "",
            lat: data.latitude || 0,
            lng: data.longitude || 0,
          };
        }) as PostedProperty[];

        setPostedProperties(propertiesFromFirestore);
      } catch (error) {
        console.error("Error loading data from cloud:", error);
      }
    };

    fetchPropertiesFromCloud();
  }, []);

  const persistToStorage = (props: PostedProperty[]) => {
    try {
      localStorage.setItem("postedProperties", JSON.stringify(props));
    } catch (error) {
      console.error("Failed to save posted properties to localStorage", error);
    }
  };

  const addProperty = (property: PostedProperty) => {
    setPostedProperties((prev) => {
      const newProps = [property, ...prev];
      persistToStorage(newProps);
      return newProps;
    });
  };

  const updateProperty = (property: PostedProperty) => {
    setPostedProperties((prev) => {
      const newProps = prev.map((p) => (p.id === property.id ? property : p));
      persistToStorage(newProps);
      return newProps;
    });
  };

  const removeProperty = (id: string) => {
    setPostedProperties((prev) => {
      const newProps = prev.filter((p) => p.id !== id);
      persistToStorage(newProps);
      return newProps;
    });
  };

  return (
    <PostedPropertiesContext.Provider value={{ postedProperties, addProperty, updateProperty, removeProperty }}>
      {children}
    </PostedPropertiesContext.Provider>
  );
}

export function usePostedProperties() {
  const context = useContext(PostedPropertiesContext);
  if (context === undefined) {
    throw new Error("usePostedProperties must be used within a PostedPropertiesProvider");
  }
  return context;
}

