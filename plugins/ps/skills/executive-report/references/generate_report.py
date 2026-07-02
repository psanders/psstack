#!/usr/bin/env python3
"""
Executive Report PDF Generator
Generates branded PDF reports for Fonoster executive summaries.
"""

import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# Brand Colors
TEAL = HexColor('#39E19E')
DARK_GREEN = HexColor('#053204')
TERTIARY_DARK = HexColor('#27150C')
WHITE = HexColor('#FFFFFF')
LIGHT_GRAY = HexColor('#F5F5F5')

def create_styles():
    """Create paragraph styles for the report."""
    styles = {}

    # Report Title
    styles['Title'] = ParagraphStyle(
        'Title',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=DARK_GREEN,
        spaceAfter=6,
    )

    # Subtitle (Customer/Date)
    styles['Subtitle'] = ParagraphStyle(
        'Subtitle',
        fontName='Helvetica',
        fontSize=12,
        leading=14,
        textColor=DARK_GREEN,
        spaceAfter=20,
    )

    # Section Headers
    styles['SectionHeader'] = ParagraphStyle(
        'SectionHeader',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=DARK_GREEN,
        spaceBefore=16,
        spaceAfter=8,
        borderPadding=(0, 0, 4, 0),
    )

    # Body Text (for prose paragraphs)
    styles['Body'] = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_GREEN,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    )

    # Bullet Points
    styles['Bullet'] = ParagraphStyle(
        'Bullet',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_GREEN,
        leftIndent=20,
        spaceAfter=4,
        bulletIndent=8,
        bulletFontName='Helvetica',
        bulletFontSize=10,
    )

    # Sub-bullet Points
    styles['SubBullet'] = ParagraphStyle(
        'SubBullet',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_GREEN,
        leftIndent=40,
        spaceAfter=4,
        bulletIndent=28,
    )

    return styles


def create_header(canvas, doc, customer_name, report_date):
    """Draw the header with logo and accent bar."""
    canvas.saveState()

    # Dark green accent bar at the top
    canvas.setFillColor(DARK_GREEN)
    canvas.rect(0, letter[1] - 0.5*inch, letter[0], 0.5*inch, fill=1, stroke=0)

    # Logo placeholder (text-based since we can't embed SVG easily in header)
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica-Bold', 18)
    canvas.drawString(0.75*inch, letter[1] - 0.35*inch, "FONOSTER")

    # Report info on the right
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica', 9)
    canvas.drawRightString(letter[0] - 0.75*inch, letter[1] - 0.3*inch, f"Executive Report")
    canvas.drawRightString(letter[0] - 0.75*inch, letter[1] - 0.45*inch, report_date)

    canvas.restoreState()


def create_footer(canvas, doc):
    """Draw the footer with page numbers."""
    canvas.saveState()

    # Page number
    canvas.setFillColor(DARK_GREEN)
    canvas.setFont('Helvetica', 9)
    canvas.drawCentredString(letter[0]/2, 0.3*inch, f"Page {doc.page}")

    canvas.restoreState()


