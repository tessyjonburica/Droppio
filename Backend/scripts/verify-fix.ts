
import { supabase } from '../src/config/db';

console.log('Testing Supabase connection with node-fetch fix...');

async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.error('Connection failed:', error);
            process.exit(1);
        } else {
            console.log('Connection successful!');
            console.log('Data:', data);
            process.exit(0);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

testConnection();
