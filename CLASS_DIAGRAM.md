# Wanderly Trip Planner - Class Diagram

This document contains UML class diagrams for the Wanderly Trip Planner database schema.

## Main Class Diagram

```mermaid
classDiagram
    %% Core User and Authentication
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +Date createdAt
        +Array~String~ trips
        +register() Boolean
        +login() String
        +updateProfile() Boolean
        +getTrips() Array
        +deleteAccount() Boolean
    }

    %% Trip Planning
    class Plan {
        +ObjectId _id
        +String userId
        +String destination
        +Number days
        +String startDate
        +String endDate
        +Number budget
        +String travelType
        +Number travelers
        +Array activities
        +Object accommodation
        +Object transportation
        +Array itinerary
        +Object costs
        +Date createdAt
        +Date updatedAt
        +Number rating
        +Boolean favorite
        +String notes
        +String aiResponse
        +Array recommendations
        +createPlan() ObjectId
        +updatePlan() Boolean
        +deletePlan() Boolean
        +ratePlan(rating) Boolean
        +toggleFavorite() Boolean
        +share() String
        +exportPDF() Blob
    }

    class Trip {
        +ObjectId _id
        +String destination
        +Number duration
        +Number travelDays
        +Object costs
        +Number total_cost_numeric
        +Date createdAt
        +save() ObjectId
        +getTripStats() Object
    }

    class SavedTrip {
        +ObjectId _id
        +String userId
        +ObjectId tripId
        +Date savedAt
        +String notes
        +Array~String~ tags
        +saveTrip() ObjectId
        +unsaveTrip() Boolean
        +getUserSavedTrips() Array
    }

    %% Sharing System
    class Share {
        +ObjectId _id
        +String shareId
        +ObjectId tripId
        +Date createdAt
        +Date expiresAt
        +String password
        +Number views
        +createShare() String
        +validateAccess(password) Boolean
        +incrementViews() Boolean
        +getComments() Array
        +isExpired() Boolean
        +deleteShare() Boolean
    }

    class Comment {
        +ObjectId _id
        +String shareId
        +String author
        +String text
        +Date createdAt
        +addComment() ObjectId
        +getComments() Array
        +deleteComment() Boolean
    }

    %% Destination Information
    class City {
        +ObjectId _id
        +String name
        +Number avgPerDay
        +Number busFare
        +Number hotelCheap
        +Number hotelModerate
        +Number hotelLuxury
        +Number foodAvg
        +Number rating
        +String attractions
        +String weather
        +String region
        +Array~String~ bestMonths
        +Array~String~ avoidMonths
        +String seasonalWarning
        +Object coordinates
        +searchByBudget(budget) Array
        +getNearby(location) Array
        +getSeasonalInfo(month) Object
        +calculateTripCost(days, type) Number
    }

    class TrendingDestination {
        +ObjectId _id
        +String name
        +String country
        +String imageUrl
        +String tripadvisorUrl
        +Date createdAt
        +addDestination() ObjectId
        +getTrending(limit) Array
        +updatePopularity() Boolean
    }

    class SeasonalEvent {
        +ObjectId _id
        +String destination
        +String month
        +String season
        +Array~String~ events
        +String highlights
        +String temperature
        +String crowds
        +String pricing
        +String recommendation
        +getByDestination(dest) Array
        +getByMonth(month) Array
        +getRecommendations() Array
    }

    %% Price & Alert System
    class Alert {
        +ObjectId _id
        +String userId
        +String email
        +String destination
        +Number budget
        +Number days
        +String travelType
        +Number currentPrice
        +Number alertThreshold
        +Number targetPrice
        +Boolean active
        +Boolean triggered
        +Date createdAt
        +Date lastChecked
        +Array notifications
        +subscribe() ObjectId
        +unsubscribe() Boolean
        +checkPriceDrops() Array
        +notify() Boolean
        +getUserAlerts() Array
    }

    class PriceHistory {
        +ObjectId _id
        +String destination
        +Date date
        +Number price
        +String currency
        +String travelType
        +Number days
        +String source
        +recordPrice() ObjectId
        +getPriceHistory(dest) Array
        +getPriceTrend() Object
    }

    class ExchangeRate {
        +ObjectId _id
        +String baseCurrency
        +Object rates
        +Date lastUpdated
        +updateRates() Boolean
        +convert(amount, from, to) Number
        +getRates() Object
    }

    %% User Activity Tracking
    class SearchHistory {
        +ObjectId _id
        +String userId
        +String searchType
        +String query
        +Object filters
        +Array results
        +Number resultCount
        +Date searchedAt
        +String source
        +saveSearch() ObjectId
        +getHistory(userId) Array
        +clearHistory(userId) Boolean
        +getRecommendations() Array
        +getPopularSearches() Array
    }

    %% Social Features
    class Testimonial {
        +ObjectId _id
        +String name
        +String text
        +String avatar
        +Number rating
        +Date createdAt
        +Number likes
        +addTestimonial() ObjectId
        +getTestimonials(limit) Array
        +likeTestimonial() Boolean
        +deleteTestimonial() Boolean
    }

    %% Caching System
    class Cache {
        +ObjectId _id
        +String cacheKey
        +String cacheType
        +Mixed data
        +Date cachedAt
        +Date expiresAt
        +set(key, data, ttl) Boolean
        +get(key) Mixed
        +invalidate(key) Boolean
        +cleanup() Number
        +isValid() Boolean
    }

    class Location {
        +ObjectId _id
        +String query
        +Array results
        +Date cachedAt
        +searchLocation() Array
        +getCached(query) Array
        +updateCache() Boolean
    }

    %% Relationships
    User "1" --> "*" Plan : creates
    User "1" --> "*" SavedTrip : saves
    User "1" --> "*" SearchHistory : performs
    User "1" --> "*" Alert : subscribes
    
    Plan "1" --> "0..1" Share : shared via
    Plan "*" --> "1" City : references
    Plan "1" --> "*" SavedTrip : saved by users
    
    Share "1" --> "*" Comment : has
    Share "*" --> "1" Plan : references
    
    City "1" --> "*" SeasonalEvent : has events
    City "1" --> "*" PriceHistory : has prices
    
    Alert "*" --> "1" City : monitors
    Alert "1" --> "*" PriceHistory : checks
    
    SearchHistory "*" --> "1" User : belongs to
    
    Cache ..> Plan : caches
    Cache ..> City : caches
    Cache ..> Location : caches
```

