import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Image, Heart, MapPin, Share2, Plus, Sparkles, Loader2, ArrowRight, Search, X, Edit3, Trash2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function CommunityFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New/Edit Post Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editPostId, setEditPostId] = useState(null); // If editing, holds the post UUID
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]); // Array of hashtags e.g. ["#hiking", "#mountains"]
  const [currentTag, setCurrentTag] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState([]); // Array of base64 strings
  const [formError, setFormError] = useState('');

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Custom Detail Modal State
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Safe LocalStorage Caching Helper
  const cachePostsSafe = (postsToCache) => {
    try {
      // Keep only last 20 posts in cache, and strip heavy photo base64 strings to save quota space
      const simplified = postsToCache.slice(0, 20).map(post => ({
        ...post,
        photo_content: null
      }));
      localStorage.setItem('xplorism_posts_cache', JSON.stringify(simplified));
    } catch (e) {
      console.warn('Failed to save posts to localStorage cache (quota limit exceeded):', e);
    }
  };

  // Fetch posts
  const fetchFeedData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const feedData = await api.get('/posts');
      if (feedData) {
        setPosts(feedData);
        cachePostsSafe(feedData);
      }
    } catch (err) {
      console.error('Error loading community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let hasCache = false;
    const cachedStr = localStorage.getItem('xplorism_posts_cache');
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (cached && cached.length > 0) {
          setPosts(cached);
          setLoading(false);
          hasCache = true;
        }
      } catch (e) {
        console.error('Failed to parse cached posts:', e);
      }
    }
    fetchFeedData(hasCache);
  }, []);

  // Handle Multiple Photos Upload Conversion to Base64
  const handlePhotosChange = (e) => {
    setFormError('');
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (uploadedPhotos.length + files.length > 5) {
      setFormError('You can upload a maximum of 5 photos.');
      return;
    }

    files.forEach(file => {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('Each image size must be less than 8MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveUploadedPhoto = (indexToRemove) => {
    setUploadedPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Convert entered tag on Space or Enter
  const handleTagKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      let val = currentTag.trim();
      if (!val) return;

      // Ensure it starts with #
      if (!val.startsWith('#')) {
        val = `#${val}`;
      }

      // Check if it's already added
      if (!tags.includes(val)) {
        setTags([...tags, val]);
      }
      setCurrentTag('');
    }
  };

  // Remove Tag Pill helper
  const handleRemoveTag = (indexToRemove) => {
    setTags(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Post Handler (Create or Edit)
  const handleCreateOrEditPost = async (e) => {
    e.preventDefault();
    setFormError('');

    // If there is still uncommitted text in currentTag, add it automatically
    let finalTags = [...tags];
    let val = currentTag.trim();
    if (val) {
      if (!val.startsWith('#')) {
        val = `#${val}`;
      }
      if (!finalTags.includes(val)) {
        finalTags.push(val);
      }
    }

    if (!title.trim() || !content.trim()) {
      setFormError('Please provide a title and share your thoughts.');
      return;
    }

    const payload = {
      title,
      content,
      tripDestination: finalTags.join(' '), // Store tags string
      photoContent: uploadedPhotos.length > 0 ? JSON.stringify(uploadedPhotos) : null
    };

    try {
      setSubmitting(true);
      if (editPostId) {
        // Edit flow
        const updatedPost = await api.put(`/posts/${editPostId}`, payload);
        const updatedPosts = posts.map(post => post.id === editPostId ? updatedPost : post);
        setPosts(updatedPosts);
        cachePostsSafe(updatedPosts);
      } else {
        // Create flow
        const newPost = await api.post('/posts', payload);
        const updatedPosts = [newPost, ...posts];
        setPosts(updatedPosts);
        cachePostsSafe(updatedPosts);
      }
      
      // Reset form & close modal
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDeleteConfirm = (post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = async (postId) => {
    try {
      try {
        await api.delete(`/posts/${postId}`);
      } catch (err) {
        // If the server returns 404 (Post not found), it means the post is already deleted on the database.
        // We can safely proceed with removing it from our local state and cache.
        if (err.message && (err.message.toLowerCase().includes('not found') || err.message.includes('404'))) {
          console.warn('Post was already deleted on the server. Cleaning up locally.');
        } else {
          throw err;
        }
      }
      const updatedPosts = posts.filter(post => post.id !== postId);
      setPosts(updatedPosts);
      cachePostsSafe(updatedPosts);
      showToast(t('toast_post_deleted') || 'Post deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast(t('toast_delete_post_fail') || 'Failed to delete post.', 'error');
    }
  };

  const handleOpenDetailModal = (post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  // Edit Post Trigger Modal
  const handleOpenEditModal = (post) => {
    setEditPostId(post.id);
    setTitle(post.title);
    setContent(post.content);
    // Parse tags array
    if (post.trip_destination) {
      setTags(post.trip_destination.split(' ').filter(Boolean));
    } else {
      setTags([]);
    }
    setUploadedPhotos(parsePhotos(post.photo_content));
    setShowFormModal(true);
  };

  // Close modal reset
  const handleCloseModal = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setCurrentTag('');
    setUploadedPhotos([]);
    setEditPostId(null);
    setFormError('');
    setShowFormModal(false);
  };

  // Like Toggle Handler
  const handleLikePost = async (postId) => {
    try {
      const updatedPost = await api.post(`/posts/${postId}/like`);
      const updatedPosts = posts.map(post => post.id === postId ? updatedPost : post);
      setPosts(updatedPosts);
      cachePostsSafe(updatedPosts);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Parse photos array from string
  const parsePhotos = (photoContentField) => {
    if (!photoContentField) return [];
    try {
      if (photoContentField.startsWith('[')) {
        return JSON.parse(photoContentField);
      }
      return [photoContentField];
    } catch (e) {
      return [photoContentField];
    }
  };

  // Filter Posts
  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      (post.trip_destination && post.trip_destination.toLowerCase().includes(searchLower)) ||
      post.username.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="community" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 py-8 space-y-8">
        
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-3xl p-8 border"
             style={{ 
               backgroundColor: 'var(--bg-secondary)', 
               borderColor: 'var(--border-primary)',
               background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(244, 63, 94, 0.03) 100%)'
             }}>
          <div className="absolute right-0 top-0 opacity-10 blur-xl pointer-events-none transform translate-x-12 -translate-y-12">
            <Users className="h-96 w-96 text-rose-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Sparkles className="h-3 w-3" />
                <span>{t('community')}</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t('community_feed')}</h1>
              <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                {t('community_subtitle')}
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditPostId(null);
                setShowFormModal(true);
              }}
              className="px-6 py-3 rounded-2xl text-white font-extrabold flex items-center justify-center space-x-2 transition shadow-lg hover:scale-105 active:scale-95 cursor-pointer self-start md:self-auto"
              style={{ backgroundColor: '#f43f5e', boxShadow: '0 8px 30px rgba(244, 63, 94, 0.25)' }}
            >
              <Plus className="h-5 w-5" />
              <span>{t('share_experience')}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_posts_placeholder')}
              className="w-full py-3.5 pl-11 pr-4 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        {/* Main Feed Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('loading_social_logs')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 border rounded-3xl p-6" 
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-base font-extrabold">{t('no_stories_title')}</h3>
            <p className="text-xs max-w-sm mx-auto mt-1 mb-6" style={{ color: 'var(--text-tertiary)' }}>
              {t('no_stories_desc')}
            </p>
            <button
              onClick={() => {
                setEditPostId(null);
                setShowFormModal(true);
              }}
              className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
            >
              {t('start_writing')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {filteredPosts.map((post) => {
              const isLikedByUser = post.liked_by?.includes(user?.id);
              const postPhotos = parsePhotos(post.photo_content);
              const isOwnPost = post.user_id === user?.id;

              return (
                <div 
                  key={post.id}
                  onClick={() => handleOpenDetailModal(post)}
                  className="rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer group"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  {/* Photo Gallery Section */}
                  {postPhotos.length > 0 && (
                    <div className="w-full relative border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      {postPhotos.length === 1 ? (
                        <div className="w-full h-52 overflow-hidden">
                          <img 
                            src={postPhotos[0]} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform hover:scale-102 duration-700" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-52 overflow-x-auto flex snap-x snap-mandatory scrollbar-thin">
                          {postPhotos.map((photo, idx) => (
                            <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                              <img 
                                src={photo} 
                                alt={`${post.title} - ${idx + 1}`} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute bottom-3 right-3 bg-black/60 text-[9px] font-black tracking-wider text-white px-2 py-0.5 rounded-full">
                                {idx + 1} / {postPhotos.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 font-black border border-rose-500/20 flex items-center justify-center text-xs tracking-wider">
                          {post.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100">{post.username}</h4>
                          <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Edit / Delete Buttons for Own Posts */}
                      {isOwnPost && (
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditModal(post)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => triggerDeleteConfirm(post)}
                            className="p-1.5 rounded-lg border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-left tracking-tight group-hover:text-rose-500 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    {/* Interactions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(post.id);
                        }}
                        className="flex items-center space-x-2 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ color: isLikedByUser ? '#f43f5e' : 'var(--text-secondary)' }}
                      >
                        <Heart className={`h-4 w-4 transition-colors ${isLikedByUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes || 0} {t('likes')}</span>
                      </button>

                      <span className="text-[9px] uppercase font-black tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Xplorism Feed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Share/Edit Modal Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-rose-500 animate-pulse" />
                <h2 className="text-base font-black uppercase tracking-wider">
                  {editPostId ? t('edit_experience') : t('share_an_experience')}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateOrEditPost} className="p-6 overflow-y-auto space-y-4 flex-1 text-left">
              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-extrabold rounded-xl">
                  {formError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('experience_title')}</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hiking the Himalayas! 🏔️"
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 transition"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Dynamic Tag Pills Box Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('hashtags')}</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-rose-500/25 transition"
                     style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center space-x-1 text-[10px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(idx)} 
                        className="hover:text-rose-700 font-extrabold transition text-[9px] shrink-0"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? t('type_tag_placeholder') : t('add_more')}
                    className="flex-1 bg-transparent border-0 outline-none p-0.5 text-xs min-w-[140px]"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Content description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('tell_story')}</label>
                <textarea 
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('tell_story_placeholder')}
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 transition resize-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Multiple Photos Upload */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('add_photos_label')}</label>
                
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2.5">
                    {uploadedPhotos.map((photo, idx) => (
                      <div key={idx} className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveUploadedPhoto(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/75 hover:bg-black/90 text-white rounded-full transition cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {uploadedPhotos.length < 5 && (
                      <label className="border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition h-16"
                             style={{ borderColor: 'var(--border-secondary)' }}>
                        <Plus className="h-4 w-4 text-slate-400" />
                        <input 
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotosChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {uploadedPhotos.length === 0 && (
                  <label className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                         style={{ borderColor: 'var(--border-secondary)' }}>
                    <Image className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('upload_trip_pictures')}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t('upload_trip_pictures_sub')}</span>
                    <input 
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t flex justify-end space-x-3" style={{ borderColor: 'var(--border-secondary)' }}>
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-white font-extrabold flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#f43f5e' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('publishing')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>{editPostId ? t('save_changes') : t('post_experience')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black">Delete Post</h3>
                <p className="text-xs text-[var(--text-secondary)] font-semibold text-center">
                  {t('confirm_delete_post') || 'Are you sure you want to delete this post?'}
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  disabled={deleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border font-extrabold transition cursor-pointer active:scale-95 text-xs disabled:opacity-50"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    if (postToDelete) {
                      setDeleting(true);
                      await confirmDeletePost(postToDelete.id);
                      setDeleting(false);
                      setIsDeleteModalOpen(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition cursor-pointer active:scale-95 text-xs shadow-md disabled:opacity-50 flex items-center justify-center space-x-1.5 min-w-[90px]"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{t('deleting') || 'Deleting...'}</span>
                    </>
                  ) : (
                    <span>{t('delete') || 'Delete'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Post Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 font-black border border-rose-500/20 flex items-center justify-center text-xs tracking-wider">
                    {selectedPost.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{selectedPost.username}</h4>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(selectedPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedPost.user_id === user?.id && (
                    <div className="flex items-center space-x-1.5 mr-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleOpenEditModal(selectedPost);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                        title={t('edit')}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          triggerDeleteConfirm(selectedPost);
                        }}
                        className="p-1.5 rounded-lg border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {/* Images */}
                {parsePhotos(selectedPost.photo_content).length > 0 && (
                  <div className="w-full rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-secondary)' }}>
                    {parsePhotos(selectedPost.photo_content).length === 1 ? (
                      <img 
                        src={parsePhotos(selectedPost.photo_content)[0]} 
                        alt={selectedPost.title} 
                        className="w-full max-h-[40vh] object-cover" 
                      />
                    ) : (
                      <div className="w-full max-h-[40vh] overflow-x-auto flex snap-x snap-mandatory scrollbar-thin">
                        {parsePhotos(selectedPost.photo_content).map((photo, idx) => (
                          <div key={idx} className="w-full shrink-0 snap-center relative">
                            <img 
                              src={photo} 
                              alt={`${selectedPost.title} - ${idx + 1}`} 
                              className="w-full max-h-[40vh] object-cover" 
                            />
                            <div className="absolute bottom-3 right-3 bg-black/60 text-[9px] font-black tracking-wider text-white px-2 py-0.5 rounded-full">
                              {idx + 1} / {parsePhotos(selectedPost.photo_content).length}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Text story */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black tracking-tight">{selectedPost.title}</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {selectedPost.content}
                  </p>

                  {/* Hashtags */}
                  {selectedPost.trip_destination && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedPost.trip_destination.split(' ').map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center text-[10px] font-extrabold bg-rose-500/5 text-rose-500 border border-rose-500/10 px-2.5 py-1 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
                <button 
                  onClick={() => {
                    handleLikePost(selectedPost.id);
                    setSelectedPost(prev => ({
                      ...prev,
                      likes: (prev.liked_by?.includes(user?.id) ? prev.likes - 1 : prev.likes + 1),
                      liked_by: prev.liked_by?.includes(user?.id)
                        ? prev.liked_by.filter(id => id !== user?.id)
                        : [...(prev.liked_by || []), user?.id]
                    }));
                  }}
                  className="flex items-center space-x-2 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ color: selectedPost.liked_by?.includes(user?.id) ? '#f43f5e' : 'var(--text-secondary)' }}
                >
                  <Heart className={`h-4.5 w-4.5 transition-colors ${selectedPost.liked_by?.includes(user?.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{selectedPost.likes || 0} {t('likes')}</span>
                </button>

                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 rounded-xl border text-xs font-bold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center space-x-2 border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--toast-bg)',
              color: toast.type === 'error' ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)',
              borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
