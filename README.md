# DataDetox – AI-Powered Intelligent Data Cleanup & Digital Wellness System

DataDetox is an AI-powered full-stack web application designed to optimize digital storage through intelligent file analysis, duplicate detection, predictive storage forecasting, and personalized cleanup recommendations. The system combines Artificial Intelligence, data analytics, and modern web technologies to help users organize their storage efficiently while promoting digital wellness and privacy.

Unlike traditional storage management tools, DataDetox leverages Google Gemini AI to analyze user storage behavior, identify redundant files, assess cleanup risks, and provide intelligent recommendations based on usage patterns.

## Key Features

- AI-powered storage analysis using Google Gemini
- Intelligent duplicate file detection with SHA-256 hashing
- Metadata-based similarity analysis
- Personalized cleanup recommendations with confidence scoring
- Predictive storage forecasting
- Interactive dashboard with real-time analytics
- Digital wellness monitoring
- Secure authentication and access control
- Backup management
- Real-time WebSocket communication
- Responsive and modern user interface

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React.js, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Artificial Intelligence** | Google Gemini AI |
| **Authentication** | JWT |
| **Real-Time Communication** | WebSockets |
| **Version Control** | Git & GitHub |

## System Architecture

DataDetox follows a **three-tier architecture** to ensure scalability, security, and efficient data processing.

### Tier 1 – Local Monitoring Agent (Python)

**Purpose**

Edge-level data collection and preprocessing.

**Responsibilities**

- Recursive file scanning using `os.walk()`
- SHA-256 hash generation
- Metadata extraction
- Duplicate file identification
- Secure metadata transmission

**Security**

- Only metadata is transmitted
- File contents never leave the local device
- Zero-content storage policy

### Tier 2 – Backend Intelligence Layer (Node.js, Express.js & PostgreSQL)

**Purpose**

Central processing, AI orchestration, and secure data management.

**Core Modules**

- JWT Authentication
- Duplicate Detection Engine
- Storage Forecasting
- AI Recommendation Engine
- REST APIs
- Database Management

### Tier 3 – Frontend Presentation Layer (React & TypeScript)

**Purpose**

Interactive dashboard and visualization.

**Features**

- Dashboard
- AI Analysis
- Cleanup Center
- Backup Management
- Digital Wellness
- Notifications
- Access Control
- Theme Customization

## AI Implementation

Google Gemini AI is integrated to provide intelligent storage recommendations based on metadata analysis and user behavior.

### AI Capabilities

- Duplicate Detection
- Metadata Similarity Analysis
- Intelligent Cleanup Recommendations
- Confidence Scoring
- Risk Assessment
- Predictive Storage Forecasting

## Project Workflow

1. User Authentication
2. File System Scanning
3. Metadata Extraction
4. SHA-256 Hash Generation
5. Duplicate Detection
6. AI Storage Analysis
7. Storage Forecasting
8. Cleanup Recommendation Generation
9. Dashboard Visualization
10. User Review & Cleanup Approval

## Dashboard Modules

The application consists of the following modules:

- Dashboard
- AI Analysis
- Cleanup Center
- Data Sources
- Backup Management
- Access Control
- Digital Wellness
- Notifications
- System Settings

## Research Highlights

- SHA-256 based duplicate detection
- AI-powered storage optimization
- Metadata-only analysis for enhanced privacy
- Confidence-based cleanup recommendations
- Predictive storage forecasting
- Real-time dashboard using WebSockets
- Privacy-first storage management


## Security & Privacy

DataDetox is built with security and user privacy as its highest priorities.

### Security Features

- JWT Authentication
- Secure REST APIs
- Protected User Sessions
- Role-Based Access Control
- Audit Logging

### Privacy

- Zero-content storage policy
- Only metadata is processed
- No user file contents are uploaded
- User approval required before cleanup
- Cleanup simulation before execution

## Future Enhancements

- Cloud Storage Integration (Google Drive, OneDrive, Dropbox)
- Mobile Application Development
- Automated Scheduled Cleanup
- AI-Based File Categorization
- Advanced Predictive Storage Analytics
- Email Notifications
- Multi-User Collaboration
- Intelligent File Compression
- Enhanced Behavioral Learning Models