## Detailed Component Diagrams

### User Management Component

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +Date createdAt
        +Array trips
        +register()
        +login()
        +updateProfile()
        +deleteAccount()
    }
    
    class AuthService {
        <<service>>
        +hashPassword(pwd) String
        +verifyPassword(pwd, hash) Boolean
        +generateToken(user) String
        +verifyToken(token) Object
        +refreshToken(token) String
    }
    
    class UserRepository {
        <<repository>>
        +findByEmail(email) User
        +findById(id) User
        +create(userData) User
        +update(id, data) Boolean
        +delete(id) Boolean
    }
    
    User ..> AuthService : uses
    AuthService ..> UserRepository : accesses
```

### Trip Planning Component

```mermaid
classDiagram
    class Plan {
        +ObjectId _id
        +String userId
        +String destination
        +Number days
        +Number budget
        +Object costs
        +Array itinerary
        +createPlan()
        +updatePlan()
        +deletePlan()
    }
    
    class City {
        +ObjectId _id
        +String name
        +Number avgPerDay
        +Number hotelCheap
        +Number hotelModerate
        +calculateTripCost()
    }
    
    class AIService {
        <<service>>
        +generateItinerary(plan) Array
        +getSuggestions(dest) Array
        +optimizeBudget(plan) Object
    }
    
    class CostCalculator {
        <<service>>
        +calculateAccommodation(days, type) Number
        +calculateTransportation(type) Number
        +calculateFood(days, type) Number
        +calculateTotal(plan) Number
    }
    
    Plan --> City : references
    Plan ..> AIService : uses
    Plan ..> CostCalculator : uses
