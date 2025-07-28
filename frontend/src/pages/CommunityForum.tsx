
import React, { useState } from 'react';
import './CommunityForum.css';

const initialPosts = [
  {
    id: 1,
    title: 'Support Band Needed for Dublin Tour',
    author: 'The Mainliners',
    category: 'Gig Swap',
    content: 'Looking for a support act for our Dublin dates in September. Get in touch if interested!',
    paid: true,
  },
  {
    id: 2,
    title: 'Bassist Wanted for Indie Band',
    author: 'Cork City Sessions',
    category: 'Band Member Ads',
    content: 'We need a bassist for regular gigs in Cork. Must be reliable and love indie rock.',
    paid: true,
  },
  {
    id: 3,
    title: 'Gear Advice: Best Drum Mics?',
    author: 'DrummerDan',
    category: 'Gear Advice',
    content: 'What drum mics do you recommend for live gigs? Looking for something affordable but solid.',
    paid: false,
  },
];

const categories = [
  'Gig Swap',
  'Gear Advice',
  'Band Member Ads',
  'General',
];

const CommunityForum: React.FC = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState({
    title: '',
    author: '',
    category: categories[0],
    content: '',
    paid: false,
  });
  const [showThankYou, setShowThankYou] = useState(false);
  const [currentView, setCurrentView] = useState<'forum' | 'diagnostics'>('forum');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked;
    }
    setForm(prev => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPosts([
      {
        ...form,
        id: posts.length + 1,
      },
      ...posts,
    ]);
    setForm({ title: '', author: '', category: categories[0], content: '', paid: false });
    if (form.paid) {
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3500);
    }
  };

  return (
    <div className="forum-page">
      {currentView === 'diagnostics' ? (
        <>
          <div className="forum-header">
            <h1>Connection Diagnostics</h1>
            <p>Test backend API connectivity and system performance</p>
            <button 
              onClick={() => setCurrentView('forum')} 
              className="back-button forum-back-btn"
            >
              ← Back to Forum
            </button>
          </div>
          <div className="diagnostics-placeholder">
            <p>Diagnostic tools would be displayed here</p>
          </div>
        </>
      ) : (
        <>
          <div className="forum-header">
            <h1>🎤 Community Forum & Discussion Board</h1>
            <p>Gig swapping, gear advice, band member ads, and more. Connect with the music community!</p>
            <button 
              onClick={() => setCurrentView('diagnostics')} 
              className="diagnostic-button forum-diagnostic-btn"
            >
              🔧 Test System Connection
            </button>
          </div>

          {/* Forum Form */}
          <div className="forum-form-section">
            <h2>📝 Create New Post</h2>
            <form className="forum-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Post Title"
                  required
                />
                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Your Name or Band"
                  required
                />
              </div>
              
              <div className="form-row">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  aria-label="Select category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <label className="paid-checkbox">
                  <input
                    type="checkbox"
                    name="paid"
                    checked={form.paid}
                    onChange={handleChange}
                  />
                  Paid Listing (promoted)
                </label>
              </div>
              
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Describe your listing, question, or ad..."
                required
              />
              
              <button type="submit" className="forum-submit">
                📤 Post to Forum
              </button>
              
              {showThankYou && (
                <div className="forum-thankyou">
                  Thank you for supporting the community! 🙏
                </div>
              )}
            </form>
          </div>

          {/* Forum Posts */}
          <div className="forum-listings-section">
            <h2>💬 Recent Posts</h2>
            <div className="forum-listings">
              {posts.map(post => (
                <div key={post.id} className={`forum-post${post.paid ? ' paid' : ''}`}>
                  <div className="forum-post-header">
                    <h3 className="forum-post-title">{post.title}</h3>
                    <div className="forum-post-badges">
                      <span className="forum-post-category">{post.category}</span>
                      {post.paid && <span className="forum-paid-badge">💰 Paid</span>}
                    </div>
                  </div>
                  <div className="forum-post-author">👤 By {post.author}</div>
                  <div className="forum-post-content">{post.content}</div>
                  <div className="forum-post-actions">
                    <button className="reply-btn">💬 Reply</button>
                    <button className="contact-btn">📧 Contact</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityForum;
