# Entity-Relationship Diagram

The database for the **Artisan Services Platform (Koforidua Municipality)**.
Rendered with Mermaid — viewable on GitHub or any Mermaid-compatible Markdown viewer.

```mermaid
erDiagram
    USERS ||--o| ARTISANS : "has profile (if artisan)"
    USERS ||--o{ BOOKINGS : "places (client)"
    USERS ||--o{ REVIEWS : "writes (client)"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ OTP_CODES : "owns"
    USERS ||--o{ PAYMENTS : "makes (client)"

    ARTISANS ||--o{ SERVICES : "offers"
    ARTISANS ||--o{ PORTFOLIO_IMAGES : "showcases"
    ARTISANS ||--o{ BOOKINGS : "receives"
    ARTISANS ||--o{ REVIEWS : "is rated in"

    SERVICES ||--o{ BOOKINGS : "booked as"

    BOOKINGS ||--o| REVIEWS : "can have one"
    BOOKINGS ||--o{ PAYMENTS : "is paid by"

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar phone
        varchar password
        enum role "client|artisan|admin"
        tinyint is_phone_verified
        tinyint is_active
        varchar avatar_url
        timestamp created_at
    }

    ARTISANS {
        int id PK
        int user_id FK,UK
        varchar trade
        int experience
        varchar location
        decimal latitude
        decimal longitude
        text bio
        decimal hourly_rate
        decimal rating
        int rating_count
        int jobs_completed
        enum availability "available|busy|offline"
        tinyint is_approved
        varchar whatsapp
    }

    PORTFOLIO_IMAGES {
        int id PK
        int artisan_id FK
        varchar image_url
        varchar caption
        enum kind "before|after|general"
    }

    SERVICES {
        int id PK
        int artisan_id FK
        varchar service_name
        text description
        decimal price
        tinyint is_active
    }

    BOOKINGS {
        int id PK
        int client_id FK
        int artisan_id FK
        int service_id FK
        date booking_date
        time booking_time
        text description
        varchar address
        enum status "pending|accepted|rejected|completed|cancelled"
        decimal amount
    }

    REVIEWS {
        int id PK
        int booking_id FK,UK
        int client_id FK
        int artisan_id FK
        tinyint rating "1..5"
        text comment
        tinyint is_hidden
    }

    PAYMENTS {
        int id PK
        int booking_id FK
        int client_id FK
        varchar reference UK
        decimal amount
        varchar channel
        varchar provider
        enum status "pending|success|failed"
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar title
        text message
        varchar type
        tinyint is_read
    }

    OTP_CODES {
        int id PK
        int user_id FK
        varchar code_hash
        enum purpose "phone_verify|password_reset"
        datetime expires_at
        tinyint consumed
    }
```

## Relationships at a glance

| From | To | Type | Meaning |
| --- | --- | --- | --- |
| users → artisans | 1 : 0..1 | A user with role `artisan` has exactly one artisan profile |
| users → bookings | 1 : N | A client places many bookings |
| artisans → bookings | 1 : N | An artisan receives many bookings |
| services → bookings | 1 : N | A booking may reference a service |
| bookings → reviews | 1 : 0..1 | A completed booking can have one review |
| bookings → payments | 1 : N | A booking can have payment attempts |
| artisans → services / portfolio_images | 1 : N | Profile content |
| users → notifications / otp_codes | 1 : N | Per-user records |

## Booking status lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending : client requests
    pending --> accepted : artisan accepts
    pending --> rejected : artisan rejects
    pending --> cancelled : client cancels
    accepted --> completed : artisan completes
    accepted --> cancelled : client cancels
    completed --> [*]
    rejected --> [*]
    cancelled --> [*]
```
