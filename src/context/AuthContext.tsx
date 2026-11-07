import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { User, UserRole } from '../types';

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          let docSnap = await getDoc(userDocRef);

          // If document was just created during register, wait briefly for Firestore propagation
          if (!docSnap.exists()) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            docSnap = await getDoc(userDocRef);
          }

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role: UserRole = data.role === 'admin' ? 'admin' : 'customer';
            const createdAt =
              typeof data.createdAt === 'string'
                ? data.createdAt
                : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

            setUser({
              uid: fbUser.uid,
              name: data.name || fbUser.displayName || '',
              email: data.email || fbUser.email || '',
              role,
              createdAt,
              id: fbUser.uid,
              displayName: data.name || fbUser.displayName || '',
            });
          } else {
            // Document does not exist in Firestore; initialize with default customer role
            const newUserData: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || '',
              email: fbUser.email || '',
              role: 'customer',
              createdAt: new Date().toISOString(),
              id: fbUser.uid,
              displayName: fbUser.displayName || '',
            };

            await setDoc(userDocRef, {
              uid: newUserData.uid,
              name: newUserData.name,
              email: newUserData.email,
              role: newUserData.role,
              createdAt: newUserData.createdAt,
            });

            setUser(newUserData);
          }
        } catch (error) {
          console.error('Error fetching user from Firestore:', error);
          setUser({
            uid: fbUser.uid,
            name: fbUser.displayName || '',
            email: fbUser.email || '',
            role: 'customer',
            createdAt: new Date().toISOString(),
            id: fbUser.uid,
            displayName: fbUser.displayName || '',
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const trimmedName = name.trim();

    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }

    const newUserData: User = {
      uid: cred.user.uid,
      name: trimmedName,
      email: cred.user.email || email.trim(),
      role: 'customer',
      createdAt: new Date().toISOString(),
      id: cred.user.uid,
      displayName: trimmedName,
    };

    const userDocRef = doc(db, 'users', cred.user.uid);
    await setDoc(userDocRef, {
      uid: newUserData.uid,
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      createdAt: newUserData.createdAt,
    });

    setUser(newUserData);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
