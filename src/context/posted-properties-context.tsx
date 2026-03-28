"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { PostedProperty } from "@/lib/types";

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
    try {
      const stored = localStorage.getItem("postedProperties");
      if (stored) {
        let parsed: PostedProperty[] = JSON.parse(stored);
        
        // --- CLEANUP SCRIPT: remove orphaned properties ---
        const badTitles = ["beautiful 5bhk residential", "3bhk", "4BHK House"];
        const filtered = parsed.filter(p => !badTitles.includes(p.title));
        
        if (filtered.length !== parsed.length) {
          localStorage.setItem("postedProperties", JSON.stringify(filtered));
        }
        // ----------------------------------------------------

        setPostedProperties(filtered);
      }
    } catch (error) {
      console.error("Failed to load posted properties from localStorage", error);
    }
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

