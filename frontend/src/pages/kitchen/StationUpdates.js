import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getStationStatus } from './StatusBoard';
import { isBarItem, isKitchenItem } from './stationItems';

export function getNewOrderIds(seen, orders, itemsKey) {
  if (seen === null) return [];
  return orders.filter(order => !seen.has(order._id) &&
    ['pending', 'preparing', 'ready'].includes(getStationStatus(order, order[itemsKey])))
    .map(order => order._id);
}

export function ConnectionStatus({ lastUpdated, now, error, refreshing }) {
  const seconds = lastUpdated ? Math.max(0, Math.floor((now - lastUpdated) / 1000)) : null;
  const stale = seconds !== null && seconds > 30;
  return <div className={`kds-connection ${error || stale ? 'disconnected' : ''}`}>
    <span role="status">{error ? 'Connection lost — retrying automatically. Orders may be outdated.'
      : stale ? 'Updates delayed — retrying automatically. Orders may be outdated.'
        : lastUpdated ? 'Connected' : 'Connecting…'}</span>
    <span>{seconds !== null ? `Updated ${seconds}s ago` : 'No orders loaded yet'}{refreshing ? ' · Refreshing…' : ''}</span>
  </div>;
}

export function MixedOrderProgress({ order }) {
  const items = order.allItems || order.items || [];
  const kitchen = items.filter(isKitchenItem);
  const bar = items.filter(isBarItem);
  if (!kitchen.length || !bar.length) return null;
  const original = { ...order, status: order.originalStatus || order.status };
  return <div className="kds-mixed-progress" aria-label="Kitchen and bar progress">
    {[['Kitchen', kitchen], ['Bar', bar]].map(([name, stationItems]) => {
      const status = getStationStatus(original, stationItems);
      return <span key={name} className={`kds-status-badge ${status}`}>{name}: {status}</span>;
    })}
  </div>;
}

export function useOrderSound() {
  const audio = useRef(null);
  const [soundReady, setSoundReady] = useState(false);
  useEffect(() => () => {
    if (audio.current && audio.current.state !== 'closed') audio.current.close().catch(() => {});
  }, []);
  const enableSound = useCallback(async () => {
    try {
      if (!audio.current || audio.current.state === 'closed') {
        audio.current = new (window.AudioContext || window.webkitAudioContext)();
        audio.current.onstatechange = () => setSoundReady(audio.current?.state === 'running');
      }
      await audio.current.resume();
      setSoundReady(audio.current.state === 'running');
    } catch { setSoundReady(false); }
  }, []);
  const playNotificationSound = useCallback(() => {
    const context = audio.current;
    if (!context || context.state !== 'running') return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);
    } catch { setSoundReady(false); }
  }, []);
  return { enableSound, playNotificationSound, soundReady };
}
