'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

interface ChurchEvent {
  id: number; date: string; title: string; formUrl: string;
  type: 'regular' | 'special'; fullName: string; destination: string; 
}

interface Person {
  id: string; 
  name: string; 
  role: 'driver' | 'rider';
  carIdTo: string | null; 
  carIdFrom: string | null;
  carId?: string | null;
  capacity?: number;
  capacityTo?: number;
  capacityFrom?: number;
  address?: string; 
  pickupTimeTo?: string; 
  pickupTimeFrom?: string; 
  pickupTime?: string; 
  isVan?: boolean; 
  vanDriverIdTo?: string | null;
  vanDriverIdFrom?: string | null;
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
  statSelf: { ko: '자차 운행', en: 'Driving own car' },
  statDone: { ko: '배정 완료', en: 'Assignment Complete' },
  btnApply1: { ko: '원클릭 신청', en: '1-Click Apply' },
  btnCancel: { ko: '취소하기', en: 'Cancel' },
  btnApplyM: { ko: '수동으로 신청하기', en: 'Apply Manually' },
  noEvents: { ko: '등록된 행사가 없습니다.', en: 'No events registered.' },
  alreadyApplied: { ko: '신청 완료됨 (수정하기)', en: 'Applied (Edit)' },
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
  share: { ko: '현재 탭 카톡 공유', en: 'Share Current' },
  saving: { ko: '저장중..', en: 'Saving..' },
  saveRes: { ko: '결과 저장', en: 'Save Results' },
  selEvt: { ko: '-- 배정할 행사를 선택하세요 --', en: '-- Select an event to assign --' },
  dirTo: { ko: '➡️ 가는 편 (교회로)', en: '➡️ To Event' },
  dirFrom: { ko: '⬅️ 오는 편 (집으로)', en: '⬅️ From Event' },
  totRider: { ko: '총 탑승 신청자:', en: 'Total Passengers:' },
  totSeat: { ko: '총 차량 좌석:', en: 'Total Seats:' },
  waitlist: { ko: '대기 인원', en: 'Waitlist' },
  allAssgn: { ko: '모두 배정되었습니다.', en: 'Everyone is assigned.' },
  carList: { ko: '차량 목록', en: 'Car List' },
  car: { ko: '[차량]', en: '[Car]' },
  full: { ko: '만차', en: 'FULL' },
  navi: { ko: '내비게이션', en: 'Navi' },
  indivCopy: { ko: '명단 복사', en: 'Copy List' },
  touch: { ko: '이름을 터치해서 이곳으로 보내세요', en: 'Touch a name to send here' },
  noDrv: { ko: '아직 신청한 운전자가 없습니다.', en: 'No drivers have applied yet.' },
  admDesc1: { ko: '위 목록에서 행사를 선택하시면', en: 'Select an event from the list above' },
  admDesc2: { ko: '배정 화면이 나타납니다.', en: 'to view the assignment screen.' },
  vanNoDriverTo: { ko: '운전자 배정', en: 'Drag from waitlist (Driver)' },
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
  man3Desc: { ko: '배정이 완료되면, 앱의 달력 화면에 가는 편과 오는 편 차량 이름이 실시간으로 표시됩니다.', en: 'Once assigned, your assigned vehicles for both directions will be displayed in real-time.' },
  man4: { ko: '4. 정기 참석자 신청 및 취소', en: '4. Regular Attendee Apply & Cancel' },
  man4Desc: { ko: '매주 예배에 참석 하는 인원의 경우 목사님께 말씀하셔서 정기 참석자 명단에 들어가면 따로 설문지로 신청하지 않아도 자동으로 참석 처리 됩니다. 못 가는 경우에만 설문지를 통해 취소하시면 됩니다.', en: 'If you attend weekly, ask the Pastor to add you to the regular attendee list. You will be automatically assigned without needing to apply. Only submit a cancellation form when you cannot attend.' },
  man5: { ko: '5. 인원 배정 안내', en: '5. Ride Assignment Notice' },
  man5Desc: { ko: '인원 배정의 경우 목사님 또는 운전자분들이 우선적으로 배정하실 예정입니다.', en: 'The Pastor or drivers will have priority in managing and assigning rides.' },
  man6: { ko: '6. 내비게이션 사용 안내', en: '6. Navigation Guide' },
  man6Desc: { ko: '배정 완료 후 운전자가 [내비게이션] 버튼을 누르면 구글 지도 앱으로 연결됩니다. 지도 앱이 열리면 최적의 동선에 맞게 픽업 순서를 직접 재배열해 주시기 바랍니다.', en: 'When a driver clicks the [Navigation] button, Google Maps will open. Please manually rearrange the stops in the map app for the most efficient route.' },
  man7: { ko: '7. 신청 마감 시간', en: '7. Application Deadline' },
  man7Desc: { ko: '원활한 인원 배정 및 업데이트를 위해 일정 2시간 전까지는 모든 신청을 끝내주시길 바랍니다.', en: 'For smooth assignments, please complete all applications at least 2 hours before the event.' },
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
  const [rideDirection, setRideDirection] = useState<'to' | 'from'>('to');

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

