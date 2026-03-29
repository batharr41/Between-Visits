import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [linkedPatientId, setLinkedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(session) {
    if (!session?.access_token) {
      setUserRole(null);
      setAgencyId(null);
      setLinkedPatientId(null);
      return;
    }
    try {
      const res = await fetch(API_URL + '/api/me', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      if (res.ok) {
        const profile = await res.json();
        setUserRole(profile.role || null);
        setAgencyId(profile.agency_id || null);
        setLinkedPatientId(profile.patient_id || null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session);
      } else {
        setUserRole(null);
        setAgencyId(null);
        setLinkedPatientId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();

  const isAdmin = userRole === 'admin';
  const isCaregiver = userRole === 'caregiver';
  const isFamily = userRole === 'family';

  return (
    <AuthContext.Provider value={{
      user, loading, signUp, signIn, signOut,
      userRole, agencyId, linkedPatientId,
      isAdmin, isCaregiver, isFamily
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
