#!/usr/bin/env python3
"""
Example: How the Executive Report Skill processes raw notes
This demonstrates the workflow using the sample notes provided.
"""

from generate_report import generate_report

# ============================================================================
# STEP 1: User provides raw notes (messy bullet points)
# ============================================================================
RAW_NOTES = """
Two minor releases with updates for the tms-migrator in support of customers request
* Updated the tms-migrator to have a default port in support of one of the initial customer deploying the tool, enabling the team to move forward in the migration conversation.
* Clarification on tool use to Alex including configuration, etc.
* Closed tickets
* Afternoon replies:
   * Replied to tms-migrator tool questions
   * Replied to issue with hardware (handed off to the team)
   * Successfully handed over ticket that where well in advance in the troubleshooting phase
   * Reply to ticket around upgrading VQ to 4.6.3 (used the canned response.)
   * Replied to a ticket using the can response around upgrading CMS to 3.12.1
* Made great progress on the SIP Bot
   * Full clean up of the non-v1 features
   * Wrote extensive unit and integration tests including SDP management, port management and more to ensure stability
   * Wrote an integration test for the contract against the Orchestrator
* Assisted Jordan with changes and fixes around his TMS tool
* Joined several customer meetings including with Morgan and the folks at
"""

# ============================================================================
# STEP 2: Claude asks required questions and receives answers
# ============================================================================
# Claude: "Who is the customer or project this report is for?"
CUSTOMER_NAME = "Fonoster"

# Claude: "Are there any additional risks or blockers I should include?"
ADDITIONAL_RISKS = "None at this time"

# Claude: "What's the reporting period?"
REPORT_PERIOD = "February 3-14, 2025"

# ============================================================================
# STEP 3: Claude analyzes notes as expert PM and structures content
# ============================================================================

executive_summary = """This reporting period delivered strong progress across multiple fronts, with two minor releases enhancing the TMS Migrator tool and significant advancement on the SIP Bot project. The team successfully supported customer deployments while maintaining responsive ticket resolution and excellent cross-team collaboration.

Technical excellence remained a priority, with the SIP Bot codebase receiving a comprehensive cleanup and extensive new test coverage. Support operations ran smoothly, with efficient ticket handling through well-prepared canned responses and appropriate escalation paths. Customer engagement continued through multiple meetings, demonstrating our commitment to partnership success."""

accomplishments = [
    {
        "group": "TMS Migrator Releases",
        "items": [
            "Shipped two minor releases addressing customer-requested enhancements",
            "Added default port configuration to streamline initial customer deployments",
            "Provided comprehensive tool configuration guidance to a team member, ensuring successful adoption"
        ]
    },
    {
        "group": "SIP Bot Development",
        "items": [
            "Completed full cleanup of non-v1 features, improving codebase maintainability",
            "Implemented extensive unit and integration tests for SDP management and port management",
            "Developed integration test coverage for the Orchestrator contract, ensuring API stability"
        ]
    },
    {
        "group": "Support & Customer Success",
        "items": [
            "Resolved multiple support tickets efficiently, including tms-migrator tool questions",
            "Successfully escalated hardware issue to appropriate team for resolution",
            "Handed off advanced-stage troubleshooting tickets smoothly for continuity",
            "Provided upgrade guidance for VQ 4.6.3 and CMS 3.12.1 using standardized responses"
        ]
    },
    {
        "group": "Collaboration",
        "items": [
            "Assisted a colleague with TMS tool development, fixes, and improvements",
            "Participated in customer meetings with key stakeholders"
        ]
    }
]

metrics = [
    {
        "category": "Releases & Deployments",
        "items": [
            "2 minor releases shipped for TMS Migrator",
            "1 customer deployment actively supported"
        ]
    },
    {
        "category": "Support Activity",
        "items": [
            "5+ support tickets resolved this period",
            "1 hardware issue escalated to specialized team",
            "2 upgrade guidance responses delivered (VQ 4.6.3, CMS 3.12.1)"
        ]
    },
    {
        "category": "Code Quality Improvements",
        "items": [
            "New unit test coverage: SDP management, port management",
            "New integration test: Orchestrator contract validation",
            "Codebase cleanup: Non-v1 features removed from SIP Bot"
        ]
    }
]

risks = []  # No significant risks this period based on notes and user confirmation

next_steps = [
    "Continue SIP Bot development toward v1 release milestone",
    "Monitor customer migration progress following TMS Migrator updates",
    "Follow up on action items from customer meetings with stakeholders",
    "Expand integration test coverage for remaining Orchestrator endpoints",
    "Document TMS Migrator configuration best practices based on team feedback"
]

# ============================================================================
# STEP 4: Generate the branded PDF report
# ============================================================================

if __name__ == "__main__":
    generate_report(
        output_path="executive_report_example.pdf",
        customer_name=CUSTOMER_NAME,
        report_period=REPORT_PERIOD,
        executive_summary=executive_summary,
        accomplishments=accomplishments,
        metrics=metrics,
        risks=risks,
        next_steps=next_steps,
    )
    print("\n✅ Example report generated successfully!")
    print("   This demonstrates how raw notes are transformed into a polished executive report.")
