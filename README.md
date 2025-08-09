# Property Search Application

A full-stack property search and discovery platform that combines modern web technologies with geographic information systems (GIS). Users can search for properties, view them on an interactive map, and discover nearby amenities in real-time.

## 🏗️ Architecture

```
Property Search App
├── Frontend (React + TypeScript + Vite)
│   ├── Interactive Leaflet Maps
│   ├── Property Search & Filtering
│   ├── Real-time Amenity Discovery
│   └── Responsive UI with Dark/Light Mode
└── Backend (Node.js + Express + TypeScript)
    ├── RESTful API
    ├── MongoDB + Mongoose ODM
    ├── Redis Caching (Optional)
    └── External API Integrations
```

## ✨ Features

### 🔍 Property Search & Discovery
- **Advanced Search**: Filter by city, price range, property type, bedrooms
- **Real-time Results**: Instant search with pagination and sorting
- **Interactive Maps**: Leaflet-based mapping with property markers and clustering
- **Property Management**: Add new properties with automatic geocoding

### 🗺️ Location-Based Services
- **Nearby Amenities**: Discover restaurants, schools, hospitals using Overpass API
- **Distance Calculations**: Travel time estimation with OpenRouteService integration
- **Geocoding**: Automatic coordinate resolution using Nominatim
- **Synchronized Views**: Property cards synchronized with map markers

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Toggle between themes
- **Smooth Animations**: Framer Motion powered interactions
- **Loading States**: Real-time feedback during searches

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local or cloud instance)
- **Redis** (optional, for caching)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/SakshamGarg16/Property-Search.git
cd Property-Search
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Required
MONGO_URI=mongodb://localhost:27017/property-search
PORT=5000

OPENTRIPMAP_API_KEY=your_opentripmap_api_key
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key

# Optional but recommended
REDIS_URL=redis://localhost:6379
```

Start the backend server:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Start the development server:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### 4. Database Setup
The application will automatically connect to MongoDB. Ensure your MongoDB instance is running and accessible via the `MONGO_URI`.

## 📋 Environment Variables

### Required Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | None (required) |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5000 |
| `REDIS_URL` | Redis connection URL | None (falls back to memory cache) |
| `OPENTRIPMAP_API_KEY` | OpenTripMap API key for amenities | None (limited functionality) |
| `OPENROUTESERVICE_API_KEY` | OpenRouteService API key for routes | None (falls back to distance estimation) |

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api/properties
```

### Endpoints

#### 1. Search Properties
```http
GET /search
```

**Query Parameters:**
- `city` (string): Filter by city name
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `propertyType` (string): Property type filter
- `minBedrooms` (number): Minimum bedrooms filter
- `sortBy` (string): Sort order (`price`, `price_desc`, `listedDate`, `listedDate_asc`)
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Results per page (default: 10, max: 100)

