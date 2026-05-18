from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import math
import numpy as np
from sklearn.neural_network import MLPRegressor
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Prepare Training Data
X_train = [
    [0.25, 0.40, 1, 0, 1, 0, 1, 0.25], # Weight Loss, Beginner, Male (Target: 5kg)
    [0.30, 0.45, 0, 1, 0, 1, 1, 0.10], # Muscle, Advanced, Male (Target: 2kg)
    [0.35, 0.35, 1, 0, 1, 0, 0, 0.50], # Weight Loss, Beginner, Female (Target: 10kg)
    [0.25, 0.30, 0, 1, 0, 0, 0, 0.25], # Muscle, Intermediate, Female (Target: 5kg)
    [0.40, 0.40, 0, 0, 0, 0, 1, 0.00], # Maintain, Intermediate, Male (Target: 0kg)
    [0.20, 0.35, 0, 1, 1, 0, 1, 0.15], # Muscle, Beginner, Male (Target: 3kg)
    [0.45, 0.40, 1, 0, 0, 1, 0, 0.10]  # Weight Loss, Advanced, Female (Target: 2kg)
]
y_train = [
    [0.45, 0.30, 1, 0],
    [0.75, 0.35, 0, 1],
    [0.40, 0.30, 1, 0],
    [0.60, 0.35, 0, 0],
    [0.65, 0.30, 0, 0],
    [0.70, 0.35, 1, 0],
    [0.42, 0.32, 0, 1]
]

# 2. Initialize and Train Model on Startup
model = MLPRegressor(hidden_layer_sizes=(10, 10), max_iter=2000, random_state=42)
X_np = np.array(X_train)
y_np = np.array(y_train)

print("Training ML Model on server startup...")
model.fit(X_np, y_np)
print("ML Model training complete.")

class TrainData(BaseModel):
    input: List[float]
    output: List[float]

@app.post("/api/train")
async def train_model(data: TrainData):
    global X_np, y_np, model
    new_X = np.array([data.input])
    new_y = np.array([data.output])
    
    X_np = np.vstack([X_np, new_X])
    y_np = np.vstack([y_np, new_y])
    
    print(f"Adding new data point and re-training model... Total size: {len(X_np)}")
    model.fit(X_np, y_np)
    
    return {"message": "Model successfully re-trained with new data.", "total_samples": len(X_np)}

