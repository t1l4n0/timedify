import { Card, DataTable, Button } from "@shopify/polaris";
import type { Plan } from "../routes/app.plans/route";

export type PlanListProps = {
  plans: Plan[];
  sortColumn: "name" | "price";
  sortAscending: boolean;
  onSortToggle: (column: "name" | "price") => void;
};

export function PlanList({ plans, sortColumn, sortAscending, onSortToggle }: PlanListProps) {
  const rows = plans.map((p) => [
    p.name,
    `${p.priceAmount.toFixed(2)} ${p.currencyCode}`,
    p.status
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "numeric", "text"]}
        headings={[
          <Button plain onClick={() => onSortToggle("name")} key="h-name">
            Name {sortColumn === "name" ? (sortAscending ? "▲" : "▼") : ""}
          </Button>,
          <Button plain onClick={() => onSortToggle("price")} key="h-price">
            Price {sortColumn === "price" ? (sortAscending ? "▲" : "▼") : ""}
          </Button>,
          "Status",
        ]}
        rows={rows}
      />
    </Card>
  );
}
