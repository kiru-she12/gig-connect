import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, Trash2, Loader2, User, Check } from 'lucide-react';

const ProfilePicManager = ({ onUpdate }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentPic = user?.profile_pic;

  const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend';

  const getImageUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('/')) {
      return pic;
    }
    return `${backendBase}/uploads/profile_pics/${pic}`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('profile_pic', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendBase}/api/profile/upload_profile_pic.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Profile picture updated successfully!');
        updateUser({ profile_pic: data.profile_pic });
        if (onUpdate) onUpdate(data.profile_pic);
      } else {
        setError(data.error || 'Failed to upload profile picture.');
      }
    } catch (err) {
      setError('Connection error. Could not upload image.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePic = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendBase}/api/profile/upload_profile_pic.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'remove' })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Profile picture removed!');
        updateUser({ profile_pic: null });
        if (onUpdate) onUpdate(null);
      } else {
        setError(data.error || 'Failed to remove profile picture.');
      }
    } catch (err) {
      setError('Connection error. Could not remove picture.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* Avatar Display */}
        <div className="relative group shrink-0">
          {currentPic ? (
            <img
              src={getImageUrl(currentPic)}
              alt={user?.name || 'User Profile'}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-md transition-all group-hover:opacity-90"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-black text-xl shadow-md border border-emerald-500/20">
              {initials}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white backdrop-blur-2xs">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
            </div>
          )}
        </div>

        {/* Buttons and Instructions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95">
              <Camera size={14} />
              <span>{currentPic ? 'Change Photo' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>

            {currentPic && (
              <button
                type="button"
                onClick={handleRemovePic}
                disabled={loading}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Allowed: JPG, PNG, WEBP (Max 5MB). Photo updates automatically across your profile.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
          {error}
        </p>
      )}

      {success && (
        <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
          <Check size={14} /> {success}
        </p>
      )}
    </div>
  );
};

export default ProfilePicManager;
