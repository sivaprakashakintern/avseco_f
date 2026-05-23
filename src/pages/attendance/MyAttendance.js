import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { attendanceApi } from '../../utils/api.js';
import dayjs from 'dayjs';
import './MyAttendance.css';

const MyAttendance = () => {
  const { attendanceRecords, fetchStatus, setToast } = useAppContext();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isPunching, setIsPunching] = useState(false);
  const [geoStatus, setGeoStatus] = useState({ checking: true, allowed: false, distance: null, mapUrl: '' });
  const [geofenceCfg, setGeofenceCfg] = useState(null);
  const [promptDisabled, setPromptDisabled] = useState(() => {
    try {
      return localStorage.getItem('att_prompt_disabled') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = dayjs().format('YYYY-MM-DD');
  
  // Find my attendance for today
  // Wait, in AppContext, myAttendanceYear holds all year data.
  // We can just filter attendanceRecords.year
  const allYearAttendance = attendanceRecords.year || [];
  const todayRecord = allYearAttendance.find(r => r.date === todayStr);

  const checkInTime = todayRecord?.checkIn ? dayjs(todayRecord.checkIn).format('hh:mm A') : null;
  const checkOutTime = todayRecord?.checkOut ? dayjs(todayRecord.checkOut).format('hh:mm A') : null;
  
  const hasPunchedIn = !!todayRecord?.checkIn;
  const hasPunchedOut = !!todayRecord?.checkOut;

  const handlePunch = async (action) => {
    try {
      setIsPunching(true);
      const isoTime = dayjs().toISOString();
      await attendanceApi.punchAttendance(action, isoTime);
      setToast({ message: `Successfully punched ${action === 'check-in' ? 'In' : 'Out'}!`, icon: 'check_circle' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Failed to record attendance', icon: 'error' });
    } finally {
      setIsPunching(false);
    }
  };

  // Fetch geofence config from server (do not request browser location on mount)
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const cfg = await attendanceApi.getGeofence();
        if (!mounted) return;
        setGeofenceCfg(cfg);
        setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: cfg.mapUrl || '' });
      } catch (err) {
        if (!mounted) return;
        setGeofenceCfg(null);
        setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '' });
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  const retryLocation = () => {
    setGeoStatus(s => ({ ...s, checking: true }));
    if (!navigator.geolocation) {
      setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: '' });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      window._lastKnownPosition = pos;
      // reuse same calculation as above by forcing an effect-like computation
      const cfgPromise = attendanceApi.getGeofence();
      cfgPromise.then(cfg => {
        if (!cfg.enabled) {
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '' });
          return;
        }
        const toRad = (d) => d * (Math.PI/180);
        const R = 6371000;
        const lat1 = pos.coords.latitude;
        const lon1 = pos.coords.longitude;
        const lat2 = Number(cfg.lat);
        const lon2 = Number(cfg.lng);
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = R * c;
        const allowed = dist <= (Number(cfg.radius) || 500);
        setGeoStatus({ checking: false, allowed, distance: dist, mapUrl: cfg.mapUrl || '' });
      }).catch(() => setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: '' }));
    }, (err) => {
      if (err && err.code === 1) {
        setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: '', reason: 'permission_denied' });
      } else {
        setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: '' });
      }
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const disablePrompt = () => {
    try { localStorage.setItem('att_prompt_disabled', 'true'); } catch (e) {}
    setPromptDisabled(true);
  };

  return (
    <div className="my-attendance-container">
      <div className="attendance-header">
        <h1>My Attendance</h1>
        <p>{currentTime.format('dddd, MMMM D, YYYY')}</p>
      </div>

      <div className="punch-card">
        {geoStatus.checking ? (
          <div style={{ padding: 12, color: '#64748b' }}>Checking your location…</div>
        ) : !geoStatus.allowed ? (
          <div style={{ padding: 12 }}>
            <div style={{ color: '#ef4444', marginBottom: 8 }}>You are not within the allowed location to punch.</div>
            <div style={{ color: '#64748b', marginBottom: 8 }}>Distance from allowed point: {geoStatus.distance ? `${Math.round(geoStatus.distance)} m` : 'Unknown'}</div>
            {geoStatus.mapUrl && (
              <a href={geoStatus.mapUrl} target="_blank" rel="noreferrer" className="punch-btn" style={{ display: 'inline-block', marginTop: 6 }}>
                Open Location in Maps
              </a>
            )}
          </div>
        ) : null}

        <div className="live-clock">
          {currentTime.format('hh:mm:ss A')}
        </div>

        {/* Banner removed — module opens normally. Location will be requested when user clicks Punch. */}

        {geoStatus.checking ? null : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="punch-actions">
            {!hasPunchedIn ? (
              <button 
                className="punch-btn btn-in" 
                onClick={() => handlePunch('check-in')}
                disabled={isPunching}
              >
                <span className="material-symbols-outlined btn-icon">login</span>
                {isPunching ? 'Punching In...' : 'PUNCH IN'}
              </button>
            ) : !hasPunchedOut ? (
              <button 
                className="punch-btn btn-out" 
                onClick={() => handlePunch('check-out')}
                disabled={isPunching}
              >
                <span className="material-symbols-outlined btn-icon">logout</span>
                {isPunching ? 'Punching Out...' : 'PUNCH OUT'}
              </button>
            ) : (
              <button className="punch-btn btn-completed" disabled>
                <span className="material-symbols-outlined btn-icon">task_alt</span>
                COMPLETED FOR TODAY
              </button>
            )}
          </div>
          </div>
        )}

        <div className="punch-history">
          <div className="history-card">
            <span className="history-label">Punch In</span>
            <span className="history-time">{checkInTime || '--:--'}</span>
            {hasPunchedIn ? (
              <span className="history-status">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>check_circle</span>
                Recorded
              </span>
            ) : (
              <span className="history-status status-pending">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>schedule</span>
                Pending
              </span>
            )}
          </div>
          
          <div className="history-card">
            <span className="history-label">Punch Out</span>
            <span className="history-time">{checkOutTime || '--:--'}</span>
            {hasPunchedOut ? (
              <span className="history-status">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>check_circle</span>
                Recorded
              </span>
            ) : (
              <span className="history-status status-pending">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>schedule</span>
                Pending
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
