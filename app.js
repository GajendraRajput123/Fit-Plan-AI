// ===== DOM Elements =====
const screens = {
    login: document.getElementById('login-section'),
    landing: document.getElementById('landing-section'),
    form: document.getElementById('form-section'),
    loading: document.getElementById('loading-section'),
    results: document.getElementById('results-section')
};

// Form Elements
const formSteps = document.querySelectorAll('.form-step');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const submitBtn = document.getElementById('submit-btn');
const progressBar = document.getElementById('form-progress');
const fitnessForm = document.getElementById('fitness-form');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State Variables
let currentStep = 1;
const totalSteps = formSteps.length;
let userProfile = {};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Login/Signup Toggle Logic
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const formTitle = document.querySelector('.form-title');
    const formDesc = document.querySelector('.form-desc');

    if(showSignupBtn && showLoginBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('view-hidden');
            signupForm.classList.remove('view-hidden');
            formTitle.textContent = "Create an Account";
            formDesc.textContent = "Join us to start your fitness journey";
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('view-hidden');
            loginForm.classList.remove('view-hidden');
            formTitle.textContent = "Welcome Back";
            formDesc.textContent = "Sign in to continue your fitness journey";
        });
    }

    // Signup form logic
    if(signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const name = document.getElementById('signup-name').value;

            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('fitplan_users') || '{}');
            if(existingUsers[email]) {
                alert("Account with this email already exists! Please log in.");
                showLoginBtn.click();
                return;
            }

            // Save new user
            existingUsers[email] = { password, name };
            localStorage.setItem('fitplan_users', JSON.stringify(existingUsers));
            
            const btn = document.getElementById('signup-btn');
            const originalText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
            
            setTimeout(() => {
                btn.innerText = originalText;
                alert("Account created successfully!");
                switchScreen('landing');
            }, 800);
        });
    }

    // Login form logic
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Validate against local storage
            const existingUsers = JSON.parse(localStorage.getItem('fitplan_users') || '{}');
            
            if(!existingUsers[email] || existingUsers[email].password !== password) {
                alert("Invalid email or password!");
                return;
            }

            // Simulate authentication delay
            const btn = document.getElementById('login-btn');
            const originalText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            
            setTimeout(() => {
                btn.innerText = originalText;
                switchScreen('landing');
            }, 800);
        });
    }

    // Start button logic
    document.getElementById('start-btn').addEventListener('click', () => {
        switchScreen('form');
        updateFormUI();
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        fitnessForm.reset();
        currentStep = 1;
        updateFormUI();
        switchScreen('landing');
    });

    // Form Navigation
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateFormUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateFormUI();
    });

    // Form Submission
    fitnessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateCurrentStep()) {
            gatherFormData();
            initiateAI();
        }
    });

    // Goal Conditional Inputs
    const goalRadios = document.querySelectorAll('input[name="goal"]');
    const lossGroup = document.getElementById('target-loss-group');
    const muscleGroup = document.getElementById('target-muscle-group');
    const lossInput = document.getElementById('target_amount_loss');
    const muscleInput = document.getElementById('target_amount_muscle');

    goalRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            
            // Hide both first
            lossGroup.classList.remove('expand-active');
            lossGroup.classList.add('expand-hidden');
            lossInput.required = false;
            
            muscleGroup.classList.remove('expand-active');
            muscleGroup.classList.add('expand-hidden');
            muscleInput.required = false;

            if (val === 'weight loss') {
                lossGroup.classList.remove('expand-hidden');
                lossGroup.classList.add('expand-active');
                lossInput.required = true;
            } else if (val === 'build muscle') {
                muscleGroup.classList.remove('expand-hidden');
                muscleGroup.classList.add('expand-active');
                muscleInput.required = true;
            }
        });
    });

    // Trigger initial state
    const activeGoal = document.querySelector('input[name="goal"]:checked');
    if(activeGoal) activeGoal.dispatchEvent(new Event('change'));

    // Tabs Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            // Re-trigger animations by cloning/replacing elements just for flair
            const targetContent = document.getElementById(btn.dataset.target);
            targetContent.style.animation = 'none';
            targetContent.offsetHeight; /* trigger reflow */
            targetContent.style.animation = null; 
        });
    });
});

