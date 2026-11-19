"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { NavProduct } from "@/content/types";

const NavProductsContext = createContext<readonly NavProduct[]>([]);

/**
 * Gives the header menus their product list. The root layout builds the list on the server (navProducts)
 * and passes it in here, so the menus do not import the products, whose full copy would then be in every
 * page's JavaScript. A context, not props through Header and DesktopNav, which have no use for the list.
 */
export function NavProductsProvider({ products, children }: { products: readonly NavProduct[]; children: ReactNode }) {
  return <NavProductsContext.Provider value={products}>{children}</NavProductsContext.Provider>;
}

/** The products the header menus list, in display order. */
export function useNavProducts(): readonly NavProduct[] {
  return useContext(NavProductsContext);
}
