import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// URL base
const BASE_URL = __ENV.BASE_URL || 'http://localhost';

// Configuración del test
export let options = {
    stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
    ],

    // -------------------------
    //     THRESHOLDS
    // -------------------------
    thresholds: {
        // Si la latencia p95 es mayor a 500 ms → FAIL
        'latencia': ['p(95) < 300'],

        // Si menos de 98% de requests son exitosas → FAIL
        'success_rate': ['rate > 0.98']
    }
};

// Métricas personalizadas
export const v1Count = new Counter('version_v1');
export const v2Count = new Counter('version_v2');

// Métricas básicas adicionales de performance
export const latency = new Trend('latencia');
export const successRate = new Rate('success_rate');

export default function () {

    const res = http.get(BASE_URL);

    // Métricas estándar
    check(res, { 'status 200': (r) => r.status === 200 });
    latency.add(res.timings.duration);
    successRate.add(res.status === 200);

    // Canary tracking
    const body = res.body || "";
    if (body.includes("V1")) {
        v1Count.add(1);
    } else if (body.includes("V2")) {
        v2Count.add(1);
    }

    sleep(0.5);
}

// ---- SUMMARY ----
export function handleSummary(data) {

    const v1 = data.metrics.version_v1?.values?.count ?? 0;
    const v2 = data.metrics.version_v2?.values?.count ?? 0;
    const weight = __ENV.CANARY_WEIGHT || "???";

    console.log(`
        ================================
          SUMMARY - CANARY REPORT
        ================================
        Canary Weight aplicado : ${weight}%
        Tráfico V1: ${v1}
        Tráfico V2: ${v2}
        -------------------------------
        Métricas básicas:
        - Latencia promedio: ${data.metrics.latencia?.values?.avg?.toFixed(2)} ms
        - Latencia p95: ${data.metrics.latencia?.values['p(95)']?.toFixed(2)} ms
        - Tasa de éxito: ${(data.metrics.success_rate?.values?.rate * 100).toFixed(2)} %
        ================================
    `);

    return {};
}
