
import React, { useState } from 'react';
import './CommunityForum.css';

// Navigation pane (copied and adapted from App.tsx)
const NavigationPane = ({ onNavigate, currentView }: { onNavigate: (view: string) => void, currentView: string }) => (
  <nav className="navigation" style={{ marginBottom: '2rem' }}>
    <div className="nav-brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
      🎵 BandVenueReview.ie
    </div>
    <div className="nav-links desktop-nav">
      <button className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => onNavigate('home')}>Home</button>
      <button className={`nav-link ${currentView === 'venues' ? 'active' : ''}`} onClick={() => onNavigate('venues')}>Venues</button>
      <button className={`nav-link ${currentView === 'studios' ? 'active' : ''}`} onClick={() => onNavigate('studios')}>Studios</button>
      <button className={`nav-link ${currentView === 'bands' ? 'active' : ''}`} onClick={() => onNavigate('bands')}>Bands</button>
      <button className={`nav-link ${currentView === 'gigs' ? 'active' : ''}`} onClick={() => onNavigate('gigs')}>🎵 Gigs</button>
      <button className={`nav-link ${currentView === 'features' ? 'active' : ''}`} onClick={() => onNavigate('features')}>💡 Features</button>
      <button className={`nav-link ${currentView === 'forum' ? 'active' : ''}`} onClick={() => onNavigate('forum')}>💬 Forum</button>
    </div>
  </nav>
);

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
  const [currentView, setCurrentView] = useState('forum');

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

  // Navigation handler
  const handleNavigate = (view: string) => {
    // If you want to actually route, you can use react-router here
    setCurrentView(view);
    // Optionally, you could window.location or use a router
    if (view !== 'forum') {
      window.location.href = '/'; // fallback: go to home for other views
    }
  };

  return (
    <div className="forum-page">
      <NavigationPane onNavigate={handleNavigate} currentView={currentView} />
      <h1>🎤 Community Forum & Discussion Board</h1>
      <p className="forum-desc">
        Gig swapping, gear advice, band member ads, and more. Bands can pay to post listings (e.g., "Support band needed for tour," "Sound engineer wanted," "Bassist wanted").
      </p>
      <form className="forum-form" onSubmit={handleSubmit}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Listing Title"
          required
        />
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          placeholder="Your Name or Band"
          required
        />
        <label htmlFor="category-select" className="forum-label">
          Category
        </label>
        <select
          id="category-select"
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Describe your listing, question, or ad..."
          required
        />
        <label className="paid-label">
          <input
            type="checkbox"
            name="paid"
            checked={form.paid}
            onChange={handleChange}
          />
          Paid Listing (promoted)
        </label>
        <button type="submit" className="forum-submit">Post Listing</button>
        {showThankYou && (
          <div className="forum-thankyou">Thank you for supporting the community! 🙏</div>
        )}
      </form>
      <div className="forum-listings">
        {posts.map(post => (
          <div key={post.id} className={`forum-post${post.paid ? ' paid' : ''}`}>
            <div className="forum-post-header">
              <span className="forum-post-title">{post.title}</span>
              <span className="forum-post-category">{post.category}</span>
              {post.paid && <span className="forum-paid-badge">Paid</span>}
            </div>
            <div className="forum-post-author">By {post.author}</div>
            <div className="forum-post-content">{post.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityForum;
