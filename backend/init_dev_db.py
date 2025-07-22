#!/usr/bin/env python3
"""
Development setup script - creates SQLite database with sample data
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Band, Venue, Review, Genre
from werkzeug.security import generate_password_hash
from datetime import datetime, date
import uuid

def init_dev_database():
    """Initialize SQLite database with sample data"""
    app = create_app('development')
    
    with app.app_context():
        print("🗄️  Creating development database...")
        
        # Drop and recreate all tables
        db.drop_all()
        db.create_all()
        
        print("🌱 Seeding database with sample data...")
        
        # Create genres
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
            genre = Genre(**genre_data)
            db.session.add(genre)
        
        # Create sample venues (Irish venues from your schema)
        venues_data = [
            {
                'name': "Whelan's",
                'address': '25 Wexford Street',
                'city': 'Dublin',
                'county': 'Dublin',
                'eircode': 'D02 H527',
                'phone': '+353 1 478 0766',
                'website': 'https://www.whelans.com',
                'capacity': 300,
                'venue_type': 'live_music_venue',
                'primary_genres': ["rock", "indie", "folk"],
                'facilities': ["professional_sound", "lighting", "bar", "green_room", "merchandise_area"],
                'description': "Dublin's premier live music venue since 1989. Known for discovering new talent and hosting intimate gigs.",
                'tech_specs': {
                    'pa_system': 'L-Acoustics system with 32-channel digital mixer',
                    'mics_available': 8,
                    'lighting_rig': 'Full LED lighting system with haze machine',
                    'stage_size': '6m x 4m',
                    'backline': ['drum_kit', 'bass_amp', 'guitar_amp'],
                    'power_outlets': 6,
                    'monitor_system': '4-way monitor system',
                    'accessibility': ['ramp_access', 'accessible_toilet']
                },
                'contact_info': {
                    'booking_email': 'bookings@whelans.com',
                    'booking_phone': '+353 1 478 0766',
                    'manager_name': 'Dave Allen',
                    'preferred_contact': 'email'
                },
                'latitude': 53.3359,
                'longitude': -6.2589,
                'verified': True
            },
            {
                'name': 'The Button Factory',
                'address': 'Curved Street, Temple Bar',
                'city': 'Dublin',
                'county': 'Dublin',
                'eircode': 'D02 HN24',
                'phone': '+353 1 670 9202',
                'capacity': 450,
                'venue_type': 'club',
                'primary_genres': ["electronic", "indie", "rock"],
                'facilities': ["professional_sound", "lighting", "bar", "late_license"],
                'description': 'Intimate venue in the heart of Temple Bar, perfect for both emerging and established acts.',
                'tech_specs': {
                    'pa_system': 'Pioneer CDJ setup with full range speakers',
                    'mics_available': 4,
                    'lighting_rig': 'Club-style lighting with strobes and smoke machine',
                    'stage_size': '5m x 3m',
                    'backline': ['dj_setup', 'keyboard'],
                    'power_outlets': 8,
                    'monitor_system': 'DJ booth monitors'
                },
                'contact_info': {
                    'booking_email': 'info@buttonfactory.ie',
                    'booking_phone': '+353 1 670 9202',
                    'preferred_contact': 'email'
                },
                'latitude': 53.3448,
                'longitude': -6.2634,
                'verified': True
            },
            {
                'name': 'Cyprus Avenue',
                'address': 'Caroline Street',
                'city': 'Cork',
                'county': 'Cork',
                'phone': '+353 21 427 6165',
                'website': 'https://www.cyprusavenue.ie',
                'capacity': 200,
                'venue_type': 'live_music_venue',
                'primary_genres': ["indie", "folk", "rock"],
                'facilities': ["sound_system", "bar", "parking"],
                'description': "Cork's beloved independent music venue supporting local and touring artists.",
                'tech_specs': {
                    'pa_system': 'Yamaha digital system with 16-channel mixer',
                    'mics_available': 6,
                    'lighting_rig': 'Basic stage lighting with spots',
                    'stage_size': '4m x 3m',
                    'backline': ['drum_kit'],
                    'power_outlets': 4,
                    'monitor_system': '2-way floor monitors'
                },
                'contact_info': {
                    'booking_email': 'bookings@cyprusavenue.ie',
                    'booking_phone': '+353 21 427 6165',
                    'manager_name': 'Siobhan Murphy',
                    'preferred_contact': 'phone'
                },
                'latitude': 51.8985,
                'longitude': -8.4756,
                'verified': True
            },
            {
                'name': "Monroe's Tavern",
                'address': 'Dominick Street Upper',
                'city': 'Galway',
                'county': 'Galway',
                'phone': '+353 91 583 397',
                'capacity': 150,
                'venue_type': 'pub',
                'primary_genres': ["traditional", "folk", "rock"],
                'facilities': ["sound_system", "bar", "traditional_session_space"],
                'description': 'Historic Galway pub hosting traditional sessions and contemporary acts.',
                'tech_specs': {
                    'pa_system': 'Basic PA suitable for acoustic acts',
                    'mics_available': 3,
                    'lighting_rig': 'Ambient pub lighting',
                    'stage_size': '3m x 2m corner stage',
                    'power_outlets': 2,
                    'monitor_system': 'Single floor monitor'
                },
                'contact_info': {
                    'booking_email': 'music@monroestavern.ie',
                    'booking_phone': '+353 91 583 397',
                    'preferred_contact': 'phone'
                },
                'latitude': 53.2743,
                'longitude': -9.0568,
                'verified': True
            },
            {
                'name': "The Workman's Club",
                'address': '10 Wellington Quay',
                'city': 'Dublin',
                'county': 'Dublin',
                'eircode': 'D02 XH91',
                'phone': '+353 1 670 6692',
                'website': 'https://www.theworkmansclub.com',
                'capacity': 180,
                'venue_type': 'club',
                'primary_genres': ["indie", "electronic", "alternative"],
                'facilities': ["professional_sound", "lighting", "bar", "late_license", "roof_terrace"],
                'description': 'Multi-level venue with different spaces for intimate gigs and club nights.',
                'tech_specs': {
                    'pa_system': 'Multi-room sound system with separate DJ booth',
                    'mics_available': 5,
                    'lighting_rig': 'Full club lighting with lasers',
                    'stage_size': '4m x 3m main room',
                    'backline': ['keyboard', 'dj_setup'],
                    'power_outlets': 6,
                    'monitor_system': 'In-ear monitoring available',
                    'accessibility': ['elevator_access']
                },
                'contact_info': {
                    'booking_email': 'bookings@theworkmansclub.com',
                    'booking_phone': '+353 1 670 6692',
                    'manager_name': 'Paul Hogan',
                    'preferred_contact': 'email'
                },
                'latitude': 53.3463,
                'longitude': -6.2589,
                'verified': True
            }
        ]
        
        for venue_data in venues_data:
            venue = Venue(**venue_data)
            db.session.add(venue)
        
        # Create a sample admin user
        admin_user = User(
            email='admin@bandvenuereview.ie',
            user_type='venue',
            name='BandVenueReview.ie Admin',
            bio='Platform administrator',
            verified=True
        )
        admin_user.set_password('admin123')  # Change in production!
        db.session.add(admin_user)
        
        # Create a sample band user
        band_user = User(
            email='thestrokes@example.com',
            user_type='band',
            name='The Strokes',
            bio='Irish rock band from Dublin',
            verified=True
        )
        band_user.set_password('band123')
        db.session.add(band_user)
        
        db.session.commit()
        
        # Create band profile for the band user
        band_profile = Band(
            id=band_user.id,
            user_id=band_user.id,
            genre='Rock',
            member_count=4,
            formation_year=2020,
            location='Dublin',
            social_links={
                'facebook': 'https://facebook.com/thestrokes',
                'instagram': 'https://instagram.com/thestrokes'
            }
        )
        db.session.add(band_profile)
        db.session.commit()
        
        print("✅ Development database created successfully!")
        print(f"📊 Created:")
        print(f"   - {len(genres_data)} genres")
        print(f"   - {len(venues_data)} venues")
        print(f"   - 2 users (1 admin, 1 band)")
        print(f"   - 1 band profile")
        print("\n🔑 Test credentials:")
        print("   Admin: admin@bandvenuereview.ie / admin123")
        print("   Band: thestrokes@example.com / band123")
        
        return True

if __name__ == "__main__":
    success = init_dev_database()
    if not success:
        sys.exit(1)
    else:
        print("\n🚀 Ready to start development server!")
        print("   Run: python app.py")
