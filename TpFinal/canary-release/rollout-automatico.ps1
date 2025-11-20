$stages = @(5, 10, 25, 50, 75, 100)

foreach ($weight in $stages) {

    Write-Host "Aplicando weight $weight%..."

    kubectl annotate ingress myapp-canary nginx.ingress.kubernetes.io/canary-weight="$weight" --overwrite

    Start-Sleep -Seconds 2

    $env:CANARY_WEIGHT = $weight

    Write-Host "Ejecutando test con weight $weight%"

    # Ejecutamos k6 y capturamos el exit code
    k6 run canary-test.js
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Write-Host ""
        Write-Host "Threshold FAILED con weight $weight% !!!"
        Write-Host "Realizando rollback a weight 0%..."

        kubectl annotate ingress myapp-canary nginx.ingress.kubernetes.io/canary-weight="0" --overwrite

        Write-Host "Rollback completado."
        Write-Host "Deteniendo rollout."
        break
    }

    Write-Host "Weight $weight% aprobado."
    Write-Host "Pausa entre etapas..."
    Start-Sleep -Seconds 10
}

Write-Host "Rollout finalizado!"
