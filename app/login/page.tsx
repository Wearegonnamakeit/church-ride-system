'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true); 

  // 🌟 이메일/비밀번호 대신 이름과 전화번호 사용
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }), // 🌟 이름과 번호 전송
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(`환영합니다, ${data.user.name}님!`);
        router.push('/'); 
      } else {
        alert('이름이나 전화번호를 다시 확인해주세요.');
      }
    } catch (error) {
      alert('서버와 통신할 수 없습니다.');
    }
  };

  const resolveCoordinates = async (targetAddress: string) => {
    setPredictions([]); 
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(targetAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();
      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        setLat(location.lat); setLng(location.lng); setAddress(targetAddress); 
        return { lat: location.lat, lng: location.lng };
      }
      return null;
    } catch { return null; }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) return alert('모든 칸을 채워주세요!');

    let finalLat = lat;
    let finalLng = lng;
    if (!finalLat || !finalLng) {
      const coords = await resolveCoordinates(address);
      if (!coords) return alert('정확한 주소를 선택해주세요.');
      finalLat = coords.lat; finalLng = coords.lng;
    }

    try {
      const res = await fetch('http://localhost:3001/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, lat: finalLat, lng: finalLng }),
      });

      if (res.ok) {
        alert('가입이 완료되었습니다! 이제 로그인해주세요.');
        setIsLoginMode(true); 
      } else {
        alert('이미 가입된 전화번호입니다.');
      }
    } catch { alert('서버 오류 발생'); }
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value); setLat(null); setLng(null);
    if (!value.trim()) return setPredictions([]);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' },
        body: JSON.stringify({ input: value })
      });
      const data = await res.json();
      setPredictions(data.suggestions ? data.suggestions.map((s: any) => ({ place_id: s.placePrediction.placeId, description: s.placePrediction.text.text })) : []);
    } catch { setPredictions([]); }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`} strategy="afterInteractive" />
      <h1 style={{ textAlign: 'center' }}>{isLoginMode ? '👋 로그인' : '✨ 첫 방문 등록'}</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setIsLoginMode(true)} style={{ padding: '8px 16px', border: 'none', background: isLoginMode ? '#0070f3' : '#eee', color: isLoginMode ? '#fff' : '#333', borderRadius: '20px', cursor: 'pointer' }}>로그인</button>
        <button onClick={() => setIsLoginMode(false)} style={{ padding: '8px 16px', border: 'none', background: !isLoginMode ? '#0070f3' : '#eee', color: !isLoginMode ? '#fff' : '#333', borderRadius: '20px', cursor: 'pointer' }}>등록하기</button>
      </div>

      <form onSubmit={isLoginMode ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="이름 (예: 홍길동)" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }} />
        <input type="tel" placeholder="전화번호 (숫자만)" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }} />

        {!isLoginMode && (
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="기본 픽업/출발 주소 검색" value={address} onChange={handleAddressChange} style={{ width: '100%', padding: '12px', fontSize: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }} />
            {predictions.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', zIndex: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                {predictions.map((p) => (
                  <li key={p.place_id} onClick={() => resolveCoordinates(p.description)} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>📍 {p.description}</li>
                ))}
              </ul>
            )}
            {lat && lng && <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '5px' }}>✅ 주소 확인 완료!</div>}
          </div>
        )}
        <button type="submit" style={{ padding: '14px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {isLoginMode ? '시작하기' : '등록 완료'}
        </button>
      </form>
    </div>
  );
}