```

### Sharing & Social Component

```mermaid
classDiagram
    class Share {
        +ObjectId _id
        +String shareId
        +ObjectId tripId
        +Date expiresAt
        +Number views
        +createShare()
        +validateAccess()
        +incrementViews()
    }
    
    class Comment {
        +ObjectId _id
        +String shareId
        +String author
        +String text
        +addComment()
        +getComments()
    }
    
    class Testimonial {
        +ObjectId _id
        +String name
        +String text
        +Number rating
        +addTestimonial()
        +likeTestimonial()
    }
    
    class Plan {
        +ObjectId _id
        +String destination
        +share()
    }
    
    Share "*" --> "1" Plan : references
    Share "1" --> "*" Comment : has
    Comment --> Share : belongs to
```

### Alert & Notification Component

```mermaid
classDiagram
    class Alert {
        +ObjectId _id
        +String userId
        +String destination
        +Number currentPrice
        +Number targetPrice
        +Boolean active
        +subscribe()
        +checkPriceDrops()
        +notify()
    }
    
    class PriceHistory {
        +ObjectId _id
        +String destination
        +Date date
        +Number price
        +recordPrice()
        +getPriceHistory()
    }
    
    class NotificationService {
        <<service>>
        +sendEmail(email, message) Boolean
        +sendPush(userId, message) Boolean
        +createNotification(userId, msg) Boolean
    }
    
    class PriceChecker {
        <<service>>
        +checkDestinationPrice(dest) Number
        +compareWithHistory(dest, price) Object
        +findPriceDrops() Array
    }
    
    Alert --> PriceHistory : monitors
    Alert ..> NotificationService : uses
    Alert ..> PriceChecker : uses
```

### Cache & Performance Component

```mermaid
classDiagram
    class Cache {
        +ObjectId _id
        +String cacheKey
        +String cacheType
        +Mixed data
        +Date expiresAt
        +set()
        +get()
        +invalidate()
    }
    
    class CacheManager {
        <<service>>
        +getCached(key) Mixed
        +setCached(key, data, ttl) Boolean
        +invalidateCache(pattern) Number
        +cleanupExpired() Number
    }
    
    class AIResponseCache {
        <<specialized>>
        +getCachedResponse(query) String
        +cacheResponse(query, response) Boolean
    }
    
    class GeocodeCache {
        <<specialized>>
        +getCachedGeocode(address) Object
        +cacheGeocode(address, coords) Boolean
    }
    
    class WeatherCache {
        <<specialized>>
        +getCachedWeather(location) Object
        +cacheWeather(location, data) Boolean
    }
    
    Cache <|-- AIResponseCache
    Cache <|-- GeocodeCache
    Cache <|-- WeatherCache
    CacheManager ..> Cache : manages
```

## Data Access Layer

```mermaid
classDiagram
    class Repository {
        <<interface>>
        +findById(id) Object
        +findOne(query) Object
        +find(query) Array
        +create(data) ObjectId
        +update(id, data) Boolean
        +delete(id) Boolean
    }
    
    class UserRepository {
        +findByEmail(email) User
        +createUser(data) User
    }
    
    class PlanRepository {
        +findByUserId(userId) Array
        +searchPlans(criteria) Array
    }
    
    class CityRepository {
        +searchByBudget(budget) Array
        +findByRegion(region) Array
    }
    
    class AlertRepository {
        +getActiveAlerts() Array
        +findByUserId(userId) Array
    }
    
    class DatabaseConnection {
        <<service>>
        -cachedClient
        -cachedDb
        +connect() Connection
        +getDb() Database
        +getCollection(name) Collection
    }
    
    Repository <|.. UserRepository
    Repository <|.. PlanRepository
    Repository <|.. CityRepository
    Repository <|.. AlertRepository
    
    UserRepository ..> DatabaseConnection
    PlanRepository ..> DatabaseConnection
    CityRepository ..> DatabaseConnection
    AlertRepository ..> DatabaseConnection