// ===== Logic Functions =====

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('view-active');
        screen.classList.add('view-hidden');
    });
    
    screens[screenName].classList.remove('view-hidden');
    screens[screenName].classList.add('view-active');
}

function updateFormUI() {
    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;

    // Show/Hide steps
    formSteps.forEach(step => {
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.remove('view-hidden');
            step.classList.add('active');
        } else {
            step.classList.add('view-hidden');
            step.classList.remove('active');
        }
    });

    // Update buttons
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }

    // Update Titles
    const stepTitle = document.getElementById('step-title');
    const stepDesc = document.getElementById('step-desc');
    
    if(currentStep === 1) {
        stepTitle.textContent = "Let's get to know you";
        stepDesc.textContent = "Provide some basic details to build your physiological profile.";
    } else if (currentStep === 2) {
        stepTitle.textContent = "What's the goal?";
        stepDesc.textContent = "Select your primary object so the AI can tune your macros and routine.";
    } else {
        stepTitle.textContent = "Final details";
        stepDesc.textContent = "Tell us about your experience level and environment.";
    }
}

function validateCurrentStep() {
    // Simple validation: check if inputs in current active step are valid
    const currentStepDiv = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentStepDiv.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.style.borderColor = '#ef4444'; // red
            setTimeout(() => input.style.borderColor = 'rgba(255,255,255,0.1)', 2000);
        }
    });
    return isValid;
}

function gatherFormData() {
    const formData = new FormData(fitnessForm);
    userProfile = Object.fromEntries(formData.entries());
    console.log("Captured Profile:", userProfile);
}

// Simulated AI Generation Flow
function initiateAI() {
    switchScreen('loading');
    
    // Simulate Loading Stages
    const subtext = document.getElementById('loader-subtext');
    const dots = document.querySelectorAll('.step-dot');
    
    setTimeout(() => {
        subtext.textContent = `Running data through the trained Neural Network...`;
        dots[0].classList.remove('active');
        dots[1].classList.add('active');
    }, 1500);

    setTimeout(() => {
        subtext.textContent = `Predicting optimal calories and routine split...`;
        dots[1].classList.remove('active');
        dots[2].classList.add('active');
    }, 3000);

    // Call Python Backend API
    setTimeout(async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userProfile)
            });
            
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            
            const plan = await response.json();
            renderResults(plan);
        } catch (error) {
            console.error("API Error:", error);
            console.log("Backend not reachable. Falling back to local AI generation.");
            const plan = generateFallbackPlan(userProfile);
            renderResults(plan);
        }
    }, 4500);
}

