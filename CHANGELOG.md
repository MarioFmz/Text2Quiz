# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-10-15

### Added
- ✨ Complete Vue 3 + TypeScript + Vite project setup
- 🤖 Three AI agents for document processing and quiz generation
  - Document Processor: Extracts text from PDFs and images (OCR)
  - Quiz Generator: Creates intelligent questions with OpenAI
  - Content Analyzer: Analyzes document difficulty and suggests parameters
- 🔐 Authentication system with Supabase Auth
- 📊 Dashboard with user statistics
- 📄 Document upload with drag & drop
- 🎯 Interactive quiz interface with results
- 🗄️ Complete database schema with RLS policies
- 📝 Comprehensive documentation (README, SETUP)

### Fixed
- 🐛 Sanitize file names to remove special characters before upload
  - Removes accents and tildes
  - Replaces spaces and special chars with underscores
  - Fixes Supabase Storage 400 errors
- 🐛 Configure PDF.js worker for Vite
  - Copy worker to public/ folder
  - Add postinstall script for automatic setup
  - Fixes 404 errors when loading PDF.js worker

### Changed
- 🔧 Remove unused Anthropic SDK dependency
- 🔧 Update .env.example with correct OpenAI configuration

### Technical Details

#### Document Processing
- **PDFs**: Uses `pdf.js` for text extraction
- **Images**: Uses `tesseract.js` for OCR
- **File Naming**: Automatic sanitization for storage compatibility

#### AI Integration
- **Model**: OpenAI GPT-4o-mini
- **Questions**: Multiple choice and true/false
- **Explanations**: Detailed feedback for each answer

#### Security
- Row Level Security (RLS) on all tables
- User-specific data access
- Secure file storage with Supabase

#### Performance
- Indexed database queries
- Optimized PDF processing
- Lazy loading for routes

---

## Commits

### Initial Setup
- `b9d7459` - Initial commit: Complete implementation
- `5c62513` - docs: Add detailed setup instructions
- `deaafbd` - docs: Update README with comprehensive information
- `67b55de` - chore: Remove unused Anthropic SDK

### Bug Fixes
- `f029161` - fix: Sanitize file names before upload
- `b69e517` - fix: Configure PDF.js worker for Vite
- `96e8e8a` - chore: Add postinstall script for PDF.js worker

---

## Known Issues

None at this time.

## Future Enhancements

- [ ] Edge Functions for server-side quiz generation
- [ ] Practice mode without saving results
- [ ] Share quizzes between users
- [ ] Advanced charts with Chart.js
- [ ] Adaptive difficulty based on performance
- [ ] Document categorization
- [ ] Export statistics to PDF/CSV
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Mobile app with Capacitor
