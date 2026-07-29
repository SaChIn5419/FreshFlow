"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orderService, ParsedItem } from "@/app/services/orders";
import { customerService } from "@/app/services/customers";
import { productService } from "@/app/services/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STANDARD_UNITS = ["kg", "gm", "Piece", "Bunch", "Packet", "Box", "Dozen", "Litre"];

export default function OrderUploadPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getCustomers,
  });

  const { data: allProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  const parsePdf = useMutation({
    mutationFn: (file: File) => orderService.parsePdfOrder(customerId, file),
    onSuccess: (data) => {
      setParsedItems(data.items);
      setIsReviewing(true);
      toast.success(`Parsed ${data.items.length} items`);
    },
    onError: () => toast.error("Failed to parse PDF"),
  });

  const parseText = useMutation({
    mutationFn: () => orderService.parseTextOrder(customerId, textInput),
    onSuccess: (data) => {
      setParsedItems(data.items);
      setIsReviewing(true);
      toast.success(`Parsed ${data.items.length} items`);
    },
    onError: () => toast.error("Failed to parse text"),
  });

  const createOrder = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      toast.success("Order created successfully!");
      router.push("/orders");
    },
    onError: () => toast.error("Failed to create order"),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!customerId) {
      toast.error("Please select a customer first.");
      return;
    }
    parsePdf.mutate(file);
  };

  const handleTextSubmit = () => {
    if (!customerId) {
      toast.error("Please select a customer first.");
      return;
    }
    if (!textInput.trim()) {
      toast.error("Please enter some text.");
      return;
    }
    parseText.mutate();
  };

  const handleOverrideMatch = (index: number, matchId: string) => {
    const newItems = [...parsedItems];
    const item = newItems[index];
    
    // Check in top_matches first
    const selectedTop = item.top_matches.find(m => m.product_id === matchId);
    if (selectedTop) {
      item.matched_product_id = selectedTop.product_id;
      item.matched_product_name = selectedTop.product_name;
      item.unit = selectedTop.unit;
      item.confidence = 100;
    } else {
      // Check in catalog
      const catalogProd = allProducts?.find(p => p.id === matchId);
      if (catalogProd) {
        item.matched_product_id = catalogProd.id;
        item.matched_product_name = catalogProd.name;
        item.unit = catalogProd.unit;
        item.confidence = 100;
      }
    }
    setParsedItems(newItems);
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const newItems = [...parsedItems];
    newItems[index].quantity = newQty;
    setParsedItems(newItems);
  };

  const handleUnitChange = (index: number, newUnit: string) => {
    const newItems = [...parsedItems];
    newItems[index].unit = newUnit;
    setParsedItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = parsedItems.filter((_, i) => i !== index);
    setParsedItems(newItems);
  };

  const handleSubmitOrder = () => {
    // Filter out items that are not matched
    const validItems = parsedItems.filter(item => item.matched_product_id);
    
    if (validItems.length === 0) {
      toast.error("No valid matched items to create order.");
      return;
    }

    createOrder.mutate({
      customer_id: customerId,
      items: validItems.map(item => ({
        product_id: item.matched_product_id!,
        quantity: item.quantity,
        unit: item.unit
      })),
      remarks: "Created via Parser"
    });
  };

  if (isLoadingCustomers) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-green-700" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Upload Order</h1>
        <p className="text-sm text-gray-500">Extract order items from a PDF or WhatsApp message.</p>
      </div>

      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 flex items-center gap-4">
        <div className="w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">1. Select Customer *</label>
          <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a restaurant..." />
            </SelectTrigger>
            <SelectContent>
              {customers?.filter(c => c.is_active).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.restaurant_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isReviewing ? (
        <div className="grid grid-cols-2 gap-6">
          <Card className={`border-dashed border-2 ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="font-medium text-lg mb-2">Upload Purchase Order</h3>
              <p className="text-sm text-gray-500 mb-6">PDF files only. Ensure the table is clean.</p>
              
              <input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={handleFileUpload} />
              <Button onClick={() => document.getElementById('pdf-upload')?.click()} className="bg-green-700 hover:bg-green-800" disabled={parsePdf.isPending}>
                {parsePdf.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Select PDF
              </Button>
            </CardContent>
          </Card>

          <Card className={`${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4 text-gray-700">
                <FileText className="w-5 h-5 mr-2" />
                <h3 className="font-medium">Paste WhatsApp Text</h3>
              </div>
              <Textarea 
                placeholder="E.g. Tomato 5kg&#10;Onion 10kg"
                className="flex-1 resize-none mb-4"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
              <Button 
                onClick={handleTextSubmit} 
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={parseText.isPending}
              >
                {parseText.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Extract Items"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-medium">2. Review Extracted Items</h3>
              <Button variant="outline" size="sm" onClick={() => setIsReviewing(false)}>Start Over</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extracted Name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matched Product</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-gray-600 font-medium">"{item.raw_name}"</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min={0}
                          step="any"
                          className="w-20 h-8" 
                          value={item.quantity} 
                          onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)} 
                        />
                        <Select value={item.unit} onValueChange={(val) => handleUnitChange(idx, val || "")}>
                          <SelectTrigger className="w-24 h-8 text-xs text-gray-500">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_UNITS.map(u => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                            {!STANDARD_UNITS.includes(item.unit) && item.unit && (
                              <SelectItem value={item.unit}>{item.unit}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.confidence > 70 ? (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {item.confidence.toFixed(0)}% Match
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Review Needed
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.confidence > 70 ? (
                        <span className="font-bold text-gray-800">{item.matched_product_name}</span>
                      ) : (
                        <Select 
                          value={item.matched_product_id || ""} 
                          onValueChange={(val) => handleOverrideMatch(idx, val || "")}
                        >
                          <SelectTrigger className="h-9 border-amber-300 rounded-xl bg-white font-semibold text-gray-800">
                            <SelectValue placeholder={item.matched_product_name || "Select matching produce..."}>
                              {item.matched_product_name ? item.matched_product_name : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200">
                            {item.top_matches.length > 0 && (
                              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-800 bg-green-50">
                                Suggested AI Matches
                              </div>
                            )}
                            {item.top_matches.map(m => (
                              <SelectItem key={m.product_id} value={m.product_id} className="font-semibold text-gray-800">
                                🎯 {m.product_name} ({m.unit})
                              </SelectItem>
                            ))}
                            {allProducts && allProducts.length > 0 && (
                              <>
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border-t border-gray-100">
                                  All Farm Produce Catalog
                                </div>
                                {allProducts
                                  .filter(p => !item.top_matches.some(tm => tm.product_id === p.id))
                                  .map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-gray-700">
                                      {p.name} ({p.unit})
                                    </SelectItem>
                                  ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button onClick={handleSubmitOrder} className="bg-green-700 hover:bg-green-800" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Creating..." : "Confirm & Create Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
