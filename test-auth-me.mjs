// First, login
const loginResponse = await fetch('http://localhost:3000/api/trpc/auth.loginLocal', {
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

console.log('Login status:', loginResponse.status);
const setCookie = loginResponse.headers.get('set-cookie');
console.log('Set-Cookie header:', setCookie);

// Now try to get auth.me with the cookie
const meResponse = await fetch('http://localhost:3000/api/trpc/auth.me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': setCookie || ''
  },
  credentials: 'include'
});

console.log('Auth.me status:', meResponse.status);
const meText = await meResponse.text();
console.log('Auth.me response:', meText);