def generate_report(
    output_path: str,
    customer_name: str,
    report_period: str,
    executive_summary: str,
    accomplishments: list,
    metrics: list,
    risks: list,
    next_steps: list,
):
    """
    Generate the executive report PDF.

    Args:
        output_path: Where to save the PDF
        customer_name: Customer or project name
        report_period: e.g., "February 3-14, 2025"
        executive_summary: Narrative prose (string)
        accomplishments: List of dicts with 'group' (str) and 'items' (list of str)
        metrics: List of dicts with 'category' (str) and 'items' (list of str)
        risks: List of dicts with 'risk' (str) and 'mitigation' (str, optional)
        next_steps: List of strings
    """

    styles = create_styles()

    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        topMargin=0.8*inch,
        bottomMargin=0.75*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
    )

    # Build story
    story = []

    # Title
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Biweekly Executive Report", styles['Title']))
    story.append(Paragraph(f"{customer_name} | {report_period}", styles['Subtitle']))

    # Executive Summary
    story.append(Paragraph("Executive Summary", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_GREEN, spaceAfter=10))
    for para in executive_summary.split('\n\n'):
        if para.strip():
            story.append(Paragraph(para.strip(), styles['Body']))

    # Key Accomplishments
    story.append(Paragraph("Key Accomplishments", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_GREEN, spaceAfter=10))
    for group in accomplishments:
        if group.get('group'):
            story.append(Paragraph(f"<b>{group['group']}</b>", styles['Body']))
        for item in group.get('items', []):
            story.append(Paragraph(f"• {item}", styles['Bullet']))

    # Metrics / KPIs
    story.append(Paragraph("Metrics / KPIs", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_GREEN, spaceAfter=10))
    for metric in metrics:
        if metric.get('category'):
            story.append(Paragraph(f"<b>{metric['category']}</b>", styles['Body']))
        for item in metric.get('items', []):
            story.append(Paragraph(f"• {item}", styles['Bullet']))

    # Risks & Blockers
    story.append(Paragraph("Risks &amp; Blockers", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_GREEN, spaceAfter=10))
    if not risks:
        story.append(Paragraph("No significant risks identified this period.", styles['Body']))
    else:
        for risk in risks:
            story.append(Paragraph(f"• <b>{risk['risk']}</b>", styles['Bullet']))
            if risk.get('mitigation'):
                story.append(Paragraph(f"  <i>Mitigation:</i> {risk['mitigation']}", styles['SubBullet']))

    # Next Steps
    story.append(Paragraph("Next Steps", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_GREEN, spaceAfter=10))
    for step in next_steps:
        story.append(Paragraph(f"• {step}", styles['Bullet']))

    # Build with header/footer
    report_date = datetime.now().strftime("%B %d, %Y")

    def add_header_footer(canvas, doc):
        create_header(canvas, doc, customer_name, report_date)
        create_footer(canvas, doc)

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)

    print(f"✓ Report generated: {output_path}")
    return output_path


# Example usage - this will be called by Claude with actual content
if __name__ == "__main__":
    # Example data structure (Claude will replace this with actual content)

    example_executive_summary = """This reporting period delivered strong progress across multiple fronts, with two minor releases enhancing the TMS Migrator tool and significant advancement on the SIP Bot project. The team successfully supported customer deployments while maintaining responsive ticket resolution.

Technical excellence remained a priority, with extensive unit and integration testing added to the SIP Bot codebase. Cross-team collaboration was evident through support for a colleague's TMS tool development and multiple customer-facing meetings. The team demonstrated agility in handling both planned development work and reactive support needs."""

    example_accomplishments = [
        {
            "group": "TMS Migrator Releases",
            "items": [
                "Released two minor versions with customer-requested updates",
                "Added default port configuration to streamline customer deployments",
                "Provided tool configuration guidance to a team member"
            ]
        },
        {
            "group": "SIP Bot Development",
            "items": [
                "Completed cleanup of non-v1 features",
                "Implemented comprehensive unit and integration tests",
                "Added SDP management and port management test coverage",
                "Developed integration test for Orchestrator contract"
            ]
        },
        {
            "group": "Support & Collaboration",
            "items": [
                "Resolved multiple support tickets efficiently using canned responses",
                "Assisted a colleague with TMS tool changes and fixes",
                "Successfully handed off tickets in advanced troubleshooting phases",
                "Participated in customer meetings with stakeholders"
            ]
        }
    ]

    example_metrics = [
        {
            "category": "Releases & Deployments",
            "items": [
                "2 minor releases shipped",
                "1 customer deployment supported"
            ]
        },
        {
            "category": "Support Activity",
            "items": [
                "5+ tickets resolved",
                "Hardware issue escalated and handed off",
                "Upgrade guidance provided for VQ 4.6.3 and CMS 3.12.1"
            ]
        },
        {
            "category": "Code Quality",
            "items": [
                "Unit tests: Added for SDP and port management",
                "Integration tests: New Orchestrator contract coverage"
            ]
        }
    ]

    example_risks = [
        {
            "risk": "Customer migration timeline dependency",
            "mitigation": "Default port configuration added to reduce deployment friction"
        }
    ]

    example_next_steps = [
        "Continue SIP Bot development toward v1 release",
        "Monitor customer migration progress post-TMS Migrator updates",
        "Follow up on customer meetings action items",
        "Complete remaining integration test coverage"
    ]

    # Generate the example report
    generate_report(
        output_path="executive_report.pdf",
        customer_name="Fonoster",
        report_period="February 3-14, 2025",
        executive_summary=example_executive_summary,
        accomplishments=example_accomplishments,
        metrics=example_metrics,
        risks=example_risks,
        next_steps=example_next_steps,
    )
