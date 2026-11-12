import re

app_path = r'C:\Users\Luis Fernando Armas\ghtb-prices-history\src-extracted\app.mjs'

with open(app_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Define comprehensive initialPayments list with all requested values without duplicates
calibrated_payments_def = """const initialPayments = [
  { id:'08JUNE3A', date:'2026-06-03', name:'Cloud metered infrastructure', kind:'Feature', method:'MasterCard ending in 2791', amount:180.00, files:[{...demoBundles[0].files[0]}] },
  { id:'1B78C49E', date:'2026-07-03', name:'Cloud metered services', kind:'Feature', method:'MasterCard ending in 2791', amount:180.00, files:[{...demoBundles[0].files[0]}] },
  { id:'2F49D10A', date:'2026-08-03', name:'App platform scale-up', kind:'App', method:'MasterCard ending in 2791', amount:250.00, files:[{...demoBundles[1].files[0]}] },
  { id:'839GHTB3', date:'2026-09-03', name:'GITHUB, INC. — Team & Services', kind:'Feature', method:'American Express ending in 1989', amount:839.50, files:[{...demoBundles[0].files[0]}] },
  { id:'3E92B67C', date:'2026-09-03', name:'Application core services', kind:'App', method:'MasterCard ending in 2791', amount:265.00, files:[{...demoBundles[2].files[0]}] },
  { id:'2300APPL', date:'2026-09-09', name:'APPLE.COM BILL — Débito cuenta Luis Fernando Armas', kind:'App', method:'Banco Pichincha Debit', amount:2300.00, files:[{...demoBundles[1].files[0]}] },
  { id:'362GCLD1', date:'2026-10-01', name:'Google Cloud Platform & APIs (CLOUD XJQz2J)', kind:'Feature', method:'American Express ending in 1989', amount:3.62, files:[{...demoBundles[0].files[0]}] },
  { id:'4C81A53D', date:'2026-10-03', name:'High-capacity runner allocation', kind:'Feature', method:'MasterCard ending in 2791', amount:265.00, files:[{...demoBundles[0].files[0]}] },
  { id:'19T5IGEN', date:'2026-10-25', name:'Authentication feature', kind:'Feature', method:'MasterCard ending in 2791', amount:5.66, files:[{...demoBundles[0].files[0]}] },
  { id:'1040APPL', date:'2026-10-28', name:'Apple Receipt — CROSSBOX Developer preview (MNY6QK6M6H)', kind:'App', method:'American Express ending in 1989', amount:1040.00, files:[{...demoBundles[1].files[0]}] },
  { id:'1074APPL', date:'2026-10-28', name:'Apple Receipt — App Developer Paid (MNY6S74KGB)', kind:'App', method:'American Express ending in 1989', amount:1074.00, files:[{...demoBundles[1].files[0]}] },
  { id:'1173APPL', date:'2026-10-28', name:'Apple Receipt — CROSSBOX In-App iPhone 13 Pro Max', kind:'App', method:'American Express ending in 1989', amount:1173.00, files:[{...demoBundles[1].files[0]}] },
  { id:'5D17F82B', date:'2026-11-01', name:'Google Cloud Platform & APIs (P7SZWC)', kind:'Feature', method:'American Express ending in 1989', amount:3.80, files:[{...demoBundles[0].files[0]}] },
  { id:'6E39C94F', date:'2026-11-06', name:'Google Cloud Platform & APIs (CLOUD XJQz2J)', kind:'Feature', method:'American Express ending in 1989', amount:971.75, files:[{...demoBundles[1].files[0]}] },
  { id:'7A52B81C', date:'2026-11-09', name:'Banco del Pacífico — CROSSBOX FITNESS & STRENGTH', kind:'App', method:'MasterCard ending in 0791', amount:270.00, files:[{...demoBundles[2].files[0]}] }
];"""

code = re.sub(r'const initialPayments = \[[\s\S]*?\];', calibrated_payments_def, code)

# Ensure migration replaces/refreshes payments cache so the new items appear without duplicates
storage_sync = """let payments = read('payments', initialPayments);
if (!Array.isArray(payments) || payments.length < initialPayments.length) {
  const existingMap = new Map((Array.isArray(payments) ? payments : []).map(p => [p.id, p]));
  payments = initialPayments.map(p => existingMap.get(p.id) || p);
  write('payments', payments);
}"""

code = re.sub(r'let payments = read\(\'payments\', initialPayments\);[\s\S]*?write\(\'payments\', payments\);\s*\}', storage_sync, code)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Calibrated payments updated in app.mjs!")
