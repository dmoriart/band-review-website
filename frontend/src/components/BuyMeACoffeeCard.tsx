import React, { useState } from 'react';
import './BuyMeACoffeeCard.css';

const coffeeImage = 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80'; // Royalty-free coffee/music image

const BuyMeACoffeeCard: React.FC = () => {
  const [showThankYou, setShowThankYou] = useState(false);

  const handleClick = () => {
    window.open('https://buy.stripe.com/5kQ14mcr40MOat5eQO8Ra03', '_blank');
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 4000);
  };

  return (
    <div className="bmc-card feature">
      <img src={coffeeImage} alt="Buy us a coffee" className="bmc-image" />
      <div className="bmc-content">
        <h2>☕ Buy Us a Coffee!</h2>
        <p className="bmc-desc">
          <strong>Keep the Music Playing</strong><br /><br />
          Our ambition is to make it easier for new bands to get started and for music lovers to discover live gigs. If you believe in what we’re building, buy us a coffee and help energise the Irish music scene!
        </p>
        <button className="bmc-button" onClick={handleClick}>
          Buy Me a Coffee
        </button>
        {showThankYou && (
          <div className="bmc-thankyou">
            <span role="img" aria-label="Thank you">🙏</span> Thank you for your support!
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyMeACoffeeCard;
