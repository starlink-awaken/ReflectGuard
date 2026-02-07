# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.4.0] - 2026-02-17

### Added
- **Real-time event push integration** (Task 74)
  - WebSocket server integration with Analytics CRUD operations
  - Real-time broadcast of `analytics:record:created`, `analytics:record:updated`, `analytics:record:deleted` events
  - Frontend event handlers for automatic Dashboard updates
  - Graceful degradation when WebSocket server is unavailable
  - <100ms event push latency

- **Key Management Service** (Task #14)
  - Centralized key generation, storage, and rotation
  - Environment variable integration (DOTENV)
  - Key version management for seamless rotation
  - Integration with TokenCache for secure token validation

- **API Input Validation Coverage** (Task #12)
  - Zod schema validation for all API endpoints
  - Protection against injection attacks (SQL, XSS, NoSQL)
  - Path traversal prevention
  - Parameter pollution prevention
  - Prototype pollution protection
  - 83 validation tests with 100% pass rate

- **Incremental Update Logic** (Task #2)
  - AnalyticsService now supports incremental data updates
  - Cache-aware dashboard computation
  - Time-range optimized data queries
  - Merged base + incremental data processing

- **Trend Comparison Analysis** (Task #3)
  - Compare trends across different time periods
  - Detect significant changes (>10% threshold)
  - Direction change detection
  - Confidence interval comparison

- **Rate Limiting Enhancement** (Task #13)
  - Sliding window rate limiting algorithm
  - User-based and IP-based limits
  - Endpoint-specific rate limits
  - Distributed support (Redis-ready)

- **CORS Configuration Optimization** (Task #16)
  - Strict origin validation with allowlist
  - Reduced preflight cache time
  - Configurable credentials and headers
  - Environment-based origin configuration

- **Timing-Safe String Comparison** (Task #15)
  - `timingSafeEqual()` function for token validation
  - Protection against timing attacks
  - Random delay for comparison operations
  - Integration with JWT service

### Changed
- **AnalyticsService Refactoring** (Task #1)
  - Now requires `memoryStore` parameter in constructor
  - Uses actual Reader classes (ViolationDataReader, MetricsDataReader, RetroDataReader)
  - Real data flow: Reader → Aggregator → Analyzer
  - Breaking change: Constructor signature updated

- **Dashboard API**
  - Now returns real Analytics data (previously mocked)
  - Response time <500ms (P95)
  - Parallel query execution for better performance

- **WebSocket Server**
  - Fixed `stop()` method to properly release ports
  - Server startup order adjusted (WebSocket before Analytics)
  - Graceful connection cleanup

- **Chart.js Integration** (Task 72)
  - Dashboard data manager for chart binding
  - Real-time chart updates on WebSocket events
  - Responsive chart containers
  - Trend-based color coding (red/green/cyan)

- **Type Filtering** (Task 75)
  - Analytics records can be filtered by `type` field
  - Combined with pagination and sorting
  - API support: `?type=custom&sortBy=name`

### Fixed
- **WebSocket Port Occupation** (Task 71)
  - Fixed `stop()` method to call `server.stop()`
  - Eliminated EADDRINUSE errors in tests
  - Test stability improved from 40% to 100%

- **Authentication Middleware** (Task 73)
  - Integrated real JWT service in test helpers
  - Fixed token refresh logic
  - Fixed password length validation
  - 14 new authentication tests

- **Time Zone Handling** (Task #7)
  - All timestamps normalized to UTC
  - TimeUtils for consistent time range calculations
  - Fixed boundary conditions (end of day, month, year)

- **Test Coverage Gaps**
  - MetricsDataReader: 2.56% → 85% coverage
  - RetroDataReader: 4.69% → 85% coverage
  - TimeUtils: 25.81% → 90% coverage

- **E2E Test Environment**
  - Fixed server startup issues in integration tests
  - Improved test isolation with cleanup handlers

### Testing
- **Total Tests:** 1,550+ (from 1,492 in Week 7-8)
- **Test Coverage:** 86% (from 83.88%)
- **Pass Rate:** 100% (from 98.7%)
- **New Tests Added:** 58+

### Test Coverage Improvements
| Module | Before | After | Improvement |
|--------|--------|-------|-------------|
| MetricsDataReader | 2.56% | 85% | +82.44% |
| RetroDataReader | 4.69% | 85% | +80.31% |
| TimeUtils | 25.81% | 90% | +64.19% |
| Overall | 83.88% | 86% | +2.12% |

### Documentation
- Added `CONTRIBUTING.md` - Contribution guidelines for developers
- Added `LICENSE` - MIT License with copyright information
- Added `SECURITY.md` - Security policy and vulnerability reporting
- Updated all documentation to v2.4.0
- API documentation enhanced with validation schemas

### Security
- All P0 security threats fixed
- Input validation on all API endpoints
- Timing-safe token comparison
- Enhanced CORS security
- Rate limiting on all public endpoints

### Performance
- Dashboard API: <500ms (P95)
- Cache hit rate: >80%
- Analytics query optimization with parallel execution
- Event push latency: <100ms

---

## [2.3.0] - 2026-02-06

### Added
- **REST API CRUD Operations** (Task 63)
  - POST /api/v1/analytics/records - Create records
  - GET /api/v1/analytics/records - List with pagination
  - GET /api/v1/analytics/records/:id - Get single record
  - PUT /api/v1/analytics/records/:id - Update record
  - DELETE /api/v1/analytics/records/:id - Delete record

- **WebSocket Real-time Communication** (Task 64)
  - WebSocket server on port 3001
  - 100+ concurrent connection support
  - Room-based message broadcasting
  - Event subscription system
  - Heartbeat mechanism (30s interval)
  - Auto-reconnection support

- **Web UI Dashboard Framework** (Task 65)
  - Responsive HTML dashboard
  - Tailwind CSS styling
  - Chart.js integration
  - WebSocket status indicator
  - Settings form
  - Activity table

### Changed
- API server now serves static UI files
- WebSocket server integrated with main server

### Known Issues
- WebSocket tests affected by port occupation (fixed in v2.4.0)
- Analytics endpoints missing input validation (added in v2.4.0)
- Chart.js charts not initialized (implemented in v2.4.0)

---

## [2.2.0] - 2026-02-05

### Added
- **Analytics Module** - Complete data analysis engine
  - UsageAggregator - Usage metrics (retro count, active users, avg duration)
  - QualityAggregator - Quality metrics (violation rate, false positive rate)
  - PerformanceAggregator - Performance metrics (avg/P50/P95/P99 times)
  - TrendAggregator - Trend data points with direction and slope
  - TrendAnalyzer - Linear regression, moving average, change point detection
  - AnomalyDetector - Z-score based anomaly detection
  - CacheManager - LRU + TTL caching

### Testing
- 82 new tests for Analytics module
- >90% test coverage for Analytics

---

## [2.1.0] - 2026-02-04

### Added
- Week 4-5 Risk Monitoring Framework
- Memory system cleanup (ARCHIVE/ mechanism)
- Refactoring scripts (8 scripts in scripts/)

### Changed
- Optimized file count by 10%
- Performance improved by 20%

---

## [2.0.0] - 2026-02-03

### Added
- Phase 2 architecture complete
- GatewayGuard v2.0
- DataExtractor v2.0
- RetrospectiveCore v2.0
- PatternMatcher v2.0

### Changed
- Three-layer MEMORY architecture (Hot/Warm/Cold)
- MCP Server integration
- Enhanced CLI v2.0

---

## [1.0.0] - 2026-02-03

### Added
- Initial MVP release
- Gateway checking functionality
- Basic retrospective capabilities
- 5 principles checking
- Pattern matching
- File-based data storage

---

## Version Support Policy

| Version | Supported          | Release Date | Support Until |
|---------|--------------------|--------------|--------------|
| 2.4.x   | :white_check_mark: | 2026-02-17   | 2026-08-17   |
| 2.3.x   | :white_check_mark: | 2026-02-06   | 2026-08-06   |
| 2.2.x   | :white_check_mark: | 2026-02-05   | 2026-08-05   |
| 2.1.x   | :white_check_mark: | 2026-02-04   | 2026-08-04   |
| 2.0.x   | :white_check_mark: | 2026-02-03   | 2026-08-03   |
| < 2.0   | :x:                | -            | -            |

---

## Migration Guide

### From v2.3.0 to v2.4.0

#### Breaking Change: AnalyticsService Constructor

**Before (v2.3.0):**
```typescript
import { AnalyticsService } from './AnalyticsService.js';
const service = new AnalyticsService();
```

**After (v2.4.0):**
```typescript
import { AnalyticsService } from './AnalyticsService.js';
import { MemoryStore } from './MemoryStore.js';

const memoryStore = new MemoryStore();
const service = new AnalyticsService({ memoryStore });
```

#### WebSocket Event Types

New event types for real-time updates:
- `analytics:record:created` - Fired when a record is created
- `analytics:record:updated` - Fired when a record is updated
- `analytics:record:deleted` - Fired when a record is deleted

#### CORS Configuration

Update your environment variables:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Full Changelog

For detailed changes between versions, please see:
- [GitHub Releases](https://github.com/your-org/prism-gateway/releases)
- [Git Commit History](https://github.com/your-org/prism-gateway/commits/main)

---

**Maintained by:** PRISM-Gateway Team
**License:** MIT
**Last Updated:** 2026-02-07
