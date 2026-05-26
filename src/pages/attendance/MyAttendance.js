import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { attendanceApi } from '../../utils/api.js';
import dayjs from 'dayjs';
import './MyAttendance.css';

const MyAttendance = () => {
  const { attendanceRecords, setToast } = useAppContext();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isPunching, setIsPunching] = useState(false);
  const [geoConfig, setGeoConfig] = useState({ enabled: false, lat: 0, lng: 0, radius: 500, mapUrl: '' });
  const [geoStatus, setGeoStatus] = useState({ checking: true, allowed: true, distance: null, mapUrl: '' });
  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = dayjs().format('YYYY-MM-DD');
  
  // Find my attendance for today
  const allYearAttendance = attendanceRecords.year || [];
  const todayRecord = allYearAttendance.find(r => r.date === todayStr);

  const checkInTime = todayRecord?.checkIn ? dayjs(todayRecord.checkIn).format('hh:mm A') : null;
  const checkOutTime = todayRecord?.checkOut ? dayjs(todayRecord.checkOut).format('hh:mm A') : null;
  
  const hasPunchedIn = !!todayRecord?.checkIn;
  const hasPunchedOut = !!todayRecord?.checkOut;

  const handlePunch = async (action) => {
    try {
      setIsPunching(true);

      if (geoConfig.enabled) {
        if (!navigator.geolocation) {
          setToast({ message: 'Geolocation is not supported by your browser.', icon: 'error' });
          setIsPunching(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Calculate distance (Haversine formula)
            const toRadians = (deg) => deg * (Math.PI / 180);
            const R = 6371000; // meters
            const dLat = toRadians(geoConfig.lat - lat);
            const dLon = toRadians(geoConfig.lng - lng);
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                      Math.cos(toRadians(lat)) * Math.cos(toRadians(geoConfig.lat)) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const dist = R * c;

            if (dist > geoConfig.radius) {
              setToast({ message: 'try again within 500 m from your company', icon: 'error' });
              setTimeout(() => setToast(null), 2000);
              setIsPunching(false);
              return;
            }

            // Within geofence, send punch with lat and lng to backend
            try {
              const isoTime = dayjs().toISOString();
              await attendanceApi.punchAttendance(action, isoTime, lat, lng);
              setToast({ message: `Successfully punched ${action === 'check-in' ? 'In' : 'Out'}!`, icon: 'check_circle' });
              setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
              console.error(err);
              setToast({ message: err.response?.data?.message || 'Failed to record attendance', icon: 'error' });
            } finally {
              setIsPunching(false);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            setToast({ message: 'Location permission is required to punch attendance. Please enable location services.', icon: 'error' });
            setIsPunching(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        // Geofencing not enabled, normal punch
        const isoTime = dayjs().toISOString();
        await attendanceApi.punchAttendance(action, isoTime);
        setToast({ message: `Successfully punched ${action === 'check-in' ? 'In' : 'Out'}!`, icon: 'check_circle' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Failed to record attendance', icon: 'error' });
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
        if (cfg && cfg.enabled) {
          setGeoConfig({
            enabled: true,
            lat: cfg.lat,
            lng: cfg.lng,
            radius: cfg.radius || 500,
            mapUrl: cfg.mapUrl || ''
          });
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: cfg.mapUrl || '' });
        } else {
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '' });
        }
      } catch (err) {
        if (!mounted) return;
        setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '' });
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

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
