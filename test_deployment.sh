#!/bin/bash
# Test script for the deployed BandVenueReview.ie API

echo "🧪 Testing BandVenueReview.ie API Deployment"
echo "=========================================="

API_URL="https://band-review-website.onrender.com"

echo ""
echo "1️⃣ Testing Health Endpoint..."
echo "GET $API_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed"
    exit 1
fi

echo ""
echo "2️⃣ Testing Venues Endpoint..."
echo "GET $API_URL/api/venues"
echo ""

VENUES_RESPONSE=$(curl -s "$API_URL/api/venues")
echo "Response (first 200 chars): ${VENUES_RESPONSE:0:200}..."

if echo "$VENUES_RESPONSE" | grep -q "Whelan"; then
    echo "✅ Venues endpoint working - found Irish venues!"
else
    echo "❌ Venues endpoint failed"
    exit 1
fi

echo ""
echo "3️⃣ Testing Genres Endpoint..."
echo "GET $API_URL/api/genres"
echo ""

GENRES_RESPONSE=$(curl -s "$API_URL/api/genres")
echo "Response (first 200 chars): ${GENRES_RESPONSE:0:200}..."

if echo "$GENRES_RESPONSE" | grep -q "Rock"; then
    echo "✅ Genres endpoint working!"
else
    echo "❌ Genres endpoint failed"
    exit 1
fi

echo ""
echo "🎉 All API tests passed! Your backend is working perfectly."
echo ""
echo "📋 Next steps:"
echo "1. Update Netlify environment variable:"
echo "   REACT_APP_API_URL=$API_URL/api"
echo "2. Redeploy your Netlify frontend"
echo "3. Test the full application!"
