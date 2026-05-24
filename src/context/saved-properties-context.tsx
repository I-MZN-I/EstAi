"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import { collection, query, where, onSnapshot, setDoc, deleteDoc, doc } from "firebase/firestore";

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
    }, []);

    // Sync saved properties from Firestore for the currently logged-in user
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                setSavedPropertyIds([]);
                return;
            }

            const q = query(
                collection(db, "saved_properties"),
                where("userId", "==", user.uid)
            );

            const unsub = onSnapshot(q, (snapshot) => {
                const ids = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return data.propertyId || doc.id.split("_")[1] || doc.id;
                });
                setSavedPropertyIds(ids);
            });

            return () => unsub();
        });

        return () => unsubscribe();
    }, []);

    const saveProperty = async (id: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        try {
            // Write a record to the saved_properties collection with userId tracking
            await setDoc(doc(db, "saved_properties", `${currentUser.uid}_${id}`), {
                userId: currentUser.uid,
                propertyId: id,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Failed to save property to Firestore", error);
        }
    };

    const removeProperty = async (id: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        try {
            await deleteDoc(doc(db, "saved_properties", `${currentUser.uid}_${id}`));
        } catch (error) {
            console.error("Failed to remove property from Firestore", error);
        }
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
