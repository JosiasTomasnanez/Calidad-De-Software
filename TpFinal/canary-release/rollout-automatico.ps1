$stages = @(10, 25, 50, 75, 100)

foreach ($weight in $stages) {

    Write-Host "🚀 Aplicando weight $weight%..."

    kubectl annotate ingress myapp-canary nginx.ingress.kubernetes.io/canary-weight="$weight" --overwrite

    Start-Sleep -Seconds 2

    $env:CANARY_WEIGHT = $weight

    Write-Host "Ejecutando test con weight $weight%"
    k6 run canary-test.js

    Write-Host " Pausa entre etapas..."
    Start-Sleep -Seconds 10
}

Write-Host "🎉 Rollout completado!"
