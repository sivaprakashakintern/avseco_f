import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { attendanceApi } from '../../utils/api.js';
import dayjs from 'dayjs';
import './MyAttendance.css';

const MyAttendance = () => {
  const { attendanceRecords, setToast } = useAppContext();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isPunching, setIsPunching] = useState(false);
  const [geoConfig, setGeoConfig] = useState({ 
    enabled: true, 
    lat: 10.431338, 
    lng: 78.585891, 
    radius: 500, 
    mapUrl: 'https://maps.app.goo.gl/bHvhxbA3BaQ1J1Ne6?g_st=aw' 
  });
  const [geoStatus, setGeoStatus] = useState({ checking: false, allowed: true, distance: null, mapUrl: '', error: null, verified: false });
  
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

  // Verifies user location against the geofence config
  const verifyLocation = (silent = false) => {
    return new Promise((resolve, reject) => {
      if (!geoConfig.enabled) {
        resolve({ allowed: true });
        return;
      }

      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        if (!silent) setToast({ message: msg, icon: 'error' });
        setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: geoConfig.mapUrl, error: msg, verified: true });
        resolve({ allowed: false, error: msg });
        return;
      }

      setGeoStatus(prev => ({ ...prev, checking: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Calculate distance using Haversine formula
          const toRadians = (deg) => deg * (Math.PI / 180);
          const R = 6371000; // meters
          const dLat = toRadians(geoConfig.lat - lat);
          const dLon = toRadians(geoConfig.lng - lng);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRadians(lat)) * Math.cos(toRadians(geoConfig.lat)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;

          const isAllowed = dist <= geoConfig.radius;
          
          setGeoStatus({
            checking: false,
            allowed: isAllowed,
            distance: dist,
            mapUrl: geoConfig.mapUrl,
            error: null,
            verified: true
          });

          if (!silent) {
            if (isAllowed) {
              setToast({ message: `Location verified! You are ${Math.round(dist)}m away (within range).`, icon: 'check_circle' });
            } else {
              setToast({ message: `Out of range! You are ${Math.round(dist)}m away.`, icon: 'warning' });
            }
            setTimeout(() => setToast(null), 3000);
          }

          resolve({ allowed: isAllowed, lat, lng, distance: dist });
        },
        (error) => {
          console.error('Error getting location:', error);
          let msg = 'Location permission is required to punch attendance. Please enable location services.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access in your browser settings to punch attendance.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable. Please check your network or GPS connection.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
          }
          if (!silent) setToast({ message: msg, icon: 'error' });
          setGeoStatus({
            checking: false,
            allowed: false,
            distance: null,
            mapUrl: geoConfig.mapUrl,
            error: msg,
            verified: true
          });
          resolve({ allowed: false, error: msg });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handlePunch = async (action) => {
    try {
      setIsPunching(true);

      if (geoConfig.enabled) {
        const result = await verifyLocation(true); // check location silently first
        if (!result.allowed) {
          setToast({ message: result.error || 'try again within 500 m from your company', icon: 'error' });
          setTimeout(() => setToast(null), 3500);
          setIsPunching(false);
          return;
        }

        // Within geofence, send punch with lat and lng to backend
        try {
          const isoTime = dayjs().toISOString();
          await attendanceApi.punchAttendance(action, isoTime, result.lat, result.lng);
          setToast({ message: `Successfully punched ${action === 'check-in' ? 'In' : 'Out'}!`, icon: 'check_circle' });
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          console.error(err);
          setToast({ message: err.response?.data?.message || 'Failed to record attendance', icon: 'error' });
        } finally {
          setIsPunching(false);
        }
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
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: cfg.mapUrl || '', error: null, verified: false });
        } else {
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '', error: null, verified: false });
        }
      } catch (err) {
        if (!mounted) return;
        setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '', error: null, verified: false });
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
        {geoStatus.verified && (
          <div className={`geo-status-banner ${geoStatus.allowed ? 'status-allowed' : 'status-denied'}`}>
            <span className="material-symbols-outlined banner-icon">
              {geoStatus.allowed ? 'check_circle' : geoStatus.error ? 'location_off' : 'warning'}
            </span>
            <div className="banner-content">
              <div className="banner-title">
                {geoStatus.allowed 
                  ? 'Within Allowed Geofence' 
                  : geoStatus.error 
                    ? 'Location Check Failed' 
                    : 'Out of Allowed Range'}
              </div>
              <div className="banner-desc">
                {geoStatus.allowed 
                  ? `You are ${geoStatus.distance !== null ? `${Math.round(geoStatus.distance)}m` : 'close'} away from the company. Ready to punch.`
                  : geoStatus.error 
                    ? geoStatus.error
                    : `You are ${geoStatus.distance !== null ? `${Math.round(geoStatus.distance)}m` : 'too far'} away (Limit: ${geoConfig.radius}m).`}
              </div>
              {geoStatus.mapUrl && !geoStatus.allowed && (
                <a href={geoStatus.mapUrl} target="_blank" rel="noreferrer" className="maps-link-btn">
                  <span className="material-symbols-outlined">map</span>
                  Open Location in Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        <div className="live-clock">
          {currentTime.format('hh:mm:ss A')}
        </div>

        {geoConfig.enabled && (
          <button 
            type="button" 
            className={`verify-loc-btn ${geoStatus.checking ? 'verifying' : ''}`}
            onClick={() => verifyLocation(false)}
            disabled={geoStatus.checking || isPunching}
          >
            <span className="material-symbols-outlined btn-icon-small">
              {geoStatus.checking ? 'autorenew' : 'my_location'}
            </span>
            {geoStatus.checking ? 'Verifying Location...' : 'Check Location Status'}
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="punch-actions">
            {!hasPunchedIn ? (
              <button 
                className="punch-btn btn-in" 
                onClick={() => handlePunch('check-in')}
                disabled={isPunching || geoStatus.checking}
              >
                <span className="material-symbols-outlined btn-icon">login</span>
                {isPunching ? 'Punching In...' : 'PUNCH IN'}
              </button>
            ) : !hasPunchedOut ? (
              <button 
                className="punch-btn btn-out" 
                onClick={() => handlePunch('check-out')}
                disabled={isPunching || geoStatus.checking}
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
