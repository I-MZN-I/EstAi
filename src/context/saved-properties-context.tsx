"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SavedPropertiesContextType {
    savedPropertyIds: string[];
    saveProperty: (id: string) => void;
    removeProperty: (id: string) => void;
    isSaved: (id: string) => boolean;
    toggleSave: (id: string) => void;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: React.ReactNode }) {
    const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const stored = localStorage.getItem("savedProperties");
            if (stored) {
                setSavedPropertyIds(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load saved properties from localStorage", error);
        }
    }, []);

    const persistToStorage = (ids: string[]) => {
        try {
            localStorage.setItem("savedProperties", JSON.stringify(ids));
        } catch (error) {
            console.error("Failed to save properties to localStorage", error);
        }
    };

    const saveProperty = (id: string) => {
        setSavedPropertyIds((prev) => {
            if (prev.includes(id)) return prev;
            const newIds = [...prev, id];
            persistToStorage(newIds);
            return newIds;
        });
    };

    const removeProperty = (id: string) => {
        setSavedPropertyIds((prev) => {
            const newIds = prev.filter((savedId) => savedId !== id);
            persistToStorage(newIds);
            return newIds;
        });
    };

    const isSaved = (id: string) => {
        return savedPropertyIds.includes(id);
    };

    const toggleSave = (id: string) => {
        if (isSaved(id)) {
            removeProperty(id);
        } else {
            saveProperty(id);
        }
    };

    // Prevent hydration mismatch by not rendering until mounted
    // or return context directly, but components using it should handle skeleton state

    return (
        <SavedPropertiesContext.Provider
            value={{ savedPropertyIds, saveProperty, removeProperty, isSaved, toggleSave }}
        >
            {children}
        </SavedPropertiesContext.Provider>
    );
}

export function useSavedProperties() {
    const context = useContext(SavedPropertiesContext);
    if (context === undefined) {
        throw new Error("useSavedProperties must be used within a SavedPropertiesProvider");
    }
    return context;
}