function renderResults(plan) {
    // 1. Render Summary Panel
    const summaryHtml = `
        <div class="metric-item">
            <div class="metric-label">Goal</div>
            <div class="metric-value" style="font-size: 1.1rem; text-transform: capitalize;">${userProfile.goal}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Target Calories</div>
            <div class="metric-value text-primary">${plan.summary.targetCalories}</div>
            <div class="metric-label">kcal/day</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Workout Split</div>
            <div class="metric-value" style="font-size: 1.1rem;">${plan.summary.splitType}</div>
            <div class="metric-label">${plan.summary.daysPerWeek} days/w</div>
        </div>
    `;
    document.getElementById('summary-metrics').innerHTML = summaryHtml;

    // 2. Render Workouts
    const workoutContainer = document.getElementById('workout-container');
    let workoutHtml = '';
    plan.workoutPlan.forEach(day => {
        workoutHtml += `
        <div class="day-card">
            <div class="day-header">
                <div class="day-title">${day.day}: ${day.focus}</div>
                <div class="body-part">${day.intensity}</div>
            </div>
            <ul class="exercise-list">
        `;
        
        day.exercises.forEach(ex => {
            workoutHtml += `
                <li class="exercise-item">
                    <span class="exercise-name"><i class="fa-solid fa-angle-right" style="color:var(--primary); font-size:0.8rem; margin-right:8px;"></i>${ex.name}</span>
                    <span class="exercise-reps">${ex.sets} sets × ${ex.reps}</span>
                </li>
            `;
        });
        
        workoutHtml += `</ul></div>`;
    });
    workoutContainer.innerHTML = workoutHtml;

    // 3. Render Diet Plan
    const dietContainer = document.getElementById('diet-container');
    let dietHtml = '';
    
    // Add Macro Overview
    dietHtml += `
        <div class="glass-card" style="position: relative; margin-bottom: 1.5rem;">
            <div style="display:flex; justify-content:space-around; text-align:center;">
                <div>
                    <div style="font-size:1.5rem; color:#ec4899; font-weight:700;">${plan.summary.macros.protein}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Protein (g)</div>
                </div>
                <div>
                    <div style="font-size:1.5rem; color:#3b82f6; font-weight:700;">${plan.summary.macros.carbs}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Carbs (g)</div>
                </div>
                <div>
                    <div style="font-size:1.5rem; color:#f59e0b; font-weight:700;">${plan.summary.macros.fats}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Fats (g)</div>
                </div>
            </div>
        </div>
    `;

    // Map meals to icons
    const getMealIcon = (type) => {
        const t = type.toLowerCase();
        if(t.includes('breakfast')) return '<i class="fa-solid fa-mug-hot"></i>';
        if(t.includes('lunch')) return '<i class="fa-solid fa-bowl-food"></i>';
        if(t.includes('dinner')) return '<i class="fa-solid fa-burger"></i>';
        return '<i class="fa-solid fa-apple-whole"></i>';
    };

    plan.dietPlan.forEach(dayPlan => {
        dietHtml += `
        <div class="day-card" style="margin-top: 1.5rem;">
            <div class="day-header" style="border-bottom:none; margin-bottom:0.5rem; padding-bottom:0;">
                <div class="day-title text-gradient" style="font-size:1.4rem;">${dayPlan.day} Nutrition</div>
            </div>
            <div class="meals-container" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
        `;

        dayPlan.meals.forEach(meal => {
            dietHtml += `
            <div class="meal-card" style="margin-bottom:0;">
                <div class="meal-icon">
                    ${getMealIcon(meal.mealName)}
                </div>
                <div class="meal-content">
                    <div class="meal-title">${meal.mealName}</div>
                    <div class="meal-desc">${meal.suggestion}</div>
                    <div class="meal-macros">
                        <div class="macro macro-p">P: <span>${meal.protein}g</span></div>
                        <div class="macro macro-c">C: <span>${meal.carbs}g</span></div>
                        <div class="macro macro-f">F: <span>${meal.fats}g</span></div>
                    </div>
                </div>
            </div>
            `;
        });
        
        dietHtml += `</div></div>`;
    });
    dietContainer.innerHTML = dietHtml;

    // Finally, switch to results view
    switchScreen('results');
}

