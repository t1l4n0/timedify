import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Layout, Card, Text, DataTable } from '@shopify/polaris';
import prisma from '~/db.server';
import { percentile } from '~/utils/stats';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const events = await prisma.webVitalEvent.findMany({
      where: { kind: 'INP', ts: { gte: since } },
      select: { valueMs: true, rating: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const values = events.map(e => e.valueMs);
    const p75 = percentile(values, 75);
    const p95 = percentile(values, 95);

    return json({ 
      count: values.length, 
      p75, 
      p95, 
      recentEvents: events.map(e => ({
        value: e.valueMs,
        rating: e.rating,
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error('Database error:', error);
    return json({ 
      count: 0, 
      p75: 0, 
      p95: 0, 
      recentEvents: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default function TestMetricsPage() {
  const { count, p75, p95, recentEvents, error } = useLoaderData<typeof loader>();

  return (
    <Page title="INP Metrics Test (Last 28 Days)">
      <Layout>
        {error && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '1rem' }}>
                <Text as="p" variant="bodyMd" tone="critical">
                  Error: {error}
                </Text>
              </div>
            </Card>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <DataTable
                columnContentTypes={['text', 'numeric']}
                headings={['Metric', 'Value']}
                rows={[
                  ['Event Count', count.toString()],
                  ['p75 (ms)', p75.toString()],
                  ['p95 (ms)', p95.toString()],
                ]}
              />
              <div style={{ marginTop: '1rem', color: '#6d7175' }}>
                <Text as="p" variant="bodySm">
                  Target: p75 ≤ 200ms (good), ≤ 500ms (needs improvement)
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text as="h3" variant="headingMd">Recent Events</Text>
              <DataTable
                columnContentTypes={['numeric', 'text', 'text']}
                headings={['Value (ms)', 'Rating', 'Created']}
                rows={recentEvents.map(e => [
                  e.value.toString(),
                  e.rating,
                  new Date(e.createdAt).toLocaleString()
                ])}
              />
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
