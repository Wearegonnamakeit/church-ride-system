'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

interface ChurchEvent {
  id: number; date: string; title: string; formUrl: string;
  type: 'regular' | 'special'; fullName: string; destination: string; 
}

interface Person {
  id: string; name: string; role: 'driver' | 'rider';
  carId: string | null; capacity?: number; address?: string; 
  pickupTime?: string;
}

interface UserProfile {
  name: string; phone: string; rideType: string; capacity: string; address: string;
}

const t = {
  loading: { ko: '데이터를 불러오는 중입니다...', en: 'Loading data...' },
  loadFail: { ko: '데이터를 불러오는데 실패했습니다.', en: 'Failed to load data.' },
  reqFields: { ko: '이름, 전화번호, 이동 수단은 필수입니다!', en: 'Name, Phone, and Ride Type are required!' },
  saved: { ko: '내 정보가 스마트폰에 저장되었습니다!', en: 'Profile saved to your device!' },
  fullCar: { ko: '만차입니다!', en: 'This car is full!' },
  noData: { ko: '저장할 데이터가 없습니다.', en: 'No data to save.' },
  saveOk: { ko: '배정 결과가 안전하게 저장되었습니다!', en: 'Assignments saved successfully!' },
  saveFail: { ko: '오류가 발생했습니다.', en: 'An error occurred.' },
  copyOk: { ko: '카카오톡 복사 완료!', en: 'Copied to clipboard!' },
  routeFail: { ko: '경로를 생성할 주소를 찾을 수 없습니다.', en: 'Not enough addresses for a route.' },
  
  promo: { ko: '내 정보를 등록하면 1초 만에 원클릭 신청이 가능합니다!', en: 'Register info for 1-second 1-click application!' },
  goProfile: { ko: '내 정보 등록하러 가기', en: 'Go to Profile Settings' },
  prev: { ko: '이전', en: 'Prev' },
  next: { ko: '다음', en: 'Next' },
  
  schedTitle: { ko: '해당 일자 일정', en: 'Schedule for Selected Date' },
  regWorship: { ko: '정기 예배', en: 'Regular Worship' },
  spcEvent: { ko: '특별 행사', en: 'Special Event' },
  loc: { ko: '장소:', en: 'Location:' },
  myStat: { ko: '내 배정 상태:', en: 'My Ride Status:' },
  statWait: { ko: '대기 중 (아직 배정되지 않음)', en: 'Waiting (Not assigned yet)' },
  statSelf: { ko: '본인 차량으로 운행', en: 'Driving own car' },
  statDone: { ko: '배정 완료', en: 'Assignment Complete' },
  btnApply1: { ko: '원클릭 신청', en: '1-Click Apply' },
  btnCancel: { ko: '취소하기', en: 'Cancel' },
  btnApplyM: { ko: '수동으로 신청하기', en: 'Apply Manually' },
  noEvents: { ko: '등록된 행사가 없습니다.', en: 'No events registered.' },
  
  profTitle: { ko: '내 프로필 설정', en: 'My Profile Settings' },
  profDesc: { ko: '여기에 정보를 한 번만 저장해두면, 앞으로 버튼 클릭 한 번에 폼이 자동 완성됩니다.', en: 'Save your info here once, and forms will auto-fill with one click.' },
  name: { ko: '이름 *', en: 'Name *' },
  phone: { ko: '전화번호 *', en: 'Phone *' },
  ride: { ko: '이동 수단 *', en: 'Ride Type *' },
  addr: { ko: '집 주소 또는 픽업 주소', en: 'Home or Pickup Address' },
  cap: { ko: '차량 정원 (본인 제외 남는 좌석)', en: 'Car Capacity (Available seats excluding yourself)' },
  btnSaveProf: { ko: '내 프로필 기기에 저장하기', en: 'Save Profile to Device' },
  
  optSel: { ko: '-- 선택하세요 --', en: '-- Select --' },
  optRide: { ko: '라이드 필요 (탑승자)', en: 'Need a Ride (Passenger)' },
  optDrive: { ko: '운전 가능 (차량 제공)', en: 'Can Drive (Provide a car)' },
  optSelf: { ko: '자차 이동 (라이드 불필요)', en: 'Drive Self (No ride needed)' },
  
  admTitle: { ko: '차량 수동 배정', en: 'Manual Ride Assignment' },
  refresh: { ko: '갱신', en: 'Refresh' },
  share: { ko: '카톡 공유', en: 'Share' },
  saving: { ko: '저장중..', en: 'Saving..' },
  saveRes: { ko: '결과 저장', en: 'Save Results' },
  selEvt: { ko: '-- 배정할 행사를 선택하세요 --', en: '-- Select an event to assign --' },
  
  totRider: { ko: '총 탑승 신청자:', en: 'Total Passengers:' },
  totSeat: { ko: '총 차량 좌석:', en: 'Total Seats:' },
  waitlist: { ko: '대기 인원', en: 'Waitlist' },
  allAssgn: { ko: '모두 배정되었습니다.', en: 'Everyone is assigned.' },
  carList: { ko: '차량 목록', en: 'Car List' },
  car: { ko: '[차량]', en: '[Car]' },
  full: { ko: '만차', en: 'FULL' },
  navi: { ko: '내비게이션 안내', en: 'Navigation' },
  touch: { ko: '이름을 터치해서 이곳으로 보내세요', en: 'Touch a name to send here' },
  noDrv: { ko: '아직 신청한 운전자가 없습니다.', en: 'No drivers have applied yet.' },
  admDesc1: { ko: '위 목록에서 행사를 선택하시면', en: 'Select an event from the list above' },
  admDesc2: { ko: '배정 화면이 나타납니다.', en: 'to view the assignment screen.' },
  
  tab1: { ko: '[ 달력 및 신청 ]', en: '[ Calendar ]' },
  tab2: { ko: '[ 내 정보 설정 ]', en: '[ Profile ]' },
  tab3: { ko: '[ 배정 관리 ]', en: '[ Admin ]' },

  guideTitle: { ko: '스마트폰 바탕화면에 앱 설치하기', en: 'Install App on Home Screen' },
  guideKakao: { ko: '1. 카톡 창 우측 하단(또는 상단) [점 3개] 클릭 -> [다른 브라우저로 열기]', en: '1. Tap [3 dots] in KakaoTalk -> [Open in other browser]' },
  guideApple: { ko: '2. 아이폰(Safari): 하단 [공유]버튼 -> [홈 화면에 추가]', en: '2. iPhone (Safari): Tap [Share] -> [Add to Home Screen]' },
  guideGalaxy: { ko: '2. 갤럭시(Chrome): 우측 상단 [점 3개]버튼 -> [홈 화면에 추가]', en: '2. Galaxy (Chrome): Tap [3 dots] -> [Add to Home Screen]' },
  
  selected: { ko: '(선택됨)', en: '(Selected)' },
  cancelMark: { ko: 'X', en: 'X' },

  helpBtn: { ko: '도움말', en: 'Help' },
  manTitle: { ko: '앱 사용 설명서', en: 'How to use this app' },
  man1: { ko: '1. 내 정보 설정 (최초 1회)', en: '1. Profile Setup (Once)' },
  man1Desc: { ko: '하단 [내 정보 설정] 탭에서 이름과 연락처를 먼저 저장하세요. 한 번만 저장하면 계속 유지됩니다. 바꾸고 싶은 경우 정보 업데이트 후 새로 저장하시면 업데이트 됩니다.', en: 'Save your name and contact info in the [Profile] tab first. It remains saved permanently. To change it, update the info and save again.' },
  man2: { ko: '2. 1초 자동 신청', en: '2. 1-Click Auto Apply' },
  man2Desc: { ko: '[달력 및 신청] 탭에서 원하는 일정의 [원클릭 신청] 버튼을 누르면 신청서가 자동으로 완성됩니다. 차량의 경우만 한번 더 확인 부탁 드립니다.', en: 'Click [1-Click Apply] on the desired event in the [Calendar] tab to auto-fill the form. Please double-check your ride option.' },
  man3: { ko: '3. 내 배정 상태 확인', en: '3. Check Ride Status' },
  man3Desc: { ko: '배정이 완료되면, 앱의 배정 관리 화면에 내가 탑승할 차량 이름이 실시간으로 표시됩니다.', en: 'Once assigned, the name of your designated vehicle will be displayed in real-time.' },
  man4: { ko: '4. 정기 참석자 신청 및 취소', en: '4. Regular Attendee Apply & Cancel' },
  man4Desc: { ko: '매주 예배에 참석 하는 인원의 경우 목사님께 말씀하셔서 정기 참석자 명단에 들어가면 따로 설문지로 신청하지 않아도 자동으로 참석 처리 됩니다. 못 가는 경우에만 설문지를 통해 취소하시면 됩니다.', en: 'If you attend weekly, ask the Pastor to add you to the regular attendee list. You will be automatically assigned without needing to apply. Only submit a cancellation form when you cannot attend.' },
  man5: { ko: '5. 인원 배정 안내', en: '5. Ride Assignment Notice' },
  man5Desc: { ko: '인원 배정의 경우 목사님 또는 운전자분들이 우선적으로 배정하실 예정입니다.', en: 'The Pastor or drivers will have priority in managing and assigning rides.' },
  man6: { ko: '6. 내비게이션 사용 안내', en: '6. Navigation Guide' },
  man6Desc: { ko: '배정 완료 후 운전자가 [내비게이션 안내] 버튼을 누르면 구글 지도 앱으로 연결됩니다. 지도 앱이 열리면 최적의 동선에 맞게 탑승자 픽업(경유지) 순서를 직접 재배열해 주시기 바랍니다.', en: 'When a driver clicks the [Navigation] button after assignments, Google Maps will open. Please manually rearrange the stops in the map app for the most efficient route.' },
  man7: { ko: '7. 신청 마감 시간', en: '7. Application Deadline' },
  man7Desc: { ko: '원활한 인원 배정 및 업데이트를 위해 일정 2시간 전까지는 모든 신청을 끝내주시길 바랍니다.', en: 'For smooth ride assignments and updates, please complete all applications at least 2 hours before the event.' },
  man8: { ko: '8. 피드백 및 문의', en: '8. Feedback & Contact' },
  man8Desc: { ko: '피드백 및 추가 아이디어는 김동호에게 언제든 연락바랍니다.', en: 'Please feel free to contact Dongho Kim for any feedback or new ideas.' },
  closeBtn: { ko: '닫기', en: 'Close' }
};

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'calendar' | 'profile' | 'admin'>('calendar');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const CALENDAR_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=1986581638&single=true&output=csv';
  const RESPONSES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=1712691725&single=true&output=csv';
  const ASSIGNMENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=294556834&single=true&output=csv'; 
  const SAVE_API_URL = 'https://script.google.com/macros/s/AKfycbyBJJe0HkVOf2vU32lvGZXuakS5gL0w6cdXWQmiyWVb2WcWNZkW9qEiDEnP2iEcazSx/exec';
  const REGULAR_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWYHu8VfgQPB8i5SHh577Ok32tuVLVnReeNZaUf5BJJdl_eO9aatGhl-RacqO_hY6EESrLl7EOzjiS/pub?gid=1990100498&single=true&output=csv';

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [rawResponses, setRawResponses] = useState<any[]>([]); 
  const [regularAttendees, setRegularAttendees] = useState<any[]>([]); 
  const [savedAssignments, setSavedAssignments] = useState<any[]>([]); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: '', phone: '', rideType: '', capacity: '', address: '' });
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('church_ride_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsProfileSaved(true);
    }
    const savedLang = localStorage.getItem('church_ride_lang');
    if (savedLang === 'en' || savedLang === 'ko') setLang(savedLang);

    const guideDismissed = localStorage.getItem('church_ride_guide_dismissed');
    if (!guideDismissed) {
      setShowInstallGuide(true);
    }
  }, []);

  const dismissInstallGuide = () => {
    setShowInstallGuide(false);
    localStorage.setItem('church_ride_guide_dismissed', 'true');
  };

  const toggleLang = () => {
    const nextLang = lang === 'ko' ? 'en' : 'ko';
    setLang(nextLang);
    localStorage.setItem('church_ride_lang', nextLang);
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [calendarRes, responsesRes, assignmentsRes, regularRes] = await Promise.all([
        fetch(`${CALENDAR_CSV_URL}&t=${new Date().getTime()}`).then(res => res.text()),
        fetch(`${RESPONSES_CSV_URL}&t=${new Date().getTime()}`).then(res => res.text()),
        fetch(`${ASSIGNMENT_CSV_URL}&t=${new Date().getTime()}`).then(res => res.text()),
        fetch(`${REGULAR_CSV_URL}&t=${new Date().getTime()}`).then(res => res.text())
      ]);

      Papa.parse(calendarRes, { header: true, skipEmptyLines: true, complete: (res) => {
        setEvents(res.data.filter((row: any) => row['날짜'] && row['행사명']).map((row: any, idx) => ({
          id: idx, date: row['날짜'].trim(), title: row['행사명'], fullName: `${row['날짜'].trim()} ${row['행사명']}`, 
          formUrl: '', type: (String(row['행사명']).includes('예배') ? 'regular' : 'special'), destination: row['목적지'] || row['장소'] || ''
        })));
      }});

      Papa.parse(responsesRes, { header: true, skipEmptyLines: true, complete: (res) => setRawResponses(res.data) });
      if (assignmentsRes) Papa.parse(assignmentsRes, { header: true, skipEmptyLines: true, complete: (res) => setSavedAssignments(res.data) });
      if (regularRes) Papa.parse(regularRes, { header: true, skipEmptyLines: true, complete: (res) => setRegularAttendees(res.data) });
      
    } catch (e) {
      showToast(t.loadFail[lang], 'error');
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, ''); 
    let formatted = raw;
    if (raw.startsWith('01')) { 
      if (raw.length > 3 && raw.length <= 7) formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
      else if (raw.length > 7) formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    } else { 
      if (raw.length > 3 && raw.length <= 6) formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
      else if (raw.length > 6) formatted = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 10)}`;
    }
    setProfile({ ...profile, phone: formatted });
  };

  const handleProfileSave = () => {
    if (!profile.name || !profile.phone || !profile.rideType) {
      showToast(t.reqFields[lang], 'error'); return;
    }
    localStorage.setItem('church_ride_profile', JSON.stringify(profile));
    setIsProfileSaved(true);
    showToast(t.saved[lang], 'success');
  };

  const getPrefilledUrl = (eventName: string, isCancel: boolean = false) => {
    let url = `https://docs.google.com/forms/d/e/1FAIpQLSd_mBaYyyr0G7Qi-VPVqCZBVl1op-MPGJlqB5sT3ANRd_dnvA/viewform?usp=pp_url`;
    url += `&entry.1913637231=${encodeURIComponent(eventName)}`;
    if (isProfileSaved) {
      url += `&entry.1705247789=${encodeURIComponent(profile.name)}`;
      url += `&entry.906870747=${encodeURIComponent(profile.phone)}`;
      const attendText = isCancel ? '불참하겠습니다 (absence)' : '참석하겠습니다 (Attend)';
      url += `&entry.1966413337=${encodeURIComponent(attendText)}`;
      if (!isCancel) {
        url += `&entry.141657008=${encodeURIComponent(profile.rideType)}`;
        if (profile.address) url += `&entry.555227514=${encodeURIComponent(profile.address)}`;
      }
    }
    return url;
  };

  const getMyRideStatus = (eventName: string) => {
    if (!profile.name) return null;
    const assignmentRow = savedAssignments.find(a => a['행사명'] === eventName);
    if (!assignmentRow || !assignmentRow['데이터']) return null;
    
    try {
      const data = JSON.parse(assignmentRow['데이터']);
      const me = data.find((p: any) => p.name === profile.name);
      if (!me) return { status: t.statWait[lang], color: '#f59e0b' };
      if (me.role === 'driver') return { status: t.statSelf[lang], color: '#10b981' };
      if (me.carId) {
        const driver = data.find((p: any) => p.id === me.carId);
        // 여기서부터 추가 및 변경된 부분
        let timeStr = '';
        if (driver && driver.pickupTime) {
          timeStr = lang === 'ko' ? ` (픽업: ${driver.pickupTime})` : ` (Pickup: ${driver.pickupTime})`;
        }
        return driver ? { status: lang === 'ko' ? `${driver.name}님 차량 탑승${timeStr}` : `Riding with ${driver.name}${timeStr}`, color: '#3b82f6' } : { status: t.statDone[lang], color: '#3b82f6' };
      }
      return { status: t.statWait[lang], color: '#f59e0b' };
    } catch (e) { return null; }
  };

  const [adminSelectedEvent, setAdminSelectedEvent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [dragOverCarId, setDragOverCarId] = useState<string | 'waitlist' | null>(null);

  useEffect(() => {
    if (!adminSelectedEvent) { setPeople([]); return; }
    const currentEventObj = events.find(e => e.fullName === adminSelectedEvent);
    const isRegular = currentEventObj?.type === 'regular';

    const attendeeMap = new Map<string, Person>();

    if (isRegular && regularAttendees.length > 0) {
      regularAttendees.forEach((row, idx) => {
        const name = row['이름'];
        if (!name) return;
        const address = row['주소'] || '';
        const rideType = row['이동 수단'] || '';
        const capacityStr = String(row['정원'] || '').replace(/[^0-9]/g, '');
        const capacity = capacityStr ? parseInt(capacityStr, 10) : 4;
        
        let role: 'driver' | 'rider' = rideType.includes('운전') ? 'driver' : 'rider';
        let id = role === 'driver' ? `reg_driver_${idx}` : `reg_rider_${idx}`;
        
        attendeeMap.set(name, { id, name, role, capacity, carId: role === 'driver' ? id : null, address });
      });
    }

    rawResponses.forEach((row, idx) => {
      const rowEvent = row['참석 행사'] || '';
      if (rowEvent === adminSelectedEvent) {
        const nameKey = Object.keys(row).find(key => key.includes('이름')) || '';
        const name = row[nameKey];
        if (!name) return;

        const attendanceStatus = String(row['참석 여부 (Attendance or not)'] || row['참석 여부'] || '');
        const isAbsent = attendanceStatus.includes('불참');
        const isAttending = attendanceStatus.includes('참석하겠습니다');

        if (isAbsent) {
          attendeeMap.delete(name); 
        } else if (isAttending) {
          const addressKey = Object.keys(row).find(key => key.includes('주소') || key.includes('Address')) || '';
          const address = addressKey ? row[addressKey] : '';
          const rideTypeKey = Object.keys(row).find(key => key.includes('이동 수단') || key.includes('수단') || key.includes('Ride Information')) || '';
          const rideType = rideTypeKey ? String(row[rideTypeKey]) : '';
          const capacityKey = Object.keys(row).find(key => key.includes('정원') || key.includes('Capacity')) || '';
          const capacityStr = capacityKey ? String(row[capacityKey]).replace(/[^0-9]/g, '') : '';
          const capacity = capacityStr ? parseInt(capacityStr, 10) : 4;

          let role: 'driver' | 'rider' = rideType.includes('운전 가능') ? 'driver' : 'rider';
          let id = role === 'driver' ? `form_driver_${idx}` : `form_rider_${idx}`;
          
          attendeeMap.set(name, { id, name, role, capacity, carId: role === 'driver' ? id : null, address });
        }
      }
    });

    const savedRow = savedAssignments.find(r => r['행사명'] === adminSelectedEvent);
    if (savedRow && savedRow['데이터']) {
      try {
        const parsedData = JSON.parse(savedRow['데이터']);
        parsedData.forEach((savedPerson: Person) => {
          if (attendeeMap.has(savedPerson.name)) {
            const currentPerson = attendeeMap.get(savedPerson.name)!;
            if (currentPerson.role !== 'driver') {
              currentPerson.carId = savedPerson.carId;
            }
          }
        });
      } catch (e) { console.error("데이터 읽기 실패", e); }
    }

    setPeople(Array.from(attendeeMap.values()));
  }, [adminSelectedEvent, rawResponses, savedAssignments, regularAttendees, events]);

  const assignToCar = (carId: string | null) => {
    if (!selectedRider) return;
    setPeople(prev => prev.map(p => p.id === selectedRider ? { ...p, carId } : p));
    setSelectedRider(null); 
  };

  const handleDragStart = (e: React.DragEvent, riderId: string) => { e.dataTransfer.setData('riderId', riderId); setSelectedRider(riderId); };
  const handleDrop = (e: React.DragEvent, carId: string | null) => {
    e.preventDefault(); setDragOverCarId(null);
    const riderId = e.dataTransfer.getData('riderId');
    if (!riderId) return;

    if (carId !== null) {
      const driver = people.find(p => p.id === carId);
      const passengers = people.filter(p => p.carId === carId);
      if (driver && passengers.length >= (driver.capacity || 0)) { showToast(t.fullCar[lang], 'error'); setSelectedRider(null); return; }
    }
    setPeople(prev => prev.map(p => p.id === riderId ? { ...p, carId } : p));
    setSelectedRider(null);
  };

  const saveToSheet = async () => {
    if (!adminSelectedEvent) return;
    if (people.length === 0) { showToast(t.noData[lang], 'error'); return; }
    setIsSaving(true);
    try {
      const formData = new URLSearchParams();
      formData.append("eventName", adminSelectedEvent); formData.append("peopleData", JSON.stringify(people));
      await fetch(SAVE_API_URL, { method: 'POST', mode: 'no-cors', body: formData });
      showToast(t.saveOk[lang], 'success');
    } catch (e) { showToast(t.saveFail[lang], 'error'); }
    setIsSaving(false);
  };

  const copyToKakao = () => {
    const drivers = people.filter(p => p.role === 'driver');
    const unassignedRiders = people.filter(p => p.role === 'rider' && !p.carId);
    let text = lang === 'ko' ? `[${adminSelectedEvent || '차량 배정'} 결과 안내]\n\n` : `[${adminSelectedEvent || 'Ride Assignment'} Results]\n\n`;
    drivers.forEach(driver => {
      const passengers = people.filter(p => p.role === 'rider' && p.carId === driver.id);
      const isFull = passengers.length >= (driver.capacity || 0);
      const statusTxt = isFull ? t.full[lang] : (lang === 'ko' ? `${driver.capacity! - passengers.length}자리 남음` : `${driver.capacity! - passengers.length} seats left`);
      const riderTxt = passengers.map(p => p.name).join(', ') || (lang === 'ko' ? '빈 차' : 'Empty');
      const timeTxt = driver.pickupTime ? (lang === 'ko' ? ` [픽업: ${driver.pickupTime}]` : ` [Pickup: ${driver.pickupTime}]`) : '';
      text += `${t.car[lang]} ${driver.name} (${statusTxt})${timeTxt}\n - ${lang === 'ko' ? '탑승' : 'Riders'}: ${riderTxt}\n\n`;
    });
    text += `[${t.waitlist[lang]}]\n - ${unassignedRiders.length > 0 ? unassignedRiders.map(p => p.name).join(', ') : (lang === 'ko' ? '없음' : 'None')}\n`;
    navigator.clipboard.writeText(text).then(() => showToast(t.copyOk[lang], 'success'));
  };

  const openRouteMap = (driverId: string) => {
    const driver = people.find(p => p.id === driverId);
    const passengers = people.filter(p => p.role === 'rider' && p.carId === driverId);
    const destination = events.find(e => e.fullName === adminSelectedEvent)?.destination || '';
    const waypoints = [driver?.address, ...passengers.map(p => p.address), destination].filter(addr => addr && addr.trim() !== '');

    if (waypoints.length < 2) { showToast(t.routeFail[lang], 'error'); return; }
    window.open(`https://www.google.com/maps/dir/${waypoints.map(addr => encodeURIComponent(addr as string)).join('/')}`, '_blank');
  };

  const year = currentDate.getFullYear(); const month = currentDate.getMonth();
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => i);
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);
  const selectedEvents = events.filter(e => e.date === selectedDate);
  const unassignedRiders = people.filter(p => p.role === 'rider' && !p.carId);
  const drivers = people.filter(p => p.role === 'driver');
  const uniqueEvents = Array.from(new Set(events.map(e => e.fullName)));
  
  const weekDaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays = lang === 'ko' ? weekDaysKo : weekDaysEn;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const totalRiders = people.filter(p => p.role === 'rider').length;
  const totalCapacity = drivers.reduce((acc, d) => acc + (d.capacity || 0), 0);
  const isShortage = totalRiders > totalCapacity;

  if (isLoading) {
    return (
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: '#f4f4f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .loader { border: 4px solid #e4e4e7; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        `}</style>
        <div className="loader"></div>
        <p style={{ marginTop: '15px', color: '#71717a', fontSize: '14px', fontWeight: 'bold' }}>{t.loading[lang]}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: '#f4f4f5', minHeight: '100vh', position: 'relative', paddingBottom: '80px', fontFamily: 'sans-serif', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #f4f4f5; }
        .hover-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-btn:hover { transform: translateY(-2px); filter: brightness(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
        .hover-btn:active { transform: translateY(0); }
        .drop-zone { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .drop-zone-active { transform: scale(1.02); box-shadow: 0 0 20px rgba(59,130,246,0.3); border-color: #3b82f6 !important; background-color: #eff6ff !important; }
        @keyframes pulse-border { 0% { border-color: #bfdbfe; background-color: #f8fafc; } 50% { border-color: #3b82f6; background-color: #eff6ff; } 100% { border-color: #bfdbfe; background-color: #f8fafc; } }
        .highlight-drop { animation: pulse-border 1.5s infinite !important; border-width: 2px !important; border-style: dashed !important; cursor: pointer; }
        .toast-enter { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { transform: translate(-50%, 150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        
        input, select, textarea {
          appearance: none;
          -webkit-appearance: none;
          color: #000000 !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #000000 !important;
          font-size: 16px !important; 
          background-color: #ffffff;
        }
        input::placeholder {
          color: #a1a1aa !important;
          -webkit-text-fill-color: #a1a1aa !important;
        }
        
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 100;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease-out forwards;
        }
        .modal-content {
          background: #ffffff; width: 90%; max-width: 450px;
          max-height: 85vh; overflow-y: auto;
          border-radius: 16px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          transform: translateY(20px);
          animation: slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal { to { transform: translateY(0); } }
      `}</style>

      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#18181b', fontWeight: 'bold', borderBottom: '2px solid #f4f4f5', paddingBottom: '15px' }}>
              {t.manTitle[lang]}
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man1[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man1Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man2[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man2Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man3[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man3Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man4[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man4Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man5[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man5Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man6[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man6Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man7[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man7Desc[lang]}</p>
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{t.man8[lang]}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{t.man8Desc[lang]}</p>
            </div>

            <button className="hover-btn" onClick={() => setIsHelpOpen(false)} style={{ width: '100%', padding: '12px', background: '#18181b', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              {t.closeBtn[lang]}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast-enter" style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3f3f46', color: '#fff', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 90, boxShadow: '0 8px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>{toast.message}</div>}

      <header style={{ background: '#ffffff', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e4e4e7' }}>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#18181b', fontWeight: '900' }}>LivingStone Ride</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsHelpOpen(true)} style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#3f3f46' }}>
            {t.helpBtn[lang]}
          </button>
          <button onClick={toggleLang} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}>
            {lang === 'ko' ? 'EN' : 'KR'}
          </button>
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        {showInstallGuide && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '15px', borderRadius: '12px', marginBottom: '20px', position: 'relative' }}>
            <button onClick={dismissInstallGuide} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#92400e', fontWeight: 'bold' }}>X</button>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#92400e', fontWeight: 'bold' }}>{t.guideTitle[lang]}</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
              <li>{t.guideKakao[lang]}</li>
              <li>{t.guideApple[lang]}</li>
              <li>{t.guideGalaxy[lang]}</li>
            </ul>
          </div>
        )}

        {currentTab === 'calendar' && (
          <div>
            {!isProfileSaved && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1d4ed8' }}>{t.promo[lang]}</p>
                <button className="hover-btn" onClick={() => setCurrentTab('profile')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>{t.goProfile[lang]}</button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <button className="hover-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ border: 'none', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#3f3f46', fontWeight: 'bold' }}>{t.prev[lang]}</button>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#18181b' }}>
                {lang === 'ko' ? `${year}년 ${month + 1}월` : `${monthNames[month]} ${year}`}
              </h2>
              <button className="hover-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ border: 'none', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#3f3f46', fontWeight: 'bold' }}>{t.next[lang]}</button>
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
                <h3 style={{ fontSize: '16px', color: '#3f3f46', marginBottom: '10px', marginLeft: '5px', fontWeight: 'bold' }}>{t.schedTitle[lang]}</h3>
                {selectedEvents.length > 0 ? selectedEvents.map(event => {
                  const myStatus = getMyRideStatus(event.fullName);
                  return (
                    <div key={event.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e4e4e7', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '12px', background: event.type === 'regular' ? '#dbeafe' : '#fce7f3', color: event.type === 'regular' ? '#1d4ed8' : '#be185d', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                          {event.type === 'regular' ? t.regWorship[lang] : t.spcEvent[lang]}
                        </span>
                      </div>
                      <h4 style={{ margin: '12px 0', fontSize: '18px', color: '#18181b' }}>{event.title}</h4>
                      {event.destination && <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '15px' }}>{t.loc[lang]} <span style={{ fontWeight: 'bold', color: '#3f3f46' }}>{event.destination}</span></div>}
                      
                      {myStatus && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{t.myStat[lang]}</span>
                          <span style={{ fontSize: '14px', color: myStatus.color, fontWeight: '900' }}>{myStatus.status}</span>
                        </div>
                      )}
                      
                      {isProfileSaved ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="hover-btn" onClick={() => window.open(getPrefilledUrl(event.fullName, false), '_blank')} style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>{t.btnApply1[lang]}</button>
                          <button className="hover-btn" onClick={() => window.open(getPrefilledUrl(event.fullName, true), '_blank')} style={{ flex: 1, padding: '12px', background: '#f4f4f5', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>{t.btnCancel[lang]}</button>
                        </div>
                      ) : (
                        <button className="hover-btn" onClick={() => window.open(getPrefilledUrl(event.fullName, false), '_blank')} style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>{t.btnApplyM[lang]}</button>
                      )}
                    </div>
                  );
                }) : <div style={{ padding: '30px', textAlign: 'center', color: '#a1a1aa', background: '#fff', borderRadius: '16px', border: '1px dashed #d4d4d8', fontSize: '14px' }}>{t.noEvents[lang]}</div>}
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#18181b', fontWeight: 'bold' }}>{t.profTitle[lang]}</h2>
            <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '25px', lineHeight: '1.5' }}>{t.profDesc[lang]}</p>
            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3f3f46', marginBottom: '6px' }}>{t.name[lang]}</label><input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} placeholder="Alex" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '16px' }} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3f3f46', marginBottom: '6px' }}>{t.phone[lang]}</label><input type="tel" inputMode="numeric" pattern="[0-9]*" value={profile.phone} onChange={handlePhoneChange} placeholder="Only numbers" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '16px' }} /></div>
            
            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3f3f46', marginBottom: '6px' }}>{t.ride[lang]}</label>
              <select value={profile.rideType} onChange={(e) => setProfile({...profile, rideType: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '16px', background: '#fff' }}>
                <option value="">{t.optSel[lang]}</option>
                <option value="라이드 필요 (탑승자, I need ride system)">{t.optRide[lang]}</option>
                <option value="운전 가능 (다른 사람 탑승 가능, I can give a ride)">{t.optDrive[lang]}</option>
                <option value="자차 이동 (라이드 불필요, I don't need a ride)">{t.optSelf[lang]}</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3f3f46', marginBottom: '6px' }}>{t.addr[lang]}</label><input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} placeholder="123 Main st" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '16px' }} /></div>
            {profile.rideType.includes('운전 가능') && (<div style={{ marginBottom: '20px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3f3f46', marginBottom: '6px' }}>{t.cap[lang]}</label><input type="number" inputMode="numeric" pattern="[0-9]*" value={profile.capacity} onChange={(e) => setProfile({...profile, capacity: e.target.value})} placeholder="4" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '16px' }} /></div>)}
            <button className="hover-btn" onClick={handleProfileSave} style={{ width: '100%', padding: '14px', background: '#18181b', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '10px' }}>{t.btnSaveProf[lang]}</button>
          </div>
        )}

        {currentTab === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#18181b', fontWeight: 'bold' }}>{t.admTitle[lang]}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="hover-btn" onClick={fetchAllData} style={{ padding: '8px 10px', background: '#f4f4f5', color: '#3f3f46', border: '1px solid #d4d4d8', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>{t.refresh[lang]}</button>
                <button className="hover-btn" onClick={copyToKakao} style={{ padding: '8px 10px', background: '#fef01b', color: '#3f2020', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>{t.share[lang]}</button>
                <button className="hover-btn" onClick={saveToSheet} disabled={isSaving} style={{ padding: '8px 10px', background: isSaving ? '#a1a1aa' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>{isSaving ? t.saving[lang] : t.saveRes[lang]}</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <select value={adminSelectedEvent} onChange={(e) => setAdminSelectedEvent(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d4d4d8', fontSize: '16px', background: '#fff', cursor: 'pointer', color: '#18181b', fontWeight: 'bold' }}>
                <option value="">{t.selEvt[lang]}</option>
                {uniqueEvents.map(eventName => <option key={eventName} value={eventName}>{eventName}</option>)}
              </select>
            </div>

            {adminSelectedEvent ? (
              <>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e4e4e7', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                    <span style={{ color: '#3f3f46' }}>{t.totRider[lang]} {totalRiders}</span>
                    <span style={{ color: '#3f3f46' }}>{t.totSeat[lang]} {totalCapacity}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((totalRiders / (totalCapacity || 1)) * 100, 100)}%`, height: '100%', background: isShortage ? '#ef4444' : '#10b981', transition: 'width 0.5s ease' }}></div>
                  </div>
                  {isShortage ? (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>
                      {lang === 'ko' ? `차량 좌석이 ${totalRiders - totalCapacity}자리 부족합니다! 추가 차량이 필요합니다.` : `Short by ${totalRiders - totalCapacity} seats! Extra cars needed.`}
                    </p>
                  ) : (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>
                      {lang === 'ko' ? `차량 좌석이 ${totalCapacity - totalRiders}자리 여유 있습니다.` : `${totalCapacity - totalRiders} seats available.`}
                    </p>
                  )}
                </div>

                <div className={`drop-zone ${dragOverCarId === 'waitlist' ? 'drop-zone-active' : ''} ${selectedRider ? 'highlight-drop' : ''}`} onClick={() => assignToCar(null)} onDragOver={(e) => { e.preventDefault(); setDragOverCarId('waitlist'); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, null)} style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: dragOverCarId === 'waitlist' ? '2px dashed #3b82f6' : '1px solid #e4e4e7', minHeight: '100px', marginBottom: '25px', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>{t.waitlist[lang]} <span style={{ background: '#f4f4f5', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#71717a' }}>{unassignedRiders.length}</span></h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {unassignedRiders.map(rider => (
                      <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: selectedRider === rider.id ? '#3b82f6' : '#f4f4f5', color: selectedRider === rider.id ? '#fff' : '#3f3f46', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {rider.name} {selectedRider === rider.id && t.selected[lang]}
                      </button>
                    ))}
                    {unassignedRiders.length === 0 && <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{t.allAssgn[lang]}</span>}
                  </div>
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', paddingLeft: '5px', fontWeight: 'bold' }}>{t.carList[lang]}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {drivers.map(driver => {
                    const passengers = people.filter(p => p.role === 'rider' && p.carId === driver.id);
                    const isFull = passengers.length >= (driver.capacity || 0);

                    return (
                      <div key={driver.id} className={`drop-zone ${dragOverCarId === driver.id ? 'drop-zone-active' : ''} ${selectedRider && !isFull ? 'highlight-drop' : ''}`} onClick={() => !isFull && assignToCar(driver.id)} onDragOver={(e) => { e.preventDefault(); !isFull && setDragOverCarId(driver.id); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, driver.id)} style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: isFull ? '2px solid #fecaca' : '1px solid #e4e4e7', position: 'relative', cursor: isFull ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
                        {isFull && <div style={{ position: 'absolute', right: '-25px', top: '15px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{t.full[lang]}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '900', color: '#18181b', fontSize: '16px' }}>{t.car[lang]} {driver.name}</span>
                            <span style={{ fontSize: '12px', background: isFull ? '#fee2e2' : '#dcfce7', color: isFull ? '#dc2626' : '#166534', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{passengers.length} / {driver.capacity}</span>
                          </div>
                          <button className="hover-btn" onClick={(e) => { e.stopPropagation(); openRouteMap(driver.id); }} style={{ padding: '8px 12px', background: '#18181b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{t.navi[lang]}</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#3f3f46', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {lang === 'ko' ? '픽업 안내:' : 'Pickup Info:'}
                          </span>
                          <input 
                            type="text" 
                            placeholder={lang === 'ko' ? "예: 10:30 (순차 픽업) / 개별 연락" : "ex: 10:30 AM / Will text you"}
                            value={driver.pickupTime || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPeople(prev => prev.map(p => p.id === driver.id ? { ...p, pickupTime: val } : p));
                            }}
                            onClick={(e) => e.stopPropagation()} 
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d4d4d8', fontSize: '14px', background: '#fff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '45px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px inset #f1f5f9' }}>
                          {passengers.map(rider => (
                            <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: selectedRider === rider.id ? '#3b82f6' : '#ffffff', color: selectedRider === rider.id ? '#fff' : '#334155', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {rider.name} 
                              {selectedRider === rider.id ? ` ${t.selected[lang]}` : <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>{t.cancelMark[lang]}</span>}
                            </button>
                          ))}
                          {passengers.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', height: '100%' }}>{t.touch[lang]}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {drivers.length === 0 && <div style={{ fontSize: '14px', color: '#71717a', textAlign: 'center', padding: '30px', background: '#f4f4f5', borderRadius: '12px' }}>{t.noDrv[lang]}</div>}
                </div>
              </>
            ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: '#71717a', background: '#fff', borderRadius: '16px', border: '2px dashed #e4e4e7', fontSize: '14px', lineHeight: '1.6' }}>{t.admDesc1[lang]}<br/>{t.admDesc2[lang]}</div>}
          </div>
        )}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#ffffff', display: 'flex', borderTop: '1px solid #e4e4e7', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 20, boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' }}>
        <button className="hover-btn" onClick={() => setCurrentTab('calendar')} style={{ flex: 1, padding: '15px 0', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: currentTab === 'calendar' ? '#18181b' : '#a1a1aa' }}><span style={{ fontSize: '13px', fontWeight: currentTab === 'calendar' ? '900' : 'normal' }}>{t.tab1[lang]}</span></button>
        <button className="hover-btn" onClick={() => setCurrentTab('profile')} style={{ flex: 1, padding: '15px 0', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: currentTab === 'profile' ? '#18181b' : '#a1a1aa' }}><span style={{ fontSize: '13px', fontWeight: currentTab === 'profile' ? '900' : 'normal' }}>{t.tab2[lang]}</span></button>
        <button className="hover-btn" onClick={() => setCurrentTab('admin')} style={{ flex: 1, padding: '15px 0', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: currentTab === 'admin' ? '#18181b' : '#a1a1aa' }}><span style={{ fontSize: '13px', fontWeight: currentTab === 'admin' ? '900' : 'normal' }}>{t.tab3[lang]}</span></button>
      </nav>
    </div>
  );
}