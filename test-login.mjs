const response = await fetch('http://localhost:3000/api/trpc/auth.loginLocal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    json: {
      email: 'admin@barbearia.com',
      password: '2Il%bfRjGiW!f1ew'
    }
  }),
  credentials: 'include'
});

console.log('Status:', response.status);
console.log('Headers:', Object.fromEntries(response.headers));
const text = await response.text();
console.log('Body:', text);
try {
  const json = JSON.parse(text);
  console.log('Parsed:', JSON.stringify(json, null, 2));
} catch (e) {
  console.log('Failed to parse JSON:', e.message);
}
