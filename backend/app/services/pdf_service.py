class PDFService:
    @staticmethod
    def generate_pdf_from_html(html_content: str, output_path: str):
        """
        Abstracts PDF generation. Currently uses WeasyPrint.
        Can be swapped later to ReportLab or other libraries.
        """
        from weasyprint import HTML
        HTML(string=html_content).write_pdf(output_path)