  const checkApplicationStatus = (eventName: string, type: 'regular' | 'special') => {
    if (!profile.name) return false;
    let isApplied = false;
    if (type === 'regular' && regularAttendees.length > 0) {
      const isRegular = regularAttendees.some(row => row['이름'] === profile.name);
      if (isRegular) isApplied = true;
    }
    const myResponses = rawResponses.filter(row => {
      const rowEvent = row['참석 행사'] || '';
      const nameKey = Object.keys(row).find(key => key.includes('이름')) || '';
      return rowEvent === eventName && row[nameKey] === profile.name;
    });
    if (myResponses.length > 0) {
      const latestResponse = myResponses[myResponses.length - 1];
      const attendanceStatus = String(latestResponse['참석 여부 (Attendance or not)'] || latestResponse['참석 여부'] || '');
      if (attendanceStatus.includes('불참')) isApplied = false;
      else if (attendanceStatus.includes('참석')) isApplied = true;
    }
    return isApplied;
  };

  const getMyRideStatus = (eventName: string) => {
    if (!profile.name) return null;
    const assignmentRow = savedAssignments.find(a => a['행사명'] === eventName);
    if (!assignmentRow || !assignmentRow['데이터']) return null;
    
    try {
      const data = JSON.parse(assignmentRow['데이터']);
      const me = data.find((p: any) => p.name === profile.name);
      if (!me) return { statusTo: t.statWait[lang], colorTo: '#f59e0b', statusFrom: t.statWait[lang], colorFrom: '#f59e0b' };
      
      if (me.id === 'van_1_driver_to_placeholder' || me.id === 'van_1_driver_from_placeholder') return null;

      if (me.role === 'driver') {
        const checkDriving = (dir: 'to' | 'from') => {
          const van = data.find((p: any) => p.isVan);
          const vanDrvId = dir === 'to' ? van?.vanDriverIdTo : van?.vanDriverIdFrom;
          if (vanDrvId === me.id) return { drivingVan: true };

          const myPassengers = data.filter((p: any) => (dir === 'to' ? p.carIdTo : p.carIdFrom) === me.id);
          if (dir === 'to' && !me.carIdTo && myPassengers.length > 0) return { drivingPrivate: true, passengers: myPassengers };
          if (dir === 'from' && !me.carIdFrom && myPassengers.length > 0) return { drivingPrivate: true, passengers: myPassengers };
          
          return { drivingNone: true };
        };

        const buildStatusTxt = (drivingInfo: any, dir: 'to' | 'from') => {
          if (drivingInfo.drivingVan) return lang === 'ko' ? '교회 밴 운전' : 'Driving Van';
          if (drivingInfo.drivingPrivate) {
            const passengerNames = drivingInfo.passengers.map((p: any) => p.name).join(', ');
            const timeStr = dir === 'to' ? me.pickupTimeTo : me.pickupTimeFrom;
            const timeTxt = timeStr ? ` / 안내: ${timeStr}` : '';
            return lang === 'ko' ? `자차 운행 (탑승: ${passengerNames}${timeTxt})` : `Self (Riders: ${passengerNames}${timeTxt})`;
          }
          return null; 
        };

        const drvTo = checkDriving('to');
        const drvFrom = checkDriving('from');
        const txtTo = buildStatusTxt(drvTo, 'to');
        const txtFrom = buildStatusTxt(drvFrom, 'from');

        if (!txtTo && !txtFrom) {
          const meRider = data.find((p: any) => p.name === profile.name && p.role === 'rider');
          if (meRider) {
            const buildRiderStatus = (dir: 'to' | 'from', meR: any) => {
              const myCarId = dir === 'to' ? meR.carIdTo : meR.carIdFrom;
              if (myCarId) {
                const driver = data.find((p: any) => p.id === myCarId);
                if (driver) {
                  const timeStr = dir === 'to' ? driver.pickupTimeTo : driver.pickupTimeFrom;
                  const timeTxt = timeStr ? ` (${timeStr})` : '';
                  return { txt: `${driver.name} 탑승${timeTxt}`, col: '#3b82f6' };
                }
              }
              return { txt: t.statWait[lang], col: '#f59e0b' };
            };
            return {
              statusTo: buildRiderStatus('to', meRider).txt, colorTo: buildRiderStatus('to', meRider).col,
              statusFrom: buildRiderStatus('from', meRider).txt, colorFrom: buildRiderStatus('from', meRider).col,
            };
          }
          return { statusTo: t.statWait[lang], colorTo: '#f59e0b', statusFrom: t.statWait[lang], colorFrom: '#f59e0b' };
        }

        return {
          statusTo: txtTo || t.statWait[lang], colorTo: txtTo ? '#10b981' : '#f59e0b',
          statusFrom: txtFrom || t.statWait[lang], colorFrom: txtFrom ? '#10b981' : '#f59e0b',
        };
      }
      
      const buildRiderStatus = (direction: 'to' | 'from', meR: any) => {
        const myCarId = direction === 'to' ? meR.carIdTo : meR.carIdFrom;
        if (myCarId) {
          const driver = data.find((p: any) => p.id === myCarId);
          if (driver) {
            const timeStr = direction === 'to' ? driver.pickupTimeTo : driver.pickupTimeFrom;
            const timeTxt = timeStr ? ` (${timeStr})` : '';
            return { txt: `${driver.name} 탑승${timeTxt}`, col: '#3b82f6' };
          }
          return { txt: t.statDone[lang], col: '#3b82f6' };
        }
        return { txt: t.statWait[lang], col: '#f59e0b' };
      };

      return {
        statusTo: buildRiderStatus('to', me).txt, colorTo: buildRiderStatus('to', me).col,
        statusFrom: buildRiderStatus('from', me).txt, colorFrom: buildRiderStatus('from', me).col,
      };
    } catch (e) { return null; }
  };

