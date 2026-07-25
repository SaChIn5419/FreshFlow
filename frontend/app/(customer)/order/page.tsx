"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customerService } from "@/app/services/customers";
import { orderService } from "@/app/services/orders";
import { productService, Product } from "@/app/services/products";
import { useAuth } from "@/app/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Trash2, Sparkles, Check, Grid, Tag, History } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function CustomerOrderPage() {
  const { user } = useAuth();
  
  // Store selections as: { [product_id]: { quantity: number, unit: string } }
  const [selections, setSelections] = useState<Record<string, { quantity: number; unit: string }>>({});
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [addedProducts, setAddedProducts] = useState<Product[]>([]);
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  
  // Catalog Browser State
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>("All");
  const [hasInitializedLastOrder, setHasInitializedLastOrder] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setActiveSuggestionIdx(0);
  }, [searchTerm]);

  // 1. Fetch Customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getCustomers,
    enabled: !!user,
  });

  const myCustomer = useMemo(() => {
    return customers?.find((c) => c.user_id === user?.id);
  }, [customers, user]);

  // 2. Fetch Customer's previous order history to get the last order items
  const { data: previousOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["previousOrders", myCustomer?.id],
    queryFn: orderService.getOrders,
    enabled: !!myCustomer,
  });

  // Extract last order items & quantities
  const lastOrderItems = useMemo(() => {
    if (!previousOrders || previousOrders.length === 0) return [];
    
    // Sort orders by created_at descending
    const sorted = [...previousOrders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastOrder = sorted[0];
    return lastOrder.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product.name,
      product_unit: item.unit,
      last_qty: item.quantity
    }));
  }, [previousOrders]);

  // 3. Fetch templates (their curated product catalog)
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", myCustomer?.id],
    queryFn: () => customerService.getTemplates(myCustomer!.id),
    enabled: !!myCustomer,
  });

  // 4. Fetch all active products
  const { data: allProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  // Auto-initialize active order list with the items from their LAST ORDER
  const lastOrderedProducts = useMemo(() => {
    if (!lastOrderItems || lastOrderItems.length === 0 || !allProducts) return [];
    return allProducts.filter(p => lastOrderItems.some(item => item.product_id === p.id));
  }, [lastOrderItems, allProducts]);

  useEffect(() => {
    if (!hasInitializedLastOrder && lastOrderedProducts.length > 0) {
      setAddedProducts(lastOrderedProducts);
      // Pre-set selection units (but quantity starts at 0 or empty so they enter fresh ones)
      const initialSelections: Record<string, { quantity: number; unit: string }> = {};
      lastOrderItems.forEach(item => {
        initialSelections[item.product_id] = {
          quantity: 0,
          unit: item.product_unit
        };
      });
      setSelections(initialSelections);
      setHasInitializedLastOrder(true);
    }
  }, [lastOrderedProducts, lastOrderItems, hasInitializedLastOrder]);

  const createOrder = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      toast.success("Order submitted successfully!");
      setSelections({});
      setNotes("");
      // Reset active list to last order items again
      if (lastOrderedProducts.length > 0) {
        setAddedProducts(lastOrderedProducts);
        const initialSelections: Record<string, { quantity: number; unit: string }> = {};
        lastOrderItems.forEach(item => {
          initialSelections[item.product_id] = {
            quantity: 0,
            unit: item.product_unit
          };
        });
        setSelections(initialSelections);
      } else {
        setAddedProducts([]);
      }
    },
    onError: () => {
      toast.error("Failed to submit order. Please try again.");
    }
  });

  const handleQuantityChange = (productId: string, value: string, defaultUnit: string) => {
    const currentUnit = selections[productId]?.unit || defaultUnit;
    let num = parseFloat(value);
    
    if (isWholeNumberUnit(currentUnit)) {
      num = isNaN(num) ? 0 : Math.round(num);
    } else {
      num = isNaN(num) ? 0 : num;
    }

    setSelections(prev => ({
      ...prev,
      [productId]: {
        quantity: num,
        unit: prev[productId]?.unit || defaultUnit
      }
    }));
  };

  const handleUnitChange = (productId: string, unit: string) => {
    setSelections(prev => {
      const currentQty = prev[productId]?.quantity || 0;
      const updatedQty = isWholeNumberUnit(unit) ? Math.round(currentQty) : currentQty;
      return {
        ...prev,
        [productId]: {
          unit,
          quantity: updatedQty
        }
      };
    });
  };

  const selectedCount = Object.values(selections).filter(s => s.quantity > 0).length;

  // Active items currently on the order list
  const combinedItems = useMemo(() => {
    return addedProducts.map(p => {
      const historyItem = lastOrderItems.find(item => item.product_id === p.id);
      return {
        product_id: p.id,
        product_name: p.name,
        product_unit: p.unit,
        last_qty: historyItem?.last_qty || null,
        last_unit: historyItem?.product_unit || null
      };
    });
  }, [addedProducts, lastOrderItems]);

  // Autocomplete search suggestions (filtering all database products)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !allProducts) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.is_active && 
      p.name.toLowerCase().includes(term)
    ).slice(0, 5); // Limit to 5 results
  }, [searchTerm, allProducts]);

  const formatUnit = (unit: string) => {
    const u = (unit || "").trim().toLowerCase();
    if (u === "kg" || u === "kilogram") return "KG";
    if (u === "bunch" || u === "bunches") return "Bunch";
    if (u === "packet" || u === "pkt" || u === "packets") return "Packet";
    if (u === "piece" || u === "pc" || u === "pieces") return "Piece";
    if (u === "box" || u === "boxes") return "Box";
    return unit.charAt(0).toUpperCase() + unit.slice(1);
  };

  const isWholeNumberUnit = (unitStr: string) => {
    const u = (unitStr || "").trim().toLowerCase();
    return u === "bunch" || u === "bunches" || 
           u === "packet" || u === "pkt" || u === "packets" || 
           u === "piece" || u === "pc" || u === "pieces" || 
           u === "box" || u === "boxes";
  };

  const getProductCategoryGroup = (product: Product) => {
    const productName = (product.name || "").toLowerCase();
    const category = product.category || "Other";
    const categoryUpper = category.toUpperCase();

    // Indian Mandi Context: Anything that is not locally grown/traditional is classed as "Exotic"
    const isExoticItem = 
      categoryUpper === "EXOTIC" || 
      categoryUpper === "EXOTICS" ||
      productName.includes("broccoli") ||
      productName.includes("zucchini") ||
      productName.includes("lettuce") ||
      productName.includes("cherry tomato") ||
      productName.includes("baby corn") ||
      productName.includes("mushroom") ||
      productName.includes("yellow bell") ||
      productName.includes("red bell") ||
      productName.includes("yellow capsicum") ||
      productName.includes("red capsicum") ||
      productName.includes("celery") ||
      productName.includes("parsley") ||
      productName.includes("basil") ||
      productName.includes("leek") ||
      productName.includes("bok choy") ||
      productName.includes("asparagus") ||
      productName.includes("avocado") ||
      productName.includes("thyme") ||
      productName.includes("rosemary") ||
      productName.includes("oregano") ||
      productName.includes("red cabbage") ||
      productName.includes("chinese cabbage") ||
      productName.includes("jalapeno") ||
      productName.includes("dragon fruit") ||
      productName.includes("kiwi") ||
      productName.includes("passion fruit");

    if (isExoticItem) return "Exotic";
    if (productName.includes("spring onion")) return "Greens & Herbs";
    if (productName.includes("lemon")) return "Vegetables";
    
    if (categoryUpper === "HERBS" || categoryUpper === "LEAFY") return "Greens & Herbs";
    if (categoryUpper === "VEGETABLES" || categoryUpper === "VEGGIES") return "Vegetables";
    if (categoryUpper === "FRUITS" || categoryUpper === "FRUIT") return "Fruits";
    
    return "Other";
  };

  // Catalog Browser Categories
  const catalogCategories = useMemo(() => {
    if (!templates || !allProducts) return ["All"];
    const cats = new Set<string>();
    templates.forEach(t => {
      const prod = allProducts.find(p => p.id === t.product_id);
      if (prod) {
        cats.add(getProductCategoryGroup(prod));
      }
    });

    const list = Array.from(cats).filter(c => c !== "Other");
    if (cats.has("Other")) list.push("Other");
    
    // Standard Mandi order
    const order = ["Greens & Herbs", "Vegetables", "Exotic", "Fruits", "Other"];
    const sortedList = order.filter(o => list.includes(o));
    
    return ["All", ...sortedList];
  }, [templates, allProducts]);

  // Catalog Browser items (curated template products matching selected category)
  const filteredCatalogItems = useMemo(() => {
    if (!templates || !allProducts) return [];
    
    // Resolve full product objects for template items
    const templateProds = allProducts.filter(p => 
      p.is_active && templates.some(t => t.product_id === p.id)
    );

    if (selectedCatalogCategory === "All") return templateProds;
    return templateProds.filter(p => getProductCategoryGroup(p) === selectedCatalogCategory);
  }, [templates, allProducts, selectedCatalogCategory]);

  // Unified function to add item to list, prevent duplicates, scroll and focus input
  const addAndFocusProduct = (product: Product) => {
    const existing = addedProducts.find(p => p.id === product.id);
    
    if (existing) {
      setFocusedProductId(product.id);
      
      // Default to 1 if no quantity set
      if (!selections[product.id] || selections[product.id].quantity === 0) {
        setSelections(prev => ({
          ...prev,
          [product.id]: {
            quantity: 1,
            unit: prev[product.id]?.unit || product.unit
          }
        }));
      }
      return;
    }

    setAddedProducts(prev => [...prev, product]);
    setSelections(prev => ({
      ...prev,
      [product.id]: {
        quantity: 1,
        unit: product.unit
      }
    }));
    setFocusedProductId(product.id);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIdx(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedMatch = searchResults[activeSuggestionIdx];
      if (selectedMatch) {
        addAndFocusProduct(selectedMatch);
        setSearchTerm("");
        toast.success(`Selected ${selectedMatch.name}`);
      }
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, productId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchTerm("");
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
    setSelections(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Focus and scroll side effects
  useEffect(() => {
    if (focusedProductId) {
      const el = quantityRefs.current[focusedProductId];
      if (el) {
        el.focus();
        el.select();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedProductId, combinedItems]);

  useEffect(() => {
    if (focusedProductId) {
      const timer = setTimeout(() => setFocusedProductId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [focusedProductId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCustomer) return;

    const items = Object.entries(selections)
      .filter(([_, data]) => data.quantity > 0)
      .map(([productId, data]) => ({
        product_id: productId,
        quantity: data.quantity,
        unit: data.unit
      }));

    if (items.length === 0) {
      toast.error("Please select at least one product with a quantity greater than 0.");
      return;
    }

    createOrder.mutate({
      customer_id: myCustomer.id,
      items,
      remarks: notes,
    });
  };

  if (isLoadingCustomers || isLoadingTemplates || isLoadingOrders) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!myCustomer) {
    return (
      <div className="p-6 text-center text-red-600">
        Customer profile not found. Please contact support.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pb-32 max-w-2xl mx-auto px-4">
      {/* Premium Header */}
      <div className="py-6 border-b border-gray-100 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Order</h1>
          <p className="text-sm text-gray-500 mt-1">Pre-populated with items from your last order.</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{myCustomer.restaurant_name}</span>
        </div>
      </div>

      {/* Autocomplete Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          <Input 
            id="search-input"
            ref={searchInputRef}
            placeholder="Search catalog... e.g. Onion, Tomato, Mint" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-12 pr-4 h-12 text-base border-gray-200 focus:border-green-500 focus:ring-green-500 shadow-sm rounded-lg"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <Card className="absolute w-full mt-1.5 z-20 overflow-hidden shadow-xl border border-gray-150 rounded-lg">
            <div className="bg-gray-50 px-4 py-1.5 border-b text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Matching Products</span>
              <span>Hit Enter to Select First</span>
            </div>
            <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto bg-white">
              {searchResults.map((p, idx) => {
                const isAlreadyInList = combinedItems.some(i => i.product_id === p.id);
                const isActive = idx === activeSuggestionIdx;
                return (
                  <li 
                    key={p.id} 
                    className={`p-3.5 hover:bg-green-50/50 cursor-pointer flex justify-between items-center transition-all ${
                      isActive 
                        ? "bg-green-50 text-green-900 border-l-4 border-green-700 pl-2.5 font-semibold" 
                        : "bg-white text-gray-900"
                    }`}
                    onClick={() => {
                      addAndFocusProduct(p);
                      setSearchTerm("");
                      toast.success(`Selected ${p.name}`);
                    }}
                  >
                    <span className="text-gray-900 font-medium">
                      {p.name}
                      {isAlreadyInList && (
                        <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded ml-2 font-bold tracking-wide">
                          On Active List
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-gray-150 px-2 py-0.5 rounded-full">{p.category}</span>
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">{p.unit}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {/* 🚀 A Better Way: Collapsible Catalog Browser Grid */}
      <Card className="p-4 border border-gray-200 shadow-sm rounded-lg mb-8 bg-gray-50/30">
        <div className="flex items-center justify-between pb-3 border-b mb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
            <Grid className="w-4 h-4 text-green-700" />
            <span>Browse Restaurant Catalog</span>
          </div>
          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">Quick Selection</span>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {catalogCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCatalogCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedCatalogCategory === cat
                  ? "bg-green-700 text-white border-green-700 shadow-sm"
                  : "bg-white hover:bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Items grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredCatalogItems.map((p) => {
            const isSelected = addedProducts.some(item => item.id === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addAndFocusProduct(p)}
                className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex justify-between items-center ${
                  isSelected
                    ? "bg-green-50/50 border-green-300 text-green-800"
                    : "bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 border-gray-200"
                }`}
              >
                <span className="truncate mr-1">{p.name}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <Tag className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
          {filteredCatalogItems.length === 0 && (
            <div className="col-span-full text-center py-4 text-xs text-gray-400">
              No products found in this category.
            </div>
          )}
        </div>
      </Card>

      {/* Active Order List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <History className="w-4 h-4 text-green-600" />
            <span>Active Order List</span>
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-wider">{combinedItems.length} items to configure</span>
        </div>

        {combinedItems.map((item) => {
          const availableUnitsRaw = (item.product_unit || "KG").split(",").map(u => u.trim()).filter(Boolean);
          if (!availableUnitsRaw.some(u => u.toUpperCase() === "KG")) {
            availableUnitsRaw.push("KG");
          }
          const availableUnits = Array.from(new Set(availableUnitsRaw.map(formatUnit)));
          const defaultUnit = availableUnits[0];
          const currentSelection = selections[item.product_id];
          const currentUnit = formatUnit(currentSelection?.unit || defaultUnit);
          
          const isFocused = focusedProductId === item.product_id;
          const hasQty = (currentSelection?.quantity || 0) > 0;
          const hasHistory = item.last_qty !== null;

          return (
            <Card 
              key={item.product_id} 
              className={`p-3.5 flex items-center justify-between border shadow-sm transition-all duration-300 ${
                isFocused 
                  ? "border-green-500 ring-2 ring-green-100 bg-green-50/20 scale-[1.01]" 
                  : hasQty 
                  ? "border-green-200 bg-white" 
                  : "border-gray-150 bg-white"
              }`}
            >
              <div className="flex flex-col pr-2">
                <span className="font-semibold text-gray-900">{item.product_name}</span>
                {hasHistory && (
                  <span className="text-[10px] text-gray-500 flex items-center mt-1 font-medium">
                    <History className="w-3 h-3 mr-1 text-gray-400" />
                    Last ordered: {item.last_qty} {formatUnit(item.last_unit || "")}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2.5 flex-shrink-0">
                <div className="w-20">
                  <Input
                    ref={(el) => {
                      if (el) quantityRefs.current[item.product_id] = el;
                    }}
                    type="number"
                    step={isWholeNumberUnit(currentUnit) ? "1" : "any"}
                    min="0"
                    placeholder="0"
                    className="text-right text-base font-semibold h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    value={currentSelection?.quantity || ""}
                    onChange={(e) => handleQuantityChange(item.product_id, e.target.value, defaultUnit)}
                    onKeyDown={(e) => handleQuantityKeyDown(e, item.product_id)}
                  />
                </div>
                
                {availableUnits.length > 1 ? (
                  <select 
                    className="h-11 border border-gray-250 rounded-md px-2 bg-white text-xs font-semibold focus:border-green-500 focus:ring-green-500 outline-none cursor-pointer"
                    value={currentUnit}
                    onChange={(e) => handleUnitChange(item.product_id, e.target.value)}
                  >
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-500 text-xs font-bold w-12 text-center bg-gray-50 border border-gray-150 rounded-md py-3">{defaultUnit}</span>
                )}

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveProduct(item.product_id)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}

        {combinedItems.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <p className="text-gray-500 font-medium">Your order list starts empty.</p>
            <p className="text-xs text-gray-400 mt-1">Search or use the Browse Catalog browser above to add items.</p>
          </div>
        )}

        {/* Special Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
          <Label htmlFor="remarks" className="text-sm font-semibold text-gray-700">Special Instructions / Remarks</Label>
          <Textarea 
            id="remarks"
            placeholder="e.g. Please deliver before 9:00 AM, select small-sized potatoes..." 
            className="resize-none border-gray-200 focus:border-green-500 focus:ring-green-500" 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-xl max-w-lg mx-auto z-10 rounded-t-xl">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-center text-gray-500 font-bold uppercase tracking-wider">
            {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'} with quantity selected
          </div>
          <Button 
            type="submit" 
            className="w-full bg-green-700 hover:bg-green-800 h-12 text-base font-semibold shadow-lg shadow-green-100 transition-all rounded-lg"
            disabled={createOrder.isPending || selectedCount === 0}
          >
            {createOrder.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Order...
              </span>
            ) : "Submit Order Request"}
          </Button>
        </div>
      </div>
    </form>
  );
}
