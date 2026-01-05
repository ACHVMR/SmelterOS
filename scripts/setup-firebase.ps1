# SmelterOS Firebase Setup Script
# Enables all required Firebase services on the GCP project

$PROJECT_ID = "smelteros"
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   SmelterOS Firebase Setup" -ForegroundColor White
Write-Host "   Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Set the active project
Write-Host "[1/10] Setting active project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID 2>&1 | Out-Null
Write-Host "       [OK] Project set to $PROJECT_ID" -ForegroundColor Green

# Firebase Core APIs
Write-Host ""
Write-Host "[2/10] Enabling Firebase Management API..." -ForegroundColor Yellow
gcloud services enable firebase.googleapis.com 2>&1 | Out-Null
Write-Host "       [OK] firebase.googleapis.com" -ForegroundColor Green

# Firebase Authentication
Write-Host ""
Write-Host "[3/10] Enabling Firebase Authentication..." -ForegroundColor Yellow
$authApis = @(
    "identitytoolkit.googleapis.com",
    "securetoken.googleapis.com"
)
foreach ($api in $authApis) {
    gcloud services enable $api 2>&1 | Out-Null
    Write-Host "       [OK] $api" -ForegroundColor Green
}

# Firebase Firestore
Write-Host ""
Write-Host "[4/10] Enabling Firestore..." -ForegroundColor Yellow
gcloud services enable firestore.googleapis.com 2>&1 | Out-Null
Write-Host "       [OK] firestore.googleapis.com" -ForegroundColor Green

# Firebase Storage
Write-Host ""
Write-Host "[5/10] Enabling Firebase Storage..." -ForegroundColor Yellow
$storageApis = @(
    "storage.googleapis.com",
    "firebasestorage.googleapis.com"
)
foreach ($api in $storageApis) {
    gcloud services enable $api 2>&1 | Out-Null
    Write-Host "       [OK] $api" -ForegroundColor Green
}

# Firebase Hosting
Write-Host ""
Write-Host "[6/10] Enabling Firebase Hosting..." -ForegroundColor Yellow
gcloud services enable firebasehosting.googleapis.com 2>&1 | Out-Null
Write-Host "       [OK] firebasehosting.googleapis.com" -ForegroundColor Green

# Firebase Cloud Messaging
Write-Host ""
Write-Host "[7/10] Enabling Firebase Cloud Messaging..." -ForegroundColor Yellow
$fcmApis = @(
    "fcm.googleapis.com",
    "fcmregistrations.googleapis.com"
)
foreach ($api in $fcmApis) {
    gcloud services enable $api 2>&1 | Out-Null
    Write-Host "       [OK] $api" -ForegroundColor Green
}

# Firebase Extensions & Features
Write-Host ""
Write-Host "[8/10] Enabling Firebase Extensions..." -ForegroundColor Yellow
$extApis = @(
    "firebaseremoteconfig.googleapis.com",
    "firebasedynamiclinks.googleapis.com",
    "firebaserules.googleapis.com",
    "firebaseml.googleapis.com"
)
foreach ($api in $extApis) {
    gcloud services enable $api 2>&1 | Out-Null
    Write-Host "       [OK] $api" -ForegroundColor Green
}

# Cloud Functions (required for Firebase Functions)
Write-Host ""
Write-Host "[9/10] Enabling Cloud Functions..." -ForegroundColor Yellow
$functionsApis = @(
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "eventarc.googleapis.com",
    "run.googleapis.com"
)
foreach ($api in $functionsApis) {
    gcloud services enable $api 2>&1 | Out-Null
    Write-Host "       [OK] $api" -ForegroundColor Green
}

# Verify Firebase project
Write-Host ""
Write-Host "[10/10] Verifying Firebase setup..." -ForegroundColor Yellow

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   Firebase Setup Complete!" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: firebase login" -ForegroundColor White
Write-Host "  2. Run: firebase use --add" -ForegroundColor White
Write-Host "  3. Select project: $PROJECT_ID" -ForegroundColor White
Write-Host "  4. Run: firebase deploy --only firestore:rules" -ForegroundColor White
Write-Host "  5. Run: firebase deploy --only firestore:indexes" -ForegroundColor White
Write-Host ""
Write-Host "For local development:" -ForegroundColor Cyan
Write-Host "  firebase emulators:start" -ForegroundColor White
Write-Host ""
