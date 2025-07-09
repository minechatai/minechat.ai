// Debug script to test Google OAuth configuration
import https from 'https';
import url from 'url';

// Test Google OAuth endpoint directly
const testGoogleOAuth = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = 'https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  console.log('Testing Google OAuth URL:');
  console.log(authUrl);
  console.log('\nClient ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  
  // Test if the URL is accessible
  const parsedUrl = url.parse(authUrl);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'HEAD'
  };
  
  const req = https.request(options, (res) => {
    console.log('\nGoogle OAuth endpoint test:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ Google OAuth endpoint is accessible');
    } else {
      console.log('❌ Google OAuth endpoint returned error:', res.statusCode);
    }
  });
  
  req.on('error', (e) => {
    console.error('❌ Error testing Google OAuth endpoint:', e.message);
  });
  
  req.end();
};

testGoogleOAuth();