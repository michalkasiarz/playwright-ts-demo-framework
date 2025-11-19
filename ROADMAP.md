# Roadmap: Demo Shop Showcase (TypeScript + Playwright)

## Project Goal

Showcase a modern TypeScript + Playwright stack. Focus on testing authentication, payments, API, events, reporting. Integrate RabbitMQ (event-driven), GraphQL, and design patterns in tests.

---

## Roadmap Phases

### Phase 1: Core Application

- Backend REST API (Express + TypeScript + MongoDB)
- Frontend SPA (TypeScript)
- Docker Compose setup
- Authentication: JWT, TOTP, Google OAuth
- Data seeding

### Phase 2: RabbitMQ (Event-Driven Architecture)

- Integrate RabbitMQ for order processing (OrderCreated, OrderShipped)
- Worker for event handling (shipping, notifications)

### Phase 3: GraphQL API

- Add GraphQL endpoint (Apollo Server)
- Fetch nested data (user + orders + cart)

### Phase 4: Payment Simulation

- Add endpoint `/api/payments/mock` (e.g., Stripe/FakePay)
- Simulate payment: status "pending", "success", "failed"

### Phase 6: Playwright E2E & API Tests

### Phase 7: Security & Compliance

- Implement security features: rate limiting, CSRF protection, input validation, secure headers, audit logging
- RBAC (Role-Based Access Control) and permission matrix
- Automated security tests:
  - Playwright + OWASP ZAP integration
  - Test for XSS (Cross-Site Scripting): inject scripts, validate output escaping
  - Test for SQL Injection: send malicious payloads, verify backend protection
  - Authentication bypass: attempt login with invalid credentials, session hijacking
  - Privilege escalation: test access to restricted endpoints with lower roles
  - CSRF: simulate cross-site requests, validate token enforcement
  - Security regression: ensure fixes remain effective over time

### Phase 8: Performance & Load Testing

- Integrate k6 or Artillery for load and performance tests
- Simulate high user load, concurrent purchases, API stress
- Monitor response times, error rates, system bottlenecks

### Phase 9: Microservices (optional)

- Split backend into services: Order, User, Notification, Payment
- Communication via RabbitMQ
- API Gateway (REST/GraphQL)

### Phase 10: CI/CD & Quality Gates

- GitHub Actions or GitLab CI for build, test, lint, security scan, deploy
- Automated test reporting: Allure, Playwright HTML, code coverage
- Security and performance gates before deploy

### Phase 11: Documentation & Knowledge Sharing

Engineering practices: The project applies key design patterns (Singleton, Builder, Facade, Strategy, Observer) to improve maintainability, scalability, and testability. These patterns are documented in the architecture and code comments.

### Application Features to Test

- RBAC (Role-Based Access Control) and permission matrix
- Audit log and event sourcing
- Real payment gateway integration (Stripe sandbox)
- Notification system (email, SMS, WebSocket)
- Data export/import (CSV, Excel)
- Error handling and fallback logic
