import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error connecting to Supabase or finding table:', error.message);
        if (error.code === '42P01') {
            console.error('Table "profiles" does not exist. Please run the SQL script in Supabase.');
        }
        process.exit(1);
    } else {
        console.log('Success: "profiles" table exists and is accessible.');
        process.exit(0);
    }
}

check();
