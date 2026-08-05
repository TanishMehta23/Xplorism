import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Fetch posts
  const fetchFeedData = async () => {
    try {
      setLoading(true);
      const feedData = await api.get('/posts');
      setPosts(feedData || []);
    } catch (err) {
      console.error('Error loading community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
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
        setPosts(posts.map(post => post.id === editPostId ? updatedPost : post));
      } else {
        // Create flow
        const newPost = await api.post('/posts', payload);
        setPosts([newPost, ...posts]);
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

  // Delete Post Handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
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
      setPosts(posts.map(post => post.id === postId ? updatedPost : post));
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
                <span>Travel Community</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Explorers Social Feed</h1>
              <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                Share logs, highlight moments, and interact with co-travelers from all over the world.
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
              <span>Share Experience</span>
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
              placeholder="Search posts by tags, user, or keywords..."
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
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading social logs...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 border rounded-3xl p-6" 
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-base font-extrabold">No stories shared yet</h3>
            <p className="text-xs max-w-sm mx-auto mt-1 mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Be the first traveler to write a log and post pictures about your adventures!
            </p>
            <button
              onClick={() => {
                setEditPostId(null);
                setShowFormModal(true);
              }}
              className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
            >
              Start Writing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {filteredPosts.map((post) => {
              const isLikedByUser = post.liked_by?.includes(user?.id);
              const postPhotos = parsePhotos(post.photo_content);
              const isOwnPost = post.user_id === user?.id;

              return (
                <div 
                  key={post.id}
                  className="rounded-3xl border overflow-hidden flex flex-col transition hover:shadow-md"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  {/* Photo Gallery Section */}
                  {postPhotos.length > 0 && (
                    <div className="w-full relative border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      {postPhotos.length === 1 ? (
                        <div className="w-full h-64 overflow-hidden">
                          <img 
                            src={postPhotos[0]} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform hover:scale-102 duration-700" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 overflow-x-auto flex snap-x snap-mandatory scrollbar-thin">
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
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 font-black border border-rose-500/20 flex items-center justify-center text-xs tracking-wider">
                          {post.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{post.username}</h4>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Edit / Delete Buttons for Own Posts */}
                      {isOwnPost && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(post)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                            title="Edit Post"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="space-y-3.5 text-left flex-1">
                      <div className="space-y-1">
                        <h3 className="text-base font-black tracking-tight">{post.title}</h3>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {post.content}
                        </p>
                      </div>

                      {/* Display Hashtags */}
                      {post.trip_destination && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.trip_destination.split(' ').map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center text-[10px] font-extrabold bg-rose-500/5 text-rose-500 border border-rose-500/10 px-2 py-0.5 rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactions Footer */}
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className="flex items-center space-x-2 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ color: isLikedByUser ? '#f43f5e' : 'var(--text-secondary)' }}
                      >
                        <Heart className={`h-4.5 w-4.5 transition-colors ${isLikedByUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes || 0} Likes</span>
                      </button>

                      <span className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
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
                  {editPostId ? 'Edit Experience' : 'Share an Experience'}
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Title</label>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hashtags</label>
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
                    placeholder={tags.length === 0 ? "Type tag & press Space/Enter" : "add more..."}
                    className="flex-1 bg-transparent border-0 outline-none p-0.5 text-xs min-w-[140px]"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Content description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tell the story</label>
                <textarea 
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell us what you experienced, cost-saving tips, or highlights..."
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 transition resize-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Multiple Photos Upload */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Add Highlight Photos (Max 5)</label>
                
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
                    <Image className="h-8 w-8 text-slate-455 mb-2" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Trip Pictures</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Supports multiple images (Max 5, 8MB each)</span>
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
                  Cancel
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
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>{editPostId ? 'Save Changes' : 'Post Experience'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
