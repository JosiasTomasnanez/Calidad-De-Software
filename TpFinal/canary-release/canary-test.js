import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// URL base
const BASE_URL = __ENV.BASE_URL || 'http://localhost';

// Configuración del test
export let options = {
    stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
    ],
};

// Métricas personalizadas
export const v1Count = new Counter('version_v1');
export const v2Count = new Counter('version_v2');

export default function () {
    const res = http.get(BASE_URL);

    check(res, { 'status 200': (r) => r.status === 200 });

    const body = res.body || "";

    if (body.includes("V1")) {
        v1Count.add(1);
    } else if (body.includes("V2")) {
        v2Count.add(1);
    }

    sleep(0.5);
}

// ---- FIX DEL ERROR EN EL 100% ----
export function handleSummary(data) {
    const v1 = data.metrics.version_v1 ? data.metrics.version_v1.values.count : 0;
    const v2 = data.metrics.version_v2 ? data.metrics.version_v2.values.count : 0;
    const weight = __ENV.CANARY_WEIGHT || "???";

    console.log(`
        ================================
          SUMMARY - CANARY REPORT
        ================================
        Canary Weight aplicado : ${weight}%
        Tráfico V1: ${v1}
        Tráfico V2: ${v2}
        -------------------------------
    `);

    return {};
}
