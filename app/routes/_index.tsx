import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.search ? `?${url.searchParams.toString()}` : "";
  return redirect(`/app${search}`);
};