**Response:**
```json
{
  "results": [
    {
      "_id": "property_id",
      "title": "Modern Apartment",
      "price": 250000,
      "location": {
        "city": "Delhi",
        "state": "Delhi",
        "pincode": "110001"
      },
      "propertyType": "apartment",
      "bedrooms": 2,
      "bathrooms": 2,
      "area": 1200,
      "coordinates": {
        "lat": 28.6139,
        "lng": 77.2090
      },
      "listedDate": "2024-01-15T00:00:00.000Z",
      "status": "available"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

#### 2. Get Nearby Amenities
```http
GET /:id/nearby-amenities
```

**URL Parameters:**
- `id`: Property ID

**Query Parameters:**
- `radius` (number): Search radius in meters (default: 1000)
- `types` (string): Comma-separated amenity types (e.g., "restaurant,school,hospital")

**Response:**
```json
{
  "amenities": [
    {
      "id": 123456789,
      "name": "Local Restaurant",
      "type": "restaurant",
      "lat": 28.6140,
      "lng": 77.2091
    }
  ]
}
```

#### 3. Add New Property
```http
POST /add
```

**Request Body:**
```json
{
  "title": "Modern Apartment",
  "description": "Beautiful 2BHK apartment",
  "price": 250000,
  "location": {
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "propertyType": "apartment",
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 1200,
  "amenities": ["parking", "gym", "swimming-pool"],
  "images": ["image1.jpg", "image2.jpg"],
  "status": "available"
}
```

### Error Responses
```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `404`: Resource not found
- `500`: Internal server error

## 🏗️ Design Decisions and Trade-offs

### Technology Choices

#### Frontend Architecture
- **React + TypeScript**: Chosen for type safety, component reusability, and strong ecosystem
- **Vite**: Selected over Create React App for faster development builds and better performance
- **Leaflet**: Preferred over Google Maps for open-source licensing and OpenStreetMap integration

#### Backend Architecture
- **Express.js**: Lightweight and flexible framework with extensive middleware ecosystem
- **MongoDB**: Document-based storage ideal for property data with varying schemas
- **Mongoose**: Provides schema validation and relationship management for MongoDB

#### Mapping & Geocoding
- **OpenStreetMap + Nominatim**: Open-source alternative to paid geocoding services
- **Overpass API**: Real-time amenity data without API keys or rate limits
- **Marker Clustering**: Prevents map overcrowding with large property datasets

### Performance Optimizations
- **Redis Caching**: Optional caching layer for frequent amenity queries
- **Database Indexing**: Strategic indexes on city, propertyType, bedrooms, and listedDate
- **Pagination**: Prevents memory issues with large result sets
- **Lean Queries**: MongoDB lean() for faster data retrieval

### Trade-offs Made

#### 1. Geocoding Accuracy vs Cost
- **Decision**: Use free Nominatim instead of paid Google Geocoding API
- **Trade-off**: Slightly less accurate geocoding for zero cost
- **Mitigation**: Manual coordinate verification for critical properties

#### 2. Real-time vs Cached Amenities
- **Decision**: Real-time Overpass API calls with optional Redis caching
- **Trade-off**: Slower initial requests but always up-to-date data
- **Mitigation**: Loading states and caching for repeated queries

#### 3. Client-side vs Server-side Rendering
- **Decision**: Single Page Application (SPA) with client-side rendering
- **Trade-off**: SEO challenges but better user experience
- **Mitigation**: Could add SSR/SSG with Next.js in future

#### 4. Schema Flexibility vs Performance
- **Decision**: Document-based MongoDB over relational database
- **Trade-off**: Complex queries are harder but schema evolution is easier
- **Mitigation**: Strategic indexing and query optimization

## 🔮 Future Improvements

### Short-term Enhancements (1-3 months)
- **User Authentication**: JWT-based login/register system
- **Property Images**: Image upload with cloud storage (AWS S3/Cloudinary)
- **Advanced Filters**: Price history, property age, rating system
- **Mobile App**: React Native version for iOS/Android
- **Email Notifications**: Alerts for new properties matching criteria

### Medium-term Features (3-6 months)
- **Property Favorites**: Save and organize favorite properties
- **Comparison Tool**: Side-by-side property comparison
- **Virtual Tours**: 360° photo integration
- **Property Analytics**: Price trends and market insights
- **Agent Portal**: Property management dashboard for real estate agents

### Long-term Vision (6+ months)
- **Machine Learning**: Property price prediction and recommendation engine
- **Mortgage Calculator**: Integrated loan and EMI calculations
- **Social Features**: Reviews, ratings, and property sharing
- **Multi-language Support**: Internationalization for global markets
- **API Marketplace**: Third-party integrations (CRM, property management tools)

### Technical Improvements
- **Performance**: 
  - Implement server-side rendering with Next.js
  - Add Progressive Web App (PWA) capabilities
  - Optimize bundle size with code splitting
- **Scalability**:
  - Microservices architecture with API Gateway
  - Database sharding for large datasets
  - Container deployment with Docker/Kubernetes
- **Monitoring**:
  - Application performance monitoring (APM)
  - Error tracking with Sentry
  - Analytics dashboard for usage metrics

### Infrastructure Enhancements
- **CI/CD Pipeline**: Automated testing and deployment
- **Load Balancing**: Handle high traffic with multiple server instances
- **CDN Integration**: Faster static asset delivery
- **Backup Strategy**: Automated database backups and disaster recovery
- **Security Hardening**: Rate limiting, input sanitization, HTTPS enforcement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation above
- Review the setup instructions

---

**Built with ❤️ by [SakshamGarg16](https://github.com/SakshamGarg16)**
