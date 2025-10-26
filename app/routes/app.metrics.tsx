import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Layout, Card, Text, DataTable, Badge, Banner } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import prisma from '~/db.server';
import { percentile } from '~/utils/stats';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  
  // Load all web vital events
  const allEvents = await prisma.webVitalEvent.findMany({
    where: { ts: { gte: since } },
    select: { kind: true, value: true, rating: true, ts: true },
    orderBy: { ts: 'desc' },
  });

  // Load session token events
  const sessionTokenEvents = await prisma.sessionTokenEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { success: true, endpoint: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Group events by kind
  const eventsByKind = allEvents.reduce((acc, event) => {
    if (!acc[event.kind]) acc[event.kind] = [];
    acc[event.kind].push(event);
    return acc;
  }, {} as Record<string, typeof allEvents>);

  // Calculate metrics for each web vital
  const webVitalsMetrics = Object.entries(eventsByKind).map(([kind, events]) => {
    const values = events.map(e => e.value);
    const p75 = percentile(values, 75);
    const p95 = percentile(values, 95);
    
    // Calculate performance rating based on kind
    const getRating = (p75: number, kind: string) => {
      switch (kind) {
        case 'INP':
          if (p75 <= 200) return { tone: 'success' as const, text: 'Excellent' };
          if (p75 <= 500) return { tone: 'warning' as const, text: 'Good' };
          return { tone: 'critical' as const, text: 'Needs Improvement' };
        case 'CLS':
          if (p75 <= 0.1) return { tone: 'success' as const, text: 'Excellent' };
          if (p75 <= 0.25) return { tone: 'warning' as const, text: 'Good' };
          return { tone: 'critical' as const, text: 'Needs Improvement' };
        case 'LCP':
          if (p75 <= 2500) return { tone: 'success' as const, text: 'Excellent' };
          if (p75 <= 4000) return { tone: 'warning' as const, text: 'Good' };
          return { tone: 'critical' as const, text: 'Needs Improvement' };
        case 'FCP':
          if (p75 <= 1800) return { tone: 'success' as const, text: 'Excellent' };
          if (p75 <= 3000) return { tone: 'warning' as const, text: 'Good' };
          return { tone: 'critical' as const, text: 'Needs Improvement' };
        case 'TTFB':
          if (p75 <= 800) return { tone: 'success' as const, text: 'Excellent' };
          if (p75 <= 1800) return { tone: 'warning' as const, text: 'Good' };
          return { tone: 'critical' as const, text: 'Needs Improvement' };
        default:
          return { tone: 'warning' as const, text: 'Unknown' };
      }
    };

    return {
      kind,
      count: values.length,
      p75,
      p95,
      rating: getRating(p75, kind),
      recentEvents: events.slice(0, 5)
    };
  });

  // Calculate session token metrics
  const totalTokenEvents = sessionTokenEvents.length;
  const successfulTokenEvents = sessionTokenEvents.filter(e => e.success).length;
  const successRate = totalTokenEvents > 0 ? (successfulTokenEvents / totalTokenEvents) * 100 : 0;
  
  const tokenRating = successRate >= 95 
    ? { tone: 'success' as const, text: 'Excellent' }
    : successRate >= 80 
    ? { tone: 'warning' as const, text: 'Good' }
    : { tone: 'critical' as const, text: 'Needs Improvement' };

  return json({ 
    webVitalsMetrics,
    sessionTokenMetrics: {
      totalEvents: totalTokenEvents,
      successfulEvents: successfulTokenEvents,
      successRate: Math.round(successRate * 100) / 100,
      rating: tokenRating,
      recentEvents: sessionTokenEvents.slice(0, 10)
    }
  });
}

