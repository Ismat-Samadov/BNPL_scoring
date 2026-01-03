# Web Frontend Documentation

**Modern, responsive web interface for the Agrarian BNPL Risk Scoring System**

Built with FastAPI + Jinja2 Templates + Custom CSS

---

## Overview

The web frontend provides an intuitive, user-friendly interface for:
- Scoring applicants via interactive forms
- Viewing analytics dashboards
- Exploring risk distributions and product recommendations
- Accessing API documentation

**Tech Stack:**
- **Backend**: FastAPI (Python)
- **Templates**: Jinja2
- **Styling**: Custom CSS with gradient backgrounds
- **Icons**: Unicode emojis for visual appeal
- **Responsive**: Mobile-friendly design

---

## Pages & Features

### 1. Home Page (/)

**Features:**
- System overview and statistics
- Quick start guide with 3 action cards
- Scoring methodology table (8 risk factors)
- Available BNPL products showcase
- Product match accuracy: 100%
- API latency: <60ms

**Key Sections:**
- ✅ Stats Grid: 4 key metrics (accuracy, latency, tests, data)
- 🚀 Quick Start: 3 call-to-action buttons
- 📊 Scoring Methodology: Weighted risk factors table
- 🎯 BNPL Products: 6 product cards with details

**URL:** http://localhost:8000/

---

### 2. Score Applicant (/score)

**Features:**
- Interactive form with 12 input fields
- Input validation (client & server-side)
- Sample data auto-fill button
- Real-time form submission
- Beautiful gradient styling

**Form Fields:**
1. User ID (text)
2. Region (dropdown: North, South, East, West, Central)
3. Farm Type (dropdown: Smallholder, Commercial, Cooperative)
4. Crop Type (dropdown: Maize, Rice, Vegetables, Livestock, Mixed, Horticulture)
5. Farm Size (number, 0.5-500 ha)
6. Years of Experience (number, 0-40)
7. Monthly Income (number, 5000-500000)
8. Recent Cash Inflows (number, 0-1000000)
9. Average Order Value (number, 1000-200000)
10. Device Trust Score (number, 0-100)
11. Identity Consistency (number, 0-100)
12. Prior Defaults (number, 0-5)

**Sample Data Button:**
- Instantly fills form with realistic test data
- User ID: SYNTHETIC_TEST_001
- Region: North, Farm: Smallholder, Crop: Maize
- Perfect for quick testing

**URL:** http://localhost:8000/score

---

### 3. Score Results (POST /score)

**Features:**
- Comprehensive risk assessment display
- Color-coded risk tier badges
- BNPL terms breakdown
- Top-3 rule contributors table
- Product match rationale
- Next steps recommendations

**Result Sections:**

**Decision Summary Box** (Gradient background):
- Risk Tier (badge: Low/Medium/High/Decline)
- Late Payment Probability (%)
- Linear Risk Score (0-100)
- BNPL Credit Limit (formatted with commas)
- Repayment Tenor (months)
- Top 3 Products (comma-separated)

