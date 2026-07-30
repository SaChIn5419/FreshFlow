from pathlib import Path
from datetime import datetime, timezone
import zoneinfo
from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
IST_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")

_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)


def format_ist(dt: datetime | None) -> str:
    if not dt:
        dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_dt = dt.astimezone(IST_TZ)
    return ist_dt.strftime("%d %b %Y, %I:%M %p IST")


def number_to_words_inr(number: float) -> str:
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_below_thousand(n):
        res = []
        if n >= 100:
            res.append(units[n // 100] + " Hundred")
            n %= 100
        if n >= 20:
            res.append(tens[n // 10])
            n %= 10
        elif n >= 10:
            res.append(teens[n - 10])
            n = 0
        if n > 0:
            res.append(units[n])
        return " ".join(res)

    amount = round(float(number), 2)
    rs = int(amount)
    paise = int(round((amount - rs) * 100))

    if rs == 0:
        rs_str = "Zero"
    else:
        parts = []
        crore = rs // 10000000
        rs %= 10000000
        lakh = rs // 100000
        rs %= 100000
        thousand = rs // 1000
        rs %= 1000
        hundreds = rs

        if crore > 0:
            parts.append(convert_below_thousand(crore) + " Crore")
        if lakh > 0:
            parts.append(convert_below_thousand(lakh) + " Lakh")
        if thousand > 0:
            parts.append(convert_below_thousand(thousand) + " Thousand")
        if hundreds > 0:
            parts.append(convert_below_thousand(hundreds))
        rs_str = " ".join(parts)

    result = f"Rupees {rs_str}"
    if paise > 0:
        result += f" and {convert_below_thousand(paise)} Paise"
    result += " Only"
    return result


def render_invoice(invoice, customer, settings) -> str:
    template = _env.get_template("invoice.html")
    amount_words = number_to_words_inr(invoice.grand_total)
    total_items_count = len(invoice.items) if invoice.items else 0
    total_qty_sum = sum(float(i.quantity) for i in invoice.items) if invoice.items else 0
    formatted_ist_date = format_ist(invoice.created_at)

    return template.render(
        invoice=invoice,
        customer=customer,
        settings=settings,
        amount_words=amount_words,
        total_items_count=total_items_count,
        total_qty_sum=total_qty_sum,
        formatted_ist_date=formatted_ist_date,
    )


def render_packing_slip(order, customer, settings) -> str:
    template = _env.get_template("packing_slip.html")
    return template.render(order=order, customer=customer, settings=settings)


def render_to_pdf(html: str) -> bytes:
    from weasyprint import HTML
    return HTML(string=html, base_url=str(TEMPLATES_DIR)).write_pdf()
