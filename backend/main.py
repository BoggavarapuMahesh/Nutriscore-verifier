from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import math

app = FastAPI(title="NutriScore Checker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Official Nutri-Score 2023 tables ──────────────────────────────────────────

ENERGY_KJ_POINTS = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SUGARS_POINTS    = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]
SAT_FAT_POINTS   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SODIUM_POINTS    = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]  # mg

FIBER_POINTS     = [0.9, 1.9, 2.8, 3.7, 4.7]
PROTEIN_POINTS   = [1.6, 3.2, 4.8, 6.4, 8.0]
FNV_POINTS       = [40, 60, 80, 100]   # fruits/nuts/veg %


def _score_negative(value: float, thresholds: list) -> int:
    for i, t in enumerate(thresholds):
        if value <= t:
            return i
    return len(thresholds)


def _score_positive(value: float, thresholds: list) -> int:
    for i, t in enumerate(thresholds):
        if value <= t:
            return i
    return len(thresholds)


def calculate_nutriscore(
    energy_kj: float,
    sugars: float,
    saturated_fat: float,
    sodium_mg: float,
    fiber: float,
    protein: float,
    fruits_veg_nuts_pct: float = 0,
    is_beverage: bool = False,
    is_cheese: bool = False,
    is_fat: bool = False,
) -> dict:
    """
    Calculates Nutri-Score grade (A–E) from per-100g/100ml values.
    Returns the score, letter, and breakdown for transparency.
    """

    n_energy   = _score_negative(energy_kj,   ENERGY_KJ_POINTS)
    n_sugars   = _score_negative(sugars,       SUGARS_POINTS)
    n_sat_fat  = _score_negative(saturated_fat, SAT_FAT_POINTS)
    n_sodium   = _score_negative(sodium_mg,    SODIUM_POINTS)
    negative   = n_energy + n_sugars + n_sat_fat + n_sodium

    fnv = _score_positive(fruits_veg_nuts_pct, FNV_POINTS)
    p_fiber    = _score_positive(fiber,   FIBER_POINTS)
    p_protein  = _score_positive(protein, PROTEIN_POINTS)

    # Protein counted freely only when fnv ≥ 5 OR total negative < 11
    if negative >= 11 and fnv < 5:
        final = negative - fnv - p_fiber
    else:
        final = negative - fnv - p_fiber - p_protein

    # Letter grade (general food thresholds)
    if is_beverage:
        thresholds = [(-15, "A"), (1, "B"), (5, "C"), (9, "D")]
    else:
        thresholds = [(-1, "A"), (2, "B"), (10, "C"), (18, "D")]

    grade = "E"
    for threshold, letter in thresholds:
        if final <= threshold:
            grade = letter
            break

    return {
        "score": final,
        "grade": grade,
        "breakdown": {
            "negative": {
                "energy_kj":      {"value": energy_kj,      "points": n_energy},
                "sugars_g":       {"value": sugars,          "points": n_sugars},
                "saturated_fat_g":{"value": saturated_fat,   "points": n_sat_fat},
                "sodium_mg":      {"value": sodium_mg,       "points": n_sodium},
                "total":          negative,
            },
            "positive": {
                "fiber_g":        {"value": fiber,            "points": p_fiber},
                "protein_g":      {"value": protein,          "points": p_protein},
                "fruits_veg_pct": {"value": fruits_veg_nuts_pct, "points": fnv},
                "total":          fnv + p_fiber + p_protein,
            },
        },
    }


# ── Models ────────────────────────────────────────────────────────────────────

class ManualInput(BaseModel):
    energy_kj: float
    sugars: float
    saturated_fat: float
    sodium_mg: float
    fiber: float
    protein: float
    fruits_veg_nuts_pct: Optional[float] = 0
    is_beverage: Optional[bool] = False
    claimed_grade: Optional[str] = None   # grade printed on the product (A–E)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/check/manual")
def check_manual(data: ManualInput):
    result = calculate_nutriscore(
        energy_kj=data.energy_kj,
        sugars=data.sugars,
        saturated_fat=data.saturated_fat,
        sodium_mg=data.sodium_mg,
        fiber=data.fiber,
        protein=data.protein,
        fruits_veg_nuts_pct=data.fruits_veg_nuts_pct or 0,
        is_beverage=data.is_beverage or False,
    )

    verdict = None
    if data.claimed_grade:
        claimed = data.claimed_grade.upper().strip()
        calculated = result["grade"]
        if claimed == calculated:
            verdict = {"status": "match", "message": f"The label grade {claimed} matches our calculation."}
        else:
            verdict = {
                "status": "mismatch",
                "message": f"Label shows {claimed} but our calculation gives {calculated}.",
                "claimed": claimed,
                "calculated": calculated,
            }

    return {**result, "verdict": verdict}


@app.get("/check/barcode/{barcode}")
async def check_barcode(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,brands,nutriscore_grade,nutriments,ingredients_text,image_url"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)

    if resp.status_code != 200:
        raise HTTPException(502, "Could not reach Open Food Facts")

    data = resp.json()
    if data.get("status") == 0:
        raise HTTPException(404, f"Product with barcode {barcode} not found in database")

    product = data["product"]
    n = product.get("nutriments", {})

    def g(key, default=0.0):
        return float(n.get(key, default) or default)

    energy_kj      = g("energy-kj_100g") or g("energy_100g")
    sugars         = g("sugars_100g")
    saturated_fat  = g("saturated-fat_100g")
    sodium_mg      = g("sodium_100g", 0) * 1000   # stored as g in OFF
    fiber          = g("fiber_100g")
    protein        = g("proteins_100g")

    result = calculate_nutriscore(
        energy_kj=energy_kj,
        sugars=sugars,
        saturated_fat=saturated_fat,
        sodium_mg=sodium_mg,
        fiber=fiber,
        protein=protein,
    )

    claimed_grade = (product.get("nutriscore_grade") or "").upper() or None
    calculated    = result["grade"]

    if claimed_grade:
        if claimed_grade == calculated:
            verdict = {"status": "match",    "message": f"Label grade {claimed_grade} matches our calculation."}
        else:
            verdict = {"status": "mismatch", "message": f"Label shows {claimed_grade}, our algorithm gives {calculated}.",
                       "claimed": claimed_grade, "calculated": calculated}
    else:
        verdict = {"status": "unknown", "message": "No Nutri-Score grade found in the product database to compare against."}

    return {
        **result,
        "product_name": product.get("product_name", "Unknown"),
        "brand":        product.get("brands", ""),
        "image_url":    product.get("image_url", ""),
        "ingredients":  product.get("ingredients_text", ""),
        "claimed_grade": claimed_grade,
        "verdict": verdict,
        "nutrients_used": {
            "energy_kj": energy_kj,
            "sugars_g":  sugars,
            "saturated_fat_g": saturated_fat,
            "sodium_mg": sodium_mg,
            "fiber_g":   fiber,
            "protein_g": protein,
        }
    }
