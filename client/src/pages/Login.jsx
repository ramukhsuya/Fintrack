export default function Login() {
  const handleGoogleLogin = () => {
    // This points directly to your Express backend auth route
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h1>FinTrack</h1>
      <p style={{ marginBottom: '20px' }}>Securely manage your portfolio.</p>
      
      <button 
        onClick={handleGoogleLogin}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Sign in with Google
      </button>
    </div>
  );
}