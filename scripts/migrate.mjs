import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('Starting migration...')

  // Test connection
  const { error: testError } = await supabase.from('library_schedules').select('id').limit(1)

  if (testError && testError.code === '42P01') {
    console.log('Tables do not exist yet. Please run the SQL from scripts/001_create_tables.sql directly in your Supabase SQL Editor.')
    console.log('\nSQL file location: scripts/001_create_tables.sql')
    console.log('\nSteps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Click on "SQL Editor"')
    console.log('3. Paste the contents of scripts/001_create_tables.sql')
    console.log('4. Click "Run"')
  } else if (testError) {
    console.error('Connection error:', testError.message)
  } else {
    console.log('Connection successful! Tables already exist.')
  }
}

migrate()
