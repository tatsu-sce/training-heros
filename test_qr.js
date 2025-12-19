import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
    console.log("Testing handle_occupancy RPC...");
    
    // We need to be signed in to call it usually, but let's see what error we get as anon first.
    // Actually, usually RLS or security definer works for authenticated users.
    // Let's try to sign in first if possible, or just call it.
    // Without sign-in, auth.uid() is null.
    
    const { data, error } = await supabase.rpc('handle_occupancy', { 
        action_type: 'check_in' 
    });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Success:", data);
    }
}

testRPC();
