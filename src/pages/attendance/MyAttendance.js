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
  const [geoStatus, setGeoStatus] = useState({ checking: true, allowed: false, distance: null, mapUrl: '', error: null, verified: false });
  
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

  // Calculate total hours today
  let totalHoursStr = '--';
  let isHoursActive = false;
  if (todayRecord?.checkIn) {
    const start = dayjs(todayRecord.checkIn);
    const end = todayRecord.checkOut ? dayjs(todayRecord.checkOut) : currentTime;
    const diffMins = end.diff(start, 'minute');
    if (diffMins >= 0) {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      totalHoursStr = `${hrs}h ${mins}m`;
      isHoursActive = !todayRecord.checkOut;
    }
  }

  // Verifies user location against the geofence config
  const verifyLocation = (silent = false, customConfig = null) => {
    const activeConfig = customConfig || geoConfig;
    return new Promise((resolve, reject) => {
      if (!activeConfig.enabled) {
        resolve({ allowed: true });
        return;
      }

      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        if (!silent) setToast({ message: msg, icon: 'error' });
        setGeoStatus({ checking: false, allowed: false, distance: null, mapUrl: activeConfig.mapUrl, error: msg, verified: true });
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
          const dLat = toRadians(activeConfig.lat - lat);
          const dLon = toRadians(activeConfig.lng - lng);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRadians(lat)) * Math.cos(toRadians(activeConfig.lat)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;

          const isAllowed = dist <= activeConfig.radius;
          
          setGeoStatus({
            checking: false,
            allowed: isAllowed,
            distance: dist,
            mapUrl: activeConfig.mapUrl,
            error: null,
            verified: true
          });

          if (!silent) {
            if (isAllowed) {
              setToast({ message: 'Location verified! You are inside the office range.', icon: 'check_circle' });
            } else {
              setToast({ message: 'Out of range! You are currently not in the office.', icon: 'warning' });
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
            mapUrl: activeConfig.mapUrl,
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
          setToast({ message: result.error || 'You are currently not in the office', icon: 'error' });
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

  // Fetch geofence config from server and verify location automatically
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const cfg = await attendanceApi.getGeofence();
        if (!mounted) return;
        if (cfg && cfg.enabled) {
          const newConfig = {
            enabled: true,
            lat: cfg.lat,
            lng: cfg.lng,
            radius: cfg.radius || 500,
            mapUrl: cfg.mapUrl || ''
          };
          setGeoConfig(newConfig);
          setGeoStatus({ checking: true, allowed: false, distance: null, mapUrl: cfg.mapUrl || '', error: null, verified: false });
          
          // Silently verify on mount
          await verifyLocation(true, newConfig);
        } else {
          setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '', error: null, verified: true });
        }
      } catch (err) {
        if (!mounted) return;
        setGeoStatus({ checking: false, allowed: true, distance: null, mapUrl: '', error: null, verified: true });
      }
    };
    check();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="my-attendance-container">
      <div className="attendance-header">
        <h1>My Attendance</h1>
        <p>{currentTime.format('dddd, MMMM D, YYYY')}</p>
      </div>

      <div className="punch-card">
        {geoConfig.enabled && geoStatus.verified && (
          geoStatus.allowed ? (
            <div className="geo-status-banner status-allowed">
              <span className="material-symbols-outlined banner-icon">check_circle</span>
              <div className="banner-content">
                <div className="banner-title">Office Location Verified</div>
                <div className="banner-desc">You are inside the office range. Ready to punch.</div>
              </div>
            </div>
          ) : (
            <div className="geo-status-banner status-denied">
              <span className="material-symbols-outlined banner-icon">location_off</span>
              <div className="banner-content">
                <div className="banner-title">Location Restricted</div>
                <div className="banner-desc">You are currently not in the office</div>
                {geoStatus.mapUrl && (
                  <a href={geoStatus.mapUrl} target="_blank" rel="noreferrer" className="maps-link-btn">
                    <span className="material-symbols-outlined">map</span>
                    Open Location in Google Maps
                  </a>
                )}
              </div>
            </div>
          )
        )}

        <div className="live-clock">
          {currentTime.format('hh:mm:ss A')}
        </div>

        {geoConfig.enabled && geoStatus.checking && !geoStatus.verified && (
          <div className="geo-status-banner status-checking">
            <span className="material-symbols-outlined banner-icon verifying-icon">my_location</span>
            <div className="banner-content">
              <div className="banner-title">Checking your location...</div>
              <div className="banner-desc">Please wait while we verify your location.</div>
            </div>
          </div>
        )}

        {geoConfig.enabled && (
          <button 
            type="button" 
            className={`verify-loc-btn ${geoStatus.checking ? 'verifying' : ''}`}
            onClick={() => verifyLocation(false)}
            disabled={geoStatus.checking || isPunching}
          >
            <span className="material-symbols-outlined btn-icon-small">
              {geoStatus.checking ? 'autorenew' : 'refresh'}
            </span>
            {geoStatus.checking ? 'Checking Location...' : 'Re-check Location'}
          </button>
        )}

        {geoConfig.enabled && geoStatus.verified && !geoStatus.allowed && (
          <div className="office-warning-text">
            <span className="material-symbols-outlined">warning</span>
            You are currently not in the office
          </div>
        )}

        <div className="punch-actions">
          {!hasPunchedIn ? (
            <button 
              className="punch-btn btn-in" 
              onClick={() => handlePunch('check-in')}
              disabled={isPunching || geoStatus.checking || (geoConfig.enabled && !geoStatus.allowed)}
            >
              <span className="material-symbols-outlined btn-icon">login</span>
              {isPunching ? 'Punching In...' : 'PUNCH IN'}
            </button>
          ) : !hasPunchedOut ? (
            <button 
              className="punch-btn btn-out" 
              onClick={() => handlePunch('check-out')}
              disabled={isPunching || geoStatus.checking || (geoConfig.enabled && !geoStatus.allowed)}
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

          {hasPunchedIn && (
            <div className="history-card">
              <span className="history-label">Time in Office</span>
              <span className="history-time">{totalHoursStr}</span>
              <span className={`history-status ${isHoursActive ? 'status-active' : ''}`}>
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>
                  {isHoursActive ? 'pending' : 'check_circle'}
                </span>
                {isHoursActive ? 'Active Session' : 'Completed'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
