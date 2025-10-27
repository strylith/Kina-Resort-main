# Test registration endpoint
$body = @{
    email = 'testuser@example.com'
    password = 'test123456'
    firstName = 'Test'
    lastName = 'User'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://kina-resort-main-production.up.railway.app/api/auth/register' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json'

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Content: $($response.Content)"

