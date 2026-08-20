import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dtjracqlythyesfwaeqs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anJhY3FseXRoeWVzZndhZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDgzMDUsImV4cCI6MjA5MzkyNDMwNX0.yGiIsNnYXAcSiTA9e_vYznDXG_YU1XWZCENOlNHLcqY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data, error } = await supabase.from('bundles').select('id, name, published')
if (error) { console.error('ERROR:', JSON.stringify(error)); process.exit(1) }

const hardcoded = 'Eng IFP Semester 1 Bundle: Math 1 + Science 1'

console.log('\n=== ALL BUNDLES ===')
for (const b of data) {
  const nameHex = Buffer.from(b.name, 'utf8').toString('hex')
  console.log(`\nID:        ${b.id}`)
  console.log(`name:      |${b.name}|`)
  console.log(`published: ${b.published}`)
  console.log(`length:    ${b.name.length}`)
  console.log(`hex:       ${nameHex}`)
}

const ifpBundle = data.find(b =>
  b.name.toLowerCase().includes('ifp') ||
  b.name.toLowerCase().includes('semester') ||
  b.name.toLowerCase().includes('science')
)

console.log('\n=== HARDCODED STRING ===')
console.log(`value:     |${hardcoded}|`)
console.log(`hex:       ${Buffer.from(hardcoded, 'utf8').toString('hex')}`)
console.log(`length:    ${hardcoded.length}`)

if (ifpBundle) {
  console.log('\n=== COMPARISON ===')
  console.log(`DB name:          |${ifpBundle.name}|`)
  console.log(`Hardcoded:        |${hardcoded}|`)
  console.log(`Exact match:      ${ifpBundle.name === hardcoded}`)
  console.log(`Trimmed match:    ${ifpBundle.name.trim() === hardcoded.trim()}`)

  const maxLen = Math.max(ifpBundle.name.length, hardcoded.length)
  let diffFound = false
  for (let i = 0; i < maxLen; i++) {
    const dbChar = ifpBundle.name[i]
    const hcChar = hardcoded[i]
    if (dbChar !== hcChar) {
      const dbHex = dbChar ? dbChar.codePointAt(0).toString(16).toUpperCase().padStart(4,'0') : 'EOF'
      const hcHex = hcChar ? hcChar.codePointAt(0).toString(16).toUpperCase().padStart(4,'0') : 'EOF'
      console.log(`DIFF at index ${i}: DB=U+${dbHex}("${dbChar ?? ''}") HC=U+${hcHex}("${hcChar ?? ''}")`)
      diffFound = true
    }
  }
  if (!diffFound) console.log('Strings match character-for-character!')
} else {
  console.log('\nNO IFP/semester/science bundle found!')
}
