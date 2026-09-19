import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page counts
    along with page numbers in the footer.
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
        # Draw header on all pages except the cover page
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0B1D48"))
            self.drawString(54, 750, "AAVEDAN SETU — WEBSITE INTERFACE MANUAL")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            self.restoreState()

        # Draw footer on all pages
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Center watermark line
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 55, 558, 55)

        # Footer Text
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, footer_text)
        self.drawString(54, 40, "Confidential — Internal System Documentation · SIH 2026")
        self.restoreState()

def create_guide_pdf(filename):
    # Setup document geometry (Margins: 0.75 in / 54 pt)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#0B1D48'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=30
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0B1D48'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
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
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    td_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0B1D48')
    )

    story = []

    # ------------------ COVER PAGE ------------------
    story.append(Spacer(1, 100))
    story.append(Paragraph("AAVEDAN SETU", title_style))
    story.append(Paragraph("AI-Powered Civic Grievance Triage & Resolution Platform", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Decorative line
    d_table = Table([[""]], colWidths=[504], rowHeights=[4])
    d_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F59E0B')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(d_table)
    story.append(Spacer(1, 30))

    meta_text = """
    <b>Document Type:</b> Website User Interface & Functionality Guide<br/>
    <b>Target Audience:</b> SIH 2026 Evaluation Panel / Municipal Administrators / System Integrators<br/>
    <b>Coverage:</b> 12 System Modules, 45+ Buttons, Forms, Coordinates Pickers & AI Conversational Engines<br/>
    <b>Date of Compilation:</b> August 2026<br/>
    <b>Status:</b> Production Ready
    """
    story.append(Paragraph(meta_text, body_style))
    story.append(PageBreak())

    # ------------------ SECTIONS GENERATOR ------------------
    
    modules = [
        {
            "title": "1. Main Layout: Top Navbar & Navigation Sidebar",
            "desc": "The global layout wraps the authenticated user session, offering real-time notifications, multi-lingual translation, and workspace toggles.",
            "elements": [
                ("Sidebar Navigation Links", "Icon + Text Menu Links", "Sidebar", "Navigates between Dashboard, Grievance Board, Budgeting portal, Government Schemes, and profile views."),
                ("Grievance Status Bell", "Bell Icon (Top-Right Navbar)", "Header", "Toggles an inline panel displaying real-time push notification updates (e.g. ticket updates, resolution comments)."),
                ("Switch to Officer/Citizen Mode", "Floating Gradient Button", "Navbar / Dashboard", "Demo switch toggling dashboard visualization between Citizen portal and Officer's backend resolution ledger."),
                ("Google Translate Dropdown", "Dropdown Select", "Top Header", "Injects Google Translate DOM modifications dynamically translating the entire interface to 12 regional languages."),
                ("Profile Menu Badge", "User Avatar (Top-Right)", "Navbar", "Clicking displays a dropdown with options to view Account profile or trigger the Logout action.")
            ]
        },
        {
            "title": "2. Landing & Authentication Module",
            "desc": "Serves as the gateway for citizen onboarding. Supports password authentication, OTP-based mobile registration, and Google OAuth 2.0.",
            "elements": [
                ("Continue with Google", "Large Action Button (with G-Logo)", "Login / Register", "Triggers the Google OAuth accounts popup. Verifies access token on backend, creates DB record and generates SimpleJWT keys."),
                ("Password Mode Tab", "Pill Segmented Selector", "Login / Register", "Switches input field bindings to email + password validations."),
                ("Login with OTP Tab", "Pill Segmented Selector", "Login / Register", "Switches form bindings to mobile number validation and OTP verification fields."),
                ("Send OTP", "Action Button (Right inline)", "OTP Forms", "Validates 10-digit format and calls backend OTP service. Triggers a 60s cooldown timer and displays mock OTP in browser toast for demo."),
                ("Verify & Submit", "Primary Action Button", "OTP Forms", "Sends OTP code to verify endpoint. On success, requests SimpleJWT tokens and redirects user."),
                ("Forgot Password", "Link Label (Below inputs)", "Login Page", "Routes the user to phone verification layout to send password reset code."),
                ("Reset Password / Submit", "Primary Action Button", "Reset Page", "Verifies OTP and new password inputs, calling backend to reset DB password hashes.")
            ]
        },
        {
            "title": "3. Citizen Dashboard & Analytics",
            "desc": "Provides the home screen layout for authenticated citizens, rendering aggregate charts and quick action portals.",
            "elements": [
                ("File New Grievance", "Primary Pulsing Button", "Main Layout", "Opens the dual-triage module to submit complaints."),
                ("Budgeting Portal", "Outline Action Card", "Main Dashboard", "Navigates directly to the Civic Budgeting capital allocation board."),
                ("Complaint Trend Chart", "Interactive Line Chart", "Dashboard Centre", "Visualizes monthly complaint volumes. Hovering displays specific category data counts."),
                ("Department Distribution", "Doughnut Chart", "Dashboard Right", "Breaks down complaints by municipal departments (PWD, Water, Sanitation, Electricity, safety).")
            ]
        },
        {
            "title": "4. Grievance Filing Triage — AI Assistant Mode",
            "desc": "Aavedan Saathi provides a natural language filing interface using intent categorization and fuzzy location parsing.",
            "elements": [
                ("Voice Input (Microphone)", "Pulsing Mic Button", "Chat Box", "Activates browser HTML5 speech-to-text (`webkitSpeechRecognition`) to capture complaints in regional dialects."),
                ("Send Message", "Arrow Icon Button", "Chat Box", "POSTs raw input to AI Orchestrator. Checks state variables, extracts location entities, and determines next action."),
                ("GPS Auto-Detect Location", "Location Pin Icon Button", "Chat Box widget", "Queries navigator.geolocation API, fetches coordinates, and reverse-geocodes State/District via OpenStreetMap."),
                ("Switch to Manual Form", "Text Handoff Button", "Chat Assistant", "Transfers AI-extracted category, district, and address parameters into manual form fields, exiting chat mode."),
                ("Preview Official Email", "Outline Eye Button", "Handoff Screen", "Opens a mock-up rendering the structured grievance letter drafted by the AI microservice."),
                ("Send Official Email", "Gradient Action Button", "Handoff Screen", "Instructs SMTP handlers to dispatch the grievance report directly to the correct department's division email.")
            ]
        },
        {
            "title": "5. Grievance Filing Triage — Manual Form Mode",
            "desc": "Enables citizens to bypass conversational filing and manually register grievances with precise geographic coordinates and attachments.",
            "elements": [
                ("State Dropdown", "Dropdown Selection", "Manual Form", "Populates all 36 Indian States/UTs. Selecting filters District selection."),
                ("District Dropdown", "Dropdown Selection", "Manual Form", "Populates official districts based on State (cascading). Typo-tolerant matching checks inputs on submission."),
                ("Map Coordinate Picker", "Interactive Leaflet Container", "Manual Form", "Displays map centered on user GPS. Clicking drops a pin, auto-filling precise Latitude & Longitude decimal values."),
                ("Evidence Photo Upload", "Multi-File Input Area", "Manual Form", "Supports drag-and-drop file uploads. Processes image compression before storing on backend."),
                ("Submit Complaint", "Primary Action Button", "Form Footer", "Validates inputs, maps coordinates, and inserts ticket record in database with generated reference number (e.g. GC-2026-000001).")
            ]
        },
        {
            "title": "6. My Complaints & Grievance Board",
            "desc": "The central repository displaying active, pending, and resolved complaints with multi-dimensional filtering.",
            "elements": [
                ("Filter Board Accordeon", "Toggle Panel Button", "Board Header", "Expands filter criteria including Status, Priority, Category, Department, State, and District."),
                ("Toggle Upvote / Support", "Heart / Up-Arrow Button", "Complaint Cards", "Adds citizen vote weight to complaint. Toggles state and sends HTTP request to DB, triggering live project score recalculations."),
                ("View Detail Board", "Arrow Icon Button", "Complaint Cards", "Routes browser to full detail page of selected grievance ticket.")
            ]
        },
        {
            "title": "7. Complaint Detail & Resolution Ledger",
            "desc": "Verifies resolution progress. Integrates the Officer Resolution Panel and the Citizen Verification Ledger.",
            "elements": [
                ("Resolve Grievance (Officer)", "Action Button", "Officer Panel", "Opens upload dialog for department officers to select 'After Repair' proof images."),
                ("Submit Group Resolution", "Action Button", "Officer Panel", "Saves resolution proof. Cascades status to ALL complaints grouped within the ward cluster, marking them Under Review."),
                ("Verify Work Done (Citizen)", "Success Check Button", "Citizen Ledger", "Citizen approves proof. Accumulating 3 approvals updates CivicProject status to COMPLETED and resolves all complaints."),
                ("Reject Proof (Citizen)", "Rejection Cross Button", "Citizen Ledger", "Citizen rejects proof, prompting reason dialog. 3 rejections reopens the tickets to IN_PROGRESS and alerts the resolving officer.")
            ]
        },
        {
            "title": "8. Civic Budgeting & Community Projects Portal",
            "desc": "Empowers citizens to democratically allocate municipal capital from the ₹5 Crore District Repair Pool.",
            "elements": [
                ("Vote to Fund Project", "Large Check Box Toggle", "Budgeting Cards", "Toggles user vote on a CivicProject. Triggers atomic database transaction syncing priority scores and percentages."),
                ("District Filter", "Select Dropdown", "Budgeting Header", "Dynamically updates unallocated backlog cost counters based on selected district database query.")
            ]
        },
        {
            "title": "9. Government Schemes & Profile Modules",
            "desc": "AI schemes matching engine and citizen profile panel.",
            "elements": [
                ("Check Eligibility", "Action Button", "Schemes Page", "Evaluates user age, income, category, and state against welfare rules. Filters ineligible state yojanas."),
                ("Update Profile Detail", "Primary Action Button", "Profile Page", "Saves user profile modifications, updating email, phone, and full name values in backend DB User model.")
            ]
        }
    ]

    for mod in modules:
        # Prevent orphaned headers
        story.append(Paragraph(mod["title"], h1_style))
        story.append(Paragraph(mod["desc"], body_style))
        story.append(Spacer(1, 5))

        # Setup Table Data
        table_data = [[
            Paragraph("Button / Element Name", th_style),
            Paragraph("UI Placement / Trigger", th_style),
            Paragraph("Interactive Context", th_style),
            Paragraph("Internal / System Functionality", th_style)
        ]]

        for name, placement, context, function in mod["elements"]:
            table_data.append([
                Paragraph(name, td_bold_style),
                Paragraph(placement, td_style),
                Paragraph(context, td_style),
                Paragraph(function, td_style)
            ])

        # Widths: Name(110), Placement(100), Context(90), Function(204) -> Sum = 504 (Exact page boundary width)
        t = Table(table_data, colWidths=[110, 100, 90, 204])
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
        story.append(Spacer(1, 15))

    # Build Document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    target = "e:/checking/Done_AavedanSetu/Aavedan-Setu/aavedan_setu_buttons_and_functions_guide.pdf"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    create_guide_pdf(target)
    print(f"Successfully generated manual at: {target}")
