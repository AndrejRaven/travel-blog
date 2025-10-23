import { getHeaderData } from "@/lib/queries/functions";
import { getHierarchicalCategories } from "./header-data";
import HeaderClient from "./HeaderClient";

export default async function HeaderServer() {
  // Pobierz dane header z Sanity na serwerze
  const [headerData, hierarchicalCategories] = await Promise.all([
    getHeaderData(),
    getHierarchicalCategories(),
  ]);

  return (
    <HeaderClient
      headerData={headerData}
      hierarchicalCategories={hierarchicalCategories}
    />
  );
}
