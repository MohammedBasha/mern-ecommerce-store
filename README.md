# 🛒 MERN E-commerce Store

## 📌 Overview

A full-stack MERN E-Commerce application built with modern technologies including React, Node.js, Express, MongoDB, Redis, Stripe, Zustand, Tailwind CSS, and comprehensive testing for both frontend and backend.
It includes authentication, product management, cart functionality, secure payments, and a modern interactive UI.

---

This project was built step-by-step starting from backend API development, authentication systems, payment integrations, frontend UI implementation, and finally backend/frontend testing.

Development Workflow:

Planning → Backend API → Frontend UI → Stripe Integration → Backend Testing → Frontend Testing

---

## 🚀 Tech Stack

### Frontend

- React 19
- Vite
- Zustand
- Tailwind CSS v4
- Axios
- React Router DOM
- Framer Motion
- Recharts
- Stripe JS
- React Hot Toast

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Redis + Upstash
- Stripe
- Cloudinary
- Cookie Parser

---

## Testing

### Backend Testing

- Jest

### Frontend Testing

- Vitest

---

# Main Features

## Authentication System

- User Signup
- User Login
- User Logout
- JWT Authentication
- Refresh Token System
- Protected Routes
- Admin Authorization

### Authentication Flow

- Access Token expires in 15 minutes
- Refresh Token expires in 7 days
- Refresh Tokens stored in Redis (Upstash)
- Tokens stored in HTTP-only cookies

---

## Product Management

- Create Products
- Delete Products
- Featured Products
- Product Categories
- Recommended Products
- Cloudinary Image Uploads

---

## Shopping Cart

- Add To Cart
- Remove From Cart
- Update Quantity
- Clear Cart

---

## Coupon System

- Apply Coupons
- Validate Coupons
- Expiration Handling
- Auto Disable Expired Coupons

---

## Stripe Payment Integration

- Stripe Checkout Session
- Payment Success Handling
- Order Creation
- Coupon Discounts
- Purchase Success & Cancel Pages

---

## Admin Dashboard

- Analytics Dashboard
- Revenue Charts
- Product Management
- Featured Products Management

---

# Security & Middlewares

Created custom middlewares including:

## protectRoute

Ensures authenticated users can access protected routes.

## adminRoute

Ensures only admin users can access admin routes.

---

# State Management

Managed using Zustand stores:

- useUserStore
- useCartStore
- useProductStore

---

## 💳 Features

- 🔐 User Authentication (JWT)
- 🛍️ Product Listing & Management
- 🛒 Cart & Checkout System
- 💳 Stripe Payment Integration
- ☁️ Image Upload with Cloudinary
- ⚡ Redis Caching for performance
- 📊 Dashboard & Analytics (Recharts)
- 🎨 Smooth UI Animations
