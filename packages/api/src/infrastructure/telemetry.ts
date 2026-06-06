import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';
import type { Meter } from '@opentelemetry/api';

const prometheusExporter = new PrometheusExporter({
  port: Number(process.env.OTEL_METRICS_PORT ?? '9464'),
  endpoint: '/metrics',
  preventServerStart: process.env.NODE_ENV === 'test',
});

const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) =>
          req.url?.startsWith('/metrics') ?? false,
      },
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-pino': { enabled: false },
    }),
  ],
});

sdk.start();

const meter = metrics.getMeter(
  process.env.OTEL_SERVICE_NAME ?? 'alentapp-api',
  process.env.OTEL_SERVICE_VERSION ?? '1.0.0'
);

const memoryGauge = meter.createObservableGauge('process.memory.usage', {
  description: 'Uso de memoria heap del proceso Node.js',
  unit: 'By',
});

meter.addBatchObservableCallback(
  (observableResult) => {
    observableResult.observe(memoryGauge, process.memoryUsage().heapUsed);
  },
  [memoryGauge]
);

export function createREDMetrics(m: Meter = meter) {
  const requestCounter = m.createCounter('http.requests.total', {
    description: 'Total de requests HTTP recibidos',
    unit: '{request}',
  });

  const errorCounter = m.createCounter('http.requests.errors', {
    description: 'Total de requests HTTP con error (4xx/5xx)',
    unit: '{request}',
  });

  const requestDuration = m.createHistogram('http.request.duration', {
    description: 'Duración de cada request HTTP desde recepción hasta respuesta',
    unit: 'ms',
    advice: {
      explicitBucketBoundaries: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
    },
  });

  return { requestCounter, errorCounter, requestDuration };
}

export { sdk, meter, prometheusExporter };
