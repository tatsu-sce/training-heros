import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function getSession() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
            } catch (error) {
                console.error("Supabase auth error:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const resetPasswordForEmail = async (email) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
    };

    const updatePassword = async (newPassword) => {
        return supabase.auth.updateUser({ password: newPassword });
    };

    const value = {
        session,
        user,
        signOut: () => supabase.auth.signOut(),
        resetPasswordForEmail,
        updatePassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    Loading authentication...
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
