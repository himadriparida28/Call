import os
import re
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically render headers, footers, and page numbers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        # Draw header on all pages except cover/first page
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0B1D48"))
            self.drawString(54, 750, "AAVEDAN SETU — SYSTEM WORKFLOWS REPORT")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            self.restoreState()

        # Draw footer on all pages
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 55, 558, 55)

        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, footer_text)
        self.drawString(54, 40, "Aavedan Setu System Internals · SIH 2026 Documentation")
        self.restoreState()

def clean_md_text(text):
    """
    Translates basic markdown formatting into HTML tags supported by ReportLab's Paragraph.
    """
    # Escape ampersands and angle brackets first so raw HTML in text/code blocks isn't parsed as tags
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Replace bold **text** with <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Replace italics *text* with <i>text</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Replace code `text` with font tag
    text = re.sub(r'`(.*?)`', r'<font face="Courier" color="#0F172A"><b>\1</b></font>', text)
    # Clean up double math signs
    text = text.replace("$$", "")
    return text

def convert_md_to_pdf(md_path, pdf_path):
    if not os.path.exists(md_path):
        print(f"Error: Markdown file {md_path} not found.")
        sys.exit(1)

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0B1D48'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0B1D48'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#B45309'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#334155')
    )

    story = []
    
    in_code_block = False
    code_content = []
    
    in_table = False
    table_rows = []

    in_list = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Handle Code Block
        if stripped.startswith("```"):
            if in_code_block:
                # End of code block
                in_code_block = False
                
                # Check length of code block
                if len(code_content) < 25:
                    # Small code block: keep it wrapped in a styled table
                    code_text = "\n".join(code_content)
                    p_code = Paragraph(code_text.replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)
                    t_code = Table([[p_code]], colWidths=[504])
                    t_code.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
                        ('BORDER', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                        ('VALIGN', (0,0), (-1,-1), 'TOP'),
                        ('TOPPADDING', (0,0), (-1,-1), 6),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                        ('LEFTPADDING', (0,0), (-1,-1), 8),
                        ('RIGHTPADDING', (0,0), (-1,-1), 8),
                    ]))
                    story.append(t_code)
                else:
                    # Large code block: render line by line as paragraphs so it breaks across pages
                    story.append(Spacer(1, 4))
                    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=6))
                    for line_str in code_content:
                        escaped_line = line_str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
                        story.append(Paragraph(escaped_line, code_style))
                    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=6, spaceAfter=8))
                
                code_content = []
                story.append(Spacer(1, 6))
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_content.append(line)
            i += 1
            continue

        # Handle Table
        if stripped.startswith("|"):
            # It's a table row
            if not in_table:
                in_table = True
                table_rows = []
            
            # Check if it is a separator line (e.g. |---|---|)
            if re.match(r'^\|[\s:-|]*\|$', stripped):
                i += 1
                continue
                
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            table_rows.append(cells)
            i += 1
            continue
        else:
            if in_table:
                # End of table
                in_table = False
                
                formatted_rows = []
                # Header row
                formatted_rows.append([Paragraph(clean_md_text(cell), th_style) for cell in table_rows[0]])
                # Body rows
                for r in table_rows[1:]:
                    formatted_rows.append([Paragraph(clean_md_text(cell), td_style) for cell in r])

                num_cols = len(table_rows[0])
                col_width = 504 / num_cols if num_cols > 0 else 504
                col_widths = [col_width] * num_cols

                t = Table(formatted_rows, colWidths=col_widths)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0B1D48')),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
                ]))
                story.append(t)
                story.append(Spacer(1, 8))
                table_rows = []

        # Handle Headings
        if stripped.startswith("#"):
            match = re.match(r'^(#+)\s*(.*)', stripped)
            if match:
                level = len(match.group(1))
                title = clean_md_text(match.group(2))
                if level == 1:
                    story.append(Paragraph(title, title_style))
                elif level == 2:
                    story.append(Paragraph(title, h1_style))
                elif level == 3:
                    story.append(Paragraph(title, h2_style))
                else:
                    story.append(Paragraph(title, h3_style))
            i += 1
            continue

        # Handle Horizontal Rules
        if stripped == "---":
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))
            i += 1
            continue

        # Handle Lists (Bulleted or Numbered)
        bullet_match = re.match(r'^[-*+]\s+(.*)', stripped)
        num_match = re.match(r'^\d+\.\s+(.*)', stripped)
        
        if bullet_match:
            item_text = clean_md_text(bullet_match.group(1))
            bullet_style = ParagraphStyle(
                'BulletCustom',
                parent=body_style,
                leftIndent=15,
                firstLineIndent=-10,
                spaceAfter=4
            )
            story.append(Paragraph(f"&bull; {item_text}", bullet_style))
            i += 1
            continue

        if num_match:
            item_text = clean_md_text(num_match.group(1))
            num_style = ParagraphStyle(
                'NumCustom',
                parent=body_style,
                leftIndent=15,
                firstLineIndent=-10,
                spaceAfter=4
            )
            # Find the number string
            num_str = stripped.split(".")[0]
            story.append(Paragraph(f"{num_str}. {item_text}", num_style))
            i += 1
            continue

        # Normal Paragraphs
        if stripped:
            para_text = clean_md_text(stripped)
            story.append(Paragraph(para_text, body_style))
        else:
            # Empty line adds spacer
            story.append(Spacer(1, 4))
            
        i += 1

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully compiled Markdown to PDF at: {pdf_path}")

if __name__ == "__main__":
    md = "C:/Users/dasbh/.gemini/antigravity/brain/96305aa5-9617-4462-9b1c-49c1f8b1b813/system_workflows_report.md"
    pdf = "e:/checking/Done_AavedanSetu/Aavedan-Setu/system_workflows_report.pdf"
    
    if len(sys.argv) > 1:
        md = sys.argv[1]
    if len(sys.argv) > 2:
        pdf = sys.argv[2]
        
    convert_md_to_pdf(md, pdf)
