import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import { getStore, saveStore, readImage } from '../../services/storeService';
import './StoreSettings.css';
import StoreHoursStatus from '../../components/portal/StoreHoursStatus';
import { FiLayout, FiClock, FiCreditCard, FiEye, FiSave } from 'react-icons/fi';

export default function StoreSettings() {
  const [store, setStore] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');
  const saveHours = async () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(store.openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(store.closingTime) || store.openingTime >= store.closingTime) {
      setHoursMessage('Choose valid hours with closing time after opening time.');
      return;
    }
    setBusy(true);
    setHoursMessage('');
    try {
      const saved = await saveStore({ openingTime: store.openingTime, closingTime: store.closingTime, closedDays: store.closedDays || [], closed: store.closed });
      setStore(current => ({ ...current, isOpen: saved.isOpen }));
      setHoursMessage('Store hours saved. The portal will use this schedule.');
    } catch (error) { setHoursMessage(error.message); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    getStore().then(setStore).catch(e => setMessage(e.message));
  }, []);
  const change = (key, value) => setStore(s => ({ ...s, [key]: value }));
  const upload = async (key, file) => { try { change(key, await readImage(file)); setMessage('Image ready. Save changes to publish it.'); } catch (e) { setMessage(e.message); } };
  const save = async e => { e.preventDefault(); setBusy(true); setMessage(''); try { setStore(await saveStore(Object.fromEntries(['title', 'subtitle', 'announcement', 'coverImage', 'gcashQr', 'openingTime', 'closingTime', 'closedDays', 'closed'].map(key => [key, store[key]])))); setMessage('Store settings saved.'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  return <AdminNav title="Portal settings">
    <div className="store-settings-intro"><p>Shape your storefront and set your ordering schedule.</p><a href="/portal" target="_blank" rel="noreferrer"><FiEye aria-hidden="true" /> View portal</a></div>
    {message && <p className="store-settings-message" role="status">{message}</p>}
    {!store ? <p>Loading store settings…</p> : <form className="store-settings" onSubmit={save}><fieldset disabled={busy}>
      <div className="settings-save-bar"><div><strong>Store settings</strong><p>Save to publish your portal settings.</p></div><button className="primary-btn" type="submit"><FiSave aria-hidden="true" />{busy ? 'Saving…' : 'Save changes'}</button></div>
      <div className="store-settings-grid">
      <section className="store-appearance"><div className="settings-section-heading"><span><FiLayout aria-hidden="true" /></span><div><h2>Portal appearance</h2><p>A warm welcome starts here.</p></div></div>
        <label>Title<input maxLength={160} value={store.title} onChange={e => change('title', e.target.value)} /></label>
        <label>Subtitle<input maxLength={300} value={store.subtitle} onChange={e => change('subtitle', e.target.value)} /></label>
        <label>Announcement<textarea maxLength={500} value={store.announcement} onChange={e => change('announcement', e.target.value)} /></label>
        <label>Cover photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => upload('coverImage', e.target.files[0])} /></label>
        {store.coverImage && <><img className="store-cover-preview" src={store.coverImage} alt="Portal cover preview" /><button type="button" onClick={() => change('coverImage', '')}>Remove cover</button></>}
        <div className="store-live-preview" aria-label="Portal appearance preview" style={store.coverImage ? { backgroundImage: `linear-gradient(90deg, #f3f6efed, #f3f6efd9), url(${store.coverImage})` } : undefined}>
          <span className="settings-eyebrow"><FiEye aria-hidden="true" /> Live preview</span>
          <h3>{store.title || 'Your Alimento favorites, delivered.'}</h3>
          <p>{store.subtitle || 'Browse the menu and pay with GCash.'}</p>
          {store.announcement && <div className="preview-announcement">{store.announcement}</div>}
        </div>
      </section>
      <section className="store-hours"><div className="settings-section-heading"><span><FiClock aria-hidden="true" /></span><div><h2>Store hours</h2><p>Set when customers can order.</p></div></div><p>Philippine time (Asia/Manila). Portal ordering stops at closing time.</p>
        <div className="settings-time-grid">
        <label>Opening time<input type="time" required value={store.openingTime} onChange={e => change('openingTime', e.target.value)} /></label>
        <label>Closing time<input type="time" required value={store.closingTime} onChange={e => change('closingTime', e.target.value)} /></label>
        </div>
        <p className="settings-field-title">Closed days</p><div className="settings-days">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <label key={day}><input type="checkbox" checked={(store.closedDays || []).includes(index)} onChange={e => change('closedDays', e.target.checked ? [...(store.closedDays || []), index] : store.closedDays.filter(d => d !== index))} /> {day}</label>)}</div>
        <label className="settings-toggle"><input type="checkbox" checked={store.closed} onChange={e => change('closed', e.target.checked)} /> Temporarily close online ordering</label>
        <p>Checked days are closed. Uncheck Sunday to accept Sunday orders during the hours above, then save store hours. Turn off temporary closure to resume scheduled ordering.</p>
        <StoreHoursStatus store={store} draft />
        <button type="button" onClick={saveHours}><FiSave aria-hidden="true" />{busy ? 'Saving…' : 'Save store hours'}</button>
        {hoursMessage && <p role="status">{hoursMessage}</p>}
      </section>
      <section className="store-payment"><div className="settings-section-heading"><span><FiCreditCard aria-hidden="true" /></span><div><h2>GCash payment QR</h2><p>Make checkout easier for your customers.</p></div></div><p>Upload the store’s original payment QR image. Customers can download it and must upload their payment receipt. Staff verify payment separately.</p>
        <label>Payment QR image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => upload('gcashQr', e.target.files[0])} /></label>
        {store.gcashQr && <img className="store-qr-preview" src={store.gcashQr} alt="GCash payment QR preview" />}
      </section>
      </div>
    </fieldset></form>}
  </AdminNav>;
}
