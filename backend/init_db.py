"""
BandVenueReview.ie - Database Initialization
Script to create database tables and seed with initial data
"""

import os
import sys
from datetime import datetime, date

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Band, Venue, Review, Genre

def init_database():
    """Initialize database with tables and sample data"""
    app = create_app('development')
    
    with app.app_context():
        print("🗄️  Creating database tables...")
        db.create_all()
        
        print("🌱 Seeding database with sample data...")
        
        # Create sample genres
        genres_data = [
            {'name': 'Rock', 'description': 'Rock music including classic rock, hard rock, and alternative'},
            {'name': 'Folk', 'description': 'Traditional and contemporary folk music'},
            {'name': 'Indie', 'description': 'Independent music across various sub-genres'},
            {'name': 'Electronic', 'description': 'Electronic music including techno, house, and ambient'},
            {'name': 'Traditional', 'description': 'Traditional Irish music and Celtic sounds'},
            {'name': 'Jazz', 'description': 'Jazz and blues music'},
            {'name': 'Pop', 'description': 'Popular music and mainstream hits'},
            {'name': 'Punk', 'description': 'Punk rock and hardcore music'},
            {'name': 'Metal', 'description': 'Heavy metal and its sub-genres'},
            {'name': 'Country', 'description': 'Country and western music'}
        ]
        
        for genre_data in genres_data:
            existing = Genre.query.filter_by(name=genre_data['name']).first()
            if not existing:
                genre = Genre(**genre_data)
                db.session.add(genre)
        
        # Create sample venues
        venues_data = [
            {
                'name': "Whelan's",
                'address': "25 Wexford Street",
                'city': "Dublin",
                'county': "Dublin",
                'eircode': "D02 H527",
                'phone': "+353 1 478 0766",
                'website': "https://www.whelans.com",
                'capacity': 300,
                'venue_type': "live_music_venue",
                'primary_genres': ["rock", "indie", "folk"],
                'facilities': ["professional_sound", "lighting", "bar", "green_room", "merchandise_area"],
                'description': "Dublin's premier live music venue since 1989. Known for discovering new talent and hosting intimate gigs."
            },
            {
                'name': "The Button Factory",
                'address': "Curved Street, Temple Bar",
                'city': "Dublin",
                'county': "Dublin",
                'eircode': "D02 HN24",
                'phone': "+353 1 670 9202",
                'capacity': 450,
                'venue_type': "club",
                'primary_genres': ["electronic", "indie", "rock"],
                'facilities': ["professional_sound", "lighting", "bar", "late_license"],
                'description': "Intimate venue in the heart of Temple Bar, perfect for both emerging and established acts."
            },
            {
                'name': "Cyprus Avenue",
                'address': "Caroline Street",
                'city': "Cork",
                'county': "Cork",
                'phone': "+353 21 427 6165",
                'website': "https://www.cyprusavenue.ie",
                'capacity': 200,
                'venue_type': "live_music_venue",
                'primary_genres': ["indie", "folk", "rock"],
                'facilities': ["sound_system", "bar", "parking"],
                'description': "Cork's beloved independent music venue supporting local and touring artists."
            },
            {
                'name': "Monroe's Tavern",
                'address': "Dominick Street Upper",
                'city': "Galway",
                'county': "Galway",
                'phone': "+353 91 583 397",
                'capacity': 150,
                'venue_type': "pub",
                'primary_genres': ["traditional", "folk", "rock"],
                'facilities': ["sound_system", "bar", "traditional_session_space"],
                'description': "Historic Galway pub hosting traditional sessions and contemporary acts."
            },
            {
                'name': "The Workman's Club",
                'address': "10 Wellington Quay",
                'city': "Dublin",
                'county': "Dublin",
                'eircode': "D02 XH91",
                'phone': "+353 1 670 6692",
                'website': "https://www.theworkmansclub.com",
                'capacity': 180,
                'venue_type': "club",
                'primary_genres': ["indie", "electronic", "alternative"],
                'facilities': ["professional_sound", "lighting", "bar", "late_license", "roof_terrace"],
                'description': "Multi-level venue with different spaces for intimate gigs and club nights."
            }
        ]
        
        for venue_data in venues_data:
            existing = Venue.query.filter_by(name=venue_data['name']).first()
            if not existing:
                venue = Venue(**venue_data)
                db.session.add(venue)
        
        # Create sample users and bands
        bands_data = [
            {
                'user': {
                    'email': 'info@thestrypes.ie',
                    'name': 'The Strypes',
                    'user_type': 'band',
                    'bio': 'Irish rock band from Cavan formed in 2011',
                    'website': 'https://www.thestrypes.com'
                },
                'band': {
                    'genre': 'Rock',
                    'member_count': 4,
                    'formation_year': 2011,
                    'location': 'Cavan',
                    'social_links': {
                        'facebook': 'https://facebook.com/thestrypes',
                        'twitter': 'https://twitter.com/thestrypes'
                    }
                }
            },
            {
                'user': {
                    'email': 'contact@lisahannigan.ie',
                    'name': 'Lisa Hannigan',
                    'user_type': 'band',
                    'bio': 'Irish singer-songwriter known for her ethereal vocals',
                    'website': 'https://www.lisahannigan.ie'
                },
                'band': {
                    'genre': 'Folk',
                    'member_count': 1,
                    'formation_year': 2007,
                    'location': 'Dublin',
                    'social_links': {
                        'instagram': 'https://instagram.com/lisahannigan'
                    }
                }
            },
            {
                'user': {
                    'email': 'hello@villagers.ie',
                    'name': 'Villagers',
                    'user_type': 'band',
                    'bio': 'Indie folk project led by Conor O\'Brien',
                    'website': 'https://www.villagers.ie'
                },
                'band': {
                    'genre': 'Indie',
                    'member_count': 5,
                    'formation_year': 2008,
                    'location': 'Dublin',
                    'social_links': {
                        'spotify': 'https://open.spotify.com/artist/villagers'
                    }
                }
            }
        ]
        
        created_bands = []
        for band_data in bands_data:
            existing = User.query.filter_by(email=band_data['user']['email']).first()
            if not existing:
                # Create user
                user = User(**band_data['user'])
                user.set_password('password123')  # Default password for demo
                db.session.add(user)
                db.session.flush()  # Get the user ID
                
                # Create band profile
                band_info = band_data['band'].copy()
                band_info['id'] = user.id
                band_info['user_id'] = user.id
                band = Band(**band_info)
                db.session.add(band)
                created_bands.append(band)
        
        db.session.commit()
        
        # Create sample reviews
        venues = Venue.query.all()
        bands = Band.query.all()
        
        if venues and bands:
            reviews_data = [
                {
                    'band_id': bands[0].id,
                    'venue_id': venues[0].id,
                    'performance_date': date(2024, 6, 15),
                    'event_name': 'Summer Sessions',
                    'audience_size': 'packed',
                    'sound_quality': 5,
                    'hospitality': 4,
                    'payment_promptness': 5,
                    'crowd_engagement': 5,
                    'facilities_rating': 4,
                    'overall_rating': 5,
                    'title': 'Incredible night at an iconic venue',
                    'review_text': 'Whelan\'s lived up to its reputation. The sound was crystal clear, the staff were incredibly helpful, and the crowd was absolutely electric. Payment was sorted immediately after the show. The green room facilities were great for prep.',
                    'pros': 'Amazing sound system, professional staff, great atmosphere',
                    'cons': 'Parking can be tricky in the area',
                    'would_return': True,
                    'recommended_for': ['emerging_bands', 'established_acts']
                },
                {
                    'band_id': bands[1].id,
                    'venue_id': venues[2].id,
                    'performance_date': date(2024, 5, 20),
                    'event_name': 'Intimate Evening',
                    'audience_size': 'half_full',
                    'sound_quality': 4,
                    'hospitality': 5,
                    'payment_promptness': 4,
                    'crowd_engagement': 4,
                    'facilities_rating': 4,
                    'overall_rating': 4,
                    'title': 'Perfect venue for intimate performances',
                    'review_text': 'Cyprus Avenue provided exactly what we needed for an intimate acoustic set. The sound engineer was fantastic and really understood our needs. Cork audiences are always special.',
                    'pros': 'Excellent sound engineer, intimate setting, supportive local crowd',
                    'cons': 'Limited merchandise space',
                    'would_return': True,
                    'recommended_for': ['folk_artists', 'acoustic_acts']
                }
            ]
            
            for review_data in reviews_data:
                review = Review(**review_data)
                db.session.add(review)
            
            # Update venue ratings
            for venue in venues:
                venue.update_rating()
            
            db.session.commit()
        
        print("✅ Database initialization complete!")
        print(f"📊 Created {Genre.query.count()} genres")
        print(f"🏛️  Created {Venue.query.count()} venues")
        print(f"🎵 Created {Band.query.count()} bands")
        print(f"⭐ Created {Review.query.count()} reviews")

if __name__ == '__main__':
    init_database()
