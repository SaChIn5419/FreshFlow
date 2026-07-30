import re
import io
import uuid
from rapidfuzz import process, fuzz, utils
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.schemas.parser import ParsedItem
from app.repositories import ProductRepository

class ParserService:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    def _normalize_stem(self, word: str) -> str:
        word = re.sub(r"leaves\b", "leaf", word)
        word = re.sub(r"leafy\b", "leaf", word)
        word = re.sub(r"es\b", "", word) if len(word) > 4 else word
        word = re.sub(r"s\b", "", word) if len(word) > 3 else word
        return word

    def _normalize_string(self, text: str) -> str:
        text = text.lower()
        # Normalize produce compound words, spacing, and common variations
        text = re.sub(r"\bwater\s*melon\b", "watermelon", text)
        text = re.sub(r"\bmusk\s*melon\b", "muskmelon", text)
        text = re.sub(r"\bbabycorn\b", "baby corn", text)
        text = re.sub(r"\bsweetcorn\b", "sweet corn", text)
        text = re.sub(r"\bspringonion\b", "spring onion", text)
        text = re.sub(r"\bbeet\s*root\b", "beetroot", text)
        text = re.sub(r"\bguard\b", "gourd", text)
        text = re.sub(r"\bavacado\b", "avocado", text)
        text = re.sub(r"\bchilly\b", "chilli", text)
        text = re.sub(r"\bchili\b", "chilli", text)
        text = re.sub(r"\bladi(?:es|es'|y's|y)?\s*finger\b", "okra", text)
        return text

    def _score_match(self, query: str, target: str):
        q = utils.default_process(self._normalize_string(query))
        t = utils.default_process(self._normalize_string(target))
        if not q or not t:
            return 0.0, 0.0
        
        q_stem = " ".join([self._normalize_stem(w) for w in q.split()])
        t_stem = " ".join([self._normalize_stem(w) for w in t.split()])

        set_score = fuzz.token_set_ratio(q_stem, t_stem)
        sort_score = fuzz.token_sort_ratio(q_stem, t_stem)

        # Boost score if normalized query matches target token (e.g. "watermelon" in "watermelon kiran")
        if q_stem in t_stem or t_stem in q_stem:
            set_score = max(set_score, 95.0)

        total_score = set_score * 100 + sort_score
        
        return total_score, set_score

    def _flatten_table(self, table):
        flattened = []
        for row in table:
            if not any(row): continue
            split_cells = [str(x).split('\n') if x else [] for x in row]
            max_lines = max((len(c) for c in split_cells), default=0)
            for i in range(max_lines):
                new_row = []
                for cell_lines in split_cells:
                    if i < len(cell_lines):
                        new_row.append(cell_lines[i].strip())
                    else:
                        new_row.append("")
                if any(new_row):
                    flattened.append(new_row)
        return flattened

    def parse_pdf(self, file_bytes: bytes, customer_id: uuid.UUID) -> List[ParsedItem]:
        import pdfplumber
        raw_items = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    flattened = self._flatten_table(table)
                    name_idx = -1
                    qty_idx = -1
                    
                    for row in flattened:
                        row_lower = [str(x).lower().strip() for x in row]
                        
                        # Try to detect headers
                        if name_idx == -1 and qty_idx == -1:
                            for idx, cell in enumerate(row_lower):
                                if cell in ["product name", "product", "item", "description", "items"]:
                                    name_idx = idx
                                if cell in ["qty", "quantity", "req qty"]:
                                    qty_idx = idx
                            if name_idx != -1 or qty_idx != -1:
                                continue
                                
                        name = ""
                        qty = 0.0
                        unit = "KG"
                        
                        if name_idx != -1 and qty_idx != -1:
                            if name_idx < len(row) and qty_idx < len(row):
                                name = row[name_idx]
                                qty_str = row[qty_idx]
                                # Clean HSN/SAC codes from names if present (e.g. "06C800CH001")
                                # This regex finds any word with 5+ chars that contains BOTH letters and numbers
                                name = re.sub(r'\b(?=\w*\d)(?=\w*[a-zA-Z])[a-zA-Z0-9]{5,}\b', '', name)
                                name = name.replace('.', '').strip()
                                try:
                                    qty = float(re.sub(r'[^\d.]', '', qty_str))
                                except ValueError:
                                    pass
                        else:
                            # Fallback generic parsing for flattened rows
                            for cell in row:
                                if not cell: continue
                                if re.search(r'\d+', cell) and qty == 0.0:
                                    try:
                                        qty = float(re.sub(r'[^\d.]', '', cell))
                                    except ValueError:
                                        pass
                                elif len(cell) > 3 and not name:
                                    if cell.lower() not in ["product", "item", "description"]:
                                        name = cell
                                        
                        if name and qty > 0:
                            raw_items.append({"name": name, "qty": qty, "unit": unit})

        return self.match_products(raw_items, customer_id)

        return self.match_products(raw_items, customer_id)

    def parse_text(self, text: str, customer_id: uuid.UUID) -> List[ParsedItem]:
        raw_items = []
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Very basic regex: Text followed by a number
            match = re.search(r'^([a-zA-Z\s]+)[\-\:]?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$', line)
            if match:
                name = match.group(1).strip()
                qty = float(match.group(2))
                unit = match.group(3) if match.group(3) else "KG"
                
                raw_items.append({"name": name, "qty": qty, "unit": unit})
            else:
                # Fallback: just look for a number in the string
                num_match = re.search(r'(\d+(?:\.\d+)?)', line)
                if num_match:
                    qty = float(num_match.group(1))
                    name = line.replace(num_match.group(1), '').strip(" -:")
                    unit = "KG"
                    raw_items.append({"name": name, "qty": qty, "unit": unit})

        return self.match_products(raw_items, customer_id)

    def match_products(self, raw_items: List[dict], customer_id: uuid.UUID) -> List[ParsedItem]:
        # Fetch global products
        products, _ = self.product_repo.get_all(skip=0, limit=10000)
        
        # Build dictionary for rapidfuzz
        product_names = {str(p.id): p.name for p in products}
        choices = list(product_names.values())
        name_to_id = {p.name: str(p.id) for p in products}
        id_to_product = {str(p.id): p for p in products}

        results = []
        for item in raw_items:
            raw_name = item["name"]
            
            scored_matches = []
            for p in products:
                total_score, set_score = self._score_match(raw_name, p.name)
                scored_matches.append({
                    "product_id": str(p.id),
                    "product_name": p.name,
                    "unit": p.unit,
                    "scores": (total_score, set_score)
                })
                
            # Sort by total_score DESC
            scored_matches.sort(key=lambda x: x["scores"][0], reverse=True)
            top_matches_data = scored_matches[:15]
            
            best_match = top_matches_data[0] if top_matches_data else None
            
            # Confidence is the set_score of the best match
            confidence = best_match["scores"][1] if best_match else 0.0

            # Map to expected output schema (remove scores so we don't leak tuple formats)
            clean_matches = []
            for m in top_matches_data:
                clean_matches.append({
                    "product_id": m["product_id"],
                    "product_name": m["product_name"],
                    "unit": m["unit"]
                })

            parsed_item = ParsedItem(
                raw_name=raw_name,
                quantity=item["qty"],
                unit=clean_matches[0]["unit"] if clean_matches else item["unit"],
                matched_product_id=uuid.UUID(clean_matches[0]["product_id"]) if confidence > 50 else None,
                matched_product_name=clean_matches[0]["product_name"] if confidence > 50 else None,
                confidence=confidence,
                top_matches=clean_matches
            )
            results.append(parsed_item)

        return results