  const [adminSelectedEvent, setAdminSelectedEvent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [dragOverCarId, setDragOverCarId] = useState<string | 'waitlist' | 'van_driver_slot' | null>(null);

  useEffect(() => {
    if (!adminSelectedEvent) { setPeople([]); return; }
    const currentEventObj = events.find(e => e.fullName === adminSelectedEvent);
    const isRegular = currentEventObj?.type === 'regular';

    let defaultVanTo = '';
    let defaultVanFrom = '';
    let dayOfWeek = -1;

    if (currentEventObj && currentEventObj.date) {
      const [y, m, d] = currentEventObj.date.split('-').map(Number);
      const eventDate = new Date(y, m - 1, d);
      dayOfWeek = eventDate.getDay(); 

      if (dayOfWeek === 5) { 
        defaultVanTo = 'MU 옆 써클';
        defaultVanFrom = ''; 
      } else if (dayOfWeek === 0) {
        defaultVanTo = 'Chazen 앞';
        defaultVanFrom = 'Chazen 앞';
      }
    }

    const attendeeMap = new Map<string, Person>();

    attendeeMap.set('van_1', { 
      id: 'van_1', name: '교회 밴', role: 'driver', 
      capacity: 14, capacityTo: 14, capacityFrom: 14, 
      carIdTo: null, carIdFrom: null, address: '', 
      pickupTimeTo: defaultVanTo, 
      pickupTimeFrom: defaultVanFrom, 
      isVan: true, vanDriverIdTo: null, vanDriverIdFrom: null, carId: null 
    });

    if (isRegular && regularAttendees.length > 0) {
      regularAttendees.forEach((row, idx) => {
        const name = row['이름'];
        if (!name) return;

        const attendDays = String(row['참석 요일'] || row['참석예배'] || '').trim();
        let isAttendingToday = true;

        if (attendDays !== '') {
          isAttendingToday = false; 
          if (dayOfWeek === 5 && (attendDays.includes('금') || attendDays.includes('Fri'))) {
            isAttendingToday = true;
          } else if (dayOfWeek === 0 && (attendDays.includes('일') || attendDays.includes('주일') || attendDays.includes('Sun'))) {
            isAttendingToday = true;
          }
        }

        if (!isAttendingToday) return; 

        const address = row['주소'] || '';
        const rideType = row['이동 수단'] || '';
        const capacityStr = String(row['정원'] || '').replace(/[^0-9]/g, '');
        const capacity = capacityStr ? parseInt(capacityStr, 10) : 4;
        
        let role: 'driver' | 'rider' = rideType.includes('운전') ? 'driver' : 'rider';
        let id = role === 'driver' ? `reg_driver_${idx}` : `reg_rider_${idx}`;
        
        attendeeMap.set(name, { id, name, role, capacity, capacityTo: capacity, capacityFrom: capacity, carIdTo: null, carIdFrom: null, address, pickupTimeTo: '', pickupTimeFrom: '', carId: null });
      });
    }

    rawResponses.forEach((row, idx) => {
      const rowEvent = row['참석 행사'] || '';
      if (rowEvent === adminSelectedEvent) {
        const nameKey = Object.keys(row).find(key => key.includes('이름')) || '';
        const name = row[nameKey];
        if (!name) return;

        const attendanceStatus = String(row['참석 여부 (Attendance or not)'] || row['참석 여부'] || '');
        if (attendanceStatus.includes('불참')) {
          attendeeMap.delete(name); 
        } else if (attendanceStatus.includes('참석')) {
          const addressKey = Object.keys(row).find(key => key.includes('주소') || key.includes('Address')) || '';
          const address = addressKey ? row[addressKey] : '';
          const rideTypeKey = Object.keys(row).find(key => key.includes('이동 수단') || key.includes('수단') || key.includes('Ride Information')) || '';
          const rideType = rideTypeKey ? String(row[rideTypeKey]) : '';
          const capacityKey = Object.keys(row).find(key => key.includes('정원') || key.includes('Capacity')) || '';
          const capacityStr = capacityKey ? String(row[capacityKey]).replace(/[^0-9]/g, '') : '';
          const capacity = capacityStr ? parseInt(capacityStr, 10) : 4;

          let role: 'driver' | 'rider' = rideType.includes('운전 가능') ? 'driver' : 'rider';
          let id = role === 'driver' ? `form_driver_${idx}` : `form_rider_${idx}`;
          
          attendeeMap.set(name, { id, name, role, capacity, capacityTo: capacity, capacityFrom: capacity, carIdTo: null, carIdFrom: null, address, pickupTimeTo: '', pickupTimeFrom: '', carId: null });
        }
      }
    });

    const savedRow = savedAssignments.find(r => r['행사명'] === adminSelectedEvent);
    if (savedRow && savedRow['데이터']) {
      try {
        const parsedData = JSON.parse(savedRow['데이터']);
        parsedData.forEach((savedPerson: any) => {
          if (attendeeMap.has(savedPerson.name) || savedPerson.isVan) {
            let currentPerson = attendeeMap.get(savedPerson.name);
            if (!currentPerson && savedPerson.isVan) {
               attendeeMap.set(savedPerson.id, savedPerson);
               currentPerson = attendeeMap.get(savedPerson.id);
            }
            if (currentPerson) {
              if (currentPerson.role === 'driver' || currentPerson.isVan) {
                currentPerson.pickupTimeTo = savedPerson.pickupTimeTo !== undefined ? savedPerson.pickupTimeTo : (savedPerson.pickupTime || currentPerson.pickupTimeTo);
                currentPerson.pickupTimeFrom = savedPerson.pickupTimeFrom !== undefined ? savedPerson.pickupTimeFrom : (savedPerson.pickupTime || currentPerson.pickupTimeFrom);
                
                currentPerson.capacityTo = savedPerson.capacityTo !== undefined ? savedPerson.capacityTo : (savedPerson.capacity !== undefined ? savedPerson.capacity : currentPerson.capacityTo);
                currentPerson.capacityFrom = savedPerson.capacityFrom !== undefined ? savedPerson.capacityFrom : (savedPerson.capacity !== undefined ? savedPerson.capacity : currentPerson.capacityFrom);
                if (currentPerson.isVan) {
                  currentPerson.vanDriverIdTo = savedPerson.vanDriverIdTo;
                  currentPerson.vanDriverIdFrom = savedPerson.vanDriverIdFrom;
                }
              } else {
                currentPerson.carIdTo = savedPerson.carIdTo !== undefined ? savedPerson.carIdTo : (savedPerson.carId !== undefined ? savedPerson.carId : null);
                currentPerson.carIdFrom = savedPerson.carIdFrom !== undefined ? savedPerson.carIdFrom : (savedPerson.carId !== undefined ? savedPerson.carId : null);
              }
            }
          }
        });
      } catch (e) { console.error(e); }
    }
    setPeople(Array.from(attendeeMap.values()));
  }, [adminSelectedEvent, rawResponses, savedAssignments, regularAttendees, events]);

  const assignToCar = (carId: string | null | 'van_driver_slot') => {
    if (!selectedRider) return;
    const rider = people.find(p => p.id === selectedRider);
    if (!rider) return;

    if (carId === 'van_driver_slot') {
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.isVan) updated = { ...updated, [rideDirection === 'to' ? 'vanDriverIdTo' : 'vanDriverIdFrom']: rider.id };
        if (p.id === rider.id && p.role === 'rider') updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: null };
        return updated;
      }));
    } else if (carId !== null) {
      if (rider.role === 'driver') {
        showToast(lang === 'ko' ? '운전자는 탑승자로 배정할 수 없습니다.' : 'Drivers cannot be passengers.', 'error');
        setSelectedRider(null);
        return;
      }
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.id === selectedRider) updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: carId };
        if (p.isVan) {
          if (rideDirection === 'to' && p.vanDriverIdTo === selectedRider) updated = { ...updated, vanDriverIdTo: null };
          if (rideDirection === 'from' && p.vanDriverIdFrom === selectedRider) updated = { ...updated, vanDriverIdFrom: null };
        }
        return updated;
      }));
    } else {
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.id === selectedRider) updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: null };
        if (p.isVan) {
          if (rideDirection === 'to' && p.vanDriverIdTo === selectedRider) updated = { ...updated, vanDriverIdTo: null };
          if (rideDirection === 'from' && p.vanDriverIdFrom === selectedRider) updated = { ...updated, vanDriverIdFrom: null };
        }
        return updated;
      }));
    }
    setSelectedRider(null); 
  };

  const handleDragStart = (e: React.DragEvent, riderId: string) => { e.dataTransfer.setData('riderId', riderId); setSelectedRider(riderId); };
  
  const handleDrop = (e: React.DragEvent, carId: string | null | 'van_driver_slot') => {
    e.preventDefault(); setDragOverCarId(null);
    const riderId = e.dataTransfer.getData('riderId');
    if (!riderId) return;
    const rider = people.find(p => p.id === riderId);
    if (!rider) return;

    if (carId === 'van_driver_slot') {
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.isVan) updated = { ...updated, [rideDirection === 'to' ? 'vanDriverIdTo' : 'vanDriverIdFrom']: rider.id };
        if (p.id === rider.id && p.role === 'rider') updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: null };
        return updated;
      }));
    } else if (carId !== null) {
      if (rider.role === 'driver') {
        showToast(lang === 'ko' ? '운전자는 탑승자로 배정할 수 없습니다.' : 'Drivers cannot be passengers.', 'error');
        setSelectedRider(null);
        return;
      }
      const driver = people.find(p => p.id === carId);
      const passengers = people.filter(p => p.role === 'rider' && (rideDirection === 'to' ? p.carIdTo === carId : p.carIdFrom === carId));
      const currentCapacity = rideDirection === 'to' ? (driver?.capacityTo || 0) : (driver?.capacityFrom || 0);
      if (driver && passengers.length >= currentCapacity) { showToast(t.fullCar[lang], 'error'); setSelectedRider(null); return; }
      
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.id === riderId) updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: carId };
        if (p.isVan) {
          if (rideDirection === 'to' && p.vanDriverIdTo === riderId) updated = { ...updated, vanDriverIdTo: null };
          if (rideDirection === 'from' && p.vanDriverIdFrom === riderId) updated = { ...updated, vanDriverIdFrom: null };
        }
        return updated;
      }));
    } else {
      setPeople(prev => prev.map(p => {
        let updated = p;
        if (p.id === riderId) updated = { ...updated, [rideDirection === 'to' ? 'carIdTo' : 'carIdFrom']: null };
        if (p.isVan) {
          if (rideDirection === 'to' && p.vanDriverIdTo === riderId) updated = { ...updated, vanDriverIdTo: null };
          if (rideDirection === 'from' && p.vanDriverIdFrom === riderId) updated = { ...updated, vanDriverIdFrom: null };
        }
        return updated;
      }));
    }
    setSelectedRider(null);
  };

  const removeVanDriver = (e: React.MouseEvent, direction: 'to' | 'from') => {
    e.stopPropagation();
    setPeople(prev => prev.map(p => {
      if (p.isVan) return { ...p, [direction === 'to' ? 'vanDriverIdTo' : 'vanDriverIdFrom']: null };
      return p;
    }));
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
    const driversList = people.filter(p => p.role === 'driver');
    const unassignedRiders = people.filter(p => {
      if (p.role !== 'rider') return false;
      const van = people.find(v => v.isVan);
      if (rideDirection === 'to') {
        if (p.carIdTo) return false;
        if (van && van.vanDriverIdTo === p.id) return false;
        return true;
      } else {
        if (p.carIdFrom) return false;
        if (van && van.vanDriverIdFrom === p.id) return false;
        return true;
      }
    });

    let text = lang === 'ko' ? `[${adminSelectedEvent} - ${rideDirection === 'to' ? '가는 편' : '오는 편'}]\n\n` : `[${adminSelectedEvent} - ${rideDirection === 'to' ? 'To Event' : 'From Event'}]\n\n`;
    
    driversList.forEach(driver => {
      const passengers = people.filter(p => p.role === 'rider' && (rideDirection === 'to' ? p.carIdTo === driver.id : p.carIdFrom === driver.id));
      const currentCapacity = rideDirection === 'to' ? (driver.capacityTo || 0) : (driver.capacityFrom || 0);
      const isFull = passengers.length >= currentCapacity;
      const statusTxt = isFull ? t.full[lang] : (lang === 'ko' ? `${currentCapacity - passengers.length}자리 남음` : `${currentCapacity - passengers.length} seats left`);
      const riderTxt = passengers.map(p => p.name).join(', ') || (lang === 'ko' ? '빈 차' : 'Empty');
      const timeStr = rideDirection === 'to' ? driver.pickupTimeTo : driver.pickupTimeFrom;
      const timeTxt = timeStr ? (lang === 'ko' ? ` [안내: ${timeStr}]` : ` [Info: ${timeStr}]`) : '';
      
      if (driver.isVan) {
        const vanDrvId = rideDirection === 'to' ? driver.vanDriverIdTo : driver.vanDriverIdFrom;
        const vanDrv = people.find(p => p.id === vanDrvId);
        const drvName = vanDrv ? vanDrv.name : (lang === 'ko' ? '미정' : 'TBD');
        text += `[밴] ${drvName} (${statusTxt})${timeTxt}\n - ${lang === 'ko' ? '탑승' : 'Riders'}: ${riderTxt}\n\n`;
      } else {
        text += `${t.car[lang]} ${driver.name} (${statusTxt})${timeTxt}\n - ${lang === 'ko' ? '탑승' : 'Riders'}: ${riderTxt}\n\n`;
      }
    });
    text += `[${t.waitlist[lang]}]\n - ${unassignedRiders.length > 0 ? unassignedRiders.map(p => p.name).join(', ') : (lang === 'ko' ? '없음' : 'None')}\n`;
    navigator.clipboard.writeText(text).then(() => showToast(t.copyOk[lang], 'success'));
  };

  const copyIndividualCar = (e: React.MouseEvent, driverId: string) => {
    e.stopPropagation();
    const driver = people.find(p => p.id === driverId);
    if (!driver) return;
    const passengers = people.filter(p => p.role === 'rider' && (rideDirection === 'to' ? p.carIdTo === driverId : p.carIdFrom === driverId));
    
    let text = lang === 'ko' ? `[차량] ${driver.name} (${rideDirection === 'to' ? '가는 편' : '오는 편'})\n` : `[Car] ${driver.name} (${rideDirection === 'to' ? 'To Event' : 'From Event'})\n`;
    if (driver.isVan) {
      const vanDrvId = rideDirection === 'to' ? driver.vanDriverIdTo : driver.vanDriverIdFrom;
      const vanDrv = people.find(p => p.id === vanDrvId);
      const drvName = vanDrv ? vanDrv.name : (lang === 'ko' ? '미정' : 'TBD');
      text = lang === 'ko' ? `[밴] 운전: ${drvName} (${rideDirection === 'to' ? '가는 편' : '오는 편'})\n` : `[Van] Drv: ${drvName} (${rideDirection === 'to' ? 'To Event' : 'From Event'})\n`;
    }

    const timeStr = rideDirection === 'to' ? driver.pickupTimeTo : driver.pickupTimeFrom;
    if (timeStr) {
      text += lang === 'ko' ? `- 픽업 안내: ${timeStr}\n` : `- Pickup Info: ${timeStr}\n`;
    }
    if (passengers.length > 0) {
      text += lang === 'ko' ? `- 탑승자:\n` : `- Riders:\n`;
      passengers.forEach(p => {
        text += `  • ${p.name} (${p.address || '주소 없음'})\n`;
      });
    } else {
      text += lang === 'ko' ? `- 탑승자: 배정 인원 없음\n` : `- Riders: Empty\n`;
    }
    navigator.clipboard.writeText(text).then(() => showToast(t.copyOk[lang], 'success'));
  };

  const openRouteMap = (driverId: string) => {
    const driver = people.find(p => p.id === driverId);
    const passengers = people.filter(p => p.role === 'rider' && (rideDirection === 'to' ? p.carIdTo === driverId : p.carIdFrom === driverId));
    const destination = events.find(e => e.fullName === adminSelectedEvent)?.destination || '';
    let waypoints = [];
    if (rideDirection === 'to') waypoints = [driver?.address, ...passengers.map(p => p.address), destination];
    else waypoints = [destination, ...passengers.map(p => p.address)];
    const cleanWaypoints = waypoints.filter(addr => addr && addr.trim() !== '');
    if (cleanWaypoints.length < 2) { showToast(t.routeFail[lang], 'error'); return; }
    window.open(`https://www.google.com/maps/dir/${cleanWaypoints.map(addr => encodeURIComponent(addr as string)).join('/')}`, '_blank');
  };

  const year = currentDate.getFullYear(); const month = currentDate.getMonth();
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => i);
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);
  const selectedEvents = events.filter(e => e.date === selectedDate);
  
  const unassignedRiders = people.filter(p => {
    if (p.role !== 'rider') return false;
    const van = people.find(v => v.isVan);
    if (rideDirection === 'to') {
      if (p.carIdTo) return false;
      if (van && van.vanDriverIdTo === p.id) return false;
      return true;
    } else {
      if (p.carIdFrom) return false;
      if (van && van.vanDriverIdFrom === p.id) return false;
      return true;
    }
  });

  const driversList = people.filter(p => p.role === 'driver');
  const uniqueEvents = Array.from(new Set(events.map(e => e.fullName)));
  
  const weekDaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays = lang === 'ko' ? weekDaysKo : weekDaysEn;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const totalRiders = people.filter(p => {
    if (p.role !== 'rider') return false;
    const van = people.find(v => v.isVan);
    if (rideDirection === 'to' && van && van.vanDriverIdTo === p.id) return false;
    if (rideDirection === 'from' && van && van.vanDriverIdFrom === p.id) return false;
    return true;
  }).length;

  const totalCapacity = driversList.reduce((acc, d) => acc + (rideDirection === 'to' ? (d.capacityTo || 0) : (d.capacityFrom || 0)), 0);
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
        .drop-zone-van-active { transform: scale(1.02); box-shadow: 0 0 20px rgba(16,185,129,0.3); border-color: #10b981 !important; background-color: #ecfdf5 !important; }
        @keyframes pulse-border { 0% { border-color: #bfdbfe; background-color: #f8fafc; } 50% { border-color: #3b82f6; background-color: #eff6ff; } 100% { border-color: #bfdbfe; background-color: #f8fafc; } }
        @keyframes pulse-border-van { 0% { border-color: #a7f3d0; background-color: #f0fff4; } 50% { border-color: #10b981; background-color: #ecfdf5; } 100% { border-color: #a7f3d0; background-color: #f0fff4; } }
        .highlight-drop { animation: pulse-border 1.5s infinite !important; border-width: 2px !important; border-style: dashed !important; cursor: pointer; }
        .highlight-drop-van { animation: pulse-border-van 1.5s infinite !important; border-width: 2px !important; border-style: dashed !important; cursor: pointer; }
        .toast-enter { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { transform: translate(-50%, 150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        input, select, textarea { appearance: none; -webkit-appearance: none; color: #000000 !important; opacity: 1 !important; -webkit-text-fill-color: #000000 !important; font-size: 16px !important; background-color: #ffffff; }
        input::placeholder { color: #a1a1aa !important; -webkit-text-fill-color: #a1a1aa !important; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out forwards; }
        .modal-content { background: #ffffff; width: 90%; max-width: 450px; max-height: 85vh; overflow-y: auto; border-radius: 16px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transform: translateY(20px); animation: slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal { to { transform: translateY(0); } }
      `}</style>

      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#18181b', fontWeight: 'bold', borderBottom: '2px solid #f4f4f5', paddingBottom: '15px' }}>{t.manTitle[lang]}</h2>
            {[t.man1, t.man2, t.man3, t.man4, t.man5, t.man6, t.man7, t.man8].map((item, idx) => (
              <div key={idx} style={{ marginBottom: idx === 7 ? '25px' : '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#2563eb', fontWeight: 'bold' }}>{item[lang]}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#3f3f46', lineHeight: '1.5' }}>{[t.man1Desc, t.man2Desc, t.man3Desc, t.man4Desc, t.man5Desc, t.man6Desc, t.man7Desc, t.man8Desc][idx][lang]}</p>
              </div>
            ))}
            <button className="hover-btn" onClick={() => setIsHelpOpen(false)} style={{ width: '100%', padding: '12px', background: '#18181b', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>{t.closeBtn[lang]}</button>
          </div>
        </div>
      )}

      {toast && <div className="toast-enter" style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3f3f46', color: '#fff', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 90, boxShadow: '0 8px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>{toast.message}</div>}

      <header style={{ background: '#ffffff', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e4e4e7' }}>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#18181b', fontWeight: '900' }}>LivingStone Ride</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsHelpOpen(true)} style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#3f3f46' }}>{t.helpBtn[lang]}</button>
          <button onClick={toggleLang} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}>{lang === 'ko' ? 'EN' : 'KR'}</button>
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#18181b' }}>{lang === 'ko' ? `${year}년 ${month + 1}월` : `${monthNames[month]} ${year}`}</h2>
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
                  const isApplied = checkApplicationStatus(event.fullName, event.type);
                  return (
                    <div key={event.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e4e4e7', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><span style={{ fontSize: '12px', background: event.type === 'regular' ? '#dbeafe' : '#fce7f3', color: event.type === 'regular' ? '#1d4ed8' : '#be185d', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{event.type === 'regular' ? t.regWorship[lang] : t.spcEvent[lang]}</span></div>
                      <h4 style={{ margin: '12px 0', fontSize: '18px', color: '#18181b' }}>{event.title}</h4>
                      {event.destination && <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '15px' }}>{t.loc[lang]} <span style={{ fontWeight: 'bold', color: '#3f3f46' }}>{event.destination}</span></div>}
                      {myStatus && (
                        <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', overflow: 'hidden' }}>
                          <div style={{ padding: '10px 12px', display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0' }}><span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', minWidth: '40px' }}>가는 편</span><span style={{ fontSize: '13px', color: myStatus.colorTo, fontWeight: '900', wordBreak: 'keep-all', lineHeight: '1.4' }}>{myStatus.statusTo}</span></div>
                          <div style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}><span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', minWidth: '40px' }}>오는 편</span><span style={{ fontSize: '13px', color: myStatus.colorFrom, fontWeight: '900', wordBreak: 'keep-all', lineHeight: '1.4' }}>{myStatus.statusFrom}</span></div>
                        </div>
                      )}
                      {isProfileSaved ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="hover-btn" onClick={() => window.open(getPrefilledUrl(event.fullName, false), '_blank')} style={{ flex: 1, padding: '12px', background: isApplied ? '#10b981' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{isApplied ? t.alreadyApplied[lang] : t.btnApply1[lang]}</button>
                          <button className="hover-btn" onClick={() => window.open(getPrefilledUrl(event.fullName, true), '_blank')} style={{ flex: 1, padding: '12px', background: '#f4f4f5', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{t.btnCancel[lang]}</button>
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
                <option value="운전 가능 (차량 제공, I can give a ride)">{t.optDrive[lang]}</option>
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

            <div style={{ marginBottom: '15px' }}>
              <select value={adminSelectedEvent} onChange={(e) => setAdminSelectedEvent(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d4d4d8', fontSize: '16px', background: '#fff', cursor: 'pointer', color: '#18181b', fontWeight: 'bold' }}>
                <option value="">{t.selEvt[lang]}</option>
                {uniqueEvents.map(eventName => <option key={eventName} value={eventName}>{eventName}</option>)}
              </select>
            </div>

            {adminSelectedEvent ? (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={() => setRideDirection('to')} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', border: rideDirection === 'to' ? '2px solid #3b82f6' : '1px solid #e4e4e7', background: rideDirection === 'to' ? '#eff6ff' : '#fff', color: rideDirection === 'to' ? '#1d4ed8' : '#71717a', transition: 'all 0.2s' }}>
                    {t.dirTo[lang]}
                  </button>
                  <button onClick={() => setRideDirection('from')} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', border: rideDirection === 'from' ? '2px solid #ec4899' : '1px solid #e4e4e7', background: rideDirection === 'from' ? '#fdf2f8' : '#fff', color: rideDirection === 'from' ? '#be185d' : '#71717a', transition: 'all 0.2s' }}>
                    {t.dirFrom[lang]}
                  </button>
                </div>

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

                <div className={`drop-zone ${dragOverCarId === 'waitlist' ? 'drop-zone-active' : ''} ${selectedRider ? 'highlight-drop' : ''}`} onClick={() => assignToCar(null)} onDragOver={(e) => { e.preventDefault(); setDragOverCarId('waitlist'); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, null)} style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: dragOverCarId === 'waitlist' ? (rideDirection === 'to' ? '2px dashed #3b82f6' : '2px dashed #ec4899') : '1px solid #e4e4e7', minHeight: '100px', marginBottom: '25px', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    {t.waitlist[lang]} 
                    <span style={{ background: '#f4f4f5', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#71717a' }}>{unassignedRiders.length}</span>
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {unassignedRiders.map(rider => (
                      <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: selectedRider === rider.id ? (rideDirection === 'to' ? '#3b82f6' : '#ec4899') : '#f4f4f5', color: selectedRider === rider.id ? '#fff' : '#3f3f46', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {rider.name} {selectedRider === rider.id && t.selected[lang]}
                      </button>
                    ))}
                    {unassignedRiders.length === 0 && <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{t.allAssgn[lang]}</span>}
                  </div>
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#18181b', paddingLeft: '5px', fontWeight: 'bold' }}>{t.carList[lang]}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {driversList.map(driver => {
                    const passengers = people.filter(p => p.role === 'rider' && (rideDirection === 'to' ? p.carIdTo === driver.id : p.carIdFrom === driver.id));
                    const currentCapacity = rideDirection === 'to' ? (driver.capacityTo || 0) : (driver.capacityFrom || 0);
                    const isFull = passengers.length >= currentCapacity;

                    return (
                      <div key={driver.id} className={`drop-zone ${dragOverCarId === driver.id ? 'drop-zone-active' : ''} ${selectedRider && !isFull ? 'highlight-drop' : ''}`} onClick={() => !isFull && assignToCar(driver.id)} onDragOver={(e) => { e.preventDefault(); !isFull && setDragOverCarId(driver.id); }} onDragLeave={() => setDragOverCarId(null)} onDrop={(e) => handleDrop(e, driver.id)} style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: isFull ? '2px solid #fecaca' : '1px solid #e4e4e7', position: 'relative', cursor: isFull ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
                        {isFull && <div style={{ position: 'absolute', right: '-25px', top: '15px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{t.full[lang]}</div>}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          
                          {driver.isVan ? (
                            <div 
                              className={`drop-zone ${dragOverCarId === 'van_driver_slot' ? 'drop-zone-van-active' : ''} ${selectedRider ? 'highlight-drop-van' : ''}`} 
                              onClick={(e) => { e.stopPropagation(); assignToCar('van_driver_slot'); }}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverCarId('van_driver_slot'); }} 
                              onDragLeave={(e) => { e.stopPropagation(); setDragOverCarId(null); }} 
                              onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'van_driver_slot'); }}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '6px 12px', border: dragOverCarId === 'van_driver_slot' ? '2px dashed #10b981' : '1px dashed #d4d4d8', borderRadius: '8px', background: dragOverCarId === 'van_driver_slot' ? '#ecfdf5' : '#f8fafc', minHeight: '36px', cursor: 'pointer', marginRight: '10px' }}
                            >
                              <span style={{ fontWeight: '900', color: '#18181b', fontSize: '15px', marginRight: '8px' }}>{lang === 'ko' ? '밴' : 'Church Van'}</span>
                              {(() => {
                                const vanDrvId = rideDirection === 'to' ? driver.vanDriverIdTo : driver.vanDriverIdFrom;
                                const vanDriverPerson = people.find(p => p.id === vanDrvId);
                                return vanDriverPerson ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>{vanDriverPerson.name}</span>
                                    <button className="hover-btn" onClick={(e) => removeVanDriver(e, rideDirection)} style={{ border: 'none', background: 'transparent', color: '#166534', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>X</button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{t.vanNoDriverTo[lang]}</span>
                                );
                              })()}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '4px' }}>
                              <span style={{ fontWeight: '900', color: '#18181b', fontSize: '16px' }}>{t.car[lang]} {driver.name}</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', alignItems: 'center', background: isFull ? '#fee2e2' : '#dcfce7', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isFull ? '#fca5a5' : '#86efac'}` }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setPeople(prev => prev.map(p => p.id === driver.id ? { ...p, [rideDirection === 'to' ? 'capacityTo' : 'capacityFrom']: Math.max(0, currentCapacity - 1) } : p))} style={{ border: 'none', background: 'transparent', padding: '4px 8px', color: isFull ? '#dc2626' : '#166534', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: '13px', color: isFull ? '#dc2626' : '#166534', padding: '0 4px', fontWeight: 'bold' }}>{passengers.length} / {currentCapacity}</span>
                            <button onClick={() => setPeople(prev => prev.map(p => p.id === driver.id ? { ...p, [rideDirection === 'to' ? 'capacityTo' : 'capacityFrom']: currentCapacity + 1 } : p))} style={{ border: 'none', background: 'transparent', padding: '4px 8px', color: isFull ? '#dc2626' : '#166534', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
                            <button className="hover-btn" onClick={(e) => copyIndividualCar(e, driver.id)} style={{ padding: '6px 10px', background: '#fef01b', color: '#3f2020', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{t.indivCopy[lang]}</button>
                            <button className="hover-btn" onClick={(e) => { e.stopPropagation(); openRouteMap(driver.id); }} style={{ padding: '6px 10px', background: '#18181b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{t.navi[lang]}</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', background: '#f4f4f5', padding: '8px 12px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#3f3f46', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {lang === 'ko' ? '안내 메모:' : 'Info Memo:'}
                          </span>
                          <input 
                            type="text" 
                            placeholder={lang === 'ko' ? "예: 10:30 (순차 픽업) / 개별 연락" : "ex: 10:30 AM / Will text you"}
                            value={rideDirection === 'to' ? (driver.pickupTimeTo || '') : (driver.pickupTimeFrom || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPeople(prev => prev.map(p => p.id === driver.id ? { ...p, [rideDirection === 'to' ? 'pickupTimeTo' : 'pickupTimeFrom']: val } : p));
                            }}
                            onClick={(e) => e.stopPropagation()} 
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d4d4d8', fontSize: '14px', background: '#fff' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '45px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px inset #f1f5f9' }}>
                          {passengers.map(rider => (
                            <button className="hover-btn" key={rider.id} draggable onDragStart={(e) => handleDragStart(e, rider.id)} onDragEnd={() => setSelectedRider(null)} onClick={(e) => { e.stopPropagation(); setSelectedRider(selectedRider === rider.id ? null : rider.id); }} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: selectedRider === rider.id ? (rideDirection === 'to' ? '#3b82f6' : '#ec4899') : '#ffffff', color: selectedRider === rider.id ? '#fff' : '#334155', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {rider.name} 
                              {selectedRider === rider.id ? ` ${t.selected[lang]}` : <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>{t.cancelMark[lang]}</span>}
                            </button>
                          ))}
                          {passengers.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', height: '100%' }}>{t.touch[lang]}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {driversList.length === 0 && <div style={{ fontSize: '14px', color: '#71717a', textAlign: 'center', padding: '30px', background: '#f4f4f5', borderRadius: '12px' }}>{t.noDrv[lang]}</div>}
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