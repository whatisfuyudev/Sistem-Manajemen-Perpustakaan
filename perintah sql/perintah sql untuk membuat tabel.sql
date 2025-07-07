-- Drop existing tables (if any) and cascade to dependent objects
DROP TABLE IF EXISTS checkouts CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop ENUM types if they exist
DROP TYPE IF EXISTS enum_users_role;
DROP TYPE IF EXISTS enum_users_accountStatus;
DROP TYPE IF EXISTS enum_reservations_status;
DROP TYPE IF EXISTS enum_notifications_channel;
DROP TYPE IF EXISTS enum_notifications_status;
DROP TYPE IF EXISTS enum_checkouts_status;

---------------------------------------------------------------------
-- Create ENUM types and tables
---------------------------------------------------------------------

-- Users: Create ENUM types for role and accountStatus
CREATE TYPE enum_users_role AS ENUM ('Admin', 'Librarian', 'Patron');
CREATE TYPE enum_users_accountStatus AS ENUM ('Active', 'Suspended', 'Pending');

-- Create the users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role enum_users_role NOT NULL DEFAULT 'Patron',
  phone VARCHAR(255),
  address VARCHAR(255),
  account_status enum_users_accountStatus NOT NULL DEFAULT 'Active',
  profile_picture VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

---------------------------------------------------------------------

-- Reservations: Create ENUM type for status
CREATE TYPE enum_reservations_status AS ENUM ('pending', 'available', 'fulfilled', 'canceled', 'expired');

-- Create the reservations table
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  book_isbn VARCHAR(255) NOT NULL,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  queue_position INTEGER NOT NULL DEFAULT 1,
  status enum_reservations_status NOT NULL DEFAULT 'pending',
  expiration_date TIMESTAMP WITH TIME ZONE,
  notes VARCHAR(75),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

---------------------------------------------------------------------

-- Notifications: Create ENUM types for channel and status
CREATE TYPE enum_notifications_channel AS ENUM ('email', 'sms');
CREATE TYPE enum_notifications_status AS ENUM ('pending', 'sent', 'failed');

-- Create the notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  channel enum_notifications_channel NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status enum_notifications_status NOT NULL DEFAULT 'pending',
  read BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

---------------------------------------------------------------------

-- 1) Ensure the enum type exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM   pg_type t
      JOIN   pg_namespace n ON n.oid = t.typnamespace
     WHERE   n.nspname = 'public'
       AND   t.typname = 'enum_checkouts_status'
  ) THEN
    CREATE TYPE public.enum_checkouts_status AS ENUM (
      'active', 'returned', 'overdue', 'lost', 'damaged'
    );
  END IF;
END
$$;

-- 2) Create the checkouts table
CREATE TABLE public.checkouts (
  id                   SERIAL PRIMARY KEY,
  user_id             INTEGER      NOT NULL,
  book_isbn           VARCHAR(255) NOT NULL,
  checkout_date       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  due_date            TIMESTAMPTZ  NOT NULL,
  return_date         TIMESTAMPTZ,
  status               public.enum_checkouts_status NOT NULL DEFAULT 'active',
  renewal_count       INTEGER      NOT NULL DEFAULT 0,
  fine                 DECIMAL(10,2) NULL DEFAULT 0.00,
  reservation_id      INTEGER,
  renewal_requested   BOOLEAN      NOT NULL DEFAULT FALSE,
  requested_renewal_days INTEGER,
  "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

---------------------------------------------------------------------

-- Books: Create the books table
CREATE TABLE books (
  isbn VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authors TEXT[] NOT NULL,
  genres TEXT[],
  publisher VARCHAR(255),
  publication_year INTEGER,
  description TEXT,
  cover_image VARCHAR(255),
  pages INTEGER NOT NULL DEFAULT 0,,
  total_copies INTEGER NOT NULL DEFAULT 0,
  available_copies INTEGER NOT NULL DEFAULT 0,
  formats TEXT[],
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


---------------------------------------------------------------------

-- create news table
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(75) NOT NULL,
  image_url TEXT,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


---------------------------------------------------------------------

-- create article table

CREATE TABLE public.articles (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(75)        NOT NULL,
  cover_image    TEXT,
  body            JSONB              NOT NULL,
  author_name     VARCHAR(125)       NOT NULL,
  reading_time   INTEGER,
  published       BOOLEAN            NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
