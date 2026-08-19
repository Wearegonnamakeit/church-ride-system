'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface ChurchEvent {
  id: number;
  date: string;
  title: string;
  formUrl: string;
  type: 'regular' | 'special';
  fullName: string; 
  destination: string; 
}

interface Person {
  id: string;
  name: string;
  role: 'driver' | 'rider';
  carId: string | null; 
  capacity?: number; 
  address?: string; 
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'calendar' | 'admin'>('calendar');
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const CALENDAR_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=1986581638&single=true&output=csv';
  const RESPONSES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=1712691725&single=true&output=csv';
  
  // 🔴 반드시 회원님의 실제 주소로 바꿔주세요!
  const ASSIGNMENT_CSV_URL = '여기에_배정데이터_CSV_주소를_넣어주세요'; 
  const SAVE_API_URL = '여기에_새로운_앱스스크립트_주소를_넣어주세요';

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [rawResponses, setRawResponses] = useState<any[]>([]); 
  const [savedAssignments, setSavedAssignments] = useState<any[]>([]); 

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch(CALENDAR_CSV_URL).then(res => res.text()).then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const fetchedEvents = results.data
            .filter((row: any) => row['날짜'] && row['행사명'])
            .map((row: any, idx) => {
              const eventDate = row['날짜'].trim();
              const eventTitle = row['행사명'];
              const eventFullName = `${eventDate} ${eventTitle}`; 
              const encodedEventName = encodeURIComponent(eventFullName); 
              const autoFilledUrl = `https://docs.google.com/forms/d/e/1FAIpQLSd_mBaYyyr0G7Qi-VPVqCZBVl1op-MPGJlqB5sT3ANRd_dnvA/viewform?usp=pp_url&entry.1913637231=${encodedEventName}`;
              const destination = row['목적지'] || row['장소'] || '';

              return { id: idx, date: eventDate, title: eventTitle, fullName: eventFullName, formUrl: autoFilledUrl, type: (String(eventTitle).includes('예배') ? 'regular' : 'special') as 'regular' | 'special', destination: destination };
            });
          setEvents(fetchedEvents);
        }
      });
    });

    fetch(RESPONSES_CSV_URL).then(res => res.text()).then(csvText => {
      Papa.parse(csvText, { header: true, skipEmptyLines: true, complete: (results) => setRawResponses(results.data) });
    });

    if (ASSIGNMENT_CSV_URL !== '여기에_배정데이터_CSV_주소를_넣어주세요') {
      fetch(`${ASSIGNMENT_CSV_URL}&t=${new Date().getTime()}`).then(res => res.text()).then(csvText => {
        Papa.parse(csvText, { header: true, skipEmptyLines: true, complete: (results) => setSavedAssignments(results.data) });
      });
    }
  }, []);

  const [adminSelectedEvent, setAdminSelectedEvent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [dragOverCarId, setDragOverCarId] = useState<string | 'waitlist' | null>(null);

  useEffect(() => {
    if (!adminSelectedEvent) {
      setPeople([]);
      return;
    }

    const savedRow = savedAssignments.find(r => r['행사명'] === adminSelectedEvent);
    let savedPeopleMap: Record<string, string | null> = {}; 
    
    if (savedRow && savedRow['데이터']) {
      try {
        const parsedData = JSON.parse(savedRow['데이터']);
        parsedData.forEach((p: Person) => { if (p.role !== 'driver') savedPeopleMap[p.name] = p.carId; });
      } catch (e) { console.error("데이터 읽기 실패", e); }
    }

    const latestResponsesMap = new Map();
    rawResponses.forEach((row) => {
      const rowEvent = row['참석 행사'] || '';
      if (rowEvent === adminSelectedEvent) {
        const nameKey = Object.keys(row).find(key => key.includes('이름')) || '';
        const name = row[nameKey] || '이름없음';
        latestResponsesMap.set(name, row); 
      }
    });

    const dynamicDrivers: Person[] = [];
    const dynamicRiders: Person[] = [];
    const latestResponses = Array.from(latestResponsesMap.values());

    latestResponses.forEach((row, idx) => {
      const isAttending = String(row['참석 여부 (Attendance or not)'] || row['참석 여부'] || '').includes('참석하겠습니다');
      
      if (isAttending) {
        const nameKey = Object.keys(row).find(key => key.includes('이름')) || '';
        const name = row[nameKey] || '이름없음';
        
        const addressKey = Object.keys(row).find(key => key.includes('주소') || key.includes('Address')) || '';
        const address = addressKey ? row[addressKey] : '';

        const rideTypeKey = Object.keys(row).find(key => key.includes('이동 수단') || key.includes('수단') || key.includes('Ride Information')) || '';
        const rideType = rideTypeKey ? String(row[rideTypeKey]) : '';

        const capacityKey = Object.keys(row).find(key => key.includes('정원') || key.includes('Capacity')) || '';
        const capacityStr = capacityKey ? String(row[capacityKey]).replace(/[^0-9]/g, '') : '';
        const capacity = capacityStr ? parseInt(capacityStr, 10) : 4;

        if (rideType.includes('운전 가능')) {
          const driverId = `driver_${idx}`;
          dynamicDrivers.push({ id: driverId, name: name, role: 'driver', capacity: capacity, carId: driverId, address: address });
        } else if (rideType.includes('라이드 필요') || !rideType) {
          dynamicRiders.push({ id: `rider_${idx}`, name: name, role: 'rider', carId: savedPeopleMap[name] !== undefined ? savedPeopleMap[name] : null, address: address });
        }
      }
    });

    setPeople([...dynamicDrivers, ...dynamicRiders]);
  }, [adminSelectedEvent, rawResponses, savedAssignments]);

  const assignToCar = (carId: string | null) => {
    if (!selectedRider) return;
    setPeople(prev => prev.map(p => p.id === selectedRider ? { ...p, carId } : p));
    setSelectedRider(null); 
  };

  const handleDragStart = (e: React.DragEvent, riderId: string) => {
    e.dataTransfer.setData('riderId', riderId);
    setSelectedRider(riderId);
  };

  const handleDrop = (e: React.DragEvent, carId: string | null) => {
    e.preventDefault();
    setDragOverCarId(null);
    const riderId = e.dataTransfer.getData('riderId');
    if (!riderId) return;

    if (carId !== null) {
      const driver = people.find(p => p.id === carId);
      const passengers = people.filter(p => p.carId === carId);
      if (driver && passengers.length >= (driver.capacity || 0)) {
        showToast('이 차량은 이미 만차입니다!', 'error');
        setSelectedRider(null);
        return;
      }
    }
    setPeople(prev => prev.map(p => p.id === riderId ? { ...p, carId } : p));
    setSelectedRider(null);
  };

  const saveToSheet = async () => {
    if (!adminSelectedEvent) return;
    
    if (people.length === 0) {
      showToast('신청한 인원이 없어 저장할 데이터가 없습니다.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new URLSearchParams();
      formData.append("eventName", adminSelectedEvent);
      formData.append("peopleData", JSON.stringify(people));

      await fetch(SAVE_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData, 
      });
      
      showToast('배정 결과가 안전하게 저장되었습니다!', 'success');
    } catch (e) {
      showToast('오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    }
    setIsSaving(false);
  };

  const copyToKakao = () => {
    const drivers = people.filter(p => p.role === 'driver');
    const unassignedRiders = people.filter(p => p.role === 'rider' && !p.carId);

    let text = `[${adminSelectedEvent || '차량 배정'} 결과 안내]\n\n`;
    drivers.forEach(driver => {
      const passengers = people.filter(p => p.role === 'rider' && p.carId === driver.id);
      const passengerNames = passengers.map(p => p.name).join(', ') || '빈 차';
      const isFull = passengers.length >= (driver.capacity || 0);
      text += `[차량] ${driver.name} (${isFull ? '만차' : `${driver.capacity! - passengers.length}자리 남음`})\n`;
      text += ` - 탑승: ${passengerNames}\n\n`;
    });
    if (unassignedRiders.length > 0) text += `[대기 인원]\n - ${unassignedRiders.map(p => p.name).join(', ')}\n`;
    else text += `[대기 인원] 없음\n`;

    navigator.clipboard.writeText(text).then(() => showToast('복사되었습니다! 카카오톡에 붙여넣기 해주세요.', 'success'));
  };

  const openRouteMap = (driverId: string) => {
    const driver = people.find(p => p.id === driverId);
    const passengers = people.filter(p => p.role === 'rider' && p.carId === driverId);
    
    const currentEvent = events.find(e => e.fullName === adminSelectedEvent);
    const destination = currentEvent?.destination || '';

    const driverAddress = driver?.address || '';
    const passengerAddresses = passengers.map(p => p.address).filter(addr => addr && addr.trim() !== '');

    const waypoints = [];
    if (driverAddress) waypoints.push(driverAddress);
    waypoints.push(...passengerAddresses as string[]);
    if (destination) waypoints.push(destination);

    if (waypoints.length < 2) {
      showToast('경로 생성 불가: [운전자 주소, 탑승자 주소, 행사 목적지] 중 최소 2개의 주소가 필요합니다.', 'error');
      return;
    }

    const encodedAddresses = waypoints.map(addr => encodeURIComponent(addr)).join('/');
    const routeUrl = `https://www.google.com/maps/dir/${encodedAddresses}`;
    
    window.open(routeUrl, '_blank');
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const selectedEvents = events.filter(e => e.date === selectedDate);
  const unassignedRiders = people.filter(p => p.role === 'rider' && !p.carId);
  const drivers = people.filter(p => p.role === 'driver');
  const uniqueEvents = Array.from(new Set(events.map(e => e.fullName)));

  return (
    // 🌟 바로 이 줄에 width: '100%'가 추가되어 화면 크기가 일정하게 고정됩니다!
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: '#f4f4f5', minHeight: '100vh', position: 'relative', paddingBottom: '80px', fontFamily: 'sans-serif', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
      
      {/* 🌟 여백 찌그러짐을 방지하는 box-sizing: border-box 와 기본 margin 제거 코드 추가 */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #f4f4f5; }
        .hover-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-btn:hover { transform: translateY(-2px); filter: brightness(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
        .hover-btn:active { transform: translateY(0); }
        
        .drop-zone { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .drop-zone-active { transform: scale(1.02); box-shadow: 0 0 20px rgba(59,130,246,0.3); border-color: #3b82f6 !important; background-color: #eff6ff !important; }
        
        .toast-enter { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp {
          from { transform: translate(-50%, 150%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {toast && (
        <div className="toast-enter" style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3f3f46', color: '#fff', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 100, boxShadow: '0 8px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.message}
        </div>
      )}

      <header style={{ background: '#ffffff', padding: '20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e4e4e7' }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#18181b', fontWeight: '800' }}>우리교회 라이드</h1>
      </header>

      <main style={{ padding: '20px' }}>
        
        {currentTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <button className="hover-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ border: 'none', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#3f3f46', fontWeight: 'bold' }}>이전</button>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#18181b' }}>{year}년 {month + 1}월</h2>
              <button className="hover-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ border: 'none', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#3f3f46', fontWeight: 'bold' }}>다음</button>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e4e4e7' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                {weekDays.map((day, idx) => <div key={day} style={{ color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : '#71717a' }}>{day}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {blanks.map(b => <div key={`blank-${b}`} />)}
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasEvent = events.some(e => e.date === dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div className="hover-btn" key={day} onClick={() => setSelectedDate(dateStr)} style={{ height: '45px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px', background: isSelected ? '#18181b' : hasEvent ? '#f3f4f6' : 'transparent', color: isSelected ? '#fff' : '#18181b', fontWeight: hasEvent ? 'bold' : 'normal' }}>
                      <span style={{ fontSize: '14px' }}>{day}</span>
                      {hasEvent && <div style={{ width: '5px', height: '5px', background: isSelected ? '#fff' : '#3b82f6', borderRadius: '50%', marginTop: '3px' }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', color: '#3f3f46', marginBottom: '10px', marginLeft: '5px', fontWeight: 'bold' }}>해당 일자 일정</h3>
                {selectedEvents.length > 0 ? (
                  selectedEvents.map(event => (
                    <div key={event.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e4e4e7', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <span style={{ fontSize: '12px', background: event.type === 'regular' ? '#dbeafe' : '#fce7f3', color: event.type === 'regular' ? '#1d4ed8' : '#be185d', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{event.type === 'regular' ? '정기 예배' : '특별 행사'}</span>
                      <h4 style={{ margin: '12px 0', fontSize: '18px', color: '#18181b' }}>{event.title}</h4>
                      {event.destination && <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '15px' }}>장소: <span style={{ fontWeight: 'bold', color: '#3f3f46' }}>{event.destination}</span></div>}
                      <button className="hover-btn" onClick={() => window.open(event.formUrl, '_blank')} style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>라이드 신청 또는 취소하기</button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#a1a1aa', background: '#fff', borderRadius: '16px', border: '1px dashed #d4d4d8', fontSize: '14px' }}>등록된 행사가 없습니다.</div>
                )}
              </div>
            )}
          </div>
        )}

        {currentTab === 'admin' && (
          <div>
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '14px 20px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', border: '1px solid #fecaca', textAlign: 'center', lineHeight: '1.5' }}>
              [안내] 이곳은 목사님과 <b>차량 운전자</b>분들만 이용하는 관리 공간입니다. 일반 교인분들은 <b>일정 달력</b> 탭을 이용해 주세요.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#18181b', fontWeight: 'bold' }}>차량 수동 배정</h2>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="hover-btn" onClick={copyToKakao} style={{ padding: '8px 12px', background: '#fef01b', color: '#3f2020', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>카톡 공유</button>
                <button className="hover-btn" onClick={saveToSheet} disabled={isSaving} style={{ padding: '8px 12px', background: isSaving ? '#a1a1aa' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  {isSaving ? '저장 중...' : '결과 저장'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <select 
                value={adminSelectedEvent} 
                onChange={(e) => setAdminSelectedEvent(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d4d4d8', fontSize: '15px', background: '#fff', cursor: 'pointer', color: '#18181b', fontWeight: 'bold' }}
              >
                <option value="">-- 배정할 행사를 선택하세요 --</option>
                {uniqueEvents.map(eventName => (
                  <option key={eventName} value={eventName}>{eventName}</option>
                ))}
              </select>
            </div>

            {adminSelectedEvent ? (
              <>
                <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '12px 15px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>안내: 화면에서 드래그하여 배정한 후 우측 상단의 <b>[결과 저장]</b> 버튼을 꼭 눌러주세요.</div>

                <div 
                  className={`drop-zone ${dragOverCarId === 'waitlist' ? 'drop-zone-active' : ''}`}
                  onClick={() => assignToCar(null)} onDragOver={(e) => { e.preventDefault(); setDragOverCarId('waitlist'); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, null)}
                  style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: dragOverCarId === 'waitlist' ? '2px dashed #3b82f6' : (selectedRider ? '2px dashed #a1a1aa' : '1px solid #e4e4e7'), minHeight: '100px', marginBottom: '25px', cursor: 'pointer' }}
                >
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>대기 인원 <span style={{ background: '#f4f4f5', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#71717a' }}>{unassignedRiders.length}명</span></h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {unassignedRiders.map(rider => (
                      <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'grab', background: selectedRider === rider.id ? '#3b82f6' : '#f4f4f5', color: selectedRider === rider.id ? '#fff' : '#3f3f46', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {rider.name}
                      </button>
                    ))}
                    {unassignedRiders.length === 0 && <span style={{ fontSize: '13px', color: '#a1a1aa' }}>모두 배정되었습니다.</span>}
                  </div>
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', paddingLeft: '5px', fontWeight: 'bold' }}>차량 목록</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {drivers.map(driver => {
                    const passengers = people.filter(p => p.role === 'rider' && p.carId === driver.id);
                    const isFull = passengers.length >= (driver.capacity || 0);

                    return (
                      <div key={driver.id} className={`drop-zone ${dragOverCarId === driver.id ? 'drop-zone-active' : ''}`} onClick={() => !isFull && assignToCar(driver.id)} onDragOver={(e) => { e.preventDefault(); !isFull && setDragOverCarId(driver.id); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, driver.id)} style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: isFull ? '2px solid #fecaca' : (dragOverCarId === driver.id ? '2px dashed #3b82f6' : '1px solid #e4e4e7'), position: 'relative', cursor: isFull ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
                        {isFull && <div style={{ position: 'absolute', right: '-25px', top: '15px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>만차</div>}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '900', color: '#18181b', fontSize: '16px' }}>[차량] {driver.name}</span>
                            <span style={{ fontSize: '12px', background: isFull ? '#fee2e2' : '#dcfce7', color: isFull ? '#dc2626' : '#166534', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{passengers.length} / {driver.capacity}명</span>
                          </div>
                          <button className="hover-btn" onClick={(e) => { e.stopPropagation(); openRouteMap(driver.id); }} style={{ padding: '8px 12px', background: '#18181b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                            내비게이션 안내
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '45px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px inset #f1f5f9' }}>
                          {passengers.map(rider => (
                            <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: selectedRider === rider.id ? '#3b82f6' : '#ffffff', color: selectedRider === rider.id ? '#fff' : '#334155', fontSize: '13px', fontWeight: 'bold', cursor: 'grab', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {rider.name} <span style={{ color: selectedRider === rider.id ? '#93c5fd' : '#94a3b8', fontSize: '12px', fontWeight: 'normal' }}>X</span>
                            </button>
                          ))}
                          {passengers.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', height: '100%' }}>이곳으로 이름을 드래그하세요</span>}
                        </div>
                      </div>
                    );
                  })}
                  {drivers.length === 0 && <div style={{ fontSize: '14px', color: '#71717a', textAlign: 'center', padding: '30px', background: '#f4f4f5', borderRadius: '12px' }}>아직 신청한 운전자가 없습니다.</div>}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#71717a', background: '#fff', borderRadius: '16px', border: '2px dashed #e4e4e7', fontSize: '14px', lineHeight: '1.6' }}>
                위 목록에서 행사를 선택하시면<br/>배정 화면이 나타납니다.
              </div>
            )}
          </div>
        )}

      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#ffffff', display: 'flex', borderTop: '1px solid #e4e4e7', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 20, boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' }}>
        <button className="hover-btn" onClick={() => setCurrentTab('calendar')} style={{ flex: 1, padding: '15px 0', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: currentTab === 'calendar' ? '#18181b' : '#a1a1aa' }}>
          <span style={{ fontSize: '14px', fontWeight: currentTab === 'calendar' ? '900' : 'normal' }}>[ 달력 및 신청 ]</span>
        </button>
        <button className="hover-btn" onClick={() => setCurrentTab('admin')} style={{ flex: 1, padding: '15px 0', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: currentTab === 'admin' ? '#18181b' : '#a1a1aa' }}>
          <span style={{ fontSize: '14px', fontWeight: currentTab === 'admin' ? '900' : 'normal' }}>[ 차량 배정 관리 ]</span>
        </button>
      </nav>
    </div>
  );
}