// ===== Fallback Generation (If backend is down) =====
function generateFallbackPlan(profile) {
    const age = parseInt(profile.age) || 25;
    const weight = parseInt(profile.weight) || 70;
    const goal = profile.goal || '';
    const experience = profile.experience || 'beginner';
    const environment = profile.environment || 'gym';
    const gender = profile.gender || 'male';
    const diet = profile.diet || 'veg';

    const isWeightLoss = goal === 'weight loss';
    const isMuscle = goal === 'build muscle';
    const isVeg = diet.toLowerCase().includes('veg') && !diet.toLowerCase().includes('non');

    // Simple fallback logic instead of ML
    let targetCals = 2000;
    if (gender === 'male') targetCals = 2500;
    else targetCals = 2000;

    if (isWeightLoss) targetCals -= 500;
    if (isMuscle) targetCals += 300;

    if (targetCals < 1200) targetCals = 1200;
    if (targetCals > 4000) targetCals = 4000;

    let pRatio = isMuscle ? 0.35 : 0.30;
    let fRatio = 0.25;
    let cRatio = 1 - (pRatio + fRatio);

    const protein = Math.floor((targetCals * pRatio) / 4);
    const fats = Math.floor((targetCals * fRatio) / 9);
    const carbs = Math.floor((targetCals * cRatio) / 4);

    let splitType = "Upper/Lower Split";
    let days = 4;
    if (experience === 'beginner') {
        splitType = "Full Body System";
        days = 3;
    } else if (experience === 'advanced') {
        splitType = "Push/Pull/Legs";
        days = 6;
    }

    const homeExercises = [
        {"name": "Push-ups", "sets": 3, "reps": "10-20"},
        {"name": "Bodyweight Squats", "sets": 4, "reps": "15-25"},
        {"name": "Chair Dips", "sets": 3, "reps": "10-15"},
        {"name": "Lunges", "sets": 3, "reps": "12 each leg"},
        {"name": "Plank", "sets": 3, "reps": "60 seconds"}
    ];

    const gymExercises = [
        {"name": "Barbell Squats", "sets": 4, "reps": "8-10"},
        {"name": "Bench Press", "sets": 4, "reps": "8-12"},
        {"name": "Deadlifts", "sets": 3, "reps": "5-8"},
        {"name": "Lat Pulldowns", "sets": 3, "reps": "10-12"},
        {"name": "Leg Press", "sets": 3, "reps": "10-15"}
    ];

    const sourceExercises = environment === 'home' ? homeExercises : gymExercises;

    const genericVegMeals = [
        {"mealName": "Breakfast", "suggestion": isWeightLoss ? "Oats with nuts" : "Besan chilla with paneer"},
        {"mealName": "Lunch", "suggestion": isWeightLoss ? "Mixed dal, 1 roti, cucumber salad" : "Dal makhani, rice, mixed veg"},
        {"mealName": "Dinner", "suggestion": isWeightLoss ? "Vegetable soup and grilled tofu" : "Paneer curry with 2 rotis"}
    ];
    
    const genericNonVegMeals = [
        {"mealName": "Breakfast", "suggestion": isWeightLoss ? "3 boiled egg whites" : "3 whole egg omelette with toast"},
        {"mealName": "Lunch", "suggestion": isWeightLoss ? "Grilled chicken breast, veggies" : "Chicken curry with rice"},
        {"mealName": "Dinner", "suggestion": isWeightLoss ? "Baked fish with asparagus" : "Mutton curry with paratha"}
    ];

    const templateMeals = isVeg ? genericVegMeals : genericNonVegMeals;
    
    const dietPlan = [];
    for (let i = 1; i <= 7; i++) {
        const dayMeals = templateMeals.map((meal, index) => {
            let p_frac = 0.3, c_frac = 0.4, f_frac = 0.3;
            if (index === 0) { p_frac = 0.25; c_frac = 0.45; f_frac = 0.3; }
            if (index === 1) { p_frac = 0.4; c_frac = 0.4; f_frac = 0.2; }
            if (index === 2) { p_frac = 0.35; c_frac = 0.15; f_frac = 0.5; }
            
            return {
                ...meal,
                protein: Math.floor(protein * p_frac),
                carbs: Math.floor(carbs * c_frac),
                fats: Math.floor(fats * f_frac)
            };
        });
        dietPlan.push({ day: "Day " + i, meals: dayMeals });
    }

    const workoutPlan = [
        { day: "Day 1", focus: "Upper Body", intensity: "High", exercises: sourceExercises.slice(0, 3) },
        { day: "Day 2", focus: "Lower Body", intensity: "Medium", exercises: sourceExercises.slice(2, 5) },
        { day: "Day 3", focus: "Rest/Cardio", intensity: "Low", exercises: [] },
        { day: "Day 4", focus: "Upper Body 2", intensity: "High", exercises: sourceExercises.slice(0, 3).reverse() },
        { day: "Day 5", focus: "Lower Body 2", intensity: "Medium", exercises: sourceExercises.slice(1, 4) },
        { day: "Day 6", focus: "Active Recovery", intensity: "Low", exercises: [] },
        { day: "Day 7", focus: "Rest", intensity: "Low", exercises: [] },
    ];

    return {
        summary: {
            targetCalories: targetCals,
            macros: { protein, carbs, fats },
            splitType,
            daysPerWeek: days
        },
        workoutPlan,
        dietPlan
    };
}