@app.post("/api/generate-plan")
async def generate_plan(request: Request):
    profile = await request.json()
    
    age = profile.get('age', 25)
    weight = profile.get('weight', 150)
    goal = profile.get('goal', '')
    experience = profile.get('experience', '')
    environment = profile.get('environment', '')
    gender = profile.get('gender', '')
    diet = profile.get('diet', '')
    
    is_weight_loss = goal == 'weight loss'
    is_muscle = goal == 'build muscle'
    diet_str = diet.lower()
    is_veg = ('veg' in diet_str or 'vegetarian' in diet_str) and 'non' not in diet_str

    target_amount = 0.0
    if is_weight_loss:
        target_amount = float(profile.get('target_amount_loss', 0)) / 20.0
    elif is_muscle:
        target_amount = float(profile.get('target_amount_muscle', 0)) / 20.0

    ml_input_array = [
        int(age) / 100,
        int(weight) / 200,
        1 if is_weight_loss else 0,
        1 if is_muscle else 0,
        1 if experience == 'beginner' else 0,
        1 if experience == 'advanced' else 0,
        1 if gender == 'male' else 0,
        target_amount
    ]

    # Predict using true ML model
    prediction_raw = model.predict([ml_input_array])[0]
    
    target_cals = math.floor(prediction_raw[0] * 4000)
    if target_cals < 1200: target_cals = 1200
    if target_cals > 4000: target_cals = 4000

    p_ratio = prediction_raw[1]
    if p_ratio < 0.2: p_ratio = 0.2
    if p_ratio > 0.4: p_ratio = 0.4

    f_ratio = 0.25
    c_ratio = 1 - (p_ratio + f_ratio)

    protein = math.floor((target_cals * p_ratio) / 4)
    fats = math.floor((target_cals * f_ratio) / 9)
    carbs = math.floor((target_cals * c_ratio) / 4)

    split_type = "Upper/Lower Split"
    days = 4
    if prediction_raw[2] > 0.5:
        split_type = "Full Body System"
        days = 3
    elif prediction_raw[3] > 0.5:
        split_type = "Push/Pull/Legs"
        days = 6

    home_exercises = [
        {"name": "Push-ups", "sets": 3, "reps": "10-20"},
        {"name": "Bodyweight Squats", "sets": 4, "reps": "15-25"},
        {"name": "Chair Dips", "sets": 3, "reps": "10-15"},
        {"name": "Lunges", "sets": 3, "reps": "12 each leg"},
        {"name": "Plank", "sets": 3, "reps": "60 seconds"}
    ]

    gym_exercises = [
        {"name": "Barbell Squats", "sets": 4, "reps": "8-10"},
        {"name": "Bench Press", "sets": 4, "reps": "8-12"},
        {"name": "Deadlifts", "sets": 3, "reps": "5-8"},
        {"name": "Lat Pulldowns", "sets": 3, "reps": "10-12"},
        {"name": "Leg Press", "sets": 3, "reps": "10-15"}
    ]

    source_exercises = home_exercises if environment == 'home' else gym_exercises

    meals_data = []
    if is_veg:
        meals_data = [
            {
                "day": "Day 1",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Poha with peanuts and sprouts." if is_weight_loss else "Moong dal chilla with paneer stuffing and mint chutney."},
                    {"mealName": "Lunch", "suggestion": "Dal tadka, 1-2 roti, mixed veg sabzi, and cucumber salad." if is_weight_loss else "Rajma chawal with a side of curd and salad."},
                    {"mealName": "Dinner", "suggestion": "Palak soup and roasted makhana." if is_weight_loss else "Paneer bhurji with paratha."}
                ]
            },
            {
                "day": "Day 2",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Upma with extra veggies." if is_weight_loss else "Besan chilla with a glass of milk and almonds."},
                    {"mealName": "Lunch", "suggestion": "Mixed sprouts salad and a bowl of curd." if is_weight_loss else "Chole with brown rice and salad."},
                    {"mealName": "Dinner", "suggestion": "Lauki (bottle gourd) sabzi with roti." if is_weight_loss else "Soya chunk curry with rice."}
                ]
            },
            {
                "day": "Day 3",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Oats idli with sambar." if is_weight_loss else "Masala oats with paneer cubes."},
                    {"mealName": "Lunch", "suggestion": "Palak paneer (less oil) and roti." if is_weight_loss else "Matar paneer with jeera rice."},
                    {"mealName": "Dinner", "suggestion": "Mixed vegetable soup." if is_weight_loss else "Dal makhani with tandoori paratha."}
                ]
            },
            {
                "day": "Day 4",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Daliya (broken wheat) upma." if is_weight_loss else "Stuffed paneer paratha with thick curd."},
                    {"mealName": "Lunch", "suggestion": "Kadhi pakora (baked pakora) and brown rice." if is_weight_loss else "Veg biryani with soya chunks and raita."},
                    {"mealName": "Dinner", "suggestion": "Stir-fried veggies with tofu." if is_weight_loss else "Mix veg korma with paratha."}
                ]
            },
            {
                "day": "Day 5",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Ragi dosa with coconut chutney." if is_weight_loss else "Whole wheat bread sandwich with peanut butter and banana."},
                    {"mealName": "Lunch", "suggestion": "Lobia (black-eyed peas) curry with roti." if is_weight_loss else "Paneer butter masala (light) with rice."},
                    {"mealName": "Dinner", "suggestion": "Tofu bhurji paired with side salad." if is_weight_loss else "Malai kofta (baked) with naan."}
                ]
            },
            {
                "day": "Day 6",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Vegetable vermicelli." if is_weight_loss else "Poha with extra peanuts and paneer."},
                    {"mealName": "Lunch", "suggestion": "Baingan bharta with roti and raita." if is_weight_loss else "Dal bati churma (moderate ghee)."},
                    {"mealName": "Dinner", "suggestion": "Pumpkin soup." if is_weight_loss else "Veg pulao with cashew nuts and raita."}
                ]
            },
            {
                "day": "Day 7",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Moong dal dosa." if is_weight_loss else "Aloo paratha with thick curd and butter."},
                    {"mealName": "Lunch", "suggestion": "Ghiya (bottle gourd) sabzi with jawar roti." if is_weight_loss else "Shahi paneer with roti."},
                    {"mealName": "Dinner", "suggestion": "Roasted chickpeas and salad." if is_weight_loss else "Vegetable hakka noodles with Gobi Manchurian."}
                ]
            }
        ]
    else:
        meals_data = [
            {
                "day": "Day 1",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "2 Boiled eggs with salt/pepper and black coffee." if is_weight_loss else "4 egg omelette with cheese and whole wheat toast."},
                    {"mealName": "Lunch", "suggestion": "Chicken tikka (dry) with single roti and green salad." if is_weight_loss else "Butter chicken (low cream) with rice."},
                    {"mealName": "Dinner", "suggestion": "Grilled fish tikka with asparagus." if is_weight_loss else "Mutton curry with paratha."}
                ]
            },
            {
                "day": "Day 2",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Egg bhurji with 1 slice whole wheat bread." if is_weight_loss else "Chicken sausage with sunny side up eggs."},
                    {"mealName": "Lunch", "suggestion": "Fish curry with a small portion of brown rice." if is_weight_loss else "Egg curry with jeera rice."},
                    {"mealName": "Dinner", "suggestion": "Tandoori chicken (no butter) with mint chutney." if is_weight_loss else "Chicken biryani with raita."}
                ]
            },
            {
                "day": "Day 3",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Scrambled eggs with spinach." if is_weight_loss else "Chicken Keema paratha with curd."},
                    {"mealName": "Lunch", "suggestion": "Chicken salad with mint dressing." if is_weight_loss else "Chicken korma with roti."},
                    {"mealName": "Dinner", "suggestion": "Lemon garlic prawn stir-fry." if is_weight_loss else "Prawn curry with steamed rice."}
                ]
            },
            {
                "day": "Day 4",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Masala omelette (2 eggs, tomatoes, onions)." if is_weight_loss else "Egg mayo sandwich with grilled chicken sides."},
                    {"mealName": "Lunch", "suggestion": "Soya and egg dry fry with single roti." if is_weight_loss else "Mutton rogan josh with rice."},
                    {"mealName": "Dinner", "suggestion": "Baked chicken breast with steamed veggies." if is_weight_loss else "Fish fry (shallow fried) with dal and rice."}
                ]
            },
            {
                "day": "Day 5",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Boiled egg whites (4) with green tea." if is_weight_loss else "Chicken mince (keema) pav."},
                    {"mealName": "Lunch", "suggestion": "Chicken clear soup with boiled veggies." if is_weight_loss else "Chicken afghani with garlic naan."},
                    {"mealName": "Dinner", "suggestion": "Fish amritsari (grilled/air fried)." if is_weight_loss else "Mutton biryani."}
                ]
            },
            {
                "day": "Day 6",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Oats with 3 egg whites." if is_weight_loss else "Double egg Kathi roll."},
                    {"mealName": "Lunch", "suggestion": "Chicken rasam with a small bowl of rice." if is_weight_loss else "Chicken chettinad with dosa."},
                    {"mealName": "Dinner", "suggestion": "Grilled chicken salad." if is_weight_loss else "Fish malai curry with rice."}
                ]
            },
            {
                "day": "Day 7",
                "meals": [
                    {"mealName": "Breakfast", "suggestion": "Egg white chilla." if is_weight_loss else "Leftover chicken/mutton curry with paratha."},
                    {"mealName": "Lunch", "suggestion": "Fish molee (Kerala style, subtle coconut)." if is_weight_loss else "Mutton keema with pav and butter."},
                    {"mealName": "Dinner", "suggestion": "Chicken tikka salad." if is_weight_loss else "Tandoori pomfret with rice."}
                ]
            }
        ]

    generated_diet_plan = []
    for dayPlan in meals_data:
        day_meals = []
        for index, meal in enumerate(dayPlan['meals']):
            if index == 0:
                p_frac, c_frac, f_frac = 0.25, 0.20, 0.30
            elif index == 1:
                p_frac, c_frac, f_frac = 0.40, 0.40, 0.30
            else:
                p_frac, c_frac, f_frac = 0.35, 0.40, 0.40
            
            day_meals.append({
                **meal,
                "protein": math.floor(protein * p_frac),
                "carbs": math.floor(carbs * c_frac),
                "fats": math.floor(fats * f_frac)
            })
        generated_diet_plan.append({
            "day": dayPlan["day"],
            "meals": day_meals
        })

    workout_plan = [
        {
            "day": "Day 1",
            "focus": "Full Body A" if experience == 'beginner' else "Push (Chest, Shoulders, Triceps)",
            "intensity": "High",
            "exercises": source_exercises[:3]
        },
        {
            "day": "Day 2",
            "focus": "Rest/Cardio" if experience == 'beginner' else "Pull (Back, Biceps)",
            "intensity": "Medium",
            "exercises": source_exercises[2:5][::-1]
        },
        {
            "day": "Day 3",
            "focus": "Full Body B" if experience == 'beginner' else "Legs & Core",
            "intensity": "High",
            "exercises": [source_exercises[1], source_exercises[3], source_exercises[4]]
        },
        {
            "day": "Day 4",
            "focus": "Active Recovery",
            "intensity": "Low",
            "exercises": []
        },
        {
            "day": "Day 5",
            "focus": "Full Body C" if experience == 'beginner' else "Push (Chest, Shoulders, Triceps) 2",
            "intensity": "High",
            "exercises": source_exercises[:3][::-1]
        },
        {
            "day": "Day 6",
            "focus": "Cardio" if experience == 'beginner' else "Pull (Back, Biceps) 2",
            "intensity": "Medium",
            "exercises": source_exercises[1:4]
        },
        {
            "day": "Day 7",
            "focus": "Rest" if experience == 'beginner' else "Legs & Core 2",
            "intensity": "High",
            "exercises": [source_exercises[0], source_exercises[2], source_exercises[4]]
        }
    ]

    return {
        "summary": {
            "targetCalories": target_cals,
            "macros": {
                "protein": protein,
                "carbs": carbs,
                "fats": fats
            },
            "splitType": split_type,
            "daysPerWeek": days
        },
        "workoutPlan": workout_plan,
        "dietPlan": generated_diet_plan
    }

if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=8000, reload=True)
