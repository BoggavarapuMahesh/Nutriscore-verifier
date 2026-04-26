# Nutriscore-verifier
A web app to verify Nutri-Score labels (A-E) on European supermarket products using the official EU algorithm. Scan barcodes or enter nutrition values manually to check if the label is accurate.

# 🔬 NutriScore Verifier

A web app to verify whether the Nutri-Score label (A–E) on German and European supermarket products is accurate, using the **official EU Nutri-Score 2023 algorithm**.

## How it works

1. **Scan** the barcode or **enter** nutrition values manually
2. The backend fetches product data from the free [Open Food Facts](https://world.openfoodfacts.org/) database
3. We calculate the **real** Nutri-Score using the official formula
4. We compare our result with what's printed on the product
5. You get a ✅ Match / ⚠️ Mismatch verdict + full score breakdown

---

## Project Structure

```
nutriscore-checker/
├── backend/
│   ├── main.py           # FastAPI app + Nutri-Score engine
│   └── requirements.txt
└── frontend/
    ├── src/
│   │   ├── App.js        # Full React UI
│   │   └── index.js
    └── public/
        └── index.html
```

---

## Setup & Run

### Backend (Python + FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

App runs at: http://localhost:3000

---

## API Endpoints

### `GET /check/barcode/{barcode}`
Looks up product by EAN barcode, calculates and compares Nutri-Score.

**Example:**
```
GET /check/barcode/4006381333931
```

### `POST /check/manual`
Calculate from manually entered nutrition values.

**Body:**
```json
{
  "energy_kj": 1250,
  "sugars": 12.5,
  "saturated_fat": 4.2,
  "sodium_mg": 320,
  "fiber": 2.1,
  "protein": 7.8,
  "fruits_veg_nuts_pct": 0,
  "is_beverage": false,
  "claimed_grade": "B"
}
```

---

## The Nutri-Score Algorithm

The score is calculated per 100g/100ml:

**Negative points (higher = worse):**
| Nutrient | 0→10 points |
|----------|-------------|
| Energy (kJ) | 0→3350 |
| Sugars (g) | 0→45 |
| Saturated fat (g) | 0→10 |
| Sodium (mg) | 0→900 |

**Positive points (higher = better, subtracted from score):**
| Nutrient | 0→5 points |
|----------|------------|
| Fiber (g) | 0→4.7 |
| Protein (g) | 0→8.0 |
| Fruits/veg/nuts (%) | 0→100 |

**Final score = Negative total − Positive total**

| Score | Grade |
|-------|-------|
| ≤ −1  | A ✅  |
| ≤ 2   | B 🟡  |
| ≤ 10  | C 🟠  |
| ≤ 18  | D 🔴  |
| > 18  | E ❌  |

---

## Tech Stack
- **Backend:** Python, FastAPI, httpx
- **Frontend:** React 18
- **Data source:** Open Food Facts (free, open database)
- **Barcode scanning:** Quagga.js (in-browser camera)


# Output 
<img width="1551" height="967" alt="image" src="https://github.com/user-attachments/assets/0c0e8cc9-bb15-443d-b6f9-c6686cc7a7e8" />

<img width="1025" height="712" alt="image" src="https://github.com/user-attachments/assets/e4e0110f-4c56-4daa-9d29-fbd38f667e82" />


