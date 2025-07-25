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
    <div className="bmc-card">
      <img src={coffeeImage} alt="Buy us a coffee" className="bmc-image" />
      <div className="bmc-content">
        <h2>☕ Buy Us a Coffee!</h2>
        <p>
          If you enjoy our music or want to support independent artists, you can buy us a coffee! Every little bit helps us keep making music and sharing it with you. Thank you for supporting the band community!
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