export default function MetricsPage() {
  const { webVitalsMetrics, sessionTokenMetrics } = useLoaderData<typeof loader>();

  return (
    <Page 
      title="Performance & Authentication Metrics" 
      subtitle="Core Web Vitals & Session Token Authentication - Last 28 Days"
      backAction={{ content: 'Back to App', url: '/app' }}
    >
      <Layout>
        <Layout.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Session Token Authentication Banner */}
            <Banner
              title="Session Token Authentication"
              tone={sessionTokenMetrics.rating.tone}
            >
              <p>
                Session token authentication is <strong>{sessionTokenMetrics.rating.text}</strong> with a success rate of {sessionTokenMetrics.successRate}%.
                {sessionTokenMetrics.rating.tone === 'success' && ' Excellent! Your app meets Shopify authentication standards.'}
                {sessionTokenMetrics.rating.tone === 'warning' && ' Consider monitoring authentication issues.'}
                {sessionTokenMetrics.rating.tone === 'critical' && ' Authentication needs attention to meet Shopify standards.'}
              </p>
            </Banner>

            {/* Session Token Metrics Card */}
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Session Token Authentication
                </Text>
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <Text as="p" variant="bodyMd" color="subdued">Total Events</Text>
                    <Text as="p" variant="headingLg">{sessionTokenMetrics.totalEvents}</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" color="subdued">Successful</Text>
                    <Text as="p" variant="headingLg">{sessionTokenMetrics.successfulEvents}</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" color="subdued">Success Rate</Text>
                    <Text as="p" variant="headingLg" tone={sessionTokenMetrics.rating.tone}>{sessionTokenMetrics.successRate}%</Text>
                    <Text as="p" variant="bodySm" color="subdued">Target: ≥ 95%</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" color="subdued">Status</Text>
                    <Badge tone={sessionTokenMetrics.rating.tone}>{sessionTokenMetrics.rating.text}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Core Web Vitals Cards */}
            {webVitalsMetrics.map((metric) => (
              <Card key={metric.kind}>
                <div style={{ padding: '1.5rem' }}>
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    {metric.kind} Performance
                  </Text>
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <Text as="p" variant="bodyMd" color="subdued">Total Events</Text>
                      <Text as="p" variant="headingLg">{metric.count}</Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodyMd" color="subdued">p75 {metric.kind}</Text>
                      <Text as="p" variant="headingLg" tone={metric.rating.tone}>
                        {metric.kind === 'CLS' ? metric.p75.toFixed(3) : `${Math.round(metric.p75)}ms`}
                      </Text>
                      <Text as="p" variant="bodySm" color="subdued">
                        Target: {metric.kind === 'INP' ? '≤ 200ms' : 
                                metric.kind === 'CLS' ? '≤ 0.1' :
                                metric.kind === 'LCP' ? '≤ 2.5s' :
                                metric.kind === 'FCP' ? '≤ 1.8s' :
                                metric.kind === 'TTFB' ? '≤ 800ms' : 'N/A'}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodyMd" color="subdued">p95 {metric.kind}</Text>
                      <Text as="p" variant="headingLg">
                        {metric.kind === 'CLS' ? metric.p95.toFixed(3) : `${Math.round(metric.p95)}ms`}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodyMd" color="subdued">Status</Text>
                      <Badge tone={metric.rating.tone}>{metric.rating.text}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Recent Events */}
            {sessionTokenMetrics.recentEvents.length > 0 && (
              <Card>
                <div style={{ padding: '1.5rem' }}>
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Recent Session Token Events
                  </Text>
                  <div style={{ marginTop: '1rem' }}>
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text']}
                      headings={['Time', 'Endpoint', 'Success', 'Status']}
                      rows={sessionTokenMetrics.recentEvents.map(event => [
                        new Date(event.createdAt).toLocaleString(),
                        event.endpoint,
                        event.success ? 'Yes' : 'No',
                        <Badge tone={event.success ? 'success' : 'critical'}>
                          {event.success ? 'Success' : 'Failed'}
                        </Badge>
                      ])}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* No Data State */}
            {webVitalsMetrics.length === 0 && sessionTokenMetrics.totalEvents === 0 && (
              <Card>
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <Text as="p" variant="bodyMd" color="subdued">
                    No performance data available yet. The app will automatically collect metrics as users interact with it.
                  </Text>
                </div>
              </Card>
            )}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