```

## Service Layer Architecture

```mermaid
classDiagram
    class TripPlanningService {
        <<service>>
        +createTrip(data) Plan
        +updateTrip(id, data) Plan
        +deleteTrip(id) Boolean
        +searchTrips(criteria) Array
        +getRecommendations(userId) Array
    }
    
    class DestinationService {
        <<service>>
        +searchDestinations(query) Array
        +getByBudget(budget, days) Array
        +getNearby(location, radius) Array
        +getTrending() Array
    }
    
    class AlertService {
        <<service>>
        +createAlert(data) Alert
        +checkPriceDrops() Array
        +sendNotifications() Number
        +getUserAlerts(userId) Array
    }
    
    class ShareService {
        <<service>>
        +createShareLink(tripId) String
        +getSharedTrip(shareId) Object
        +addComment(shareId, comment) Boolean
        +validateShareAccess(shareId, pwd) Boolean
    }
    
    class SearchService {
        <<service>>
        +saveSearch(userId, data) Boolean
        +getHistory(userId) Array
        +getRecommendations(userId) Array
    }
    
    class CacheService {
        <<service>>
        +getCached(key, type) Mixed
        +setCached(key, data, type, ttl) Boolean
        +invalidate(key, type) Boolean
    }
    
    TripPlanningService ..> CacheService : uses
    DestinationService ..> CacheService : uses
    AlertService ..> CacheService : uses
```

## Enum Definitions

```mermaid
classDiagram
    class TravelType {
        <<enumeration>>
        SOLO
        COUPLE
        FAMILY
        FRIENDS
        BUSINESS
    }
    
    class SearchType {
        <<enumeration>>
        BUDGET_SEARCH
        PLANNER
        LOCATION
        DESTINATION
    }
    
    class CacheType {
        <<enumeration>>
        AI
        GEOCODE
        WEATHER
        LOCATION
        GENERAL
    }
    
    class Season {
        <<enumeration>>
        SPRING
        SUMMER
        FALL
        WINTER
    }
    
    class Region {
        <<enumeration>>
        NORTH
        SOUTH
        CENTRAL
        EAST
        WEST
    }
    
    class NotificationType {
        <<enumeration>>
        PRICE_DROP
        TRIP_REMINDER
        SUGGESTION
        SOCIAL
    }
```

## Aggregation Patterns

```mermaid
classDiagram
    class AnalyticsService {
        <<service>>
        +getTripStats() Object
        +getPopularDestinations() Array
        +getUserEngagement(userId) Object
        +getRevenueMetrics() Object
    }
    
    class TripStats {
        +Number totalTrips
        +Number totalUsers
        +Number avgBudget
        +Array topDestinations
    }
    
    class UserEngagement {
        +Number searchCount
        +Number tripsCreated
        +Number tripsSaved
        +Array recentActivity
    }
    
    class PopularDestination {
        +String name
        +Number visitCount
        +Number avgRating
        +Number avgCost
    }
    
    AnalyticsService --> TripStats : generates
    AnalyticsService --> UserEngagement : calculates
    AnalyticsService --> PopularDestination : aggregates
```

---

## Key Design Patterns Used

### 1. Repository Pattern
- Abstracts data access logic
- Provides clean interface for CRUD operations
- Used in: `UserRepository`, `PlanRepository`, `CityRepository`

### 2. Service Layer Pattern
- Encapsulates business logic
- Coordinates between repositories
- Used in: `TripPlanningService`, `AlertService`, `ShareService`

### 3. Cache-Aside Pattern
- Data loaded on-demand and cached
- Reduces database load
- Used in: `Cache`, `CacheManager`

### 4. Factory Pattern
- Creates different types of cache instances
- Used in: `CacheManager` for specialized caches

### 5. Observer Pattern
- Price alerts notify users of changes
- Used in: `Alert` system with `NotificationService`

---

## Legend

- **Solid line with arrow (-->)**: Association/Has-a relationship
- **Dashed line with arrow (..>)**: Dependency/Uses relationship  
- **Solid line with triangle (<|--)**: Inheritance/Is-a relationship
- **Cardinality**: "1" = one, "*" = many, "0..1" = zero or one

---

*Generated: January 17, 2026*
