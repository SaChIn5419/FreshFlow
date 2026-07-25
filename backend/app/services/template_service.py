from pathlib import Path
from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)


def render_invoice(invoice, customer, settings) -> str:
    template = _env.get_template("invoice.html")
    return template.render(invoice=invoice, customer=customer, settings=settings)


def render_packing_slip(order, customer, settings) -> str:
    template = _env.get_template("packing_slip.html")
    return template.render(order=order, customer=customer, settings=settings)


def render_to_pdf(html: str) -> bytes:
    from weasyprint import HTML
    return HTML(string=html, base_url=str(TEMPLATES_DIR)).write_pdf()