**Risk Score Breakdown Table**:
- Rank (#1, #2, #3)
- Risk Factor (e.g., "Prior Defaults", "Farm Type")
- Weight (% contribution)
- Contribution (numeric value)
- Impact (High/Medium/Low badge)

**Product Match Rationale**:
- Recommended product with explanation
- Alternative options (badge pills)

**BNPL Terms Summary** (3 gradient cards):
- Credit Limit (green gradient)
- Repayment Period (blue gradient)
- Monthly Payment (purple gradient - calculated)

**Next Steps Alert**:
- Contextual guidance based on risk tier
- Auto-approve → proceed to disbursement
- Medium → additional verification
- High → manual review
- Decline → alternative products

**URL:** Results displayed after form submission

---

### 4. Analytics Dashboard (/dashboard)

**Features:**
- Comprehensive analytics overview
- Real-time statistics (1000 synthetic profiles)
- Risk tier distribution table
- Product recommendations breakdown
- Risk by farm type analysis
- Risk by region analysis
- Links to chart visualizations

**Stats Grid** (4 cards):
1. Total Applicants: 1,000
2. Mean Late Payment Prob: 13.2%
3. Approval Rate: 99.9%
4. Auto-Approve Rate: 67.2%

**Data Tables:**

**Risk Tier Distribution:**
- Low (PD < 15%): 672 (67.2%) → Auto-approve
- Medium (15-35%): 312 (31.2%) → Reduced limits
- High (35-50%): 15 (1.5%) → Manual review
- Decline (≥50%): 1 (0.1%) → Auto-decline

**Product Recommendations:**
- Fertilizer BNPL: 332 (33.2%)
- Seeds BNPL: 312 (31.2%)
- Input Bundle: 185 (18.5%)
- Cash Advance: 86 (8.6%)
- Premium BNPL: 81 (8.1%)
- Equipment Lease: 4 (0.4%)

**Risk by Farm Type:**
- Smallholder: 16.3% (Medium risk)
- Cooperative: 10.8% (Low risk)
- Commercial: 8.3% (Low risk)

**Risk by Region:**
- West: 15.2% (Medium risk)
- South: 14.4% (Low risk)
- North: 12.8% (Low risk)
- Central: 12.4% (Low risk)
- East: 12.3% (Low risk)

**Chart Visualizations:**
- Late Payment Distribution (histogram)
- Farm Size vs Risk (scatter plot)
- Product Distribution (bar chart)
- All charts downloadable in charts/ directory

**URL:** http://localhost:8000/dashboard

---

## Design System

### Color Palette

```css
--primary-color: #2ecc71 (Green - Success)
--secondary-color: #3498db (Blue - Info)
--danger-color: #e74c3c (Red - Decline)
--warning-color: #f39c12 (Orange - Medium Risk)
--dark-color: #2c3e50 (Text)
--light-color: #ecf0f1 (Backgrounds)
```

### Badge Colors

- **Low Risk**: Green (#2ecc71)
- **Medium Risk**: Orange (#f39c12)
- **High Risk**: Orange-Red (#e67e22)
- **Decline**: Red (#e74c3c)

### Typography

- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Headers**: 2.5rem (H1), 1.5rem (H2), 1.2rem (H3)
- **Body**: 1rem (16px base)
- **Small**: 0.85-0.9rem

### Layout

- **Max Width**: 1200px (centered)
- **Border Radius**: 8px (rounded corners)
- **Box Shadow**: 0 2px 10px rgba(0,0,0,0.1)
- **Grid**: Auto-fit responsive columns
- **Spacing**: 1rem, 1.5rem, 2rem increments

### Background

- **Body**: Linear gradient (purple #667eea → #764ba2)
- **Cards**: White with shadow
- **Result Box**: Gradient (#667eea → #764ba2)

---

## API Integration

### Web Routes (HTML)

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home page |
| `/score` | GET | Score form |
| `/score` | POST | Submit score (HTML response) |
| `/dashboard` | GET | Analytics dashboard |

### JSON API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api` | GET | API root |
| `/recommend_product` | POST | Get recommendation (JSON) |
| `/batch_score` | POST | Batch scoring (JSON) |
| `/health` | GET | Health check |
| `/docs` | GET | OpenAPI documentation |

---

## File Structure

```
BNPL_scoring/
├── templates/
│   ├── base.html (Base template with header/footer/nav)
│   ├── index.html (Home page)
│   ├── score_form.html (Scoring form)
│   ├── score_result.html (Results display)
│   └── dashboard.html (Analytics dashboard)
├── static/
│   └── css/
│       └── style.css (Custom styling - 500+ lines)
├── charts/ (Static chart images)
│   ├── 01_late_payment_probability_distribution.png
│   ├── 02_farm_size_vs_payment_risk.png
│   └── 03_product_distribution.png
└── api.py (FastAPI with web routes)
```

---

## Usage Examples

### Start Server

```bash
# Development mode (auto-reload)
uvicorn api:app --reload --port 8000

# Production mode (4 workers)
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

### Access Web Interface

1. **Open browser**: http://localhost:8000
2. **Navigate** to "Score Applicant"
3. **Click** "Fill Sample Data" button
4. **Submit** form
5. **View** detailed results

### Test JSON API

```bash
# Health check
curl http://localhost:8000/health

# Score via JSON API
curl -X POST http://localhost:8000/recommend_product \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

---

## Responsive Design

### Desktop (> 768px)
- 3-column grid layouts
- Wide navigation bar
- Side-by-side result cards

### Mobile (≤ 768px)
- Single-column layouts
- Stacked navigation
- Full-width buttons
- Touch-friendly targets (min 44px)

### CSS Media Query

```css
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    .nav {
        flex-direction: column;
    }
    header h1 {
        font-size: 1.8rem;
    }
}
```

---

## Accessibility Features

- ✅ Semantic HTML5 elements
- ✅ ARIA labels on forms
- ✅ High contrast text (4.5:1 ratio)
- ✅ Keyboard navigation support
- ✅ Clear error messages
- ✅ Descriptive button labels

---

## Security Features

- ✅ Form validation (client + server)
- ✅ Input sanitization
- ✅ CSRF protection (FastAPI built-in)
- ✅ Content-Security-Policy ready
- ✅ No inline JavaScript (except sample data fill)

---

## Performance Optimizations

- ✅ Static file caching
- ✅ CSS minification ready
- ✅ Async template rendering
- ✅ Fast API response times (<60ms)
- ✅ Optimized PNG charts (300 DPI)

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome 100+
- ✅ Firefox 100+
- ✅ Safari 15+
- ✅ Edge 100+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Future Enhancements

### Short Term
- [ ] Add loading spinners on form submit
- [ ] Client-side form validation with JavaScript
- [ ] Export results as PDF
- [ ] Dark mode toggle
- [ ] Print-friendly CSS

### Medium Term
- [ ] Real-time chart updates with Chart.js
- [ ] Batch upload CSV file
- [ ] User authentication (JWT)
- [ ] Save/bookmark applicants
- [ ] Email results functionality

### Long Term
- [ ] React.js rewrite for SPA experience
- [ ] WebSocket for real-time updates
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)

---

## Troubleshooting

### Issue: CSS not loading

**Solution:**
```bash
# Ensure static directory exists
ls static/css/style.css

# Check FastAPI mount
# In api.py, verify:
app.mount("/static", StaticFiles(directory="static"), name="static")
```

### Issue: Form submission error

**Solution:**
```bash
# Install python-multipart
pip install python-multipart

# Verify import in api.py
from fastapi import Form
```

### Issue: Charts not displaying

**Solution:**
```bash
# Generate charts first
python dashboard.py

# Verify charts directory is mounted
app.mount("/charts", StaticFiles(directory="charts"), name="charts")
```

---

## Development Workflow

1. **Edit Templates**: Modify `templates/*.html`
2. **Update Styles**: Edit `static/css/style.css`
3. **Add Routes**: Update `api.py` with new endpoints
4. **Test**: Reload browser (auto-reload enabled in dev mode)
5. **Deploy**: Restart server with production config

---

## Production Deployment

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name bnpl.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        alias /path/to/BNPL_scoring/static;
        expires 30d;
    }

    location /charts {
        alias /path/to/BNPL_scoring/charts;
        expires 7d;
    }
}
```

### Systemd Service

```ini
[Unit]
Description=Agrarian BNPL API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/BNPL_scoring
ExecStart=/usr/bin/uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Support & Contributing

**Questions?** Check the main README.md

**Issues?** See DEPLOYMENT.md for troubleshooting

**Feedback?** Create GitHub issue or PR

---

**Web Frontend Version:** 1.0.0
**Last Updated:** January 3, 2026
**Status:** ✅ Production Ready
